import { useState, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import type { StepMessage, AgentId, AgentStatus, ConversationState } from '../types/step';

const ALL_AGENTS: AgentId[] = [
  'marketAgent', 'complianceAgent', 'documentAgent', 'logisticsAgent', 'consensusEngine'
];

const initialStatuses = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(ALL_AGENTS.map(a => [a, 'idle'])) as Record<AgentId, AgentStatus>;

function deriveStatus(intent: string): AgentStatus {
  if (intent === 'castVote' || intent === 'callForVote') return 'voting';
  return 'thinking';
}

export function useStepConversation() {
  const [state, setState] = useState<ConversationState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const startConversation = useCallback(async () => {
    setIsStarting(true);

    // Create conversation on backend
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'dates-malaysia' }),
    });
    const { conversationId } = await res.json();

    // Initialize state
    setState({
      conversationId,
      status: 'running',
      messages: [],
      agentStatuses: initialStatuses(),
    });

    // Connect SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/step')
      .withAutomaticReconnect()
      .build();

    connection.on('StepMessage', (rawJson: string) => {
      const msg: StepMessage = JSON.parse(rawJson);
      setState(prev => {
        if (!prev) return prev;
        const updated = { ...prev };

        // Add message
        updated.messages = [...prev.messages, msg];

        // Update agent statuses
        const newStatuses = { ...prev.agentStatuses };

        // Sender becomes thinking/voting
        if (msg.sender !== 'broadcast' && msg.sender !== 'user') {
          newStatuses[msg.sender] = deriveStatus(msg.intent);
        }

        // Mark previous active agents as done (except if still needed)
        if (msg.intent === 'decisionReached') {
          ALL_AGENTS.forEach(a => { newStatuses[a] = 'done'; });
        }

        updated.agentStatuses = newStatuses;
        return updated;
      });

      // Reset sender to idle after 2s (unless consensus phase)
      if (msg.intent !== 'decisionReached' && msg.sender !== 'broadcast') {
        setTimeout(() => {
          setState(prev => {
            if (!prev) return prev;
            const s = { ...prev.agentStatuses };
            if (s[msg.sender as AgentId] !== 'done') s[msg.sender as AgentId] = 'idle';
            return { ...prev, agentStatuses: s };
          });
        }, 2000);
      }
    });

    connection.on('ConversationStatus', (data: { status: string }) => {
      setState(prev => prev ? { ...prev, status: data.status as 'completed' | 'failed' } : prev);
    });

    await connection.start();
    await connection.invoke('JoinConversation', conversationId);
    connectionRef.current = connection;
    setIsStarting(false);
  }, []);

  const reset = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
    }
    setState(null);
  }, []);

  return { state, isStarting, startConversation, reset };
}
