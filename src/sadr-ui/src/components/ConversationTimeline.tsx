import { useEffect, useRef } from 'react';
import type { StepMessage } from '../types/step';
import MessageBubble from './MessageBubble';

interface Props {
  messages: StepMessage[];
  status: 'running' | 'completed' | 'failed';
}

function TypingIndicator() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 8,
      border: '1px solid var(--border)', background: 'var(--surface-2)',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
      </div>
      <span style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--mono)' }}>الوكلاء يعملون...</span>
    </div>
  );
}

export default function ConversationTimeline({ messages, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Protocol header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }} />
        <span style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 4 }}>
          STEP PROTOCOL · LIVE FEED
        </span>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }} />
      </div>

      {/* Empty + running */}
      {messages.length === 0 && status === 'running' && <TypingIndicator />}

      {/* Messages */}
      {messages.map((msg, i) => (
        <MessageBubble key={msg.messageId} message={msg} index={i} />
      ))}

      {/* Running indicator */}
      {status === 'running' && messages.length > 0 && (
        <div style={{ paddingRight: 4 }}>
          <TypingIndicator />
        </div>
      )}

      {/* Completed */}
      {status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(0,201,122,0.3))' }} />
          <span style={{ color: 'var(--green)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
            ✓ SESSION COMPLETE
          </span>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(0,201,122,0.3), transparent)' }} />
        </div>
      )}

      {/* Failed */}
      {status === 'failed' && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--red)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          ✗ SESSION FAILED
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
