import type { KpiMetric, AlertItem, TaskItem } from './dashboard';
import type { DomainAgent, SupervisorAgent } from './agents';
import type { KnowledgeEntry, Skill } from './knowledge';
import type { DemoConversation } from './chat';
import type { A2AMessage, CollaborationEvent, SharedContextEntry, ConflictResolution } from './a2a-protocol';

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

// Chat conversation for the scenario (legacy — kept for backwards compat)
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

// Workflow execution summary (dashboard-level)
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

// Visual workflow template for the Workflows page canvas
export interface ScenarioWfNode {
  id: string;
  type: 'trigger' | 'agent' | 'condition' | 'action' | 'merge' | 'split' | 'transform' | 'connector';
  name: string;
  nameEn?: string;
  agentType?: string;
  subAgent?: string;
  connectorType?: string;
  x: number;
  y: number;
}

export interface ScenarioWfEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  labelEn?: string;
}

export interface ScenarioWorkflowTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  nodes: ScenarioWfNode[];
  edges: ScenarioWfEdge[];
}

// Permissions scenario data
export interface ScenarioAuditEntry {
  id: string;
  time: string;
  level: number;
  agentEn: string;
  agentZh: string;
  actEn: string;
  actZh: string;
  status: string;
  highRisk: boolean;
  detailEn: string;
  detailZh: string;
  impactEn: string;
  impactZh: string;
}

// The full scenario data package
export interface ScenarioData {
  meta: ScenarioMeta;
  dashboard: ScenarioDashboard;
  agents: DomainAgent[];
  conversations: ScenarioConversation[];
  workflows: ScenarioWorkflowExecution[];
  // Chat page — full DemoConversation objects
  chatConversations?: DemoConversation[];
  // Knowledge page
  knowledgeEntries?: KnowledgeEntry[];
  skills?: Skill[];
  // Workflows page — visual templates
  workflowTemplates?: ScenarioWorkflowTemplate[];
  // Permissions page
  auditLog?: ScenarioAuditEntry[];
  // Multi-agent collaboration
  supervisor?: SupervisorAgent;
  a2aMessages?: A2AMessage[];
  collaborationEvents?: CollaborationEvent[];
  sharedContext?: SharedContextEntry[];
  conflictResolutions?: ConflictResolution[];
}
