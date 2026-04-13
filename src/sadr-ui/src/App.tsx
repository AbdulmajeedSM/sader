import { useStepConversation } from './hooks/useStepConversation';
import ConversationTimeline from './components/ConversationTimeline';
import AgentStatusPanel from './components/AgentStatusPanel';
import DocumentViewer from './components/DocumentViewer';
import type { VoteRecord } from './types/step';

/* ── Geometric background layer ────────────────────────────────────────────── */
function GeoBg() {
  return <div className="geo-bg" aria-hidden="true" />;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
function Header({ onReset, active }: { onReset?: () => void; active: boolean }) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(2,4,8,0.85)',
        WebkitBackdropFilter: 'blur(16px)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #C9922E 0%, #7A5010 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 16px rgba(201,146,46,0.4)',
          }}>ص</div>
          <div>
            <div style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>صادر</div>
            <div style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>STEP PROTOCOL v0.1</div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {active && onReset && (
            <button
              onClick={onReset}
              style={{
                padding: '6px 14px', border: '1px solid var(--border-hi)',
                borderRadius: 6, background: 'transparent', color: 'var(--text-2)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hi)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
            >
              ↺ إعادة تشغيل
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', animation: 'ping 1.5s ease-out infinite', opacity: 0.6 }} />
              <div style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)' }}>A2A · Agenticthon 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Hero / Scenario Card ───────────────────────────────────────────────────── */
function ScenarioCard({ onStart, isStarting }: { onStart: () => void; isStarting: boolean }) {
  const pills = [
    { icon: '📦', label: 'HS 0807.10 — تمر سكري' },
    { icon: '📍', label: 'القصيم ← ماليزيا' },
    { icon: '⚖️', label: '٢٬٠٠٠ كجم' },
    { icon: '🚢', label: 'FOB جدة' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative' }}>
      {/* Decorative gold ring */}
      <div style={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        border: '1px solid rgba(201,146,46,0.08)',
        top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        border: '1px solid rgba(201,146,46,0.04)',
        top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ maxWidth: 600, textAlign: 'center', animation: 'heroReveal 0.8s cubic-bezier(0.22,1,0.36,1) forwards', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, border: '1px solid var(--gold-dim)', background: 'rgba(201,146,46,0.07)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          <span style={{ color: 'var(--gold)', fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>MULTI-AGENT NEGOTIATION</span>
        </div>

        {/* Title */}
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          <span className="gold-text">استشارة تصدير</span>
          <br />
          <span style={{ color: 'var(--text-1)' }}>التمور السعودية</span>
        </h1>

        {/* Sub */}
        <p style={{ color: 'var(--text-2)', fontSize: 16, marginTop: 16, marginBottom: 36, lineHeight: 1.7 }}>
          خمسة وكلاء ذكاء اصطناعي يتفاوضون بـ <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 13 }}>STEP Protocol</span> لإيجاد أفضل وجهة تصدير
        </p>

        {/* Trade context pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {pills.map(({ icon, label }) => (
            <span key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6,
              border: '1px solid var(--border-hi)', background: 'var(--surface-2)',
              color: 'var(--text-2)', fontSize: 13,
            }}>
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          disabled={isStarting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 36px', borderRadius: 8, border: 'none',
            background: isStarting ? 'var(--gold-dim)' : 'linear-gradient(135deg, #D4A030 0%, #C08020 100%)',
            color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'var(--sans)',
            cursor: isStarting ? 'not-allowed' : 'pointer',
            boxShadow: isStarting ? 'none' : '0 0 32px rgba(201,146,46,0.35), 0 4px 16px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
            transform: 'scale(1)',
          }}
          onMouseEnter={e => { if (!isStarting) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {isStarting ? (
            <>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'ping 0.8s linear infinite' }} />
              <span>جارٍ التشغيل...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>ابدأ استشارة التصدير</span>
            </>
          )}
        </button>

        <p style={{ marginTop: 18, color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          claude-sonnet-4-6 · real inference · not pre-recorded
        </p>
      </div>

      {/* Agent nodes decorative */}
      <div style={{ position: 'absolute', bottom: 40, display: 'flex', gap: 20, alignItems: 'center', opacity: 0.4 }}>
        {['📊', '🔍', '🚢', '📄', '⚖️'].map((icon, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: 8,
            border: '1px solid var(--border-hi)', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            animation: `fadeIn 0.4s ease ${i * 0.1}s both`,
          }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Conversation Status Bar ───────────────────────────────────────────────── */
function StatusBar({ conversationId, status, msgCount }: { conversationId: string; status: string; msgCount: number }) {
  const statusColor = status === 'completed' ? 'var(--green)' : status === 'failed' ? 'var(--red)' : 'var(--gold)';
  const statusAr = status === 'completed' ? 'اكتمل' : status === 'failed' ? 'فشل' : 'جارٍ...';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}`, flexShrink: 0 }} />
      <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusAr}</span>
      <span style={{ color: 'var(--border-hi)', fontSize: 12 }}>·</span>
      <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }} dir="ltr">{conversationId.slice(0, 20)}…</span>
      <span style={{ marginRight: 'auto' }} />
      <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)' }}>{msgCount} msg</span>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const { state, isStarting, startConversation, reset } = useStepConversation();

  const decisionMsg = state?.messages.find(m => m.intent === 'decisionReached');
  const decisionPayload = decisionMsg?.payload as Record<string, unknown> | undefined;
  const winningOption = decisionPayload?.winningOption as string | undefined;
  const votes = decisionPayload?.votes as VoteRecord[] | undefined;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir="rtl">
      <GeoBg />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header onReset={state ? reset : undefined} active={!!state} />

        {!state ? (
          <ScenarioCard onStart={startConversation} isStarting={isStarting} />
        ) : (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 48px' }}>
            {/* Status bar */}
            <div style={{ marginBottom: 20 }}>
              <StatusBar conversationId={state.conversationId} status={state.status} msgCount={state.messages.length} />
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
              {/* Left: Timeline + Documents */}
              <div style={{ minWidth: 0 }}>
                <div style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 }}>
                  <ConversationTimeline messages={state.messages} status={state.status} />

                  {state.messages.some(m => m.intent === 'documentGenerated') && (
                    <div style={{ marginTop: 16 }}>
                      <DocumentViewer messages={state.messages} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Agent panel */}
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
                  <AgentStatusPanel
                    statuses={state.agentStatuses}
                    decisionReached={!!winningOption}
                    winningOption={winningOption}
                    votes={votes}
                  />
                </div>

                {/* Stats */}
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginBottom: 12 }}>SESSION STATS</div>
                  {[
                    { label: 'الرسائل', value: state.messages.length, mono: true },
                    { label: 'الأصوات', value: `${votes?.length ?? 0} / 4`, mono: true },
                    { label: 'القرار', value: winningOption ?? '—', highlight: !!winningOption },
                    votes && votes.length > 0 && {
                      label: 'متوسط الثقة',
                      value: `${(votes.reduce((s, v) => s + v.confidence, 0) / votes.length * 100).toFixed(0)}%`,
                      highlight: true,
                    },
                  ].filter(Boolean).map((row: any) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{row.label}</span>
                      <span style={{ color: row.highlight ? 'var(--green)' : 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Protocol badge */}
                <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)', padding: 14, textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, marginBottom: 4 }}>مُشغَّل بواسطة</div>
                  <div style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 13 }}>STEP Protocol v0.1</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 2, fontFamily: 'var(--mono)' }}>JSON-LD · A2A · W3C PROV-O</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
