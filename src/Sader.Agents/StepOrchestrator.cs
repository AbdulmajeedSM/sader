using Step.Protocol;

namespace Sader.Agents;

/// <summary>
/// Orchestrates the full conversation between agents.
/// Emits each message via the onMessage callback (used for SignalR streaming).
/// </summary>
public class StepOrchestrator
{
    private readonly MarketAgent _market;
    private readonly ComplianceAgent _compliance;
    private readonly DocumentAgent _document;
    private readonly LogisticsAgent _logistics;
    private readonly ConsensusEngine _consensus;

    public StepOrchestrator(
        MarketAgent market,
        ComplianceAgent compliance,
        DocumentAgent document,
        LogisticsAgent logistics,
        ConsensusEngine consensus)
    {
        _market = market;
        _compliance = compliance;
        _document = document;
        _logistics = logistics;
        _consensus = consensus;
    }

    /// <summary>
    /// Runs the full dates-export demo scenario.
    /// Calls onMessage for each StepMessage as it is produced (enables real-time streaming).
    /// </summary>
    public async Task RunDatesExportScenarioAsync(
        string conversationId,
        Func<StepMessage, Task> onMessage,
        CancellationToken ct = default)
    {
        // ── Step 1: MarketAgent → ComplianceAgent: QUERY_REQUIREMENTS ───────────
        var tradeContext = new TradeContext
        {
            HsCode = "0807.10",
            HsDescription = "Sukkari Dates, dried",
            OriginCountry = "SA",
            DestinationCountry = "MY",
            Quantity = 2000,
            QuantityUnit = "KGM",
            Incoterm = "FOB",
            ExporterCity = "Al-Qassim"
        };

        var queryMsg = _market.CreateInitialQuery(tradeContext, conversationId);
        await onMessage(queryMsg);

        // ── Step 2 (parallel): ComplianceAgent + LogisticsAgent ─────────────────
        var complianceTask = _compliance.HandleAsync(queryMsg, ct);

        var logisticsQuery = StepMessage.Create(
            intent: StepIntent.QueryLogistics,
            sender: AgentId.MarketAgent,
            receiver: AgentId.LogisticsAgent,
            conversationId: conversationId,
            payload: new QueryLogisticsPayload { TradeContext = tradeContext },
            parentMessageId: queryMsg.MessageId);
        await onMessage(logisticsQuery);

        var logisticsTask = _logistics.HandleAsync(logisticsQuery, ct);

        // Wait for both
        await Task.WhenAll(complianceTask, logisticsTask);

        var complianceResponse = await complianceTask;
        var logisticsResponse = await logisticsTask;

        // Emit logistics result first (non-blocking info)
        if (logisticsResponse is not null)
            await onMessage(logisticsResponse);

        // Emit compliance result (may contain CONSTRAINT_WARNING)
        if (complianceResponse is null)
            return;

        await onMessage(complianceResponse);

        // ── Step 3: If CONSTRAINT_WARNING — DocumentAgent flags timeline risk ────
        StepMessage? timelineRisk = null;
        if (complianceResponse.Intent == StepIntent.ConstraintWarning)
        {
            timelineRisk = await _document.HandleAsync(complianceResponse, ct);
            if (timelineRisk is not null)
                await onMessage(timelineRisk);
        }

        // ── Step 4: MarketAgent proposes alternative ─────────────────────────────
        StepMessage? proposal = null;
        if (complianceResponse.Intent == StepIntent.ConstraintWarning)
        {
            proposal = await _market.HandleAsync(complianceResponse, ct);
            if (proposal is null)
                return;

            await onMessage(proposal);
        }
        else
        {
            // No constraint — conversation ends with requirements found
            return;
        }

        // ── Step 5: ConsensusEngine runs vote ────────────────────────────────────
        var (callForVote, votes, decision) = await _consensus.RunConsensusAsync(proposal, ct);

        await onMessage(callForVote);

        // Stream each vote as it arrives (already collected, but emit sequentially for drama)
        foreach (var vote in votes)
        {
            await onMessage(vote);
            await Task.Delay(300, ct); // Small delay for UI drama
        }

        await onMessage(decision);

        // ── Step 6: DocumentAgent generates documents for approved destination ───
        var documentMsg = await _document.HandleAsync(decision, ct);
        if (documentMsg is not null)
            await onMessage(documentMsg);
    }
}
