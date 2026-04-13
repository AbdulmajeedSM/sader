import { useState } from 'react';
import type { StepMessage } from '../types/step';
import { AGENT_CONFIG, INTENT_LABELS } from './agentConfig';

interface Props {
  message: StepMessage;
  index: number;
}

function getMessageSummary(msg: StepMessage): string {
  const p = msg.payload as Record<string, unknown>;

  switch (msg.intent) {
    case 'queryRequirements': {
      const tc = p.tradeContext as Record<string, unknown> | undefined;
      return `طلب متطلبات تصدير ${tc?.hsDescription ?? ''} إلى ${tc?.destinationCountry ?? ''}`;
    }
    case 'queryLogistics': {
      const tc = p.tradeContext as Record<string, unknown> | undefined;
      return `طلب تكاليف شحن إلى ${tc?.destinationCountry ?? ''}`;
    }
    case 'requirementsFound':
      return 'تم تحديد متطلبات الاستيراد والشهادات اللازمة';
    case 'logisticsEstimated': {
      const days = p.transitDays as number | undefined;
      const cost = p.freightCostUsd as number | undefined;
      return `مدة العبور: ${days} يوم — التكلفة: $${cost}`;
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
      return `التصويت: ${choice ?? ''} — ثقة ${conf ? (conf * 100).toFixed(0) + '%' : ''}`;
    }
    case 'decisionReached': {
      const option = p.winningOption as string | undefined;
      return `القرار: التصدير إلى ${option === 'AE' ? 'الإمارات العربية المتحدة 🇦🇪' : option}`;
    }
    case 'documentGenerated': {
      const title = p.title as string | undefined;
      return `وثيقة جاهزة: ${title ?? ''}`;
    }
    default:
      return msg.intent;
  }
}

function getMessageBorderColor(intent: string): string {
  switch (intent) {
    case 'constraintWarning':
    case 'decisionRejected':  return 'border-red-700/60';
    case 'timelineRisk':      return 'border-orange-700/60';
    case 'decisionReached':   return 'border-emerald-600/80';
    case 'documentGenerated': return 'border-violet-600/60';
    case 'callForVote':
    case 'castVote':          return 'border-emerald-700/50';
    default:                  return 'border-slate-700/40';
  }
}

export default function MessageBubble({ message, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = AGENT_CONFIG[message.sender] ?? AGENT_CONFIG['marketAgent']!
  const intentMeta = INTENT_LABELS[message.intent] ?? { ar: message.intent, badge: message.intent.toUpperCase(), badgeClass: 'bg-slate-800 text-slate-300' };
  const summary = getMessageSummary(message);
  const borderColor = getMessageBorderColor(message.intent);
  const isDecision = message.intent === 'decisionReached';
  const isBlocker = message.intent === 'constraintWarning';

  return (
    <div
      className={`message-enter rounded-xl border ${borderColor} p-4 transition-all duration-200 ${
        isDecision ? 'bg-emerald-950/40' :
        isBlocker  ? 'bg-red-950/30' :
        'bg-slate-900/60'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.icon}</span>
          <span className={`text-sm font-medium ${cfg.color}`}>{cfg.nameAr}</span>
          <span className="text-slate-600 text-xs">←</span>
          <span className="text-slate-400 text-xs">
            {AGENT_CONFIG[message.receiver]?.nameAr ?? (message.receiver === 'broadcast' || message.receiver === 'Broadcast' ? 'الكل' : message.receiver)}
          </span>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${intentMeta.badgeClass}`}>
          {intentMeta.badge}
        </span>
      </div>

      {/* Arabic summary */}
      <div className={`mt-2 text-sm leading-relaxed ${isDecision ? 'text-emerald-200 font-medium' : isBlocker ? 'text-red-200' : 'text-slate-300'}`}>
        {summary}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
      >
        <span className="font-mono">{'{...}'}</span>
        <span>{expanded ? 'إخفاء JSON-LD' : 'عرض JSON-LD'}</span>
      </button>

      {/* JSON-LD viewer */}
      {expanded && (
        <pre className="mt-2 text-xs bg-slate-950 rounded-lg p-3 overflow-x-auto text-slate-400 border border-slate-800 max-h-64" dir="ltr">
          {JSON.stringify(message, null, 2)}
        </pre>
      )}

      {/* Timestamp */}
      <div className="mt-2 text-xs text-slate-700">
        {new Date(message.timestamp).toLocaleTimeString('ar-SA')}
        <span className="ml-2 font-mono opacity-60">{message.messageId.slice(0, 8)}</span>
      </div>
    </div>
  );
}
