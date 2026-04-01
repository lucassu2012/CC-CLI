/**
 * IOE Workflow Orchestration Engine
 *
 * An n8n-inspired DAG-based workflow engine that coordinates the 5 domain agents
 * (Planning, Optimization, Experience, Ops, Marketing) through configurable
 * workflows with trigger, condition, transform, merge, split, and action nodes.
 */

import { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export type NodeType =
  | 'trigger'
  | 'agent'
  | 'condition'
  | 'transform'
  | 'action'
  | 'merge'
  | 'split';

export type AgentType =
  | 'planning'
  | 'optimization'
  | 'experience'
  | 'ops'
  | 'marketing';

export type TriggerKind = 'alarm' | 'schedule' | 'api' | 'manual' | 'event';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  agentType?: AgentType;
  subAgentId?: string;
  triggerKind?: TriggerKind;
  config: Record<string, any>;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
  retryPolicy?: RetryPolicy;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerKind;
  config: Record<string, any>;
  nodeId: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  variables: Record<string, any>;
  status: WorkflowStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RetryPolicy {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  input?: any;
  output?: any;
  error?: string;
  retryCount: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  nodeStates: Map<string, NodeExecutionState>;
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  variables: Record<string, any>;
}

export interface WorkflowValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface WorkflowEngineEvents {
  'execution:start': (execution: WorkflowExecution) => void;
  'execution:complete': (execution: WorkflowExecution) => void;
  'execution:error': (execution: WorkflowExecution, error: Error) => void;
  'node:start': (executionId: string, nodeId: string) => void;
  'node:complete': (executionId: string, nodeId: string, output: any) => void;
  'node:error': (executionId: string, nodeId: string, error: Error) => void;
  'node:retry': (executionId: string, nodeId: string, attempt: number) => void;
  'node:skip': (executionId: string, nodeId: string) => void;
}

// ---------------------------------------------------------------------------
// Utility: generate IDs
// ---------------------------------------------------------------------------

let idCounter = 0;
function generateId(prefix: string = 'exec'): string {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

// ---------------------------------------------------------------------------
// Expression evaluator (safe subset)
// ---------------------------------------------------------------------------

function evaluateExpression(
  expression: string,
  context: Record<string, any>,
): boolean {
  const trimmed = expression.trim();

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Support simple comparisons: field op value
  const comparisonMatch = trimmed.match(
    /^([\w.]+)\s*(===?|!==?|>=?|<=?|>|<)\s*(.+)$/,
  );
  if (comparisonMatch) {
    const [, path, op, rawValue] = comparisonMatch;
    const leftValue = resolvePathValue(context, path);
    let rightValue: any = rawValue.trim();

    if (rightValue === 'true') rightValue = true;
    else if (rightValue === 'false') rightValue = false;
    else if (rightValue === 'null') rightValue = null;
    else if (/^['"].*['"]$/.test(rightValue))
      rightValue = rightValue.slice(1, -1);
    else if (!isNaN(Number(rightValue))) rightValue = Number(rightValue);

    switch (op) {
      case '==':
      case '===':
        return leftValue === rightValue;
      case '!=':
      case '!==':
        return leftValue !== rightValue;
      case '>':
        return leftValue > rightValue;
      case '>=':
        return leftValue >= rightValue;
      case '<':
        return leftValue < rightValue;
      case '<=':
        return leftValue <= rightValue;
      default:
        return false;
    }
  }

  // Support simple boolean path: "result.success"
  const pathValue = resolvePathValue(context, trimmed);
  return Boolean(pathValue);
}

function resolvePathValue(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Data transform helpers
// ---------------------------------------------------------------------------

function applyTransform(
  data: any,
  config: Record<string, any>,
): any {
  const mapping = config.mapping as Record<string, string> | undefined;
  if (!mapping) return data;

  const result: Record<string, any> = {};
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    if (typeof sourcePath === 'string' && sourcePath.startsWith('$')) {
      result[targetKey] = resolvePathValue(
        data,
        sourcePath.slice(1),
      );
    } else {
      result[targetKey] = sourcePath;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Graph utilities
// ---------------------------------------------------------------------------

function buildAdjacency(workflow: Workflow): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    const list = adj.get(edge.source);
    if (list) list.push(edge.target);
  }
  return adj;
}

function buildReverseAdjacency(workflow: Workflow): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    const list = adj.get(edge.target);
    if (list) list.push(edge.source);
  }
  return adj;
}

function computeInDegree(workflow: Workflow): Map<string, number> {
  const inDegree = new Map<string, number>();
  for (const node of workflow.nodes) {
    inDegree.set(node.id, 0);
  }
  for (const edge of workflow.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }
  return inDegree;
}

function topologicalSort(workflow: Workflow): string[] {
  const adj = buildAdjacency(workflow);
  const inDeg = computeInDegree(workflow);
  const queue: string[] = [];
  const result: string[] = [];

  for (const [nodeId, deg] of inDeg) {
    if (deg === 0) queue.push(nodeId);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDeg.get(neighbor) || 1) - 1;
      inDeg.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return result;
}

function detectCycles(workflow: Workflow): string[][] {
  const adj = buildAdjacency(workflow);
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart).concat(neighbor));
        }
      }
    }

    recStack.delete(nodeId);
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

// ---------------------------------------------------------------------------
// Workflow Validator
// ---------------------------------------------------------------------------

export function validateWorkflow(
  workflow: Workflow,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const nodeMap = new Map<string, WorkflowNode>();
  for (const node of workflow.nodes) {
    if (nodeMap.has(node.id)) {
      errors.push({
        nodeId: node.id,
        message: `Duplicate node ID: ${node.id}`,
        severity: 'error',
      });
    }
    nodeMap.set(node.id, node);
  }

  // Edge references
  const edgeIds = new Set<string>();
  for (const edge of workflow.edges) {
    if (edgeIds.has(edge.id)) {
      errors.push({
        edgeId: edge.id,
        message: `Duplicate edge ID: ${edge.id}`,
        severity: 'error',
      });
    }
    edgeIds.add(edge.id);

    if (!nodeMap.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        message: `Edge source node not found: ${edge.source}`,
        severity: 'error',
      });
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        message: `Edge target node not found: ${edge.target}`,
        severity: 'error',
      });
    }
  }

  // At least one trigger
  const triggers = workflow.nodes.filter((n) => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push({
      message: 'Workflow must have at least one trigger node',
      severity: 'error',
    });
  }

  // Agent nodes must have agentType
  for (const node of workflow.nodes) {
    if (node.type === 'agent' && !node.agentType) {
      errors.push({
        nodeId: node.id,
        message: 'Agent node must specify agentType',
        severity: 'error',
      });
    }
    if (node.type === 'condition' && !node.config.expression) {
      errors.push({
        nodeId: node.id,
        message: 'Condition node must specify config.expression',
        severity: 'warning',
      });
    }
  }

  // Cycle detection
  const cycles = detectCycles(workflow);
  for (const cycle of cycles) {
    errors.push({
      message: `Cycle detected: ${cycle.join(' -> ')}`,
      severity: 'error',
    });
  }

  // Merge nodes should have multiple inputs
  for (const node of workflow.nodes) {
    if (node.type === 'merge') {
      const inputCount = workflow.edges.filter(
        (e) => e.target === node.id,
      ).length;
      if (inputCount < 2) {
        errors.push({
          nodeId: node.id,
          message: 'Merge node should have at least 2 inputs',
          severity: 'warning',
        });
      }
    }
  }

  // Split nodes should have multiple outputs
  for (const node of workflow.nodes) {
    if (node.type === 'split') {
      const outputCount = workflow.edges.filter(
        (e) => e.source === node.id,
      ).length;
      if (outputCount < 2) {
        errors.push({
          nodeId: node.id,
          message: 'Split node should have at least 2 outputs',
          severity: 'warning',
        });
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Node Executors
// ---------------------------------------------------------------------------

type NodeExecutor = (
  node: WorkflowNode,
  input: any,
  context: ExecutionContext,
) => Promise<any>;

interface ExecutionContext {
  variables: Record<string, any>;
  nodeOutputs: Map<string, any>;
  workflow: Workflow;
  executionId: string;
}

async function executeTriggerNode(
  node: WorkflowNode,
  input: any,
  _context: ExecutionContext,
): Promise<any> {
  // Trigger nodes pass through the triggering data
  return {
    triggeredAt: new Date().toISOString(),
    triggerType: node.triggerKind || node.config.triggerKind || 'manual',
    data: input || node.config.defaultData || {},
  };
}

async function executeAgentNode(
  node: WorkflowNode,
  input: any,
  context: ExecutionContext,
): Promise<any> {
  const agentType = node.agentType || 'ops';
  const action = node.config.action || 'analyze';
  const params = node.config.params || {};

  // Simulate agent invocation with a delay to model real async work
  await delay(node.config.simulateDelayMs || 100);

  // In a real system this would call into the agent framework.
  // Here we produce a structured result that downstream nodes can consume.
  const result: Record<string, any> = {
    agentType,
    action,
    nodeId: node.id,
    timestamp: new Date().toISOString(),
    input,
    params,
    success: true,
    findings: [],
    recommendations: [],
  };

  switch (agentType) {
    case 'ops':
      result.findings = [
        { type: 'alarm_analysis', severity: input?.severity || 'medium', details: 'Analysis complete' },
      ];
      result.recommendations = ['Apply corrective action based on root cause'];
      break;
    case 'optimization':
      result.findings = [
        { type: 'parameter_optimization', kpiImpact: '+12%', details: 'Optimization parameters identified' },
      ];
      result.recommendations = ['Adjust antenna tilt by 2 degrees', 'Increase power by 3dB'];
      break;
    case 'experience':
      result.findings = [
        { type: 'user_experience', score: 85, details: 'User experience within acceptable range' },
      ];
      result.recommendations = ['Continue monitoring for 24h'];
      break;
    case 'planning':
      result.findings = [
        { type: 'coverage_analysis', gapPercentage: 3.2, details: 'Minor coverage gaps identified' },
      ];
      result.recommendations = ['Consider additional small cell at sector 7'];
      break;
    case 'marketing':
      result.findings = [
        { type: 'user_segmentation', targetCount: 15000, details: 'High-value users identified' },
      ];
      result.recommendations = ['Launch targeted 5G upgrade campaign'];
      break;
  }

  return result;
}

async function executeConditionNode(
  node: WorkflowNode,
  input: any,
  context: ExecutionContext,
): Promise<any> {
  const expression = node.config.expression || 'true';
  const evalContext = {
    ...context.variables,
    input,
    data: input,
  };

  const result = evaluateExpression(expression, evalContext);

  return {
    condition: expression,
    result,
    branch: result ? 'true' : 'false',
    input,
  };
}

async function executeTransformNode(
  node: WorkflowNode,
  input: any,
  _context: ExecutionContext,
): Promise<any> {
  return applyTransform(input, node.config);
}

async function executeActionNode(
  node: WorkflowNode,
  input: any,
  _context: ExecutionContext,
): Promise<any> {
  const actionType = node.config.actionType || 'log';

  await delay(node.config.simulateDelayMs || 50);

  switch (actionType) {
    case 'oss_command':
      return {
        type: 'oss_command',
        command: node.config.command || 'noop',
        status: 'executed',
        input,
        timestamp: new Date().toISOString(),
      };
    case 'api_call':
      return {
        type: 'api_call',
        url: node.config.url || '',
        method: node.config.method || 'POST',
        status: 200,
        input,
        timestamp: new Date().toISOString(),
      };
    case 'notification':
      return {
        type: 'notification',
        channel: node.config.channel || 'sms',
        recipient: node.config.recipient || '',
        message: node.config.message || '',
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    case 'ticket':
      return {
        type: 'ticket',
        action: node.config.ticketAction || 'create',
        ticketId: `TKT-${Date.now()}`,
        status: 'created',
        timestamp: new Date().toISOString(),
      };
    case 'report':
      return {
        type: 'report',
        format: node.config.format || 'pdf',
        title: node.config.title || 'Report',
        status: 'generated',
        timestamp: new Date().toISOString(),
      };
    default:
      return {
        type: actionType,
        status: 'executed',
        input,
        timestamp: new Date().toISOString(),
      };
  }
}

async function executeMergeNode(
  node: WorkflowNode,
  input: any,
  context: ExecutionContext,
): Promise<any> {
  // Merge collects outputs from all input nodes
  const mergedData: Record<string, any> = {};
  for (const inputNodeId of node.inputs) {
    const output = context.nodeOutputs.get(inputNodeId);
    if (output !== undefined) {
      mergedData[inputNodeId] = output;
    }
  }
  return {
    merged: true,
    sources: Object.keys(mergedData),
    data: mergedData,
  };
}

async function executeSplitNode(
  node: WorkflowNode,
  input: any,
  _context: ExecutionContext,
): Promise<any> {
  // Split fans out the input data to all downstream nodes
  const splitKey = node.config.splitKey;
  if (splitKey && input && Array.isArray(input[splitKey])) {
    return {
      split: true,
      items: input[splitKey],
      count: input[splitKey].length,
    };
  }
  return {
    split: true,
    data: input,
  };
}

const NODE_EXECUTORS: Record<NodeType, NodeExecutor> = {
  trigger: executeTriggerNode,
  agent: executeAgentNode,
  condition: executeConditionNode,
  transform: executeTransformNode,
  action: executeActionNode,
  merge: executeMergeNode,
  split: executeSplitNode,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// WorkflowEngine
// ---------------------------------------------------------------------------

export class WorkflowEngine extends EventEmitter {
  private executions: Map<string, WorkflowExecution> = new Map();
  private cancelTokens: Map<string, boolean> = new Map();
  private pauseTokens: Map<string, boolean> = new Map();
  private pauseResolvers: Map<string, (() => void)[]> = new Map();

  constructor() {
    super();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async execute(
    workflow: Workflow,
    triggerData?: any,
  ): Promise<WorkflowExecution> {
    // Validate first
    const validationErrors = validateWorkflow(workflow).filter(
      (e) => e.severity === 'error',
    );
    if (validationErrors.length > 0) {
      const errMsg = validationErrors.map((e) => e.message).join('; ');
      throw new Error(`Workflow validation failed: ${errMsg}`);
    }

    const executionId = generateId('exec');
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      nodeStates: new Map(),
      startedAt: new Date().toISOString(),
      variables: { ...workflow.variables },
    };

    // Initialize node states
    for (const node of workflow.nodes) {
      execution.nodeStates.set(node.id, {
        nodeId: node.id,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.executions.set(executionId, execution);
    this.cancelTokens.set(executionId, false);
    this.pauseTokens.set(executionId, false);
    this.pauseResolvers.set(executionId, []);

    this.emit('execution:start', execution);

    try {
      await this.executeDAG(workflow, execution, triggerData);

      if (this.cancelTokens.get(executionId)) {
        execution.status = 'cancelled';
      } else {
        execution.status = 'completed';
        // Collect terminal node outputs as the workflow result
        const terminalOutputs: Record<string, any> = {};
        const adj = buildAdjacency(workflow);
        for (const node of workflow.nodes) {
          const outEdges = adj.get(node.id) || [];
          if (outEdges.length === 0) {
            const state = execution.nodeStates.get(node.id);
            if (state?.output !== undefined) {
              terminalOutputs[node.id] = state.output;
            }
          }
        }
        execution.result = terminalOutputs;
      }

      execution.completedAt = new Date().toISOString();
      this.emit('execution:complete', execution);
    } catch (err) {
      execution.status = 'failed';
      execution.error =
        err instanceof Error ? err.message : String(err);
      execution.completedAt = new Date().toISOString();
      this.emit('execution:error', execution, err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.cancelTokens.delete(executionId);
      this.pauseTokens.delete(executionId);
      this.pauseResolvers.delete(executionId);
    }

    return execution;
  }

  pause(executionId: string): void {
    if (this.executions.has(executionId)) {
      this.pauseTokens.set(executionId, true);
    }
  }

  resume(executionId: string): void {
    if (this.pauseTokens.has(executionId)) {
      this.pauseTokens.set(executionId, false);
      const resolvers = this.pauseResolvers.get(executionId) || [];
      for (const resolve of resolvers) {
        resolve();
      }
      this.pauseResolvers.set(executionId, []);
    }
  }

  cancel(executionId: string): void {
    this.cancelTokens.set(executionId, true);
    // Also resume if paused so the cancellation can propagate
    this.resume(executionId);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  // -----------------------------------------------------------------------
  // DAG Execution
  // -----------------------------------------------------------------------

  private async executeDAG(
    workflow: Workflow,
    execution: WorkflowExecution,
    triggerData?: any,
  ): Promise<void> {
    const sorted = topologicalSort(workflow);
    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of workflow.nodes) {
      nodeMap.set(node.id, node);
    }

    const adj = buildAdjacency(workflow);
    const reverseAdj = buildReverseAdjacency(workflow);
    const inDeg = computeInDegree(workflow);
    const nodeOutputs = new Map<string, any>();
    const completedNodes = new Set<string>();
    const skippedNodes = new Set<string>();

    // Track remaining in-degree for scheduling
    const remaining = new Map<string, number>();
    for (const [id, deg] of inDeg) {
      remaining.set(id, deg);
    }

    const context: ExecutionContext = {
      variables: execution.variables,
      nodeOutputs,
      workflow,
      executionId: execution.id,
    };

    // Find root nodes (in-degree 0)
    const readyQueue: string[] = [];
    for (const nodeId of sorted) {
      if ((remaining.get(nodeId) || 0) === 0) {
        readyQueue.push(nodeId);
      }
    }

    // Execute in waves (parallel within each wave)
    while (readyQueue.length > 0) {
      if (this.cancelTokens.get(execution.id)) return;
      await this.checkPause(execution.id);

      // Execute all ready nodes in parallel
      const currentBatch = readyQueue.splice(0, readyQueue.length);
      const promises = currentBatch.map((nodeId) =>
        this.executeNode(
          nodeMap.get(nodeId)!,
          nodeId === sorted[0] ? triggerData : undefined,
          context,
          execution,
          skippedNodes,
          reverseAdj,
        ),
      );

      const results = await Promise.allSettled(promises);

      for (let i = 0; i < currentBatch.length; i++) {
        const nodeId = currentBatch[i];
        const settledResult = results[i];

        if (settledResult.status === 'fulfilled') {
          const output = settledResult.value;
          nodeOutputs.set(nodeId, output);
          completedNodes.add(nodeId);

          // Determine which downstream nodes to activate
          const node = nodeMap.get(nodeId)!;
          const outEdges = workflow.edges.filter((e) => e.source === nodeId);

          if (node.type === 'condition') {
            // Only follow the matching branch
            const branch = output?.branch || 'true';
            for (const edge of outEdges) {
              const edgeLabel = (edge.label || edge.condition || '').toLowerCase();
              const shouldFollow =
                (branch === 'true' && (edgeLabel === 'true' || edgeLabel === 'yes' || edgeLabel === 'high')) ||
                (branch === 'false' && (edgeLabel === 'false' || edgeLabel === 'no' || edgeLabel === 'low')) ||
                (!edgeLabel);

              if (shouldFollow) {
                const newDeg = (remaining.get(edge.target) || 1) - 1;
                remaining.set(edge.target, newDeg);
                if (newDeg === 0) readyQueue.push(edge.target);
              } else {
                // Skip the non-taken branch
                this.markBranchSkipped(
                  edge.target,
                  adj,
                  skippedNodes,
                  execution,
                  remaining,
                );
              }
            }
          } else {
            // Normal: activate all downstream
            for (const edge of outEdges) {
              const newDeg = (remaining.get(edge.target) || 1) - 1;
              remaining.set(edge.target, newDeg);
              if (newDeg === 0 && !skippedNodes.has(edge.target)) {
                readyQueue.push(edge.target);
              }
            }
          }
        } else {
          // Node failed
          const node = nodeMap.get(nodeId)!;
          const state = execution.nodeStates.get(nodeId);
          if (state) {
            state.status = 'failed';
            state.error =
              settledResult.reason instanceof Error
                ? settledResult.reason.message
                : String(settledResult.reason);
          }

          // If the node is critical, abort the whole workflow
          if (node.config.critical !== false) {
            throw settledResult.reason instanceof Error
              ? settledResult.reason
              : new Error(String(settledResult.reason));
          }

          // Otherwise skip downstream
          const outEdges = workflow.edges.filter((e) => e.source === nodeId);
          for (const edge of outEdges) {
            this.markBranchSkipped(
              edge.target,
              adj,
              skippedNodes,
              execution,
              remaining,
            );
          }
        }
      }
    }
  }

  private markBranchSkipped(
    nodeId: string,
    adj: Map<string, string[]>,
    skippedNodes: Set<string>,
    execution: WorkflowExecution,
    remaining: Map<string, number>,
  ): void {
    if (skippedNodes.has(nodeId)) return;
    skippedNodes.add(nodeId);

    const state = execution.nodeStates.get(nodeId);
    if (state) {
      state.status = 'skipped';
    }
    this.emit('node:skip', execution.id, nodeId);

    const downstream = adj.get(nodeId) || [];
    for (const next of downstream) {
      // Decrement but do not activate; only skip if all parents are done/skipped
      const newDeg = (remaining.get(next) || 1) - 1;
      remaining.set(next, newDeg);
      if (newDeg === 0) {
        this.markBranchSkipped(next, adj, skippedNodes, execution, remaining);
      }
    }
  }

  private async executeNode(
    node: WorkflowNode,
    triggerData: any | undefined,
    context: ExecutionContext,
    execution: WorkflowExecution,
    skippedNodes: Set<string>,
    reverseAdj: Map<string, string[]>,
  ): Promise<any> {
    if (skippedNodes.has(node.id)) {
      return undefined;
    }

    const state = execution.nodeStates.get(node.id)!;
    state.status = 'running';
    state.startedAt = new Date().toISOString();
    this.emit('node:start', execution.id, node.id);

    // Collect input from upstream nodes
    let input: any = triggerData;
    if (!input) {
      const parents = reverseAdj.get(node.id) || [];
      if (parents.length === 1) {
        input = context.nodeOutputs.get(parents[0]);
      } else if (parents.length > 1) {
        input = {};
        for (const parent of parents) {
          const parentOutput = context.nodeOutputs.get(parent);
          if (parentOutput !== undefined) {
            input[parent] = parentOutput;
          }
        }
      }
    }

    state.input = input;

    const executor = NODE_EXECUTORS[node.type];
    if (!executor) {
      throw new Error(`No executor for node type: ${node.type}`);
    }

    const retryPolicy = node.retryPolicy || {
      maxRetries: node.config.maxRetries || 0,
      delayMs: node.config.retryDelayMs || 1000,
      backoffMultiplier: node.config.retryBackoff || 2,
    };

    let lastError: Error | null = null;
    for (
      let attempt = 0;
      attempt <= retryPolicy.maxRetries;
      attempt++
    ) {
      if (this.cancelTokens.get(execution.id)) {
        state.status = 'cancelled';
        return undefined;
      }

      try {
        if (attempt > 0) {
          this.emit('node:retry', execution.id, node.id, attempt);
          const waitTime =
            retryPolicy.delayMs *
            Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
          await delay(waitTime);
        }

        const output = await executor(node, input, context);
        state.output = output;
        state.status = 'completed';
        state.completedAt = new Date().toISOString();
        state.retryCount = attempt;
        this.emit('node:complete', execution.id, node.id, output);
        return output;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        state.retryCount = attempt;
      }
    }

    state.status = 'failed';
    state.error = lastError?.message || 'Unknown error';
    state.completedAt = new Date().toISOString();
    this.emit(
      'node:error',
      execution.id,
      node.id,
      lastError || new Error('Unknown error'),
    );
    throw lastError || new Error('Node execution failed');
  }

  private async checkPause(executionId: string): Promise<void> {
    if (this.pauseTokens.get(executionId)) {
      return new Promise<void>((resolve) => {
        const resolvers = this.pauseResolvers.get(executionId) || [];
        resolvers.push(resolve);
        this.pauseResolvers.set(executionId, resolvers);
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Default singleton
// ---------------------------------------------------------------------------

export const workflowEngine = new WorkflowEngine();

export default WorkflowEngine;
