using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Step.Protocol;
using System.Text.Json;

namespace Sader.Agents;

/// <summary>
/// Wrapper around Anthropic.SDK that sends a system prompt + user message
/// and returns a parsed StepMessage. Retries up to 3 times on JSON parse failure.
/// </summary>
public class ClaudeService
{
    private readonly AnthropicClient _client;
    private const string Model = "claude-sonnet-4-6";
    private const int MaxRetries = 3;

    public ClaudeService(string apiKey)
    {
        _client = new AnthropicClient(apiKey);
    }

    /// <summary>
    /// Calls Claude with a system prompt and user content.
    /// Returns the raw text response (callers parse it themselves for flexibility).
    /// </summary>
    public async Task<string> CompleteAsync(
        string systemPrompt,
        string userContent,
        CancellationToken ct = default)
    {
        var messages = new List<Message>
        {
            new Message(RoleType.User, userContent)
        };

        var system = new List<SystemMessage>
        {
            new SystemMessage(systemPrompt)
        };

        var request = new MessageParameters
        {
            Model = Model,
            MaxTokens = 2048,
            System = system,
            Messages = messages
        };

        var response = await _client.Messages.GetClaudeMessageAsync(request, ct);
        return response.Message.ToString() ?? string.Empty;
    }

    /// <summary>
    /// Calls Claude and attempts to parse the response as a StepMessage.
    /// Retries with stricter instructions on JSON parse failure.
    /// </summary>
    public async Task<StepMessage?> CompleteAsStepMessageAsync(
        string systemPrompt,
        string userContent,
        CancellationToken ct = default)
    {
        var currentPrompt = systemPrompt;

        for (int attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var raw = await CompleteAsync(currentPrompt, userContent, ct);
                var json = StepJson.ExtractJson(raw);
                var message = JsonSerializer.Deserialize<StepMessage>(json, StepJson.Options);
                return message;
            }
            catch (JsonException) when (attempt < MaxRetries)
            {
                // Tighten prompt on retry
                currentPrompt = systemPrompt +
                    "\n\nCRITICAL: Your previous response was not valid JSON. " +
                    "You MUST respond with ONLY a valid JSON object. " +
                    "No markdown, no explanation, no ```json blocks. Just the raw JSON object.";
            }
        }

        return null;
    }
}
