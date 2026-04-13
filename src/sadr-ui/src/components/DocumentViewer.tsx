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

  return (
    <div className="rounded-xl border border-violet-700/50 bg-violet-950/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-800/50 bg-violet-950/40">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <div>
            <div className="text-sm font-medium text-violet-200">{title ?? 'وثيقة'}</div>
            <div className="text-xs text-violet-400">{docType} · {processingDays}</div>
          </div>
        </div>
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

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        <pre className="text-xs text-violet-200 whitespace-pre-wrap font-mono leading-relaxed" dir="ltr">
          {content ?? 'جارٍ توليد الوثيقة...'}
        </pre>
      </div>
    </div>
  );
}
