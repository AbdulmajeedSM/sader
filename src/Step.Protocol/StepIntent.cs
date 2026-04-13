namespace Step.Protocol;

public enum StepIntent
{
    // Discovery
    QueryRequirements,
    QueryLogistics,

    // Responses
    RequirementsFound,
    LogisticsEstimated,

    // Warnings
    ConstraintWarning,
    TimelineRisk,

    // Proposals
    ProposeAlternative,
    ProposeDocumentSet,

    // Consensus
    CallForVote,
    CastVote,
    DecisionReached,
    DecisionRejected,

    // Documents
    DocumentGenerated,
}
