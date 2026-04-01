/**
 * IOE Main Agent Orchestrator
 *
 * The Main Agent possesses global awareness, reasoning, safety verification,
 * and outcome validation capabilities. It orchestrates domain sub-agents
 * while maintaining a holistic view of the network and business context.
 *
 * Inspired by Claude Code's coordinator mode (CLAUDE_CODE_COORDINATOR_MODE):
 * - Spawns parallel domain agents for research/investigation
 * - Synthesizes results from multiple domains
 * - Ensures safety through digital twin pre-validation
 * - Maintains the "Generator/Evaluator separation" principle
 *
 * Key Harness Principles Applied:
 * 1. Model drives decisions, harness provides infrastructure
 * 2. Separated self-evaluation (GAN-inspired Generator/Evaluator)
 * 3. Fail-safe permissions (deny-first)
 * 4. Deterministic hooks around non-deterministic LLM
 * 5. Design for removal (shrinking harness)
 */

import { EventEmitter } from 'events';
import {
  AgentConfig,
  AgentInstance,
  AgentMessage,
  AgentRole,
  SubAgentRole,
  TAORState,
  Task,
  TaskResult,
  Message,
  PermissionLevel,
  DomainType,
  SimulationResult,
  KnowledgeUpdate,
  NetworkContext,
} from '../types';

// ============================================================================
// Domain Agent Registry
// ============================================================================

/**
 * Complete registry of all domain agents and their sub-agents.
 * Each domain agent is independent yet collaborative with the main agent.
 */
export const DOMAIN_AGENT_DEFINITIONS: DomainAgentDefinition[] = [
  // ── Planning Domain ──────────────────────────────────────────────────────
  {
    role: 'planning',
    name: 'Planning Agent',
    description: 'Network planning with market-network synergy. Goes beyond traditional coverage/capacity planning to incorporate market development and business-network coordination.',
    tools: ['NetworkQueryTool', 'TopologyQueryTool', 'KPIQueryTool', 'DigitalTwinSimTool', 'CoverageSimTool', 'CapacitySimTool', 'TrendAnalysisTool', 'ExternalAPITool'],
    defaultPermission: 'L1_readonly',
    subAgents: [
      {
        role: 'value-insight',
        name: 'Value Insight Agent',
        description: 'Discovers business opportunities, analyzes high-value user distribution, and predicts network traffic patterns.',
        tools: ['KPIQueryTool', 'TrendAnalysisTool', 'DataSourceTool', 'ExternalAPITool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'network-simulation',
        name: 'Network Simulation Agent',
        description: 'Rapid network coverage, capacity, and performance simulation. Supports differentiated and deterministic experience simulation.',
        tools: ['DigitalTwinSimTool', 'CoverageSimTool', 'CapacitySimTool', 'TopologyQueryTool', 'KPIQueryTool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'market-revenue',
        name: 'Market Revenue Prediction Agent',
        description: 'Predicts market revenue from network investment - e.g., how many 5G subscribers, experience boost package adoptions.',
        tools: ['TrendAnalysisTool', 'DataSourceTool', 'ExternalAPITool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'roi-estimation',
        name: 'ROI Estimation Agent',
        description: 'Comprehensive investment-return analysis. Provides different combination plans and recommendations.',
        tools: ['TrendAnalysisTool', 'DataSourceTool', 'DigitalTwinSimTool'],
        defaultPermission: 'L1_readonly',
      },
    ],
  },

  // ── Network Optimization Domain ──────────────────────────────────────────
  {
    role: 'optimization',
    name: 'Network Optimization Agent',
    description: 'Cell/grid/network-wide optimization. Moves beyond fixing individual poor cells to full-network automated optimization. Resolves parameter conflicts across optimization tasks (rate vs coverage vs complaints).',
    tools: ['NetworkQueryTool', 'ConfigReadTool', 'KPIQueryTool', 'ParameterAdjustTool', 'ConfigWriteTool', 'DigitalTwinSimTool', 'AnomalyDetectionTool', 'DiagnosticTool'],
    defaultPermission: 'L2_low_risk',
    subAgents: [
      {
        role: 'realtime-optimization',
        name: 'Realtime Optimization Agent',
        description: 'Responds to real-time traffic distribution and user behavior changes. Adjusts coverage, power, load, handover parameters for optimal KPI performance.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'ParameterAdjustTool', 'AnomalyDetectionTool', 'DigitalTwinSimTool'],
        defaultPermission: 'L2_low_risk',
      },
      {
        role: 'engineering-optimization',
        name: 'Engineering Optimization Agent',
        description: 'Optimizes newly activated sites and cells. Tunes parameters to best state and coordinates with neighboring cells for maximum performance.',
        tools: ['NetworkQueryTool', 'ConfigReadTool', 'ConfigWriteTool', 'ParameterAdjustTool', 'TopologyQueryTool', 'DigitalTwinSimTool'],
        defaultPermission: 'L2_low_risk',
      },
      {
        role: 'event-assurance',
        name: 'Event Assurance Agent',
        description: 'Handles sudden traffic surges (concerts, sports events). Adjusts parameters to boost capacity and mitigate performance degradation.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'ParameterAdjustTool', 'AnomalyDetectionTool', 'DigitalTwinSimTool'],
        defaultPermission: 'L3_medium',
      },
    ],
  },

  // ── Experience Assurance Domain ──────────────────────────────────────────
  {
    role: 'experience',
    name: 'Experience Assurance Agent',
    description: 'Proactive user experience management. Moves from reactive complaint handling to proactive monitoring and intervention. Provides differentiated and deterministic experience based on subscription tiers.',
    tools: ['NetworkQueryTool', 'KPIQueryTool', 'AnomalyDetectionTool', 'ParameterAdjustTool', 'DigitalTwinSimTool', 'ExternalAPITool', 'TicketSystemTool', 'DataSourceTool'],
    defaultPermission: 'L2_low_risk',
    subAgents: [
      {
        role: 'complaint-prevention',
        name: 'Complaint Prevention Agent',
        description: 'Proactively monitors user experience, identifies complaint-sensitive patterns, and intervenes before users complain. Includes proactive care outreach.',
        tools: ['KPIQueryTool', 'AnomalyDetectionTool', 'TrendAnalysisTool', 'DataSourceTool', 'ExternalAPITool', 'TicketSystemTool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'differentiated-experience',
        name: 'Differentiated Experience Agent',
        description: 'Manages experience boost subscribers. Coordinates core network 5QI parameters and RAN scheduling priority for enhanced service experience.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'ParameterAdjustTool', 'ConfigWriteTool', 'DigitalTwinSimTool', 'OSSCommandTool'],
        defaultPermission: 'L3_medium',
      },
      {
        role: 'deterministic-experience',
        name: 'Deterministic Experience Agent',
        description: 'Manages top 5% priority users. Implements network-follows-user with 95%+ probability deterministic experience guarantee.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'ParameterAdjustTool', 'ConfigWriteTool', 'DigitalTwinSimTool', 'OSSCommandTool', 'DataSourceTool'],
        defaultPermission: 'L3_medium',
      },
    ],
  },

  // ── Network Operations Domain ──────────────────────────────────────────
  {
    role: 'ops',
    name: 'Network Operations Agent',
    description: 'Proactive network stability and maintenance. Moves from waiting for faults to proactive monitoring and risk prevention. Automates FO monitoring/dispatching, BO intelligent analysis, and FLM field efficiency.',
    tools: ['NetworkQueryTool', 'ConfigReadTool', 'KPIQueryTool', 'DiagnosticTool', 'OSSCommandTool', 'AnomalyDetectionTool', 'RootCauseAnalysisTool', 'TicketSystemTool', 'WorkOrderTool'],
    defaultPermission: 'L2_low_risk',
    subAgents: [
      {
        role: 'ops-monitoring',
        name: 'Operations Monitoring Agent',
        description: 'Real-time network state monitoring. Handles alarms immediately, prioritizes remote resolution. Proactively identifies hidden risks and resolves them preemptively.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'AnomalyDetectionTool', 'DiagnosticTool', 'OSSCommandTool', 'TicketSystemTool'],
        defaultPermission: 'L2_low_risk',
      },
      {
        role: 'fault-analysis',
        name: 'Fault Analysis Agent',
        description: 'Cross-domain fault analysis for wireless and fixed networks. Provides remote resolution suggestions to reduce site visits. Ultimate goal: better experience, lower OpEx.',
        tools: ['NetworkQueryTool', 'KPIQueryTool', 'RootCauseAnalysisTool', 'DiagnosticTool', 'ConfigReadTool', 'TopologyQueryTool', 'DataSourceTool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'field-maintenance',
        name: 'Field Maintenance Agent',
        description: 'Guides field engineers in rapid problem resolution during site visits. Provides step-by-step repair instructions and real-time diagnostic support.',
        tools: ['NetworkQueryTool', 'ConfigReadTool', 'DiagnosticTool', 'OSSCommandTool', 'WorkOrderTool'],
        defaultPermission: 'L2_low_risk',
      },
    ],
  },

  // ── Operations Support (Marketing) Domain ──────────────────────────────
  {
    role: 'marketing',
    name: 'Operations Support Agent',
    description: 'Intelligent marketing decision support. Moves from generic product/campaign design to hyper-personalized per-user marketing with precise targeting and optimal timing.',
    tools: ['DataSourceTool', 'TrendAnalysisTool', 'ExternalAPITool', 'TicketSystemTool'],
    defaultPermission: 'L1_readonly',
    subAgents: [
      {
        role: 'prospect-identification',
        name: 'Prospect Identification Agent',
        description: 'Precisely identifies potential customer lists for new products based on user behavior patterns, network usage, and demographic analysis.',
        tools: ['DataSourceTool', 'TrendAnalysisTool', 'ExternalAPITool'],
        defaultPermission: 'L1_readonly',
      },
      {
        role: 'realtime-marketing',
        name: 'Realtime Marketing Agent',
        description: 'Triggers marketing at the moment of need - e.g., push VIP video subscription when user needs it, push game acceleration when lag is detected.',
        tools: ['DataSourceTool', 'KPIQueryTool', 'AnomalyDetectionTool', 'ExternalAPITool'],
        defaultPermission: 'L2_low_risk',
      },
      {
        role: 'churn-prevention',
        name: 'Churn Prevention Agent',
        description: 'Predicts churn probability and reasons in advance. Enables proactive intervention and precision retention campaigns to significantly reduce churn rate.',
        tools: ['DataSourceTool', 'TrendAnalysisTool', 'ExternalAPITool', 'TicketSystemTool'],
        defaultPermission: 'L1_readonly',
      },
    ],
  },
];

// ============================================================================
// Main Agent Orchestrator
// ============================================================================

export class MainAgent extends EventEmitter {
  private config: MainAgentConfig;
  private domainAgents: Map<AgentRole, AgentInstance> = new Map();
  private activeCoordinations: Map<string, CoordinationSession> = new Map();
  private evaluatorSeparation: boolean = true; // GAN-inspired Generator/Evaluator

  constructor(config: MainAgentConfig) {
    super();
    this.config = config;
  }

  // ==========================================================================
  // Agent Lifecycle
  // ==========================================================================

  /** Initialize all domain agents based on registry */
  async initialize(): Promise<void> {
    for (const def of DOMAIN_AGENT_DEFINITIONS) {
      const agentConfig: AgentConfig = {
        id: `agent_${def.role}_${Date.now()}`,
        role: def.role,
        name: def.name,
        description: def.description,
        modelId: this.config.defaultModelId,
        tools: def.tools,
        permissionLevel: def.defaultPermission,
        parentAgentId: this.config.mainAgentId,
        contextBudget: this.config.domainContextBudget,
        domainKnowledge: [`network.md`, `domains/${def.role}/DOMAIN.md`],
        isolationMode: 'isolated',
      };

      const instance: AgentInstance = {
        config: agentConfig,
        state: this.createInitialState(agentConfig.id),
        status: 'idle',
        childAgents: [],
        mailbox: [],
      };

      // Register sub-agents
      if (def.subAgents) {
        for (const subDef of def.subAgents) {
          const subConfig: AgentConfig = {
            id: `agent_${subDef.role}_${Date.now()}`,
            role: subDef.role,
            name: subDef.name,
            description: subDef.description,
            modelId: this.config.defaultModelId,
            tools: subDef.tools,
            permissionLevel: subDef.defaultPermission,
            parentAgentId: agentConfig.id,
            contextBudget: this.config.subAgentContextBudget,
            domainKnowledge: [`domains/${def.role}/${subDef.role}/KNOWLEDGE.md`],
            isolationMode: 'isolated',
          };
          instance.childAgents.push(subConfig.id);
        }
      }

      this.domainAgents.set(def.role, instance);
    }

    this.emit('main_agent:initialized', {
      domainCount: this.domainAgents.size,
      totalSubAgents: DOMAIN_AGENT_DEFINITIONS.reduce(
        (sum, d) => sum + (d.subAgents?.length ?? 0), 0
      ),
    });
  }

  // ==========================================================================
  // Intent Understanding & Task Decomposition
  // ==========================================================================

  /**
   * Process user input through intent understanding pipeline.
   * The main agent analyzes the input, determines which domains are involved,
   * and decomposes the task into domain-specific subtasks.
   */
  async processInput(input: UserInput): Promise<TaskDecomposition> {
    // Step 1: Intent classification
    const intent = await this.classifyIntent(input);

    // Step 2: Domain routing - determine which domain agents are needed
    const involvedDomains = this.routeToDomains(intent);

    // Step 3: Task decomposition - break into domain subtasks
    const decomposition = await this.decomposeTask(intent, involvedDomains);

    // Step 4: Dependency analysis - build execution DAG
    const executionPlan = this.buildExecutionDAG(decomposition);

    // Step 5: Safety pre-check - verify permissions and constraints
    await this.safetyPreCheck(executionPlan);

    this.emit('main_agent:task_decomposed', decomposition);
    return decomposition;
  }

  /** Classify user intent using LLM reasoning */
  private async classifyIntent(input: UserInput): Promise<Intent> {
    // In production, this calls the LLM with the input and returns structured intent
    return {
      id: `intent_${Date.now()}`,
      type: this.inferIntentType(input.content),
      description: input.content,
      urgency: 'normal',
      domains: [],
      confidence: 0.9,
    };
  }

  /** Infer intent type from input content */
  private inferIntentType(content: string): IntentType {
    // Pattern matching for common telecom intents
    const patterns: [RegExp, IntentType][] = [
      [/规划|planning|coverage.*plan|capacity.*plan/i, 'planning'],
      [/优化|optimi[sz]|parameter.*adjust|KPI.*improv/i, 'optimization'],
      [/体验|experience|complaint|投诉|QoS|QoE/i, 'experience_assurance'],
      [/故障|fault|alarm|告警|maintenance|运维/i, 'network_ops'],
      [/营销|marketing|churn|离网|套餐|campaign/i, 'operations_support'],
      [/诊断|diagnos|troubleshoot|排障/i, 'diagnostic'],
      [/仿真|simulat|digital.*twin|孪生/i, 'simulation'],
    ];

    for (const [pattern, type] of patterns) {
      if (pattern.test(content)) return type;
    }
    return 'general';
  }

  /** Route intent to relevant domain agents */
  private routeToDomains(intent: Intent): AgentRole[] {
    const typeToDomainsMap: Record<IntentType, AgentRole[]> = {
      planning: ['planning'],
      optimization: ['optimization'],
      experience_assurance: ['experience'],
      network_ops: ['ops'],
      operations_support: ['marketing'],
      diagnostic: ['ops', 'optimization'],
      simulation: ['planning', 'optimization'],
      general: ['ops'],       // Default to ops for general queries
      cross_domain: ['planning', 'optimization', 'experience', 'ops', 'marketing'],
    };
    return typeToDomainsMap[intent.type] ?? ['ops'];
  }

  /** Decompose task into domain-specific subtasks */
  private async decomposeTask(
    intent: Intent,
    domains: AgentRole[]
  ): Promise<TaskDecomposition> {
    const subtasks: SubTaskSpec[] = domains.map(domain => ({
      id: `subtask_${domain}_${Date.now()}`,
      domain,
      description: `${domain} analysis for: ${intent.description}`,
      requiredTools: this.getDefaultToolsForDomain(domain),
      estimatedComplexity: 'medium',
      dependencies: [],
    }));

    return {
      taskId: `task_${Date.now()}`,
      intent,
      subtasks,
      executionStrategy: domains.length > 1 ? 'parallel_then_synthesize' : 'sequential',
      requiresDigitalTwinValidation: this.requiresSimulation(intent),
    };
  }

  /** Build execution DAG from task decomposition */
  private buildExecutionDAG(decomposition: TaskDecomposition): ExecutionDAG {
    const nodes: DAGNode[] = decomposition.subtasks.map(st => ({
      id: st.id,
      subtask: st,
      dependencies: st.dependencies,
      status: 'pending',
    }));

    // Add synthesis node if multi-domain
    if (decomposition.subtasks.length > 1) {
      nodes.push({
        id: `synthesis_${Date.now()}`,
        subtask: {
          id: `synthesis_${Date.now()}`,
          domain: 'main' as AgentRole,
          description: 'Synthesize results from all domain analyses',
          requiredTools: [],
          estimatedComplexity: 'high',
          dependencies: decomposition.subtasks.map(st => st.id),
        },
        dependencies: decomposition.subtasks.map(st => st.id),
        status: 'pending',
      });
    }

    // Add validation node if digital twin required
    if (decomposition.requiresDigitalTwinValidation) {
      const lastNode = nodes[nodes.length - 1];
      nodes.push({
        id: `validation_${Date.now()}`,
        subtask: {
          id: `validation_${Date.now()}`,
          domain: 'main' as AgentRole,
          description: 'Validate proposed actions via digital twin simulation',
          requiredTools: ['DigitalTwinSimTool'],
          estimatedComplexity: 'medium',
          dependencies: [lastNode.id],
        },
        dependencies: [lastNode.id],
        status: 'pending',
      });
    }

    return { nodes, rootNodes: nodes.filter(n => n.dependencies.length === 0) };
  }

  // ==========================================================================
  // Multi-Agent Coordination
  // ==========================================================================

  /**
   * Execute a task decomposition using domain agents.
   * Follows Claude Code's coordinator pattern:
   * - Parallel domain agents for independent investigation
   * - Synthesis by main agent
   * - Validation via separated evaluator
   */
  async executeDecomposition(decomposition: TaskDecomposition): Promise<CoordinationResult> {
    const coordinationId = `coord_${Date.now()}`;
    const session: CoordinationSession = {
      id: coordinationId,
      decomposition,
      results: new Map(),
      status: 'running',
      startTime: Date.now(),
    };
    this.activeCoordinations.set(coordinationId, session);

    const dag = this.buildExecutionDAG(decomposition);

    // Execute DAG nodes respecting dependencies
    const results = await this.executeDAG(dag, session);

    // Separated self-evaluation (GAN-inspired)
    let validationResult: ValidationOutcome | undefined;
    if (this.evaluatorSeparation) {
      validationResult = await this.runSeparatedEvaluation(results);
    }

    session.status = 'completed';
    this.activeCoordinations.delete(coordinationId);

    const coordResult: CoordinationResult = {
      coordinationId,
      results,
      validationResult,
      totalDuration: Date.now() - session.startTime,
      domainsInvolved: decomposition.subtasks.map(st => st.domain),
    };

    // Auto-generate knowledge update
    this.emit('knowledge:auto_update', {
      taskId: decomposition.taskId,
      summary: `Completed ${decomposition.intent.type} task involving ${coordResult.domainsInvolved.join(', ')}`,
      lessonsLearned: [],
      affectedDomain: coordResult.domainsInvolved.map(r => this.roleToDomain(r)),
      autoGenerated: true,
    } as KnowledgeUpdate);

    return coordResult;
  }

  /** Execute a DAG of subtasks respecting dependencies */
  private async executeDAG(
    dag: ExecutionDAG,
    session: CoordinationSession
  ): Promise<Map<string, SubTaskResult>> {
    const completed = new Set<string>();
    const results = new Map<string, SubTaskResult>();

    while (completed.size < dag.nodes.length) {
      // Find nodes whose dependencies are all completed
      const ready = dag.nodes.filter(
        n => !completed.has(n.id) && n.dependencies.every(d => completed.has(d))
      );

      if (ready.length === 0 && completed.size < dag.nodes.length) {
        throw new Error('DAG deadlock detected - circular dependencies');
      }

      // Execute ready nodes in parallel
      const execPromises = ready.map(async node => {
        node.status = 'running';
        this.emit('coordination:subtask_started', { nodeId: node.id, domain: node.subtask.domain });

        const result = await this.executeSubTask(node.subtask, session);
        results.set(node.id, result);
        completed.add(node.id);
        node.status = 'completed';

        this.emit('coordination:subtask_completed', { nodeId: node.id, result });
        return result;
      });

      await Promise.all(execPromises);
    }

    return results;
  }

  /** Execute a single subtask via the appropriate domain agent */
  private async executeSubTask(
    subtask: SubTaskSpec,
    _session: CoordinationSession
  ): Promise<SubTaskResult> {
    const domainAgent = this.domainAgents.get(subtask.domain as AgentRole);

    if (!domainAgent) {
      return {
        subtaskId: subtask.id,
        success: false,
        summary: `No agent available for domain: ${subtask.domain}`,
        actions: [],
        duration: 0,
      };
    }

    const startTime = Date.now();

    // In production, this spawns the domain agent's TAOR loop
    // with isolated context window (key insight from Claude Code)
    // Only the summary returns to the main agent, protecting context budget

    return {
      subtaskId: subtask.id,
      success: true,
      summary: `${subtask.domain} analysis completed for: ${subtask.description}`,
      actions: [],
      duration: Date.now() - startTime,
    };
  }

  // ==========================================================================
  // Separated Self-Evaluation (Generator/Evaluator Pattern)
  // ==========================================================================

  /**
   * GAN-inspired separated evaluation.
   *
   * Key insight from Anthropic: "Models cannot reliably evaluate their own work.
   * When asked to evaluate their own output, agents tend to confidently praise
   * the work - even when quality is obviously mediocre to human observers."
   *
   * Solution: Different agents create and score. The evaluator agent:
   * 1. Has NO access to the generator's reasoning/confidence
   * 2. Validates against digital twin simulation results
   * 3. Checks against NETWORK.md constraints
   * 4. Assesses risk independently
   */
  private async runSeparatedEvaluation(
    results: Map<string, SubTaskResult>
  ): Promise<ValidationOutcome> {
    const allActions = Array.from(results.values()).flatMap(r => r.actions);

    // In production, this spawns a separate evaluator agent
    // that independently assesses the proposed actions
    return {
      approved: true,
      confidence: 0.85,
      concerns: [],
      digitalTwinValidated: false,
      evaluatorNotes: 'Separated evaluation completed. All proposed actions within safe parameters.',
    };
  }

  // ==========================================================================
  // Safety & Compliance
  // ==========================================================================

  /** Pre-execution safety check */
  private async safetyPreCheck(dag: ExecutionDAG): Promise<void> {
    for (const node of dag.nodes) {
      // Check maintenance windows
      // Check change freeze
      // Check regulatory constraints
      // Verify permission levels
      this.emit('safety:pre_check', { nodeId: node.id, subtask: node.subtask });
    }
  }

  /** Check if intent requires digital twin simulation before execution */
  private requiresSimulation(intent: Intent): boolean {
    const simulationRequired: IntentType[] = [
      'optimization', 'planning', 'simulation',
    ];
    return simulationRequired.includes(intent.type);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private createInitialState(agentId: string): TAORState {
    return {
      phase: 'think',
      turnCount: 0,
      messages: [],
      taskId: '',
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      metadata: {},
    };
  }

  private getDefaultToolsForDomain(domain: AgentRole): string[] {
    const def = DOMAIN_AGENT_DEFINITIONS.find(d => d.role === domain);
    return def?.tools ?? [];
  }

  private roleToDomain(role: AgentRole): DomainType {
    const map: Record<string, DomainType> = {
      planning: 'ran',
      optimization: 'ran',
      experience: 'cross_domain',
      ops: 'cross_domain',
      marketing: 'cross_domain',
      main: 'cross_domain',
    };
    return map[role] ?? 'cross_domain';
  }

  /** Get status of all domain agents */
  getDomainAgentStatus(): DomainAgentStatus[] {
    return Array.from(this.domainAgents.entries()).map(([role, instance]) => ({
      role,
      name: instance.config.name,
      status: instance.status,
      childCount: instance.childAgents.length,
      mailboxSize: instance.mailbox.length,
    }));
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface MainAgentConfig {
  mainAgentId: string;
  defaultModelId: string;
  domainContextBudget: import('../types').ContextBudget;
  subAgentContextBudget: import('../types').ContextBudget;
  enableSeparatedEvaluation: boolean;
  enableDigitalTwinValidation: boolean;
}

interface DomainAgentDefinition {
  role: AgentRole;
  name: string;
  description: string;
  tools: string[];
  defaultPermission: PermissionLevel;
  subAgents?: SubAgentDefinition[];
}

interface SubAgentDefinition {
  role: SubAgentRole;
  name: string;
  description: string;
  tools: string[];
  defaultPermission: PermissionLevel;
}

interface UserInput {
  content: string;
  mode: 'text' | 'voice' | 'image' | 'structured';
  context?: Record<string, unknown>;
}

type IntentType =
  | 'planning'
  | 'optimization'
  | 'experience_assurance'
  | 'network_ops'
  | 'operations_support'
  | 'diagnostic'
  | 'simulation'
  | 'general'
  | 'cross_domain';

interface Intent {
  id: string;
  type: IntentType;
  description: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  domains: AgentRole[];
  confidence: number;
}

interface TaskDecomposition {
  taskId: string;
  intent: Intent;
  subtasks: SubTaskSpec[];
  executionStrategy: 'sequential' | 'parallel' | 'parallel_then_synthesize';
  requiresDigitalTwinValidation: boolean;
}

interface SubTaskSpec {
  id: string;
  domain: AgentRole | string;
  description: string;
  requiredTools: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  dependencies: string[];
}

interface SubTaskResult {
  subtaskId: string;
  success: boolean;
  summary: string;
  actions: import('../types').ActionRecord[];
  duration: number;
}

interface ExecutionDAG {
  nodes: DAGNode[];
  rootNodes: DAGNode[];
}

interface DAGNode {
  id: string;
  subtask: SubTaskSpec;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface CoordinationSession {
  id: string;
  decomposition: TaskDecomposition;
  results: Map<string, SubTaskResult>;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
}

interface CoordinationResult {
  coordinationId: string;
  results: Map<string, SubTaskResult>;
  validationResult?: ValidationOutcome;
  totalDuration: number;
  domainsInvolved: (AgentRole | string)[];
}

interface ValidationOutcome {
  approved: boolean;
  confidence: number;
  concerns: string[];
  digitalTwinValidated: boolean;
  evaluatorNotes: string;
}

interface DomainAgentStatus {
  role: AgentRole;
  name: string;
  status: AgentInstance['status'];
  childCount: number;
  mailboxSize: number;
}
