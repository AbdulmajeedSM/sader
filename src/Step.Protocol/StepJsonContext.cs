using System.Text.Json;
using System.Text.Json.Serialization;

namespace Step.Protocol;

public static class StepJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static string Serialize(StepMessage message) =>
        JsonSerializer.Serialize(message, Options);

    public static StepMessage? Deserialize(string json) =>
        JsonSerializer.Deserialize<StepMessage>(json, Options);

    /// <summary>
    /// Extracts JSON from Claude responses that may wrap it in ```json ... ``` blocks.
    /// </summary>
    public static string ExtractJson(string raw)
    {
        var trimmed = raw.Trim();

        // Handle ```json ... ``` markdown blocks
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            var start = trimmed.IndexOf('\n') + 1;
            var end = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (end > start)
                return trimmed[start..end].Trim();
        }

        // Handle ``` ... ``` without language tag
        if (trimmed.StartsWith("```"))
        {
            var start = trimmed.IndexOf('\n') + 1;
            var end = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (end > start)
                return trimmed[start..end].Trim();
        }

        // Try to find the first { and last } for bare JSON
        var firstBrace = trimmed.IndexOf('{');
        var lastBrace = trimmed.LastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace)
            return trimmed[firstBrace..(lastBrace + 1)];

        return trimmed;
    }
}
