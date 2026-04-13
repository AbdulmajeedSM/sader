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

export const AGENT_CONFIG: Record<string, AgentConfig> = {
  MarketAgent: {
    id: 'MarketAgent', nameAr: 'وكيل السوق', nameEn: 'Market', icon: '📊',
    color: 'text-blue-400', bgColor: 'bg-blue-950/50', borderColor: 'border-blue-700', dotColor: 'bg-blue-400',
  },
  ComplianceAgent: {
    id: 'ComplianceAgent', nameAr: 'وكيل الامتثال', nameEn: 'Compliance', icon: '🔍',
    color: 'text-amber-400', bgColor: 'bg-amber-950/50', borderColor: 'border-amber-700', dotColor: 'bg-amber-400',
  },
  DocumentAgent: {
    id: 'DocumentAgent', nameAr: 'وكيل المستندات', nameEn: 'Documents', icon: '📄',
    color: 'text-violet-400', bgColor: 'bg-violet-950/50', borderColor: 'border-violet-700', dotColor: 'bg-violet-400',
  },
  LogisticsAgent: {
    id: 'LogisticsAgent', nameAr: 'وكيل الشحن', nameEn: 'Logistics', icon: '🚢',
    color: 'text-cyan-400', bgColor: 'bg-cyan-950/50', borderColor: 'border-cyan-700', dotColor: 'bg-cyan-400',
  },
  ConsensusEngine: {
    id: 'ConsensusEngine', nameAr: 'محرك الإجماع', nameEn: 'Consensus', icon: '⚖️',
    color: 'text-emerald-400', bgColor: 'bg-emerald-950/50', borderColor: 'border-emerald-700', dotColor: 'bg-emerald-400',
  },
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
