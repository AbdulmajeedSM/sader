using Step.Protocol;
using System.Text.Json;

namespace Sader.Agents;

public class ConsensusEngine : IStepAgent
{
    private readonly ClaudeService _claude;
    private readonly Dictionary<string, List<StepMessage>> _pendingVotes = new();

    public AgentId AgentId => AgentId.ConsensusEngine;

    // Agents that must vote (excluding ConsensusEngine itself)
    private static readonly AgentId[] VoterAgents =
    [
        AgentId.MarketAgent,
        AgentId.ComplianceAgent,
        AgentId.DocumentAgent,
        AgentId.LogisticsAgent
    ];

    private const string VoteSystemPrompt = """
        You are a voting agent in the STEP Protocol consensus mechanism.
        You must evaluate the proposal and cast a vote.

        VOTING RULES:
        - Choose the option that best serves the Saudi exporter given your domain expertise
        - Provide a confidence score between 0.0 and 1.0
        - Include a brief rationale (1-2 sentences max)

        RESPONSE FORMAT: Respond with ONLY a valid JSON object.
        {
          "@context": "https://stepprotocol.trade/ontology/v0.1#",
          "@type": "StepMessage",
          "messageId": "<new GUID>",
          "intent": "castVote",
          "sender": "<your agent name>",
          "receiver": "ConsensusEngine",
          "conversationId": "<same as input>",
          "parentMessageId": "<proposalMessageId>",
          "timestamp": "<ISO 8601 UTC>",
          "confidence": <your confidence>,
          "payload": {
            "proposalId": "<proposalId>",
            "chosenOption": "<chosen option>",
            "confidence": <0.0-1.0>,
            "rationale": "<brief explanation>"
          }
        }
        """;

    public ConsensusEngine(ClaudeService claude)
    {
        _claude = claude;
    }

    public async Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default)
    {
        return incoming.Intent switch
        {
            StepIntent.ProposeAlternative => await HandleProposeAlternativeAsync(incoming, ct),
            StepIntent.TimelineRisk => null, // Acknowledged but not acted on directly
            _ => null
        };
    }

    /// <summary>
    /// Processes a PROPOSE_ALTERNATIVE: collects votes from all agents and produces a decision.
    /// Returns the DECISION_REACHED message.
    /// </summary>
    public async Task<(StepMessage callForVote, List<StepMessage> votes, StepMessage decision)>
        RunConsensusAsync(StepMessage proposalMessage, CancellationToken ct = default)
    {
        var proposalId = Guid.NewGuid().ToString();
        var proposalPayload = DeserializePayload<ProposeAlternativePayload>(proposalMessage.Payload);

        // 1. Create CALL_FOR_VOTE
        var callForVote = StepMessage.Create(
            intent: StepIntent.CallForVote,
            sender: AgentId.ConsensusEngine,
            receiver: AgentId.Broadcast,
            conversationId: proposalMessage.ConversationId,
            payload: new CallForVotePayload
            {
                ProposalId = proposalId,
                ProposalSummary = proposalPayload != null
                    ? $"Redirect shipment from {proposalPayload.OriginalDestination} to {proposalPayload.ProposedDestination}. Reason: {proposalPayload.Reason}"
                    : "Redirect shipment to alternative destination",
                Options = ["AE", "MY_DELAY", "ABORT"],
                RequiredVoters = [.. VoterAgents],
                TimeoutSeconds = 30
            },
            parentMessageId: proposalMessage.MessageId);

        // 2. Collect votes from each agent in parallel
        var voteTasks = VoterAgents.Select(voterId =>
            CollectVoteAsync(voterId, proposalMessage, callForVote, proposalId, ct));

        var votes = (await Task.WhenAll(voteTasks))
            .Where(v => v is not null)
            .Cast<StepMessage>()
            .ToList();

        // 3. Compute consensus
        var decision = ComputeDecision(proposalMessage, callForVote, votes, proposalPayload);

        return (callForVote, votes, decision);
    }

    private async Task<StepMessage?> CollectVoteAsync(
        AgentId voterId,
        StepMessage proposalMessage,
        StepMessage callForVote,
        string proposalId,
        CancellationToken ct)
    {
        var agentContext = GetAgentVotingContext(voterId);

        var userContent = $"""
            You are {voterId}. You must cast a vote on this proposal.

            Original proposal:
            {StepJson.Serialize(proposalMessage)}

            Vote request:
            {StepJson.Serialize(callForVote)}

            {agentContext}

            Cast your vote. Choose from: "AE" (redirect to UAE), "MY_DELAY" (proceed with Malaysia delay), "ABORT" (cancel export).
            ProposalId: {proposalId}
            ConversationId: {proposalMessage.ConversationId}
            """;

        return await _claude.CompleteAsStepMessageAsync(VoteSystemPrompt, userContent, ct: ct);
    }

    private static string GetAgentVotingContext(AgentId agentId) => agentId switch
    {
        AgentId.ComplianceAgent =>
            "COMPLIANCE PERSPECTIVE: UAE accepts Saudi SFDA HALAL certificate directly (0 extra days). " +
            "Malaysia requires JAKIM (14 days) which blocks the current timeline. " +
            "UAE compliance is fully met with existing certifications. Confidence should be ~0.97.",

        AgentId.LogisticsAgent =>
            "LOGISTICS PERSPECTIVE: UAE route is 3 days sea vs 20 days to Malaysia. " +
            "Freight cost: $180 (UAE) vs $720 (Malaysia) — saves $540. " +
            "Total time Qassim to UAE: 5 days. Massive advantage. Confidence should be ~0.95.",

        AgentId.DocumentAgent =>
            "DOCUMENTS PERSPECTIVE: For UAE, only COO (2 days) + Phytosanitary (3 days) needed. " +
            "For Malaysia, JAKIM HALAL alone takes 14 days + COO + Phytosanitary = 19+ days. " +
            "UAE documents can be ready in 3-5 business days. Confidence should be ~0.97.",

        AgentId.MarketAgent =>
            "MARKET PERSPECTIVE: UAE market score 91/100 vs Malaysia 72/100. " +
            "UAE has 12% growth rate and Saudi market share of 32%. " +
            "UAE is a re-export hub — opens doors to wider GCC. Confidence should be ~0.89.",

        _ => "Cast your vote based on your domain expertise."
    };

    private StepMessage ComputeDecision(
        StepMessage proposalMessage,
        StepMessage callForVote,
        List<StepMessage> votes,
        ProposeAlternativePayload? proposal)
    {
        var voteRecords = votes.Select(v =>
        {
            var payload = DeserializePayload<CastVotePayload>(v.Payload);
            return new VoteRecord
            {
                Voter = v.Sender,
                Choice = payload?.ChosenOption ?? "AE",
                Confidence = payload?.Confidence ?? 0.9m,
                Rationale = payload?.Rationale
            };
        }).ToList();

        // Count votes
        var voteCounts = voteRecords
            .GroupBy(v => v.Choice)
            .OrderByDescending(g => g.Count())
            .ToDictionary(g => g.Key, g => g.ToList());

        var winningOption = voteCounts.Keys.FirstOrDefault() ?? "AE";
        var winningVotes = voteCounts.GetValueOrDefault(winningOption, []);
        var isUnanimous = voteRecords.All(v => v.Choice == winningOption);
        var consensusType = isUnanimous ? ConsensusType.Unanimous : ConsensusType.Majority;

        var updatedContext = proposal?.UpdatedTradeContext ?? new TradeContext
        {
            HsCode = "0807.10",
            HsDescription = "Dates, fresh or dried",
            OriginCountry = "SA",
            DestinationCountry = winningOption == "AE" ? "AE" : "MY",
            Quantity = 2000,
            QuantityUnit = "KGM",
            Incoterm = "FOB",
            ExporterCity = "Al-Qassim"
        };

        return StepMessage.Create(
            intent: StepIntent.DecisionReached,
            sender: AgentId.ConsensusEngine,
            receiver: AgentId.Broadcast,
            conversationId: proposalMessage.ConversationId,
            payload: new DecisionReachedPayload
            {
                ProposalId = DeserializePayload<CallForVotePayload>(callForVote.Payload)?.ProposalId
                             ?? Guid.NewGuid().ToString(),
                WinningOption = winningOption,
                Votes = voteRecords,
                ConsensusType = consensusType,
                NextActions =
                [
                    $"Prepare export documents for {winningOption}",
                    "Issue Phytosanitary Certificate request to MEWA",
                    "Issue Certificate of Origin to Saudi Customs",
                    winningOption == "AE"
                        ? "Confirm SFDA HALAL certificate validity with buyer"
                        : "Begin JAKIM HALAL application immediately",
                    "Book sea freight with forwarder"
                ],
                FinalTradeContext = updatedContext
            },
            parentMessageId: callForVote.MessageId,
            confidence: (decimal)voteRecords.Average(v => (double)v.Confidence));
    }

    private Task<StepMessage?> HandleProposeAlternativeAsync(StepMessage incoming, CancellationToken ct)
    {
        // The full consensus flow is driven by RunConsensusAsync from the Orchestrator
        return Task.FromResult<StepMessage?>(null);
    }

    private static T? DeserializePayload<T>(object payload)
    {
        try
        {
            var json = JsonSerializer.Serialize(payload, StepJson.Options);
            return JsonSerializer.Deserialize<T>(json, StepJson.Options);
        }
        catch
        {
            return default;
        }
    }
}
