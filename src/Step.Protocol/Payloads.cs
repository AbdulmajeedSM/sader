using System.Text.Json.Serialization;

namespace Step.Protocol;

// ── Trade Context (shared across messages) ──────────────────────────────────

public record TradeContext
{
    [JsonPropertyName("@type")]
    public string Type { get; init; } = "TradeContext";

    public required string HsCode { get; init; }
    public required string HsDescription { get; init; }
    public required string OriginCountry { get; init; }
    public required string DestinationCountry { get; init; }
    public required decimal Quantity { get; init; }
    public required string QuantityUnit { get; init; }
    public string Incoterm { get; init; } = "FOB";
    public string? ExporterCity { get; init; }
}

// ── QueryRequirements ────────────────────────────────────────────────────────

public record QueryRequirementsPayload
{
    public required TradeContext TradeContext { get; init; }
    public string? TargetShipDate { get; init; }
}

// ── RequirementsFound ────────────────────────────────────────────────────────

public record CertificationInfo
{
    public required string CertType { get; init; }
    public required string IssuingBody { get; init; }
    public required int EstimatedDays { get; init; }
    public required bool IsMandatory { get; init; }
    public string? AcceptedEquivalent { get; init; }
    public string? Notes { get; init; }
}

public record RequirementsFoundPayload
{
    public required TradeContext TradeContext { get; init; }
    public required List<CertificationInfo> Certifications { get; init; }
    public required List<string> Documents { get; init; }
    public decimal? ImportTariffPercent { get; init; }
    public string? Notes { get; init; }
}

// ── ConstraintWarning ────────────────────────────────────────────────────────

public enum ConstraintSeverity { Info, Warning, Blocker }

public record ConstraintWarningPayload
{
    [JsonPropertyName("@type")]
    public string Type { get; init; } = "Constraint";

    public required string ConstraintType { get; init; }
    public required ConstraintSeverity Severity { get; init; }
    public required bool BlocksExport { get; init; }
    public required string Description { get; init; }
    public CertificationInfo? AffectedCertification { get; init; }
    public required TradeContext TradeContext { get; init; }
    public required List<string> SuggestedActions { get; init; }
}

// ── TimelineRisk ─────────────────────────────────────────────────────────────

public record TimelineRiskPayload
{
    public required string Description { get; init; }
    public required int DaysRequired { get; init; }
    public required int DaysAvailable { get; init; }
    public required string Bottleneck { get; init; }
}

// ── ProposeAlternative ───────────────────────────────────────────────────────

public record MarketScore
{
    public required string Country { get; init; }
    public required decimal Score { get; init; }
    public required string Rationale { get; init; }
    public string? KeyAdvantage { get; init; }
}

public record ProposeAlternativePayload
{
    public required string OriginalDestination { get; init; }
    public required string ProposedDestination { get; init; }
    public required string Reason { get; init; }
    public required MarketScore MarketAnalysis { get; init; }
    public required TradeContext UpdatedTradeContext { get; init; }
}

// ── Logistics ────────────────────────────────────────────────────────────────

public record QueryLogisticsPayload
{
    public required TradeContext TradeContext { get; init; }
}

public record LogisticsEstimatedPayload
{
    public required TradeContext TradeContext { get; init; }
    public required int TransitDays { get; init; }
    public required decimal FreightCostUsd { get; init; }
    public required string ShippingMode { get; init; }
    public required string Route { get; init; }
    public decimal? TotalLandedCostUsd { get; init; }
    public string? Notes { get; init; }
}

// ── Consensus ────────────────────────────────────────────────────────────────

public record CallForVotePayload
{
    public required string ProposalId { get; init; }
    public required string ProposalSummary { get; init; }
    public required List<string> Options { get; init; }
    public required List<AgentId> RequiredVoters { get; init; }
    public int TimeoutSeconds { get; init; } = 30;
}

public record CastVotePayload
{
    public required string ProposalId { get; init; }
    public required string ChosenOption { get; init; }
    public required decimal Confidence { get; init; }
    public string? Rationale { get; init; }
}

public record VoteRecord
{
    public required AgentId Voter { get; init; }
    public required string Choice { get; init; }
    public required decimal Confidence { get; init; }
    public string? Rationale { get; init; }
}

public enum ConsensusType { Unanimous, Majority, Weighted }

public record DecisionReachedPayload
{
    public required string ProposalId { get; init; }
    public required string WinningOption { get; init; }
    public required List<VoteRecord> Votes { get; init; }
    public required ConsensusType ConsensusType { get; init; }
    public required List<string> NextActions { get; init; }
    public required TradeContext FinalTradeContext { get; init; }
}

public record DecisionRejectedPayload
{
    public required string ProposalId { get; init; }
    public required string Reason { get; init; }
    public required List<VoteRecord> Votes { get; init; }
}

// ── Documents ────────────────────────────────────────────────────────────────

public record DocumentGeneratedPayload
{
    public required string DocumentType { get; init; }
    public required string Title { get; init; }
    public required string Content { get; init; }
    public required TradeContext TradeContext { get; init; }
    public required string EstimatedProcessingDays { get; init; }
}
