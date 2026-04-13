using Microsoft.AspNetCore.SignalR;
using Step.Protocol;

namespace Sader.Api.Hubs;

public class StepHub : Hub
{
    // Clients join a conversation group to receive its messages
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv-{conversationId}");
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv-{conversationId}");
    }
}

/// <summary>
/// Service for broadcasting STEP messages to SignalR clients.
/// </summary>
public class StepBroadcaster
{
    private readonly IHubContext<StepHub> _hub;

    public StepBroadcaster(IHubContext<StepHub> hub)
    {
        _hub = hub;
    }

    public async Task BroadcastMessageAsync(StepMessage message)
    {
        var group = $"conv-{message.ConversationId}";
        var json = StepJson.Serialize(message);
        await _hub.Clients.Group(group).SendAsync("StepMessage", json);
    }

    public async Task BroadcastStatusAsync(string conversationId, string status, string? detail = null)
    {
        var group = $"conv-{conversationId}";
        await _hub.Clients.Group(group).SendAsync("ConversationStatus", new { status, detail });
    }
}
