using Step.Protocol;
using System.Text.Json;

namespace Sader.Agents;

public class ComplianceAgent : IStepAgent
{
    private readonly ClaudeService _claude;
    private readonly string _seedsPath;

    public AgentId AgentId => AgentId.ComplianceAgent;

    private const string SystemPrompt = """
        You are ComplianceAgent in the STEP Protocol multi-agent export system for Saudi exporters.
        Your role: provide accurate regulatory compliance information for export shipments.

        You have access to a compliance database. When given trade context, you MUST:
        1. List all mandatory certifications with exact issuing body and estimated days
        2. Flag any BLOCKER constraints prominently (e.g., JAKIM takes 14 business days)
        3. Check if SFDA HALAL certificate is accepted at destination (UAE/GCC accept it directly)
        4. Include import tariff percentage

        COMPLIANCE DATABASE (use these exact figures):

        MALAYSIA (MY) for HS 0807.10 (dates):
        - HALAL_JAKIM: JAKIM Malaysia, 14 business days minimum, MANDATORY, no Saudi equivalent accepted — THIS IS A BLOCKER
        - PHYTOSANITARY: MEWA Saudi Arabia, 3 days, mandatory
        - COO: Saudi Customs, 2 days, mandatory
        - Import tariff: 0% (GCC-ASEAN FTA)

        UAE (AE) for HS 0807.10 (dates):
        - HALAL_SFDA: UAE accepts Saudi SFDA HALAL certificate directly, 0 additional days needed, mandatory
        - PHYTOSANITARY: MEWA Saudi Arabia, 3 days, mandatory
        - COO: Saudi Customs, 2 days, mandatory
        - Import tariff: 0% (GCC bilateral)

        RESPONSE FORMAT: Respond with ONLY a valid JSON object matching the StepMessage schema.
        No markdown, no explanation text outside the JSON.

        StepMessage schema:
        {
          "@context": "https://stepprotocol.trade/ontology/v0.1#",
          "@type": "StepMessage",
          "messageId": "<new GUID>",
          "intent": "requirementsFound",  (or "constraintWarning" if blocker found)
          "sender": "ComplianceAgent",
          "receiver": "MarketAgent",
          "conversationId": "<same as input>",
          "parentMessageId": "<input messageId>",
          "timestamp": "<ISO 8601 UTC>",
          "confidence": 0.95,
          "payload": { ... }
        }

        If destination is Malaysia AND product is dates: ALWAYS send "constraintWarning" intent
        with severity "Blocker" and then include the full requirements in suggestedActions.
        """;

    public ComplianceAgent(ClaudeService claude, string seedsPath)
    {
        _claude = claude;
        _seedsPath = seedsPath;
    }

    public async Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default)
    {
        if (incoming.Intent != StepIntent.QueryRequirements)
            return null;

        var complianceData = await LoadComplianceDataAsync(incoming.Payload, ct);

        var userContent = $"""
            Incoming STEP Protocol message:
            {StepJson.Serialize(incoming)}

            Compliance database for this trade route:
            {complianceData}

            Generate your ComplianceAgent response as a StepMessage JSON.
            ConversationId: {incoming.ConversationId}
            ParentMessageId: {incoming.MessageId}
            """;

        var result = await _claude.CompleteAsStepMessageAsync(SystemPrompt, userContent, ct: ct);
        return result ?? FallbackConstraintWarning(incoming);
    }

    private static StepMessage FallbackConstraintWarning(StepMessage incoming) =>
        StepMessage.Create(
            intent: StepIntent.ConstraintWarning,
            sender: AgentId.ComplianceAgent,
            receiver: AgentId.MarketAgent,
            conversationId: incoming.ConversationId,
            parentMessageId: incoming.MessageId,
            payload: new
            {
                constraintType = "CERTIFICATION_DELAY",
                severity = "Blocker",
                blocksExport = true,
                description = "شهادة HALAL JAKIM ماليزيا إلزامية وتستغرق 14 يوم عمل — لا يوجد بديل سعودي مقبول",
                affectedCertification = new
                {
                    certType = "HALAL_JAKIM",
                    issuingBody = "Jabatan Kemajuan Islam Malaysia (JAKIM)",
                    estimatedDays = 14,
                    isMandatory = true,
                    acceptedEquivalent = (string?)null
                },
                tradeContext = new { hsCode = "0807.10", originCountry = "SA", destinationCountry = "MY", quantity = 2000 },
                suggestedActions = new[] { "تحويل الشحنة للإمارات (تقبل SFDA مباشرة)", "تقديم طلب JAKIM الآن إذا كان التأجيل مقبولاً" }
            },
            confidence: 0.97m);

    private async Task<string> LoadComplianceDataAsync(object payload, CancellationToken ct)
    {
        try
        {
            var filePath = Path.Combine(_seedsPath, "compliance_rules.json");
            var json = await File.ReadAllTextAsync(filePath, ct);
            var rules = JsonSerializer.Deserialize<JsonElement>(json);

            // Extract relevant payload info to filter rules
            var payloadJson = JsonSerializer.Serialize(payload, StepJson.Options);
            var payloadElement = JsonSerializer.Deserialize<JsonElement>(payloadJson);

            string destination = "UNKNOWN";
            if (payloadElement.TryGetProperty("tradeContext", out var ctx) &&
                ctx.TryGetProperty("destinationCountry", out var dest))
            {
                destination = dest.GetString() ?? "UNKNOWN";
            }

            // Return the matching rules as a string for Claude to use
            if (rules.TryGetProperty("rules", out var rulesArray))
            {
                foreach (var rule in rulesArray.EnumerateArray())
                {
                    if (rule.TryGetProperty("destinationCountry", out var destProp) &&
                        destProp.GetString()?.Equals(destination, StringComparison.OrdinalIgnoreCase) == true)
                    {
                        return JsonSerializer.Serialize(rule, new JsonSerializerOptions { WriteIndented = true });
                    }
                }
            }

            return json; // Return full file if no match
        }
        catch
        {
            return "{}"; // Graceful fallback
        }
    }
}
