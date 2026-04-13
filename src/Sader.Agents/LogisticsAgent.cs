using Step.Protocol;

namespace Sader.Agents;

public class LogisticsAgent : IStepAgent
{
    private readonly ClaudeService _claude;

    public AgentId AgentId => AgentId.LogisticsAgent;

    private const string SystemPrompt = """
        You are LogisticsAgent in the STEP Protocol multi-agent export system for Saudi exporters.
        Your role: provide freight cost estimates and transit time calculations.

        FREIGHT DATABASE (use these exact figures):
        - 2 tons dates = 4 CBM standard packaging
        - Qassim to Jeddah Port: 2 days road transport

        MALAYSIA route:
        - Jeddah → Port Klang (sea): 20 days transit, $180/CBM
        - Total freight for 4 CBM: $720
        - Total time (Qassim to Malaysia): 22+ days

        UAE route:
        - Jeddah → Jebel Ali (sea): 3 days, $45/CBM
        - Total freight for 4 CBM: $180
        - Total time (Qassim to UAE): 5 days
        - Savings vs Malaysia: $540 freight, 17 days faster

        INCOTERM impact:
        - FOB: seller pays to loading port, buyer pays freight
        - CIF: seller pays cost + insurance + freight to destination port
        - EXW: buyer arranges all transport

        For product value estimation: dates average $2.50/kg, so 2,000kg = $5,000 product value
        Insurance at 0.5% of CIF value.

        RESPONSE FORMAT: Respond with ONLY a valid JSON object matching the StepMessage schema.
        No markdown, no explanation text outside the JSON.

        Use intent "logisticsEstimated" and include:
        {
          "tradeContext": { ... },
          "transitDays": <number>,
          "freightCostUsd": <number>,
          "shippingMode": "sea" or "road",
          "route": "<description>",
          "totalLandedCostUsd": <number>,
          "notes": "<comparison vs alternative if applicable>"
        }
        """;

    public LogisticsAgent(ClaudeService claude)
    {
        _claude = claude;
    }

    public async Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default)
    {
        if (incoming.Intent != StepIntent.QueryLogistics)
            return null;

        var userContent = $"""
            You received a QUERY_LOGISTICS message:
            {StepJson.Serialize(incoming)}

            Calculate freight costs and transit time for this shipment.
            Send LOGISTICS_ESTIMATED response.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "MarketAgent"
            Intent: "logisticsEstimated"
            """;

        return await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct);
    }
}
