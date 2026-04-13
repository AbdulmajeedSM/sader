import { useState } from 'react';
import type { StepMessage } from '../types/step';
import { AGENT_CONFIG, INTENT_LABELS } from './agentConfig';

interface Props {
  message: StepMessage;
  index: number;
}

/* ── Agent accent colors (left border) ─────────────────────────────────────── */
const AGENT_BORDER: Record<string, string> = {
  marketAgent:     '#3B82F6',
  complianceAgent: '#C9922E',
  documentAgent:   '#A78BFA',
  logisticsAgent:  '#00BFD8',
  consensusEngine: '#00C97A',
  broadcast:       '#3A506A',
  user:            '#3A506A',
};

const AGENT_GLOW: Record<string, string> = {
  marketAgent:     'rgba(59,130,246,0.15)',
  complianceAgent: 'rgba(201,146,46,0.15)',
  documentAgent:   'rgba(167,139,250,0.15)',
  logisticsAgent:  'rgba(0,191,216,0.15)',
  consensusEngine: 'rgba(0,201,122,0.15)',
  broadcast:       'transparent',
  user:            'transparent',
};

/* ── Summary text ───────────────────────────────────────────────────────────── */
function getMessageSummary(msg: StepMessage): string {
  const p = msg.payload as Record<string, unknown>;

  switch (msg.intent) {
    case 'queryRequirements': {
      const tc = p.tradeContext as Record<string, unknown> | undefined;
      return `استفسار عن متطلبات تصدير ${tc?.hsDescription ?? ''} إلى ${tc?.destinationCountry ?? ''}`;
    }
    case 'queryLogistics': {
      const tc = p.tradeContext as Record<string, unknown> | undefined;
      return `طلب تكاليف شحن وعبور إلى ${tc?.destinationCountry ?? ''}`;
    }
    case 'requirementsFound':
      return 'تم تحديد متطلبات الاستيراد والشهادات اللازمة للشحنة';
    case 'logisticsEstimated': {
      const days = p.transitDays as number | undefined;
      const cost = p.freightCostUsd as number | undefined;
      return `مدة العبور: ${days} يوم — تكلفة الشحن: $${cost?.toLocaleString()}`;
    }
    case 'constraintWarning': {
      const desc = p.description as string | undefined;
      const cert = p.affectedCertification as Record<string, unknown> | undefined;
      return desc ?? `عائق: شهادة ${cert?.certType ?? ''} تستغرق ${cert?.estimatedDays ?? ''} يوماً`;
    }
    case 'timelineRisk': {
      const desc = p.description as string | undefined;
      return desc ?? 'تحذير: الجدول الزمني في خطر';
    }
    case 'proposeAlternative': {
      const dest = p.proposedDestination as string | undefined;
      const reason = p.reason as string | undefined;
      return `مقترح التحويل إلى ${dest ?? ''}: ${reason ?? ''}`;
    }
    case 'callForVote': {
      const summary = p.proposalSummary as string | undefined;
      return `طلب تصويت: ${summary ?? ''}`;
    }
    case 'castVote': {
      const choice = p.chosenOption as string | undefined;
      const conf = p.confidence as number | undefined;
      const rationale = p.rationale as string | undefined;
      return `التصويت: ${choice ?? ''} — ثقة ${conf ? (conf * 100).toFixed(0) + '%' : ''} ${rationale ? '— ' + rationale : ''}`;
    }
    case 'decisionReached': {
      const option = p.winningOption as string | undefined;
      const type = p.consensusType as string | undefined;
      return `القرار النهائي: التصدير إلى ${option === 'AE' ? 'الإمارات العربية المتحدة 🇦🇪' : option} ${type === 'unanimous' ? '— إجماع تام' : ''}`;
    }
    case 'documentGenerated': {
      const title = p.title as string | undefined;
      return `وثيقة جاهزة: ${title ?? ''}`;
    }
    default:
      return msg.intent;
  }
}

/* ── Intent background tints ────────────────────────────────────────────────── */
function getSurfaceStyle(intent: string): React.CSSProperties {
  switch (intent) {
    case 'constraintWarning':
    case 'decisionRejected':  return { background: 'rgba(232,64,64,0.05)',  borderColor: 'rgba(232,64,64,0.25)' };
    case 'timelineRisk':      return { background: 'rgba(232,120,32,0.05)', borderColor: 'rgba(232,120,32,0.22)' };
    case 'decisionReached':   return { background: 'rgba(0,201,122,0.06)',  borderColor: 'rgba(0,201,122,0.30)' };
    case 'documentGenerated': return { background: 'rgba(167,139,250,0.05)',borderColor: 'rgba(167,139,250,0.25)' };
    case 'callForVote':
    case 'castVote':          return { background: 'rgba(0,201,122,0.04)',  borderColor: 'rgba(0,201,122,0.18)' };
    default:                  return { background: 'var(--surface-2)',       borderColor: 'var(--border)' };
  }
}

export default function MessageBubble({ message, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = AGENT_CONFIG[message.sender] ?? AGENT_CONFIG['marketAgent']!;
  const intentMeta = INTENT_LABELS[message.intent] ?? { ar: message.intent, badge: message.intent.toUpperCase(), badgeClass: '' };
  const summary = getMessageSummary(message);
  const surfaceStyle = getSurfaceStyle(message.intent);
  const borderColor = AGENT_BORDER[message.sender] ?? '#3A506A';
  const glowColor = AGENT_GLOW[message.sender] ?? 'transparent';
  const isDecision = message.intent === 'decisionReached';
  const receiverCfg = AGENT_CONFIG[message.receiver];
  const receiverName = receiverCfg?.nameAr ?? (message.receiver === 'broadcast' ? 'الكل' : message.receiver);

  return (
    <div
      className="message-enter"
      style={{
        ...surfaceStyle,
        borderRadius: 10,
        border: '1px solid',
        borderRightWidth: 3,
        borderRightColor: borderColor,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animationDelay: `${Math.min(index * 40, 400)}ms`,
        boxShadow: isDecision ? `0 0 32px rgba(0,201,122,0.12)` : `inset 4px 0 0 ${glowColor}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decision shimmer bar */}
      {isDecision && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,201,122,0.04) 50%, transparent 100%)',
          borderRadius: 'inherit',
        }} />
      )}

      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        {/* Sender → Receiver */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>{cfg.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color.replace('text-', '') }}>
            {cfg.nameAr}
          </span>
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none" style={{ opacity: 0.4 }}>
            <path d="M0 5 H16 M12 1 L17 5 L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{receiverName}</span>
        </div>

        {/* Intent badge */}
        <IntentBadge intent={message.intent} label={intentMeta.badge} />
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <p style={{
        margin: 0, fontSize: 14, lineHeight: 1.7,
        color: isDecision ? '#6EE7B7' : message.intent === 'constraintWarning' ? '#FCA5A5' : 'var(--text-1)',
        fontWeight: isDecision ? 600 : 400,
      }}>
        {summary}
      </p>

      {/* ── Expand JSON ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <span style={{ opacity: 0.6 }}>{expanded ? '▼' : '▶'}</span>
          <span>{expanded ? 'إخفاء' : 'JSON-LD'}</span>
        </button>

        {/* Timestamp + message ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)' }}>
          <span dir="ltr">{new Date(message.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
          <span style={{ opacity: 0.5 }}>{message.messageId.slice(0, 8)}</span>
          <span style={{ opacity: 0.5 }}>c:{(message.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* ── JSON viewer ──────────────────────────────────────────────────── */}
      {expanded && (
        <pre style={{
          margin: 0, fontSize: 11, padding: '12px 14px',
          background: 'var(--surface-1)', borderRadius: 6,
          border: '1px solid var(--border)', overflowX: 'auto',
          color: 'var(--text-2)', maxHeight: 280,
          fontFamily: 'var(--mono)', lineHeight: 1.6,
        }} dir="ltr">
          {JSON.stringify(message, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ── Intent Badge ───────────────────────────────────────────────────────────── */
function IntentBadge({ intent, label }: { intent: string; label: string }) {
  const styles: Record<string, React.CSSProperties> = {
    constraintWarning:  { background: 'rgba(232,64,64,0.15)',   color: '#F87171', borderColor: 'rgba(232,64,64,0.3)' },
    timelineRisk:       { background: 'rgba(232,120,32,0.15)',  color: '#FB923C', borderColor: 'rgba(232,120,32,0.3)' },
    decisionReached:    { background: 'rgba(0,201,122,0.15)',   color: '#34D399', borderColor: 'rgba(0,201,122,0.3)' },
    documentGenerated:  { background: 'rgba(167,139,250,0.15)', color: '#C4B5FD', borderColor: 'rgba(167,139,250,0.3)' },
    callForVote:        { background: 'rgba(0,201,122,0.12)',   color: '#6EE7B7', borderColor: 'rgba(0,201,122,0.25)' },
    castVote:           { background: 'rgba(0,201,122,0.10)',   color: '#6EE7B7', borderColor: 'rgba(0,201,122,0.2)' },
    proposeAlternative: { background: 'rgba(59,130,246,0.12)',  color: '#93C5FD', borderColor: 'rgba(59,130,246,0.25)' },
    logisticsEstimated: { background: 'rgba(0,191,216,0.12)',   color: '#67E8F9', borderColor: 'rgba(0,191,216,0.25)' },
    queryRequirements:  { background: 'rgba(59,130,246,0.10)',  color: '#93C5FD', borderColor: 'rgba(59,130,246,0.2)' },
    queryLogistics:     { background: 'rgba(0,191,216,0.10)',   color: '#67E8F9', borderColor: 'rgba(0,191,216,0.2)' },
    requirementsFound:  { background: 'rgba(0,201,122,0.10)',   color: '#6EE7B7', borderColor: 'rgba(0,201,122,0.2)' },
  };

  const s = styles[intent] ?? { background: 'rgba(58,80,106,0.3)', color: 'var(--text-2)', borderColor: 'var(--border)' };

  return (
    <span style={{
      ...s, border: '1px solid', borderRadius: 4,
      padding: '2px 8px', fontSize: 10, fontFamily: 'var(--mono)',
      fontWeight: 500, letterSpacing: '0.05em', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}
