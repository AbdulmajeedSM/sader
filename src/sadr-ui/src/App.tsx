import { useStepConversation } from './hooks/useStepConversation';
import ConversationTimeline from './components/ConversationTimeline';
import AgentStatusPanel from './components/AgentStatusPanel';
import DocumentViewer from './components/DocumentViewer';
import type { VoteRecord } from './types/step';

function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
            ص
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">صادر</div>
            <div className="text-slate-500 text-xs font-mono">STEP Protocol v0.1</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 text-xs">A2A · Agenticthon 2026</span>
        </div>
      </div>
    </header>
  );
}

function ScenarioCard({ onStart, isStarting }: { onStart: () => void; isStarting: boolean }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-6">🌴</div>
      <h1 className="text-3xl font-bold text-white mb-3">استشارة تصدير تمور</h1>
      <p className="text-slate-400 mb-2 text-lg">
        مصنع تمور في القصيم • ٢ طن تمور سكري
      </p>
      <p className="text-slate-500 text-sm mb-8">
        ٥ وكلاء ذكاء اصطناعي يتفاوضون بـ STEP Protocol لإيجاد أفضل وجهة تصدير
      </p>

      {/* Trade context pill */}
      <div className="inline-flex flex-wrap gap-2 justify-center mb-10">
        {[
          { icon: '📦', label: 'HS 0807.10' },
          { icon: '🌍', label: 'ماليزيا ← هدف أولي' },
          { icon: '⚖️', label: '2,000 كجم' },
          { icon: '🚢', label: 'FOB جدة' },
        ].map(({ icon, label }) => (
          <span key={label} className="px-3 py-1.5 bg-slate-800 rounded-full text-sm text-slate-300 flex items-center gap-1.5">
            <span>{icon}</span> {label}
          </span>
        ))}
      </div>

      <button
        onClick={onStart}
        disabled={isStarting}
        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40 hover:scale-105 active:scale-95"
      >
        {isStarting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            جارٍ التشغيل...
          </span>
        ) : (
          '▶ ابدأ استشارة التصدير'
        )}
      </button>

      <p className="mt-6 text-slate-600 text-xs">
        سيتم استدعاء Claude Sonnet 4.6 لكل وكيل • الحوار حقيقي وليس مُسبق التسجيل
      </p>
    </div>
  );
}

export default function App() {
  const { state, isStarting, startConversation, reset } = useStepConversation();

  // Extract decision data for AgentStatusPanel
  const decisionMsg = state?.messages.find(m => m.intent === 'decisionReached');
  const decisionPayload = decisionMsg?.payload as Record<string, unknown> | undefined;
  const winningOption = decisionPayload?.winningOption as string | undefined;
  const votes = decisionPayload?.votes as VoteRecord[] | undefined;

  return (
    <div className="min-h-screen bg-[#0a0c14]" dir="rtl">
      <Header />

      {!state ? (
        <ScenarioCard onStart={startConversation} isStarting={isStarting} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-white font-bold text-xl">استشارة تصدير التمور</h2>
              <p className="text-slate-500 text-xs font-mono mt-0.5">
                {state.conversationId.slice(0, 16)}... · {state.status === 'running' ? '🟡 قيد التشغيل' : state.status === 'completed' ? '🟢 اكتمل' : '🔴 فشل'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                إعادة تشغيل
              </button>
            </div>
          </div>

          {/* Main layout: Timeline (right/start) + Sidebar (left/end) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Timeline — takes 2/3 */}
            <div className="lg:col-span-2">
              <div className="sticky-scroll max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                <ConversationTimeline
                  messages={state.messages}
                  status={state.status}
                />

                {/* Document viewer inline after conversation */}
                {state.messages.some(m => m.intent === 'documentGenerated') && (
                  <div className="mt-4">
                    <DocumentViewer messages={state.messages} />
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-4">
              {/* Agent Status */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <AgentStatusPanel
                  statuses={state.agentStatuses}
                  decisionReached={!!winningOption}
                  winningOption={winningOption}
                  votes={votes}
                />
              </div>

              {/* Stats */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-widest">إحصائيات</div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">الرسائل</span>
                  <span className="text-white font-mono">{state.messages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">الأصوات</span>
                  <span className="text-white font-mono">{votes?.length ?? 0} / 4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">القرار</span>
                  <span className={`font-mono text-xs ${winningOption ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {winningOption ?? 'في الانتظار'}
                  </span>
                </div>
                {votes && votes.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">متوسط الثقة</span>
                    <span className="text-emerald-400 font-mono">
                      {(votes.reduce((s, v) => s + v.confidence, 0) / votes.length * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Protocol badge */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-3 text-center">
                <div className="text-xs text-slate-600 mb-1">مُشغَّل بواسطة</div>
                <div className="text-slate-400 text-sm font-mono">STEP Protocol v0.1</div>
                <div className="text-slate-600 text-xs mt-0.5">JSON-LD · W3C PROV-O · A2A</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
