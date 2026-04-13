import type { AgentId, AgentStatus } from '../types/step';
import { AGENT_CONFIG } from './agentConfig';

interface Props {
  statuses: Record<AgentId, AgentStatus>;
  decisionReached?: boolean;
  winningOption?: string;
  votes?: Array<{ voter: AgentId; choice: string; confidence: number; rationale?: string }>;
}

const AGENTS: AgentId[] = ['marketAgent', 'complianceAgent', 'logisticsAgent', 'documentAgent', 'consensusEngine'];

const AGENT_ACCENT: Record<string, string> = {
  marketAgent:     '#3B82F6',
  complianceAgent: '#C9922E',
  logisticsAgent:  '#00BFD8',
  documentAgent:   '#A78BFA',
  consensusEngine: '#00C97A',
};

const STATUS_AR: Record<AgentStatus, string> = {
  idle:     'جاهز',
  thinking: 'يعمل',
  voting:   'يصوّت',
  done:     'اكتمل',
};

function AgentRow({ agentId, status, vote }: {
  agentId: AgentId;
  status: AgentStatus;
  vote?: { choice: string; confidence: number; rationale?: string };
}) {
  const cfg = AGENT_CONFIG[agentId];
  const accent = AGENT_ACCENT[agentId] ?? '#3A506A';
  const isActive = status === 'thinking' || status === 'voting';
  const isDone = status === 'done';

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${isActive ? accent + '55' : isDone ? '#1e3048' : 'var(--border)'}`,
      background: isActive ? accent + '0d' : 'var(--surface-2)',
      padding: '10px 12px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Indicator dot */}
          <div style={{ position: 'relative', flexShrink: 0, width: 10, height: 10 }}>
            {isActive && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: accent, opacity: 0.4,
                animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
              }} />
            )}
            <div style={{
              position: 'relative', width: 10, height: 10, borderRadius: '50%',
              background: isDone ? '#00C97A' : isActive ? accent : 'var(--border-hi)',
              transition: 'background 0.3s',
            }} />
          </div>

          <span style={{ fontSize: 15 }}>{cfg.icon}</span>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? accent : isDone ? 'var(--text-1)' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {cfg.nameAr}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: isActive ? accent + 'aa' : 'var(--text-3)' }}>
              {STATUS_AR[status]}
            </div>
          </div>
        </div>

        {/* Right: vote badge */}
        {vote && (
          <div style={{
            flexShrink: 0, padding: '2px 8px', borderRadius: 4,
            border: '1px solid rgba(0,201,122,0.3)', background: 'rgba(0,201,122,0.1)',
            color: '#6EE7B7', fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
          }}>
            {vote.choice}
          </div>
        )}
      </div>

      {/* Vote details */}
      {vote && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,201,122,0.15)' }}>
          {vote.rationale && (
            <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {vote.rationale}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                className="vote-bar-fill"
                style={{
                  height: '100%', background: `linear-gradient(90deg, #00C97A, #34D399)`,
                  borderRadius: 2,
                  '--fill-w': `${vote.confidence * 100}%`,
                } as React.CSSProperties}
              />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#00C97A', flexShrink: 0 }}>
              {(vote.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentStatusPanel({ statuses, decisionReached, winningOption, votes }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
          AGENT NODES
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 7px', borderRadius: 4,
          background: 'rgba(201,146,46,0.1)', border: '1px solid rgba(201,146,46,0.25)',
          color: 'var(--gold)',
        }}>
          {Object.values(statuses).filter(s => s !== 'idle').length} / {AGENTS.length} active
        </span>
      </div>

      {/* Agent rows */}
      {AGENTS.map(agentId => (
        <AgentRow
          key={agentId}
          agentId={agentId}
          status={statuses[agentId] ?? 'idle'}
          vote={votes?.find(v => v.voter === agentId)}
        />
      ))}

      {/* Consensus decision */}
      {decisionReached && winningOption && (
        <div
          className="consensus-badge"
          style={{
            marginTop: 8,
            borderRadius: 10,
            border: '2px solid rgba(0,201,122,0.5)',
            background: 'linear-gradient(135deg, rgba(0,201,122,0.1) 0%, rgba(0,201,122,0.05) 100%)',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#6EE7B7', letterSpacing: '0.08em', marginBottom: 4 }}>
            UNANIMOUS CONSENSUS
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {winningOption === 'AE' ? 'الإمارات 🇦🇪' : winningOption}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
            إجماع تام · {votes?.length ?? 0} أصوات
          </div>
          {votes && votes.length > 0 && (
            <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(0,201,122,0.08)', border: '1px solid rgba(0,201,122,0.2)' }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: '#34D399', fontWeight: 700 }}>
                {(votes.reduce((s, v) => s + v.confidence, 0) / votes.length * 100).toFixed(0)}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginRight: 4 }}>متوسط الثقة</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
