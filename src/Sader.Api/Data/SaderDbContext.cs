using Microsoft.EntityFrameworkCore;
using Step.Protocol;
using System.Text.Json;

namespace Sader.Api.Data;

public class ConversationEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Scenario { get; set; } = string.Empty;
    public string Status { get; set; } = "running"; // running | completed | failed
    public List<MessageEntity> Messages { get; set; } = [];
}

public class MessageEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ConversationId { get; set; } = string.Empty;
    public string MessageJson { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public int OrderIndex { get; set; }
    public ConversationEntity? Conversation { get; set; }
}

public class SaderDbContext : DbContext
{
    public SaderDbContext(DbContextOptions<SaderDbContext> options) : base(options) { }

    public DbSet<ConversationEntity> Conversations => Set<ConversationEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConversationEntity>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId);

        modelBuilder.Entity<MessageEntity>()
            .HasIndex(m => m.ConversationId);
    }
}
