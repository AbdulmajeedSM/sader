import { useState } from 'react';
import type { StepMessage } from '../types/step';

interface Props {
  messages: StepMessage[];
}

export default function DocumentViewer({ messages }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const docMessages = messages.filter(m => m.intent === 'documentGenerated');
  if (docMessages.length === 0) return null;

  const selected = docMessages[selectedIdx];
  const payload = selected.payload as Record<string, unknown>;
  const content = payload.content as string | undefined;
  const title = payload.title as string | undefined;
  const docType = payload.documentType as string | undefined;
  const processingDays = payload.estimatedProcessingDays as string | undefined;
  const docsRequired = payload.documentsRequired as string[] | undefined;

  return (
    <div className="rounded-xl border border-violet-600/60 bg-violet-950/30 overflow-hidden shadow-lg shadow-violet-950/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-800/50 bg-violet-950/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-800/60 flex items-center justify-center text-lg">📄</div>
          <div>
            <div className="text-sm font-bold text-violet-100">{title ?? 'وثيقة مُولَّدة'}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-violet-400 font-mono">{docType}</span>
              {processingDays && (
                <>
                  <span className="text-violet-700">·</span>
                  <span className="text-xs text-emerald-400">⏱ {processingDays}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
            ✓ جاهزة
          </span>
          {docMessages.length > 1 && (
            <div className="flex gap-1">
              {docMessages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-6 h-6 rounded text-xs transition-colors ${
                    i === selectedIdx
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-900/60 text-violet-400 hover:bg-violet-800'
                  }`}
                >{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="p-4">
        <pre className="text-xs text-violet-100 whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/60 rounded-lg p-3 border border-slate-800 max-h-48 overflow-y-auto" dir="rtl">
          {content ?? 'جارٍ توليد الوثيقة...'}
        </pre>
      </div>

      {/* Documents required list */}
      {docsRequired && docsRequired.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs text-violet-400 mb-2 font-medium">المستندات المطلوبة:</div>
          <div className="flex flex-wrap gap-2">
            {docsRequired.map((doc, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-slate-900 rounded-lg border border-slate-700 text-slate-300">
                📎 {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-violet-950/40 border-t border-violet-900/50 flex items-center justify-between">
        <span className="text-xs text-violet-500 font-mono">STEP Protocol · documentGenerated</span>
        <span className="text-xs text-slate-600 font-mono">{selected.messageId.slice(0, 8)}</span>
      </div>
    </div>
  );
}
