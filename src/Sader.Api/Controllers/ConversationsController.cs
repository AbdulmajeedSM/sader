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
    private readonly IHubContextAccessor _hubAccessor;
    private readonly SaderDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;

    public ConversationsController(
        StepOrchestrator orchestrator,
        IHubContextAccessor hubAccessor,
        SaderDbContext db,
        IServiceScopeFactory scopeFactory)
    {
        _orchestrator = orchestrator;
        _hubAccessor = hubAccessor;
        _db = db;
        _scopeFactory = scopeFactory;
    }

    [HttpPost]
    public async Task<IActionResult> StartConversation(
        [FromBody] StartConversationRequest? request,
        CancellationToken ct)
    {
        var conversationId = Guid.NewGuid().ToString();
        var scenario = request?.Scenario ?? "dates-malaysia";

        _db.Conversations.Add(new ConversationEntity
        {
            Id = conversationId,
            Scenario = scenario,
            Status = "running"
        });
        await _db.SaveChangesAsync(ct);

        // Background task: uses its own scope so DbContext is never disposed under us
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<SaderDbContext>();
            var broadcaster = scope.ServiceProvider.GetRequiredService<StepBroadcaster>();
            int orderIndex = 0;

            try
            {
                await _orchestrator.RunDatesExportScenarioAsync(
                    conversationId,
                    async message =>
                    {
                        db.Messages.Add(new MessageEntity
                        {
                            ConversationId = conversationId,
                            MessageJson = StepJson.Serialize(message),
                            Timestamp = message.Timestamp.ToString("o"),
                            OrderIndex = orderIndex++
                        });
                        await db.SaveChangesAsync();
                        await broadcaster.BroadcastMessageAsync(message);
                    });

                var conv = await db.Conversations.FindAsync(conversationId);
                if (conv is not null) { conv.Status = "completed"; await db.SaveChangesAsync(); }
                await broadcaster.BroadcastStatusAsync(conversationId, "completed");
            }
            catch (Exception ex)
            {
                var conv = await db.Conversations.FindAsync(conversationId);
                if (conv is not null) { conv.Status = "failed"; await db.SaveChangesAsync(); }
                await broadcaster.BroadcastStatusAsync(conversationId, "failed", ex.Message);
            }
        }, CancellationToken.None);

        return Ok(new { conversationId, status = "started" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversation(string id, CancellationToken ct)
    {
        var conv = await _db.Conversations
            .Include(c => c.Messages.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (conv is null) return NotFound();

        var messages = conv.Messages
            .Select(m => JsonSerializer.Deserialize<JsonElement>(m.MessageJson))
            .ToList();

        return Ok(new { conversationId = conv.Id, scenario = conv.Scenario, status = conv.Status, messages });
    }

    [HttpGet]
    public async Task<IActionResult> ListConversations(CancellationToken ct)
    {
        var convs = await _db.Conversations
            .Take(20)
            .Select(c => new { c.Id, c.Scenario, c.Status, c.CreatedAt, MessageCount = c.Messages.Count })
            .ToListAsync(ct);
        return Ok(convs);
    }
}

public record StartConversationRequest(string? Scenario);
