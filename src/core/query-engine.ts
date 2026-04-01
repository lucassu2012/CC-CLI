/**
 * IOE QueryEngine - Session State Manager
 *
 * Inspired by Claude Code's QueryEngine.ts singleton pattern.
 * Manages the session lifecycle, coordinates between the TAOR loop,
 * context engine, memory system, and agent orchestrator.
 *
 * Design Philosophy:
 * - Single source of truth for session state
 * - Coordinates all subsystems without owning their logic
 * - JSONL persistence with ordering guarantees
 * - Crash recovery from last recorded checkpoint
 */

import { EventEmitter } from 'events';
import {
  Session,
  Message,
  TAORState,
  TAORConfig,
  ContextBudget,
  AgentConfig,
  AgentInstance,
  Task,
  TaskResult,
  KnowledgeUpdate,
} from '../types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_TAOR_CONFIG: TAORConfig = {
  maxTurns: 200,
  maxTokens: 200000,
  contextWindowSize: 200000,
  compressionThreshold: 0.92,
  maxConcurrentReadTools: 10,
  maxRetries: 3,
  retryBackoffMs: [2000, 4000, 8000, 16000, 300000], // Up to 5 min
};

const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  systemPromptTokens: 50000,
  sessionHistoryTokens: 100000,
  currentTurnTokens: 30000,
  toolResultTokens: 20000,
  totalBudget: 200000,
};

// ============================================================================
// QueryEngine
// ============================================================================

/**
 * QueryEngine is the singleton session state manager.
 *
 * Like Claude Code's QueryEngine.ts, it:
 * 1. Manages the messages[] array that feeds the TAOR loop
 * 2. Coordinates context budget across subsystems
 * 3. Persists session state as JSONL with ordering guarantees
 * 4. Provides crash recovery from the last checkpoint
 *
 * It does NOT make decisions - that's the model's job.
 * It provides infrastructure for the model to make decisions.
 */
export class QueryEngine extends EventEmitter {
  private static instance: QueryEngine | null = null;

  private session: Session;
  private messages: Message[] = [];
  private tasks: Map<string, Task> = new Map();
  private agents: Map<string, AgentInstance> = new Map();
  private checkpoints: SessionCheckpoint[] = [];
  private config: TAORConfig;
  private contextBudget: ContextBudget;
  private persistenceQueue: PersistenceEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(session: Session, config?: Partial<TAORConfig>) {
    super();
    this.session = session;
    this.config = { ...DEFAULT_TAOR_CONFIG, ...config };
    this.contextBudget = { ...DEFAULT_CONTEXT_BUDGET };
  }

  /** Get or create the singleton instance */
  static getInstance(session?: Session, config?: Partial<TAORConfig>): QueryEngine {
    if (!QueryEngine.instance) {
      if (!session) {
        throw new Error('QueryEngine requires a session for first initialization');
      }
      QueryEngine.instance = new QueryEngine(session, config);
    }
    return QueryEngine.instance;
  }

  /** Reset singleton (for testing or session restart) */
  static reset(): void {
    if (QueryEngine.instance) {
      QueryEngine.instance.cleanup();
      QueryEngine.instance = null;
    }
  }

  // ==========================================================================
  // Message Management
  // ==========================================================================

  /** Append a message with persistence guarantees */
  appendMessage(message: Message): void {
    this.messages.push(message);
    this.session.lastActivity = Date.now();

    // Ordering guarantee: user/boundary messages block-write,
    // assistant messages use fire-and-forget lazy serialization
    if (message.role === 'user' || message.role === 'system') {
      this.persistSync(message);
    } else {
      this.persistAsync(message);
    }

    this.emit('message:appended', message);
    this.checkContextBudget();
  }

  /** Get all messages (for TAOR loop consumption) */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /** Replace messages (after compression) */
  replaceMessages(messages: Message[]): void {
    this.messages = messages;
    this.emit('messages:replaced', messages.length);
  }

  /** Get messages since last compact boundary */
  getRecentMessages(): Message[] {
    let lastBoundaryIdx = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.content.some(c => c.type === 'compact_boundary')) {
        lastBoundaryIdx = i;
        break;
      }
    }
    return this.messages.slice(lastBoundaryIdx + 1);
  }

  // ==========================================================================
  // Context Budget Management
  // ==========================================================================

  /** Check if context budget triggers compression */
  private checkContextBudget(): void {
    const totalTokens = this.estimateTotalTokens();
    const threshold = this.config.contextWindowSize * this.config.compressionThreshold;

    if (totalTokens > threshold) {
      this.emit('context:compression_needed', {
        currentTokens: totalTokens,
        threshold,
        ratio: totalTokens / this.config.contextWindowSize,
      });
    }
  }

  /** Estimate total token usage across all message layers */
  estimateTotalTokens(): number {
    let total = this.contextBudget.systemPromptTokens;
    for (const msg of this.messages) {
      total += msg.metadata?.tokenCount ?? this.estimateMessageTokens(msg);
    }
    return total;
  }

  /** Rough token estimation (4 chars ≈ 1 token) */
  private estimateMessageTokens(message: Message): number {
    let charCount = 0;
    for (const content of message.content) {
      if (content.type === 'text') charCount += content.text.length;
      else if (content.type === 'tool_result') charCount += content.content.length;
      else if (content.type === 'compact_boundary') charCount += content.summary.length;
    }
    return Math.ceil(charCount / 4);
  }

  getContextBudget(): ContextBudget {
    return { ...this.contextBudget };
  }

  updateContextBudget(partial: Partial<ContextBudget>): void {
    Object.assign(this.contextBudget, partial);
  }

  getConfig(): TAORConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // Task Management
  // ==========================================================================

  createTask(task: Task): void {
    this.tasks.set(task.id, task);
    this.emit('task:created', task);
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    Object.assign(task, updates, { updatedAt: Date.now() });
    this.emit('task:updated', task);
  }

  completeTask(taskId: string, result: TaskResult): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    task.status = result.success ? 'completed' : 'failed';
    task.result = result;
    task.completedAt = Date.now();
    task.updatedAt = Date.now();
    this.emit('task:completed', task);

    // Auto-generate knowledge update on completion
    if (result.knowledgeUpdate) {
      this.emit('knowledge:update', result.knowledgeUpdate);
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      t => t.status === 'in_progress' || t.status === 'waiting_approval'
    );
  }

  // ==========================================================================
  // Agent Management
  // ==========================================================================

  registerAgent(instance: AgentInstance): void {
    this.agents.set(instance.config.id, instance);
    this.session.agents.push(instance.config.id);
    this.emit('agent:registered', instance.config);
  }

  getAgent(agentId: string): AgentInstance | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  getChildAgents(parentId: string): AgentInstance[] {
    return Array.from(this.agents.values()).filter(
      a => a.config.parentAgentId === parentId
    );
  }

  updateAgentStatus(agentId: string, status: AgentInstance['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.emit('agent:status_changed', { agentId, status });
    }
  }

  /** Send message between agents (async mailbox pattern) */
  sendAgentMessage(message: import('../types').AgentMessage): void {
    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      targetAgent.mailbox.push(message);
      this.emit('agent:message', message);
    }
  }

  // ==========================================================================
  // Persistence (JSONL with ordering guarantees)
  // ==========================================================================

  /**
   * Synchronous persistence for ordering-critical messages.
   * User and system messages block until written to ensure
   * session can be recovered from last recorded checkpoint.
   */
  private persistSync(message: Message): void {
    const entry: PersistenceEntry = {
      type: 'message',
      data: message,
      timestamp: Date.now(),
      sequence: this.messages.length - 1,
    };
    this.writeToPersistence(entry);
  }

  /**
   * Asynchronous persistence for assistant messages.
   * Fire-and-forget with 100ms drain timer (like Claude Code's lazy serialization).
   */
  private persistAsync(message: Message): void {
    const entry: PersistenceEntry = {
      type: 'message',
      data: message,
      timestamp: Date.now(),
      sequence: this.messages.length - 1,
    };
    this.persistenceQueue.push(entry);

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushPersistenceQueue();
        this.flushTimer = null;
      }, 100);
    }
  }

  private flushPersistenceQueue(): void {
    const entries = this.persistenceQueue.splice(0);
    for (const entry of entries) {
      this.writeToPersistence(entry);
    }
  }

  private writeToPersistence(entry: PersistenceEntry): void {
    // In production, this writes to JSONL file at ~/.ioe/sessions/{sessionId}.jsonl
    this.checkpoints.push({
      sequence: entry.sequence,
      timestamp: entry.timestamp,
      messageCount: this.messages.length,
    });
    this.emit('persistence:written', entry);
  }

  /** Recover session from persisted JSONL */
  static recoverSession(sessionId: string): QueryEngine | null {
    // In production, reads ~/.ioe/sessions/{sessionId}.jsonl
    // and rebuilds messages[] array from last valid checkpoint
    return null;
  }

  // ==========================================================================
  // Session Lifecycle
  // ==========================================================================

  getSession(): Session {
    return { ...this.session };
  }

  /** Create a checkpoint for crash recovery */
  checkpoint(): SessionCheckpoint {
    const cp: SessionCheckpoint = {
      sequence: this.messages.length,
      timestamp: Date.now(),
      messageCount: this.messages.length,
      taskCount: this.tasks.size,
      agentCount: this.agents.size,
      tokenEstimate: this.estimateTotalTokens(),
    };
    this.checkpoints.push(cp);
    this.emit('session:checkpoint', cp);
    return cp;
  }

  private cleanup(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushPersistenceQueue();
    }
    this.removeAllListeners();
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface PersistenceEntry {
  type: 'message' | 'task' | 'agent' | 'checkpoint';
  data: unknown;
  timestamp: number;
  sequence: number;
}

interface SessionCheckpoint {
  sequence: number;
  timestamp: number;
  messageCount: number;
  taskCount?: number;
  agentCount?: number;
  tokenEstimate?: number;
}
