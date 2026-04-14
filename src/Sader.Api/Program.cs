using Microsoft.EntityFrameworkCore;
using Sader.Agents;
using Sader.Api.Data;
using Sader.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── Port (Railway injects $PORT) ──────────────────────────────────────────────
var port = Environment.GetEnvironmentVariable("PORT");
if (port is not null)
    builder.WebHost.UseUrls($"http://+:{port}");

// ── Configuration ─────────────────────────────────────────────────────────────
var claudeApiKey = builder.Configuration["CLAUDE_API_KEY"]
    ?? Environment.GetEnvironmentVariable("CLAUDE_API_KEY")
    ?? throw new InvalidOperationException(
        "CLAUDE_API_KEY is required. Set it in appsettings.json or as an environment variable.");

var seedsPath = builder.Configuration["SeedsPath"]
    ?? Environment.GetEnvironmentVariable("SeedsPath")
    ?? Path.Combine(builder.Environment.ContentRootPath, "..", "..", "seeds");

seedsPath = Path.GetFullPath(seedsPath);

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(
                System.Text.Json.JsonNamingPolicy.CamelCase));
    });

builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// SQLite — ephemeral for demos (resets on redeploy), fine for hackathon
builder.Services.AddDbContext<SaderDbContext>(opts =>
    opts.UseSqlite("Data Source=sader.db"));

// CORS: dev allows localhost; prod serves React from same origin so CORS is a non-issue
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
    {
        if (builder.Environment.IsDevelopment())
            p.WithOrigins("http://localhost:3000", "http://localhost:5173")
             .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        else
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    }));

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

builder.Services.AddScoped<StepBroadcaster>();
builder.Services.AddSingleton<IHubContextAccessor, HubContextAccessor>();

// ── Build & Migrate ───────────────────────────────────────────────────────────
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

// Serve the Vite-built React app from wwwroot (production)
app.UseDefaultFiles();  // serves index.html for /
app.UseStaticFiles();   // serves JS / CSS / assets

app.MapControllers();
app.MapHub<StepHub>("/hubs/step");

// SPA fallback — any unknown route returns index.html for client-side routing
app.MapFallbackToFile("index.html");

app.Run();
