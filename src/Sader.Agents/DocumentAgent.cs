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
          "content": "COMMERCIAL INVOICE\\nSeller: Al-Qassim Dates Factory\\nProduct: Sukkari Dates HS 0807.10\\nQty: 2000 KG @ USD 2.50 = USD 5,000\\nIncoterm: FOB Jeddah\\nHALAL: SFDA-2024-XXXXX",
          "estimatedProcessingDays": "1 business day"
        }

        IMPORTANT: Keep the "content" field SHORT (1-3 lines). Do NOT generate a full document.
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
            You received a CONSTRAINT_WARNING about HALAL JAKIM certification taking 14 days.
            The exporter wants to ship in ~21 days — this timeline is at risk.
            Send TIMELINE_RISK to ConsensusEngine.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "consensusEngine"
            Intent: "timelineRisk"
            Keep payload under 200 characters.
            """;

        var result = await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct: ct);
        return result ?? FallbackTimelineRisk(incoming);
    }

    private async Task<StepMessage?> HandleDecisionReachedAsync(StepMessage incoming, CancellationToken ct)
    {
        var userContent = $"""
            The consensus decision was reached. Generate a brief Commercial Invoice summary for UAE export.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            Receiver: "broadcast"
            Intent: "documentGenerated"
            Keep the "content" field to 3 lines maximum. Do not write a full document.
            """;

        var result = await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct: ct);
        return result ?? FallbackDocumentGenerated(incoming);
    }

    private static StepMessage FallbackTimelineRisk(StepMessage incoming) =>
        StepMessage.Create(
            intent: StepIntent.TimelineRisk,
            sender: AgentId.DocumentAgent,
            receiver: AgentId.ConsensusEngine,
            conversationId: incoming.ConversationId,
            parentMessageId: incoming.MessageId,
            payload: new
            {
                riskType = "CERTIFICATION_DELAY",
                description = "تحذير: شهادة JAKIM تستغرق 14 يوماً عمل — لا تتناسب مع الجدول الزمني المطلوب (21 يوماً)",
                daysRequired = 14,
                daysAvailable = 21,
                recommendation = "يُنصح بتحويل الشحنة إلى الإمارات التي تقبل شهادة SFDA مباشرة"
            },
            confidence: 0.99m);

    private static StepMessage FallbackDocumentGenerated(StepMessage incoming) =>
        StepMessage.Create(
            intent: StepIntent.DocumentGenerated,
            sender: AgentId.DocumentAgent,
            receiver: AgentId.Broadcast,
            conversationId: incoming.ConversationId,
            parentMessageId: incoming.MessageId,
            payload: new
            {
                documentType = "CommercialInvoice",
                title = "فاتورة تجارية — تصدير تمور سكري إلى الإمارات",
                content = "البائع: مصنع تمور القصيم | المشتري: [مستورد دبي]\nالمنتج: تمر سكري HS 0807.10 | الكمية: 2,000 كجم\nالسعر: 2.50 دولار/كجم | الإجمالي: 5,000 دولار | Incoterm: FOB جدة\nشهادة HALAL: SFDA-2024-XXXXX (مقبولة في الإمارات مباشرة)\nوقت المعالجة: يوم عمل واحد",
                estimatedProcessingDays = "1 يوم عمل",
                documentsRequired = new[] { "شهادة المنشأ", "شهادة الصحة النباتية", "الفاتورة التجارية", "قائمة التعبئة" }
            },
            confidence: 1.0m);
}
