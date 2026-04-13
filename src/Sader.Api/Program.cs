using Microsoft.EntityFrameworkCore;
using Sader.Agents;
using Sader.Api.Data;
using Sader.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ────────────────────────────────────────────────────────────
var claudeApiKey = builder.Configuration["CLAUDE_API_KEY"]
    ?? Environment.GetEnvironmentVariable("CLAUDE_API_KEY")
    ?? throw new InvalidOperationException("CLAUDE_API_KEY is required. Set it in appsettings.json or environment variables.");

var seedsPath = builder.Configuration["SeedsPath"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "..", "..", "seeds");

// Resolve absolute path
seedsPath = Path.GetFullPath(seedsPath);

// ── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(
                System.Text.Json.JsonNamingPolicy.CamelCase));
    });

builder.Services.AddOpenApi();

// SignalR (built into ASP.NET Core 9)
builder.Services.AddSignalR();

// EF Core + SQLite
builder.Services.AddDbContext<SaderDbContext>(opts =>
    opts.UseSqlite("Data Source=sader.db"));

// CORS — allow React dev server
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:3000", "http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

// STEP Agents
builder.Services.AddSingleton(new ClaudeService(claudeApiKey));
builder.Services.AddSingleton(sp =>
    new ComplianceAgent(sp.GetRequiredService<ClaudeService>(), seedsPath));
builder.Services.AddSingleton(sp =>
    new MarketAgent(sp.GetRequiredService<ClaudeService>(), seedsPath));
builder.Services.AddSingleton(sp =>
    new LogisticsAgent(sp.GetRequiredService<ClaudeService>()));
builder.Services.AddSingleton(sp =>
    new DocumentAgent(sp.GetRequiredService<ClaudeService>()));
builder.Services.AddSingleton(sp =>
    new ConsensusEngine(sp.GetRequiredService<ClaudeService>()));
builder.Services.AddSingleton(sp =>
    new StepOrchestrator(
        sp.GetRequiredService<MarketAgent>(),
        sp.GetRequiredService<ComplianceAgent>(),
        sp.GetRequiredService<DocumentAgent>(),
        sp.GetRequiredService<LogisticsAgent>(),
        sp.GetRequiredService<ConsensusEngine>()));

// SignalR broadcaster
builder.Services.AddScoped<StepBroadcaster>();

// ── Build & Migrate ──────────────────────────────────────────────────────────
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SaderDbContext>();
    db.Database.EnsureCreated();
}

// ── Middleware ────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.UseAuthorization();

app.MapControllers();
app.MapHub<StepHub>("/hubs/step");

app.Run();
