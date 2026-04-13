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
  const p = selected.payload as Record<string, unknown>;
  const content = p.content as string | undefined;
  const title = p.title as string | undefined;
  const docType = p.documentType as string | undefined;
  const processingDays = p.estimatedProcessingDays as string | undefined;
  const docsRequired = p.documentsRequired as string[] | undefined;

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid rgba(167,139,250,0.3)',
      background: 'var(--surface-1)',
      overflow: 'hidden',
      boxShadow: '0 0 32px rgba(167,139,250,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(167,139,250,0.2)',
        background: 'rgba(167,139,250,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          }}>📄</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#C4B5FD' }}>{title ?? 'وثيقة مُولَّدة'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{docType}</span>
              {processingDays && (
                <>
                  <span style={{ color: 'var(--border-hi)' }}>·</span>
                  <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)' }}>⏱ {processingDays}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 100,
            background: 'rgba(0,201,122,0.12)', border: '1px solid rgba(0,201,122,0.3)',
            color: 'var(--green)', fontFamily: 'var(--mono)',
          }}>✓ جاهزة</span>

          {docMessages.length > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {docMessages.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    width: 24, height: 24, borderRadius: 4, border: 'none',
                    background: i === selectedIdx ? 'rgba(167,139,250,0.4)' : 'var(--surface-3)',
                    color: i === selectedIdx ? '#fff' : 'var(--text-3)',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'var(--mono)',
                  }}
                >{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document content */}
      <div style={{ padding: '16px' }}>
        <pre style={{
          margin: 0, fontSize: 12, padding: '14px 16px',
          background: 'var(--bg)', borderRadius: 8,
          border: '1px solid var(--border)',
          color: '#DDD6FE', maxHeight: 200, overflowY: 'auto',
          fontFamily: 'var(--mono)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }} dir="rtl">
          {content ?? 'جارٍ توليد الوثيقة...'}
        </pre>
      </div>

      {/* Required documents */}
      {docsRequired && docsRequired.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 8, letterSpacing: '0.06em' }}>
            REQUIRED DOCUMENTS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {docsRequired.map((doc, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 4,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}>
                📎 {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          STEP · documentGenerated
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          {selected.messageId.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
