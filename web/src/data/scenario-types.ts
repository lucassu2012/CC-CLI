import type { KpiMetric, AlertItem, TaskItem } from './dashboard';
import type { DomainAgent } from './agents';

// Scenario metadata
export interface ScenarioMeta {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  version: string;
  author: string;
  createdAt: string;
  tags: string[];
}

// Dashboard data subset
export interface ScenarioDashboard {
  kpis: KpiMetric[];
  alerts: AlertItem[];
  tasks: TaskItem[];
  extraTasks: TaskItem[];
  extraAlerts: AlertItem[];
}

// Chat conversation for the scenario
export interface ScenarioChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: { id: string; name: string; status: string; input: string; output?: string; duration?: string }[];
  thinkingSteps?: { phase: string; phaseZh: string; content: string; contentZh: string; timestamp: string }[];
  suggestions?: { id: string; text: string; textZh: string; type: string }[];
}

export interface ScenarioConversation {
  id: string;
  title: string;
  titleZh: string;
  domain: string;
  messages: ScenarioChatMessage[];
}

// Workflow execution
export interface ScenarioWorkflowExecution {
  id: string;
  workflowName: string;
  workflowNameZh?: string;
  status: 'completed' | 'running' | 'failed' | 'cancelled';
  startTime: string;
  duration: string;
  nodesExecuted: number;
  totalNodes: number;
  trigger: string;
  triggerZh?: string;
  result: string;
  resultZh?: string;
  agentsInvolved: string[];
}

// The full scenario data package
export interface ScenarioData {
  meta: ScenarioMeta;
  dashboard: ScenarioDashboard;
  agents: DomainAgent[];  // reuse existing type
  conversations: ScenarioConversation[];
  workflows: ScenarioWorkflowExecution[];
}
