// camelCase to match .NET JsonNamingPolicy.CamelCase serialization
export type AgentId =
  | 'marketAgent'
  | 'complianceAgent'
  | 'documentAgent'
  | 'logisticsAgent'
  | 'consensusEngine'
  | 'broadcast'
  | 'user';

export type StepIntent =
  | 'queryRequirements'
  | 'queryLogistics'
  | 'requirementsFound'
  | 'logisticsEstimated'
  | 'constraintWarning'
  | 'timelineRisk'
  | 'proposeAlternative'
  | 'proposeDocumentSet'
  | 'callForVote'
  | 'castVote'
  | 'decisionReached'
  | 'decisionRejected'
  | 'documentGenerated';

export interface StepMessage {
  '@context': string;
  '@type': string;
  messageId: string;
  intent: StepIntent;
  sender: AgentId;
  receiver: AgentId;
  conversationId: string;
  parentMessageId?: string;
  timestamp: string;
  confidence: number;
  payload: Record<string, unknown>;
}

export interface VoteRecord {
  voter: AgentId;
  choice: string;
  confidence: number;
  rationale?: string;
}

export type AgentStatus = 'idle' | 'thinking' | 'voting' | 'done';

export interface ConversationState {
  conversationId: string;
  status: 'running' | 'completed' | 'failed';
  messages: StepMessage[];
  agentStatuses: Record<AgentId, AgentStatus>;
}
