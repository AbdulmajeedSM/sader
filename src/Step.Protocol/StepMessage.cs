using System.Text.Json.Serialization;

namespace Step.Protocol;

public record StepMessage
{
    [JsonPropertyName("@context")]
    public string Context { get; init; } = "https://stepprotocol.trade/ontology/v0.1#";

    [JsonPropertyName("@type")]
    public string Type { get; init; } = "StepMessage";

    public required string MessageId { get; init; }
    public required StepIntent Intent { get; init; }
    public required AgentId Sender { get; init; }
    public required AgentId Receiver { get; init; }
    public required string ConversationId { get; init; }
    public string? ParentMessageId { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public decimal Confidence { get; init; } = 1.0m;
    public required object Payload { get; init; }

    public static StepMessage Create(
        StepIntent intent,
        AgentId sender,
        AgentId receiver,
        string conversationId,
        object payload,
        string? parentMessageId = null,
        decimal confidence = 1.0m) => new()
    {
        MessageId = Guid.NewGuid().ToString(),
        Intent = intent,
        Sender = sender,
        Receiver = receiver,
        ConversationId = conversationId,
        ParentMessageId = parentMessageId,
        Timestamp = DateTimeOffset.UtcNow,
        Confidence = confidence,
        Payload = payload
    };
}
