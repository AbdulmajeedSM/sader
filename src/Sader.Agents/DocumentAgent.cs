using Step.Protocol;

namespace Sader.Agents;

public class DocumentAgent : IStepAgent
{
    private readonly ClaudeService _claude;

    public AgentId AgentId => AgentId.DocumentAgent;

    private const string SystemPrompt = """
        You are DocumentAgent in the STEP Protocol multi-agent export system for Saudi exporters.
        Your role: generate export document drafts and flag timeline risks.

        DOCUMENTS YOU CAN GENERATE:
        1. Commercial Invoice (CI) — based on Incoterm
        2. Packing List (PL)
        3. Certificate of Origin (COO) application — Saudi Customs form
        4. Phytosanitary Certificate request — MEWA form
        5. HALAL Certificate application checklist (if needed)
        6. Bill of Lading draft instructions

        TIMELINE RULES:
        - For Malaysia: HALAL JAKIM alone takes 14 business days = TIMELINE RISK if shipment < 20 days
        - For UAE: only 3-5 days total (Phytosanitary + COO) — feasible for most timelines

        DOCUMENT GENERATION (when you receive DECISION_REACHED for UAE):
        Generate a realistic Commercial Invoice draft with these details:
        - Seller: [Exporter Name], Al-Qassim, Saudi Arabia
        - Product: Sukkari Dates, HS Code 0807.10
        - Quantity: 2,000 KG
        - Unit Price: USD 2.50/KG
        - Total Value: USD 5,000
        - Incoterm: FOB Jeddah Port
        - Payment: TT 30 days
        - SFDA HALAL Certificate No: [SFDA-2024-XXXXX]

        RESPONSE FORMAT: Respond with ONLY a valid JSON object matching the StepMessage schema.
        No markdown, no explanation text outside the JSON.

        For TIMELINE_RISK use intent "timelineRisk".
        For DOCUMENT_GENERATED use intent "documentGenerated" with payload:
        {
          "documentType": "CommercialInvoice",
          "title": "Commercial Invoice — Sukkari Dates Export to UAE",
          "content": "<full invoice content as markdown>",
          "tradeContext": { ... },
          "estimatedProcessingDays": "1 business day"
        }
        """;

    public DocumentAgent(ClaudeService claude)
    {
        _claude = claude;
    }

    public async Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default)
    {
        return incoming.Intent switch
        {
            StepIntent.ConstraintWarning => await HandleConstraintWarningAsync(incoming, ct),
            StepIntent.DecisionReached => await HandleDecisionReachedAsync(incoming, ct),
            _ => null
        };
    }

    private async Task<StepMessage?> HandleConstraintWarningAsync(StepMessage incoming, CancellationToken ct)
    {
        var userContent = $"""
            You received a CONSTRAINT_WARNING:
            {StepJson.Serialize(incoming)}

            Based on this constraint, assess the timeline risk.
            The exporter wants to ship in ~21 days. The JAKIM HALAL cert takes 14 business days
            PLUS other documents, making the total > 21 days.
            Send TIMELINE_RISK to ConsensusEngine.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "ConsensusEngine"
            Intent: "timelineRisk"
            """;

        return await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct);
    }

    private async Task<StepMessage?> HandleDecisionReachedAsync(StepMessage incoming, CancellationToken ct)
    {
        var userContent = $"""
            You received a DECISION_REACHED message:
            {StepJson.Serialize(incoming)}

            The decision has been made. Generate the Commercial Invoice document for the approved destination.
            Send DOCUMENT_GENERATED with a complete, realistic invoice draft.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "Broadcast"
            Intent: "documentGenerated"
            """;

        return await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct);
    }
}
