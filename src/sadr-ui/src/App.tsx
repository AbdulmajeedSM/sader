import { useStepConversation } from './hooks/useStepConversation';
import ConversationTimeline from './components/ConversationTimeline';
import AgentStatusPanel from './components/AgentStatusPanel';
import DocumentViewer from './components/DocumentViewer';
import type { VoteRecord } from './types/step';

/* ── Geo background ─────────────────────────────────────────────────────────── */
function GeoBg() {
  return <div className="geo-bg" aria-hidden="true" />;
}

/* ── Animated agent network SVG ─────────────────────────────────────────────── */
const NODES = [
  { id: 'market',     icon: '📊', nameAr: 'وكيل السوق',     color: '#3B82F6', x: 200, y: 52  },
  { id: 'compliance', icon: '🔍', nameAr: 'وكيل الامتثال',  color: '#C9922E', x: 332, y: 140 },
  { id: 'consensus',  icon: '⚖️', nameAr: 'محرك الإجماع',   color: '#00C97A', x: 288, y: 294 },
  { id: 'document',   icon: '📄', nameAr: 'وكيل المستندات', color: '#A78BFA', x: 112, y: 294 },
  { id: 'logistics',  icon: '🚢', nameAr: 'وكيل الشحن',     color: '#00C4DA', x: 68,  y: 140 },
];

// Pentagon edges + key cross-connections
const EDGES: [number, number, string][] = [
  [0, 1, '#3B82F6'], [1, 2, '#C9922E'], [2, 3, '#00C97A'],
  [3, 4, '#A78BFA'], [4, 0, '#00C4DA'],
  [0, 2, '#C9922E'], // market → consensus (propose)
  [3, 2, '#A78BFA'], // document → consensus (timeline risk)
];

function AgentNetwork() {
  return (
    <svg
      width="400" height="360"
      viewBox="0 0 400 360"
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {NODES.map(n => (
          <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={n.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={n.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* ── Edges ── */}
      {EDGES.map(([a, b, color], i) => {
        const na = NODES[a], nb = NODES[b];
        const delay = `${i * 0.4}s`;
        return (
          <g key={i}>
            {/* Base dim line */}
            <line
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={color} strokeOpacity="0.12" strokeWidth="1.5"
            />
            {/* Flowing animated packet line */}
            <line
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={color} strokeOpacity="0.55" strokeWidth="1"
              strokeDasharray="5 14"
              style={{ animation: `flowEdge 1.8s linear ${delay} infinite` }}
            />
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {NODES.map(n => (
        <g key={n.id} style={{ cursor: 'default' }}>
          {/* Glow halo */}
          <circle cx={n.x} cy={n.y} r={40} fill={`url(#glow-${n.id})`} />
          {/* Outer ring pulse */}
          <circle
            cx={n.x} cy={n.y} r={24}
            fill="none" stroke={n.color} strokeOpacity="0.25" strokeWidth="1"
            style={{ animation: `nodePulse 2.4s ease-in-out infinite`, animationDelay: `${NODES.indexOf(n) * 0.4}s` }}
          />
          {/* Node circle */}
          <circle
            cx={n.x} cy={n.y} r={18}
            fill="#06080e" stroke={n.color} strokeOpacity="0.7" strokeWidth="1.5"
          />
          {/* Icon */}
          <text
            x={n.x} y={n.y + 6}
            textAnchor="middle" fontSize="14"
            style={{ userSelect: 'none' }}
          >{n.icon}</text>
          {/* Label */}
          <text
            x={n.x} y={n.y + 38}
            textAnchor="middle" fontSize="9" fill={n.color} fillOpacity="0.75"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0"
          >{n.nameAr}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
function Header({ onReset, active }: { onReset?: () => void; active: boolean }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(2,4,10,0.88)',
      WebkitBackdropFilter: 'blur(20px)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: 'linear-gradient(135deg, #C9922E 0%, #6B3E10 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 18px rgba(201,146,46,0.45)',
          }}>ص</div>
          <div>
            <span style={{ color: 'var(--text-1)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>صادر</span>
            <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', marginRight: 8, letterSpacing: '0.06em' }}>· STEP v0.1</span>
          </div>
        </div>
        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {active && onReset && (
            <button
              type="button"
              onClick={onReset}
              style={{ padding: '5px 13px', border: '1px solid var(--border-hi)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.02em' }}
            >↺ إعادة تشغيل</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 7, height: 7 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', animation: 'ping 1.6s ease-out infinite', opacity: 0.5 }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', position: 'relative' }} />
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)' }}>A2A · Agenticthon 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */
const TRADE_PILLS = [
  { icon: '📦', label: 'HS 0807.10' },
  { icon: '🗺️', label: 'ماليزيا ← هدف أولي' },
  { icon: '⚖️', label: '٢٬٠٠٠ كجم' },
  { icon: '🚢', label: 'FOB جدة' },
];

function ScenarioCard({ onStart, isStarting }: { onStart: () => void; isStarting: boolean }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,146,46,0.05) 0%, transparent 70%)', top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', animation: 'orb 12s ease-in-out infinite' }} />

      <div style={{ maxWidth: 760, width: '100%', animation: 'heroReveal 0.9s cubic-bezier(0.22,1,0.36,1) both', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 100, border: '1px solid var(--gold-dim)', background: 'rgba(201,146,46,0.07)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>AGENT-TO-AGENT NEGOTIATION</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ textAlign: 'center', margin: '0 0 16px', fontSize: 'clamp(2rem, 5.5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
          <span className="gold-text">استشارة تصدير التمور</span>
          <br />
          <span style={{ color: 'var(--text-1)' }}>بالذكاء الاصطناعي</span>
        </h1>

        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 15, margin: '0 auto 32px', maxWidth: 480, lineHeight: 1.75 }}>
          خمسة وكلاء يتواصلون بـ{' '}
          <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 12 }}>STEP Protocol</span>
          {' '}لإيجاد أفضل وجهة تصدير لتمور سكري من القصيم
        </p>

        {/* ── Agent Network ── */}
        <div style={{ marginBottom: 32, opacity: 0.9 }}>
          <AgentNetwork />
        </div>

        {/* Trade pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {TRADE_PILLS.map(({ icon, label }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 6, border: '1px solid var(--border-hi)', background: 'rgba(11,16,24,0.8)', color: 'var(--text-2)', fontSize: 12 }}>
              <span>{icon}</span><span>{label}</span>
            </span>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '13px 38px', borderRadius: 9, border: 'none',
              background: isStarting
                ? 'var(--gold-dim)'
                : 'linear-gradient(135deg, #D4A030 0%, #B87018 100%)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              fontFamily: 'var(--sans)', cursor: isStarting ? 'not-allowed' : 'pointer',
              boxShadow: isStarting ? 'none' : '0 0 40px rgba(201,146,46,0.32), 0 6px 24px rgba(0,0,0,0.5)',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { if (!isStarting) { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 56px rgba(201,146,46,0.45), 0 8px 32px rgba(0,0,0,0.5)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(201,146,46,0.32), 0 6px 24px rgba(0,0,0,0.5)'; }}
          >
            {isStarting
              ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ping 0.7s linear infinite' }} /><span>جارٍ التشغيل...</span></>
              : <><span>▶</span><span>ابدأ استشارة التصدير</span></>
            }
          </button>
          <p style={{ marginTop: 14, color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
            claude-sonnet-4-6 · real inference · not pre-recorded
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Status Bar ──────────────────────────────────────────────────────────────── */
function StatusBar({ conversationId, status, msgCount }: { conversationId: string; status: string; msgCount: number }) {
  const col = status === 'completed' ? 'var(--green)' : status === 'failed' ? 'var(--red)' : 'var(--gold)';
  const ar  = status === 'completed' ? 'اكتمل' : status === 'failed' ? 'فشل' : 'جارٍ';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}`, flexShrink: 0 }} />
      <span style={{ color: col, fontSize: 12, fontWeight: 600 }}>{ar}</span>
      <span style={{ color: 'var(--border-hi)' }}>·</span>
      <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }} dir="ltr">{conversationId.slice(0, 24)}…</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', flexShrink: 0 }}>{msgCount} messages</span>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────────────── */
export default function App() {
  const { state, isStarting, startConversation, reset } = useStepConversation();

  const decisionMsg     = state?.messages.find(m => m.intent === 'decisionReached');
  const decisionPayload = decisionMsg?.payload as Record<string, unknown> | undefined;
  const winningOption   = decisionPayload?.winningOption as string | undefined;
  const votes           = decisionPayload?.votes as VoteRecord[] | undefined;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir="rtl">
      <GeoBg />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header onReset={state ? reset : undefined} active={!!state} />

        {!state ? (
          <ScenarioCard onStart={startConversation} isStarting={isStarting} />
        ) : (
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '20px 28px 64px' }}>
            <div style={{ marginBottom: 16 }}>
              <StatusBar conversationId={state.conversationId} status={state.status} msgCount={state.messages.length} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
              {/* Timeline */}
              <div style={{ minWidth: 0 }}>
                <div className="timeline-wrap" style={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto', paddingLeft: 28 }}>
                  <ConversationTimeline messages={state.messages} status={state.status} />
                  {state.messages.some(m => m.intent === 'documentGenerated') && (
                    <div style={{ marginTop: 14 }}>
                      <DocumentViewer messages={state.messages} />
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 74 }}>
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 14 }}>
                  <AgentStatusPanel statuses={state.agentStatuses} decisionReached={!!winningOption} winningOption={winningOption} votes={votes} />
                </div>

                {/* Stats */}
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 14 }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.1em', marginBottom: 10 }}>SESSION STATS</div>
                  {([
                    ['الرسائل',    `${state.messages.length}`,                                    false],
                    ['الأصوات',    `${votes?.length ?? 0} / 4`,                                   false],
                    ['القرار',     winningOption ?? '—',                                           !!winningOption],
                    votes?.length ? ['متوسط الثقة', `${(votes.reduce((s,v)=>s+v.confidence,0)/votes.length*100).toFixed(0)}%`, true] : null,
                  ] as ([string,string,boolean] | null)[]).filter(Boolean).map(r => r && (
                    <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{r[0]}</span>
                      <span style={{ color: r[2] ? 'var(--green)' : 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 11 }}>{r[1]}</span>
                    </div>
                  ))}
                </div>

                {/* Protocol badge */}
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 12, textAlign: 'center' }}>
                  <div style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 12 }}>STEP Protocol v0.1</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', marginTop: 3 }}>JSON-LD · A2A · W3C PROV-O</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
