import { useEffect, useRef } from 'react';
import type { StepMessage } from '../types/step';
import MessageBubble from './MessageBubble';

interface Props {
  messages: StepMessage[];
  status: 'running' | 'completed' | 'failed';
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 w-fit">
      <span className="text-slate-500 text-xs">الوكلاء يعملون</span>
      <div className="flex gap-1">
        <div className="typing-dot w-1.5 h-1.5 bg-slate-500 rounded-full" />
        <div className="typing-dot w-1.5 h-1.5 bg-slate-500 rounded-full" />
        <div className="typing-dot w-1.5 h-1.5 bg-slate-500 rounded-full" />
      </div>
    </div>
  );
}

export default function ConversationTimeline({ messages, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-3">
      {/* Protocol header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs text-slate-600 font-mono px-2">STEP Protocol v0.1</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      {messages.length === 0 && status === 'running' && <TypingIndicator />}

      {messages.map((msg, i) => (
        <MessageBubble key={msg.messageId} message={msg} index={i} />
      ))}

      {status === 'running' && messages.length > 0 && <TypingIndicator />}

      {status === 'completed' && (
        <div className="text-center py-3">
          <div className="text-xs text-slate-600 font-mono">─── نهاية المحادثة ───</div>
        </div>
      )}

      {status === 'failed' && (
        <div className="text-center py-3">
          <div className="text-xs text-red-600">حدث خطأ في المحادثة</div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
