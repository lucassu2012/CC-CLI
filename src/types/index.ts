/**
 * IOE Core Type Definitions
 * Intelligent Operations Engine - Type System
 *
 * Design Philosophy (from Claude Code Harness):
 * - Model drives the loop, Harness provides tools/context/permissions
 * - Primitives over integrations
 * - Shrinking harness - design for removal
 */

// ============================================================================
// TAOR Loop Types (Think-Act-Observe-Repeat)
// ============================================================================

export type TAORPhase = 'think' | 'act' | 'observe' | 'repeat' | 'complete' | 'error';

export interface TAORState {
  phase: TAORPhase;
  turnCount: number;
  messages: Message[];
  taskId: string;
  parentTaskId?: string;
  startTime: number;
  lastActivityTime: number;
  metadata: Record<string, unknown>;
}

export interface TAORConfig {
  maxTurns: number;
  maxTokens: number;
  contextWindowSize: number;
  compressionThreshold: number; // ~92% of context window
  maxConcurrentReadTools: number; // 10 parallel for read-only
  maxRetries: number;
  retryBackoffMs: number[];
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent[];
  timestamp: number;
  metadata?: MessageMetadata;
}

export type MessageContent =
  | TextContent
  | ToolUseContent
  | ToolResultContent
  | ImageContent
  | AudioContent
  | CompactBoundaryContent;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  toolId: string;
  content: string;
  isError?: boolean;
}

export interface ImageContent {
  type: 'image';
  source: string;
  mediaType: string;
}

export interface AudioContent {
  type: 'audio';
  source: string;
  mediaType: string;
}

export interface CompactBoundaryContent {
  type: 'compact_boundary';
  summary: string;
  preservedFileCount: number;
  originalTokenCount: number;
  compressedTokenCount: number;
}

export interface MessageMetadata {
  tokenCount?: number;
  importance?: number;
  compressible?: boolean;
  domainContext?: DomainType;
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentRole =
  | 'main'           // IOE Main Agent - global awareness
  | 'planning'       // Network Planning Domain
  | 'optimization'   // Network Optimization Domain
  | 'experience'     // Experience Assurance Domain
  | 'ops'            // Network Operations Domain
  | 'marketing';     // Operations Support Domain

export type SubAgentRole =
  // Planning sub-agents
  | 'value-insight'
  | 'network-simulation'
  | 'market-revenue'
  | 'roi-estimation'
  // Optimization sub-agents
  | 'realtime-optimization'
  | 'engineering-optimization'
  | 'event-assurance'
  // Experience sub-agents
  | 'complaint-prevention'
  | 'differentiated-experience'
  | 'deterministic-experience'
  // Ops sub-agents
  | 'ops-monitoring'
  | 'fault-analysis'
  | 'field-maintenance'
  // Marketing sub-agents
  | 'prospect-identification'
  | 'realtime-marketing'
  | 'churn-prevention';

export interface AgentConfig {
  id: string;
  role: AgentRole | SubAgentRole;
  name: string;
  description: string;
  modelId: string;
  tools: string[];                    // Allowed tool names
  permissionLevel: PermissionLevel;
  parentAgentId?: string;
  contextBudget: ContextBudget;
  domainKnowledge: string[];          // Paths to domain NETWORK.md files
  isolationMode: 'shared' | 'isolated' | 'worktree';
}

export interface AgentInstance {
  config: AgentConfig;
  state: TAORState;
  status: 'idle' | 'running' | 'waiting' | 'completed' | 'error';
  childAgents: string[];
  mailbox: AgentMessage[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'escalation';
  content: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Tool Types (Primitives over Integrations)
// ============================================================================

export interface Tool<TInput = unknown, TOutput = unknown, TProgress = unknown> {
  name: string;
  category: ToolCategory;
  description: string;
  inputSchema: Record<string, unknown>;
  isReadOnly: boolean;
  isDeferred: boolean;                // Lazy loading support
  requiredPermission: PermissionLevel;
  domainAffinity?: DomainType[];      // Which domains this tool is most relevant to

  validate(input: TInput): ValidationResult;
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
  onProgress?(progress: TProgress): void;
  render(result: ToolResult<TOutput>): ToolRenderOutput;
}

export type ToolCategory =
  | 'read'          // Network query, KPI read, config read
  | 'write'         // Config change, parameter adjustment
  | 'execute'       // Command execution on NEs
  | 'connect'       // External system integration
  | 'analyze'       // Data analysis, pattern detection
  | 'simulate'      // Digital twin simulation
  | 'orchestrate';  // Agent/task management

export interface ToolContext {
  agentId: string;
  sessionId: string;
  permissionLevel: PermissionLevel;
  networkContext: NetworkContext;
  digitalTwinAvailable: boolean;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokenCount: number;
  truncated: boolean;
  executionTimeMs: number;
}

export interface ToolRenderOutput {
  use: string;
  progress?: string;
  result: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Permission Types (L1-L5 Trust Hierarchy)
// ============================================================================

export type PermissionLevel = 'L1_readonly' | 'L2_low_risk' | 'L3_medium' | 'L4_high_risk' | 'L5_emergency';

export interface PermissionPolicy {
  level: PermissionLevel;
  allowedOperations: string[];
  deniedOperations: string[];
  requiresApproval: boolean;
  requiresDigitalTwinSim: boolean;
  requiresAuditLog: boolean;
  approverRoles: string[];
  maxAutoApprovalCount?: number;
}

export interface PermissionRequest {
  id: string;
  agentId: string;
  toolName: string;
  operation: string;
  targetResource: string;
  riskLevel: PermissionLevel;
  justification: string;
  digitalTwinResult?: SimulationResult;
  timestamp: number;
}

export interface PermissionDecision {
  requestId: string;
  approved: boolean;
  decidedBy: 'auto' | 'human' | 'policy' | 'digital_twin';
  reason: string;
  conditions?: string[];
  expiresAt?: number;
}

// ============================================================================
// Context Management Types
// ============================================================================

export interface ContextBudget {
  systemPromptTokens: number;    // Fixed ~50K for network state
  sessionHistoryTokens: number;  // Dynamic, compressed
  currentTurnTokens: number;     // Current turn
  toolResultTokens: number;      // Per-tool budgets
  totalBudget: number;
}

export interface CompressionStrategy {
  name: 'auto_compact' | 'snip_compact' | 'context_collapse' | 'micro_compress';
  trigger: CompressionTrigger;
  execute(messages: Message[], budget: ContextBudget): Promise<CompressionResult>;
}

export interface CompressionTrigger {
  type: 'threshold' | 'error' | 'time' | 'size';
  value: number;
}

export interface CompressionResult {
  compressedMessages: Message[];
  originalTokenCount: number;
  compressedTokenCount: number;
  compressionRatio: number;
  semanticLossEstimate: number;
  preservedFiles: string[];
}

// ============================================================================
// Memory Types (6-Layer Hierarchy)
// ============================================================================

export type MemoryLayer =
  | 'L1_managed'       // Enterprise/MDM policies
  | 'L2_project'       // NETWORK.md at project root
  | 'L3_rules'         // Domain-specific rules
  | 'L4_user'          // Operator preferences
  | 'L5_local'         // Per-directory auto-discovery
  | 'L6_dream';        // Auto-generated from Dream system

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  domain?: DomainType;
  content: string;
  source: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  importance: number;
  tags: string[];
}

export interface DreamConfig {
  minIntervalHours: number;       // Min 24h between dreams
  minSessionsSinceLastDream: number; // Min 5 sessions
  maxMemoryIndexLines: number;    // 200 lines / ~25KB
  phases: ('orient' | 'gather' | 'consolidate' | 'prune')[];
}

// ============================================================================
// Hook Types (Deterministic Guarantees around Non-deterministic LLM)
// ============================================================================

export type HookEvent =
  | 'pre_tool_use'
  | 'post_tool_use'
  | 'pre_config_change'
  | 'post_config_change'
  | 'pre_command_execute'
  | 'post_command_execute'
  | 'pre_simulation'
  | 'post_simulation'
  | 'permission_request'
  | 'task_start'
  | 'task_complete'
  | 'task_error'
  | 'agent_spawn'
  | 'agent_terminate'
  | 'context_compress'
  | 'memory_update'
  | 'escalation'
  | 'maintenance_window_check'
  | 'compliance_check'
  | 'safety_check'
  | 'audit_log';

export type HookHandlerType = 'command' | 'http' | 'prompt' | 'agent';

export interface HookDefinition {
  id: string;
  event: HookEvent;
  handlerType: HookHandlerType;
  handler: string;                // Command, URL, prompt, or agent config
  priority: number;               // Lower = higher priority
  enabled: boolean;
  conditions?: HookCondition[];
  timeout: number;
}

export interface HookCondition {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex' | 'gt' | 'lt';
  value: string | number;
}

export interface HookResult {
  hookId: string;
  action: 'allow' | 'deny' | 'modify' | 'log';
  message?: string;
  modifiedParams?: Record<string, unknown>;
}

// ============================================================================
// Network & Domain Types
// ============================================================================

export type DomainType = 'ran' | 'transport' | 'core' | 'fixed' | 'cloud' | 'cross_domain';

export interface NetworkContext {
  topology: NetworkTopology;
  currentAlarms: Alarm[];
  kpiSnapshot: KPISnapshot;
  maintenanceWindows: MaintenanceWindow[];
  changeFreeze: boolean;
  regulatoryConstraints: RegulatoryConstraint[];
}

export interface NetworkTopology {
  regions: Region[];
  domains: DomainType[];
  elementCount: number;
  lastUpdated: number;
}

export interface Region {
  id: string;
  name: string;
  domains: DomainType[];
  elementIds: string[];
}

export interface Alarm {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
  source: string;
  domain: DomainType;
  description: string;
  timestamp: number;
  acknowledged: boolean;
  correlationId?: string;
}

export interface KPISnapshot {
  timestamp: number;
  metrics: KPIMetric[];
}

export interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: { warning: number; critical: number };
  domain: DomainType;
  scope: string;  // cell/grid/network level
}

export interface MaintenanceWindow {
  id: string;
  start: number;
  end: number;
  affectedElements: string[];
  type: 'planned' | 'emergency';
}

export interface RegulatoryConstraint {
  region: string;
  requirement: string;
  enforcementLevel: 'mandatory' | 'recommended';
}

// ============================================================================
// Digital Twin Types
// ============================================================================

export interface SimulationRequest {
  id: string;
  type: 'coverage' | 'capacity' | 'performance' | 'experience' | 'config_change' | 'failure_injection';
  parameters: Record<string, unknown>;
  targetElements: string[];
  requestedBy: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SimulationResult {
  requestId: string;
  success: boolean;
  predictions: SimulationPrediction[];
  riskAssessment: RiskAssessment;
  confidence: number;
  executionTimeMs: number;
}

export interface SimulationPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  delta: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendation: 'proceed' | 'review' | 'abort';
}

export interface RiskFactor {
  description: string;
  severity: number; // 0-1
  mitigable: boolean;
  mitigation?: string;
}

// ============================================================================
// Shared Data Module Types
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  protocol: 'kafka' | 'grpc' | 'rest' | 'snmp' | 'netconf' | 'file' | 'database';
  endpoint: string;
  domain: DomainType;
  dataType: 'realtime' | 'near_realtime' | 'batch';
  refreshIntervalMs?: number;
  schema?: Record<string, unknown>;
}

export interface DataQuery {
  sourceId: string;
  query: string;
  parameters?: Record<string, unknown>;
  timeRange?: { start: number; end: number };
  limit?: number;
}

export interface DataResult {
  sourceId: string;
  data: unknown;
  timestamp: number;
  cached: boolean;
  nextRefresh?: number;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface KnowledgeEntry {
  id: string;
  type: 'incident' | 'resolution' | 'sop' | 'best_practice' | 'lesson_learned' | 'regulatory';
  title: string;
  content: string;
  domain: DomainType[];
  tags: string[];
  source: 'auto_generated' | 'manual' | 'imported';
  confidence: number;
  usageCount: number;
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
  relatedEntries: string[];
}

export interface KnowledgeUpdate {
  taskId: string;
  summary: string;
  rootCause?: string;
  resolution?: string;
  lessonsLearned: string[];
  affectedDomain: DomainType[];
  autoGenerated: boolean;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface ExternalSystem {
  id: string;
  name: string;
  type: 'oss' | 'bss' | 'ticketing' | 'crm' | 'inventory' | 'monitoring';
  protocol: string;
  endpoint: string;
  authType: 'token' | 'oauth2' | 'certificate' | 'basic';
  capabilities: string[];
}

export interface OSSCommand {
  system: string;
  command: string;
  parameters: Record<string, unknown>;
  targetElements: string[];
  expectedDuration: number;
  rollbackCommand?: string;
}

export interface OSSCommandResult {
  commandId: string;
  success: boolean;
  output: string;
  executionTimeMs: number;
  affectedElements: string[];
}

// ============================================================================
// Task Types
// ============================================================================

export interface Task {
  id: string;
  parentId?: string;
  type: 'diagnostic' | 'optimization' | 'planning' | 'maintenance' | 'marketing' | 'monitoring';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  subtasks: string[];
  dependencies: string[];
  result?: TaskResult;
}

export interface TaskResult {
  success: boolean;
  summary: string;
  actions: ActionRecord[];
  knowledgeUpdate?: KnowledgeUpdate;
  metrics?: Record<string, number>;
}

export interface ActionRecord {
  timestamp: number;
  action: string;
  target: string;
  result: string;
  rollbackAvailable: boolean;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  inputMode: 'cli' | 'chat' | 'api' | 'event';
  activeTask?: string;
  agents: string[];
  contextState: ContextBudget;
}
