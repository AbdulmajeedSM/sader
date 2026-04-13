using Step.Protocol;
using System.Text.Json;

namespace Sader.Agents;

public class MarketAgent : IStepAgent
{
    private readonly ClaudeService _claude;
    private readonly string _seedsPath;

    public AgentId AgentId => AgentId.MarketAgent;

    private const string SystemPrompt = """
        You are MarketAgent in the STEP Protocol multi-agent export system for Saudi exporters.
        Your role: analyze target markets and recommend the best export destination.

        When starting a consultation, send QUERY_REQUIREMENTS to ComplianceAgent.
        When you receive a CONSTRAINT_WARNING with severity=Blocker, you MUST evaluate alternatives
        and send PROPOSE_ALTERNATIVE with your best recommendation.

        MARKET INTELLIGENCE DATABASE:

        MALAYSIA (MY):
        - Market size: $45M annual dates imports
        - Growth: 8% YoY
        - Market score: 72/100
        - Saudi market share: 15%
        - Peak season: Ramadan
        - Risk: JAKIM HALAL certification delay (14 business days)

        UAE (AE):
        - Market size: $38M annual dates imports
        - Growth: 12% YoY
        - Market score: 91/100
        - Saudi market share: 32%
        - Peak season: Ramadan + National Day
        - Key advantage: SFDA HALAL accepted directly (no additional cert needed)
        - Premium market for Sukkari/Safawi varieties
        - Re-export hub for wider GCC

        BAHRAIN (BH):
        - Market size: $8.5M, GCC member, road access via causeway
        - Market score: 78/100

        RESPONSE FORMAT: Respond with ONLY a valid JSON object matching the StepMessage schema.
        No markdown, no explanation text outside the JSON.

        For PROPOSE_ALTERNATIVE, use this payload structure:
        {
          "originalDestination": "MY",
          "proposedDestination": "AE",
          "reason": "...",
          "marketAnalysis": {
            "country": "AE",
            "score": 91,
            "rationale": "...",
            "keyAdvantage": "..."
          },
          "updatedTradeContext": { ... same as original but destinationCountry changed ... }
        }
        """;

    public MarketAgent(ClaudeService claude, string seedsPath)
    {
        _claude = claude;
        _seedsPath = seedsPath;
    }

    public async Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default)
    {
        return incoming.Intent switch
        {
            StepIntent.ConstraintWarning => await HandleConstraintWarningAsync(incoming, ct),
            StepIntent.RequirementsFound => await HandleRequirementsFoundAsync(incoming, ct),
            _ => null
        };
    }

    private async Task<StepMessage?> HandleConstraintWarningAsync(StepMessage incoming, CancellationToken ct)
    {
        var marketData = await LoadMarketDataAsync(ct);

        var userContent = $"""
            You received a CONSTRAINT_WARNING from ComplianceAgent:
            {StepJson.Serialize(incoming)}

            Market data for alternatives:
            {marketData}

            The constraint BLOCKS the Malaysia shipment. Propose the best alternative destination.
            Send PROPOSE_ALTERNATIVE intent to ConsensusEngine.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "ConsensusEngine"
            Intent: "proposeAlternative"
            """;

        return await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct);
    }

    private Task<StepMessage?> HandleRequirementsFoundAsync(StepMessage incoming, CancellationToken ct)
    {
        // If requirements found with no blockers, no action needed from MarketAgent
        return Task.FromResult<StepMessage?>(null);
    }

    /// <summary>
    /// Creates the initial QueryRequirements message to kick off the conversation.
    /// </summary>
    public StepMessage CreateInitialQuery(TradeContext tradeContext, string conversationId)
    {
        return StepMessage.Create(
            intent: StepIntent.QueryRequirements,
            sender: AgentId.MarketAgent,
            receiver: AgentId.ComplianceAgent,
            conversationId: conversationId,
            payload: new QueryRequirementsPayload
            {
                TradeContext = tradeContext,
                TargetShipDate = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM-dd")
            });
    }

    private async Task<string> LoadMarketDataAsync(CancellationToken ct)
    {
        try
        {
            var filePath = Path.Combine(_seedsPath, "market_data.json");
            return await File.ReadAllTextAsync(filePath, ct);
        }
        catch
        {
            return "{}";
        }
    }
}
