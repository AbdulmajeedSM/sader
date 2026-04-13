import type { AgentId, AgentStatus } from '../types/step';
import { AGENT_CONFIG } from './agentConfig';

interface Props {
  statuses: Record<AgentId, AgentStatus>;
  decisionReached?: boolean;
  winningOption?: string;
  votes?: Array<{ voter: AgentId; choice: string; confidence: number; rationale?: string }>;
}

const STATUS_LABELS: Record<AgentStatus, { ar: string; class: string }> = {
  idle:     { ar: 'جاهز',   class: 'text-slate-500' },
  thinking: { ar: 'يعمل...',class: 'text-yellow-400 animate-pulse' },
  voting:   { ar: 'يصوّت',  class: 'text-emerald-400 animate-pulse' },
  done:     { ar: 'اكتمل',  class: 'text-emerald-400' },
};

const AGENTS: AgentId[] = ['MarketAgent', 'ComplianceAgent', 'DocumentAgent', 'LogisticsAgent', 'ConsensusEngine'];

export default function AgentStatusPanel({ statuses, decisionReached, winningOption, votes }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">
        حالة الوكلاء
      </div>

      {/* Agent rows */}
      {AGENTS.map(agentId => {
        const cfg = AGENT_CONFIG[agentId];
        const status = statuses[agentId] ?? 'idle';
        const stLabel = STATUS_LABELS[status];
        const vote = votes?.find(v => v.voter === agentId);

        return (
          <div key={agentId}
            className={`rounded-lg border p-3 transition-all duration-300 ${
              status === 'thinking' ? `${cfg.bgColor} ${cfg.borderColor}` :
              status === 'voting'   ? 'bg-emerald-950/40 border-emerald-700' :
              status === 'done'     ? 'bg-slate-900/60 border-slate-700' :
                                     'bg-slate-900/30 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{cfg.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${cfg.color}`}>{cfg.nameAr}</div>
                  <div className={`text-xs ${stLabel.class}`}>{stLabel.ar}</div>
                </div>
              </div>

              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full ${
                status === 'thinking' ? `${cfg.dotColor} animate-ping` :
                status === 'voting'   ? 'bg-emerald-400 animate-ping' :
                status === 'done'     ? 'bg-emerald-400' :
                                       'bg-slate-700'
              }`} />
            </div>

            {/* Vote result */}
            {vote && (
              <div className="mt-2 pt-2 border-t border-emerald-800/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-300">✓ {vote.choice}</span>
                  <span className="text-emerald-400 font-mono">{(vote.confidence * 100).toFixed(0)}%</span>
                </div>
                {vote.rationale && (
                  <div className="mt-1 text-xs text-slate-400 line-clamp-2">{vote.rationale}</div>
                )}
                {/* Confidence bar */}
                <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full vote-bar-fill"
                    style={{ '--fill-w': `${vote.confidence * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Consensus Decision Badge */}
      {decisionReached && winningOption && (
        <div className="mt-2 rounded-xl border-2 border-emerald-500 bg-emerald-950/60 p-4 text-center consensus-badge">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-emerald-300 font-bold text-sm">إجماع تام</div>
          <div className="text-white font-bold text-lg mt-1">
            {winningOption === 'AE' ? 'الإمارات العربية المتحدة' : winningOption}
          </div>
          <div className="text-emerald-400 text-xs mt-1">UNANIMOUS CONSENSUS</div>
        </div>
      )}
    </div>
  );
}
