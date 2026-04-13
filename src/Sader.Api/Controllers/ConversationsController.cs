using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sader.Agents;
using Sader.Api.Data;
using Sader.Api.Hubs;
using Step.Protocol;
using System.Text.Json;

namespace Sader.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly StepOrchestrator _orchestrator;
    private readonly StepBroadcaster _broadcaster;
    private readonly SaderDbContext _db;

    public ConversationsController(
        StepOrchestrator orchestrator,
        StepBroadcaster broadcaster,
        SaderDbContext db)
    {
        _orchestrator = orchestrator;
        _broadcaster = broadcaster;
        _db = db;
    }

    /// <summary>
    /// POST /api/conversations — Starts a new export consultation demo.
    /// Returns conversation ID immediately; messages are streamed via SignalR.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> StartConversation(
        [FromBody] StartConversationRequest? request,
        CancellationToken ct)
    {
        var conversationId = Guid.NewGuid().ToString();
        var scenario = request?.Scenario ?? "dates-malaysia";

        // Persist conversation
        var conv = new ConversationEntity
        {
            Id = conversationId,
            Scenario = scenario,
            Status = "running"
        };
        _db.Conversations.Add(conv);
        await _db.SaveChangesAsync(ct);

        // Fire-and-forget: run the scenario in background, streaming via SignalR
        _ = Task.Run(async () =>
        {
            int orderIndex = 0;
            try
            {
                await _orchestrator.RunDatesExportScenarioAsync(
                    conversationId,
                    async message =>
                    {
                        // Persist message
                        _db.Messages.Add(new MessageEntity
                        {
                            ConversationId = conversationId,
                            MessageJson = StepJson.Serialize(message),
                            Timestamp = message.Timestamp.ToString("o"),
                            OrderIndex = orderIndex++
                        });
                        await _db.SaveChangesAsync();

                        // Broadcast to SignalR clients
                        await _broadcaster.BroadcastMessageAsync(message);
                    });

                // Mark complete
                conv.Status = "completed";
                await _db.SaveChangesAsync();
                await _broadcaster.BroadcastStatusAsync(conversationId, "completed");
            }
            catch (Exception ex)
            {
                conv.Status = "failed";
                await _db.SaveChangesAsync();
                await _broadcaster.BroadcastStatusAsync(conversationId, "failed", ex.Message);
            }
        }, CancellationToken.None);

        return Ok(new { conversationId, status = "started" });
    }

    /// <summary>
    /// GET /api/conversations/{id} — Returns all messages for a conversation (for replay).
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversation(string id, CancellationToken ct)
    {
        var conv = await _db.Conversations
            .Include(c => c.Messages.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (conv is null)
            return NotFound();

        var messages = conv.Messages
            .Select(m => JsonSerializer.Deserialize<JsonElement>(m.MessageJson))
            .ToList();

        return Ok(new
        {
            conversationId = conv.Id,
            scenario = conv.Scenario,
            status = conv.Status,
            messages
        });
    }

    /// <summary>
    /// GET /api/conversations — Lists recent conversations.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListConversations(CancellationToken ct)
    {
        var convs = await _db.Conversations
            .Take(20)
            .Select(c => new
            {
                c.Id,
                c.Scenario,
                c.Status,
                CreatedAt = c.CreatedAt.ToString(),
                MessageCount = c.Messages.Count
            })
            .ToListAsync(ct);

        return Ok(convs);
    }
}

public record StartConversationRequest(string? Scenario);
