using Step.Protocol;

namespace Sader.Agents;

public interface IStepAgent
{
    AgentId AgentId { get; }
    Task<StepMessage?> HandleAsync(StepMessage incoming, CancellationToken ct = default);
}
