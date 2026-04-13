import type { AgentId, StepIntent } from '../types/step';

export interface AgentConfig {
  id: AgentId;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const _e = (id: AgentId, nameAr: string, nameEn: string, icon: string, color: string, bg: string, border: string, dot: string): AgentConfig =>
  ({ id, nameAr, nameEn, icon, color, bgColor: bg, borderColor: border, dotColor: dot });

// Keys in camelCase to match JSON serialization from .NET (JsonNamingPolicy.CamelCase)
export const AGENT_CONFIG: Record<string, AgentConfig> = {
  marketAgent:     _e('marketAgent',     'وكيل السوق',      'Market',     '📊', 'text-blue-400',    'bg-blue-950/50',    'border-blue-700',    'bg-blue-400'),
  complianceAgent: _e('complianceAgent', 'وكيل الامتثال',   'Compliance', '🔍', 'text-amber-400',   'bg-amber-950/50',   'border-amber-700',   'bg-amber-400'),
  documentAgent:   _e('documentAgent',   'وكيل المستندات',  'Documents',  '📄', 'text-violet-400',  'bg-violet-950/50',  'border-violet-700',  'bg-violet-400'),
  logisticsAgent:  _e('logisticsAgent',  'وكيل الشحن',      'Logistics',  '🚢', 'text-cyan-400',    'bg-cyan-950/50',    'border-cyan-700',    'bg-cyan-400'),
  consensusEngine: _e('consensusEngine', 'محرك الإجماع',    'Consensus',  '⚖️', 'text-emerald-400', 'bg-emerald-950/50', 'border-emerald-700', 'bg-emerald-400'),
  broadcast:       _e('broadcast',       'الكل',            'Broadcast',  '📡', 'text-slate-400',   'bg-slate-900/50',   'border-slate-700',   'bg-slate-400'),
};

export const INTENT_LABELS: Record<StepIntent, { ar: string; badge: string; badgeClass: string }> = {
  queryRequirements:  { ar: 'استفسار عن المتطلبات', badge: 'QUERY', badgeClass: 'bg-blue-900 text-blue-200' },
  queryLogistics:     { ar: 'استفسار عن الشحن', badge: 'QUERY', badgeClass: 'bg-cyan-900 text-cyan-200' },
  requirementsFound:  { ar: 'متطلبات مُحددة', badge: 'FOUND', badgeClass: 'bg-green-900 text-green-200' },
  logisticsEstimated: { ar: 'تكاليف الشحن', badge: 'ESTIMATED', badgeClass: 'bg-cyan-900 text-cyan-200' },
  constraintWarning:  { ar: 'تحذير عائق', badge: 'BLOCKER', badgeClass: 'bg-red-900 text-red-200' },
  timelineRisk:       { ar: 'خطر على الجدول الزمني', badge: 'RISK', badgeClass: 'bg-orange-900 text-orange-200' },
  proposeAlternative: { ar: 'مقترح بديل', badge: 'PROPOSE', badgeClass: 'bg-blue-900 text-blue-200' },
  proposeDocumentSet: { ar: 'مجموعة مستندات', badge: 'DOCS', badgeClass: 'bg-violet-900 text-violet-200' },
  callForVote:        { ar: 'طلب تصويت', badge: 'VOTE', badgeClass: 'bg-emerald-900 text-emerald-200' },
  castVote:           { ar: 'تصويت', badge: 'CAST', badgeClass: 'bg-emerald-900 text-emerald-200' },
  decisionReached:    { ar: 'قرار مُتخذ', badge: 'DECISION', badgeClass: 'bg-emerald-800 text-emerald-100' },
  decisionRejected:   { ar: 'قرار مرفوض', badge: 'REJECTED', badgeClass: 'bg-red-900 text-red-200' },
  documentGenerated:  { ar: 'وثيقة مُولَّدة', badge: 'DOCUMENT', badgeClass: 'bg-violet-900 text-violet-200' },
};
