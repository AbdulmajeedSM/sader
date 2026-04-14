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
      padding: '9px 15px', borderRadius: 8,
      border: '1px solid var(--border)', background: 'var(--surface-2)',
    }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
        <div className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
      </div>
      <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)' }}>الوكلاء يعملون...</span>
    </div>
  );
}

export default function ConversationTimeline({ messages, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }} />
        <span style={{
          color: 'var(--text-3)', fontSize: 9, fontFamily: 'var(--mono)',
          letterSpacing: '0.12em', padding: '3px 10px',
          border: '1px solid var(--border)', borderRadius: 4,
        }}>STEP PROTOCOL · LIVE FEED</span>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }} />
      </div>

      {/* Empty + running */}
      {messages.length === 0 && status === 'running' && <TypingIndicator />}

      {/* Messages with connector dots */}
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        return (
          <div key={msg.messageId} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Connector between messages */}
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, paddingRight: 0, height: 20, justifyContent: 'flex-end', paddingLeft: 12 }}>
                <div style={{ width: 1, background: 'linear-gradient(to bottom, var(--border), var(--border-hi))', margin: '0 auto' }} />
              </div>
            )}
            <MessageBubble message={msg} index={i} />
            {/* Tail connector below last message */}
            {isLast && status === 'running' && (
              <div style={{ height: 20, display: 'flex', justifyContent: 'flex-end', paddingLeft: 12 }}>
                <div style={{ width: 1, background: 'linear-gradient(to bottom, var(--border-hi), transparent)' }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Running typing indicator */}
      {status === 'running' && messages.length > 0 && (
        <div style={{ paddingTop: 4 }}>
          <TypingIndicator />
        </div>
      )}

      {/* Completed */}
      {status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 4px' }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(0,201,122,0.4))' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 6,
            border: '1px solid rgba(0,201,122,0.25)',
            background: 'rgba(0,201,122,0.07)',
          }}>
            <span style={{ color: 'var(--green)', fontSize: 11 }}>✓</span>
            <span style={{ color: 'var(--green)', fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>SESSION COMPLETE</span>
          </div>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(0,201,122,0.4), transparent)' }} />
        </div>
      )}

      {/* Failed */}
      {status === 'failed' && (
        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--red)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
          ✗ SESSION FAILED
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
