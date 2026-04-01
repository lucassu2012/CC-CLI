/**
 * IOE TAOR Loop — Think-Act-Observe-Repeat
 *
 * The core execution engine for all IOE agents. Implements the canonical
 * agentic loop: send messages to the LLM (Think), execute tool calls (Act),
 * append results (Observe), then loop (Repeat) until a stop condition is met.
 *
 * Design Philosophy:
 * - The model decides what to do; the loop just executes.
 * - Keep the loop deliberately simple — complexity lives in tools and prompts.
 * - Event emitter surface for hooks (pre/post tool, compression triggers, etc.).
 * - Fail loudly, recover gracefully, abort predictably.
 *
 * Key Constraints Encoded Here:
 * - Read-only tools: up to 10 concurrent (Promise.all)
 * - Write tools: serial execution (one at a time, ordered)
 * - Command results: 30 K char budget; query results: 20 K char budget
 * - Overflow is saved to a temp file and the path is returned instead
 * - Max 3 consecutive failures before hard abort
 * - Exponential back-off: 2 s → 4 s → 8 s → 16 s → 5 min cap
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  TAORState,
  TAORConfig,
  TAORPhase,
  Message,
  MessageContent,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  ToolResult,
  Tool,
  ToolContext,
  ContextBudget,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Result-size budgets (characters, not tokens). */
const RESULT_BUDGET = {
  /** OSS commands, shell execution — richer output expected. */
  command: 30_000,
  /** KPI queries, DB lookups, topology reads — trim aggressively. */
  query:   20_000,
} as const;

/** Retry back-off ladder (ms). Final entry is the hard cap. */
const BACKOFF_SCHEDULE_MS = [2_000, 4_000, 8_000, 16_000, 5 * 60_000] as const;

/** Maximum consecutive LLM/tool failures before aborting the loop. */
const MAX_CONSECUTIVE_FAILURES = 3;

/** Maximum concurrent read-only tool executions. */
const MAX_CONCURRENT_READS = 10;

// ============================================================================
// Supporting Types
// ============================================================================

/** Slim LLM response shape expected from any underlying API adapter. */
export interface LLMResponse {
  /** Stop reason returned by the model. */
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  /** Content blocks in the assistant message. */
  content: MessageContent[];
  /** Approximate token counts for the response. */
  usage: { inputTokens: number; outputTokens: number };
}

/** Adapter interface — swap in Anthropic SDK, OpenAI, or a stub. */
export interface LLMAdapter {
  complete(messages: Message[], config: TAORConfig): Promise<LLMResponse>;
}

/** Result of a single TAOR loop run. */
export interface TAORResult {
  /** Final state at loop termination. */
  state: TAORState;
  /** Last assistant message (the model's final response). */
  finalMessage: Message | null;
  /** Total wall-clock duration in milliseconds. */
  durationMs: number;
  /** Number of turns consumed. */
  turnsUsed: number;
  /** Whether the loop ended cleanly (vs abort/error). */
  success: boolean;
  /** Error detail if `success` is false. */
  error?: string;
}

/** Internal record of a single tool execution result. */
interface ToolExecution {
  toolId:   string;
  toolName: string;
  result:   ToolResult;
}

// ============================================================================
// ToolExecutor
// ============================================================================

/**
 * Handles concurrent (read-only) and serial (write) tool execution.
 *
 * Enforces result-size budgets per tool category and saves overflow to a
 * temporary file, returning the file path so the model can read it if needed.
 */
export class ToolExecutor extends EventEmitter {
  private readonly tools: Map<string, Tool>;
  private readonly context: ToolContext;

  constructor(tools: Tool[], context: ToolContext) {
    super();
    this.tools    = new Map(tools.map(t => [t.name, t]));
    this.context  = context;
  }

  /**
   * Execute a batch of tool calls from a single assistant turn.
   *
   * Read-only tools are fanned out (max {@link MAX_CONCURRENT_READS} at once);
   * write tools are always executed one at a time in the order they were
   * requested, after all read-only tools in the batch have settled.
   *
   * @param calls - Array of `ToolUseContent` blocks from the assistant message.
   * @returns Ordered array of execution results (same order as `calls`).
   */
  async executeBatch(calls: ToolUseContent[]): Promise<ToolExecution[]> {
    const reads:  ToolUseContent[] = [];
    const writes: ToolUseContent[] = [];

    for (const call of calls) {
      const tool = this.tools.get(call.toolName);
      if (!tool) {
        // Unknown tool — treat as a (safe) no-op with an error result.
        writes.push(call); // serial path will produce the error message
        continue;
      }
      tool.isReadOnly ? reads.push(call) : writes.push(call);
    }

    // ── 1. Fan-out reads in parallel (capped at MAX_CONCURRENT_READS) ──────
    const readResults = await this.executeInBatches(reads, MAX_CONCURRENT_READS);

    // ── 2. Execute writes one at a time ─────────────────────────────────────
    const writeResults: ToolExecution[] = [];
    for (const call of writes) {
      writeResults.push(await this.executeOne(call));
    }

    // Restore original order so the model's tool_result blocks align.
    const resultMap = new Map<string, ToolExecution>(
      [...readResults, ...writeResults].map(r => [r.toolId, r])
    );
    return calls.map(c => resultMap.get(c.toolId) ?? this.missingToolResult(c));
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Run `items` through `executeOne` with at most `concurrency` in flight. */
  private async executeInBatches(
    items: ToolUseContent[],
    concurrency: number
  ): Promise<ToolExecution[]> {
    const results: ToolExecution[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const settled = await Promise.all(chunk.map(c => this.executeOne(c)));
      results.push(...settled);
    }
    return results;
  }

  /** Execute a single tool call and enforce the result-size budget. */
  private async executeOne(call: ToolUseContent): Promise<ToolExecution> {
    const tool = this.tools.get(call.toolName);

    this.emit('tool:pre_execute', { toolId: call.toolId, toolName: call.toolName, input: call.input });

    let result: ToolResult;
    if (!tool) {
      result = {
        success:         false,
        error:           `Unknown tool: "${call.toolName}"`,
        tokenCount:      0,
        truncated:       false,
        executionTimeMs: 0,
      };
    } else {
      const validation = tool.validate(call.input);
      if (!validation.valid) {
        result = {
          success:         false,
          error:           `Validation failed: ${validation.errors.join('; ')}`,
          tokenCount:      0,
          truncated:       false,
          executionTimeMs: 0,
        };
      } else {
        try {
          result = await tool.execute(call.input, this.context);
        } catch (err) {
          result = {
            success:         false,
            error:           err instanceof Error ? err.message : String(err),
            tokenCount:      0,
            truncated:       false,
            executionTimeMs: 0,
          };
        }
      }
    }

    // Enforce result-size budget
    result = this.enforceBudget(call.toolName, result, tool);

    this.emit('tool:post_execute', { toolId: call.toolId, toolName: call.toolName, result });

    return { toolId: call.toolId, toolName: call.toolName, result };
  }

  /**
   * Clip oversized results and, if necessary, spill to a temp file.
   * The truncated content is replaced with a pointer message so the model
   * can decide whether to read the full file.
   */
  private enforceBudget(
    toolName: string,
    result: ToolResult,
    tool: Tool | undefined
  ): ToolResult {
    if (!result.success || result.data == null) return result;

    const raw  = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    // Command-category tools get a larger budget.
    const isCommand = tool?.category === 'execute' || tool?.category === 'connect';
    const budget    = isCommand ? RESULT_BUDGET.command : RESULT_BUDGET.query;

    if (raw.length <= budget) return result;

    // Spill overflow to a temp file.
    const tmpPath = path.join(
      os.tmpdir(),
      `ioe-overflow-${toolName}-${Date.now()}.txt`
    );
    try {
      fs.writeFileSync(tmpPath, raw, 'utf8');
    } catch {
      // If we can't write the file just truncate in-place.
      return {
        ...result,
        data:      raw.slice(0, budget) + '\n… [truncated — could not write overflow file]',
        truncated: true,
      };
    }

    const preview = raw.slice(0, Math.min(500, budget));
    return {
      ...result,
      data: (
        `[Result exceeds ${budget}-char budget and has been saved to: ${tmpPath}]\n` +
        `Preview (first 500 chars):\n${preview}\n…`
      ),
      truncated: true,
    };
  }

  /** Synthetic error result for calls that had no matching tool entry. */
  private missingToolResult(call: ToolUseContent): ToolExecution {
    return {
      toolId:   call.toolId,
      toolName: call.toolName,
      result: {
        success:         false,
        error:           `No result produced for tool "${call.toolName}"`,
        tokenCount:      0,
        truncated:       false,
        executionTimeMs: 0,
      },
    };
  }
}

// ============================================================================
// ErrorRecoveryPipeline
// ============================================================================

/**
 * Multi-strategy error recovery for the TAOR loop.
 *
 * Strategies (tried in order):
 * 1. **Context compression** — emits an event; the host process should
 *    intercept and compress the message history, then signal readiness.
 * 2. **Context collapse** — emits an event for a more aggressive collapse.
 * 3. **Exponential back-off retry** — sleeps using the {@link BACKOFF_SCHEDULE_MS}
 *    ladder before the next attempt.
 *
 * After {@link MAX_CONSECUTIVE_FAILURES} consecutive failures the pipeline
 * raises an unrecoverable error and the loop is aborted.
 */
export class ErrorRecoveryPipeline extends EventEmitter {
  private consecutiveFailures = 0;
  private retryAttempt        = 0;

  /**
   * Classify the error and apply the appropriate recovery strategy.
   *
   * @param err   - The raw error thrown by the LLM adapter or tool executor.
   * @param state - Current TAOR state (used for context decisions).
   * @returns `true` if the loop should continue, `false` if it should abort.
   */
  async recover(err: unknown, state: TAORState): Promise<boolean> {
    this.consecutiveFailures++;

    if (this.consecutiveFailures > MAX_CONSECUTIVE_FAILURES) {
      this.emit('recovery:abort', {
        reason: `Exceeded ${MAX_CONSECUTIVE_FAILURES} consecutive failures`,
        lastError: err,
        state,
      });
      return false;
    }

    const message = err instanceof Error ? err.message : String(err);

    // ── Strategy 0: Rate-limit detection ─────────────────────────────────────
    if (this.isRateLimit(message)) {
      this.emit('recovery:rate_limit', { message, attempt: this.retryAttempt });
      await this.backoff();
      return true;
    }

    // ── Strategy 1: Context overflow → request compression ───────────────────
    if (this.isContextOverflow(message)) {
      this.emit('recovery:context_compress', {
        state,
        reason: message,
        attempt: this.consecutiveFailures,
      });
      // Brief pause — compression is async on the host side.
      await this.sleep(500);
      return true;
    }

    // ── Strategy 2: Context still too large → collapse ────────────────────────
    if (this.consecutiveFailures >= 2 && this.isContextOverflow(message)) {
      this.emit('recovery:context_collapse', {
        state,
        reason: message,
        attempt: this.consecutiveFailures,
      });
      await this.sleep(500);
      return true;
    }

    // ── Strategy 3: General transient error → exponential back-off ───────────
    await this.backoff();
    return true;
  }

  /**
   * Signal that a turn completed without error, resetting the failure counters.
   */
  onSuccess(): void {
    this.consecutiveFailures = 0;
    this.retryAttempt        = 0;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isRateLimit(message: string): boolean {
    return /rate.?limit|429|too many requests|overloaded/i.test(message);
  }

  private isContextOverflow(message: string): boolean {
    return /context.{0,30}(length|limit|window|overflow)|too many tokens|max.*token/i.test(message);
  }

  private async backoff(): Promise<void> {
    const idx       = Math.min(this.retryAttempt, BACKOFF_SCHEDULE_MS.length - 1);
    const delayMs   = BACKOFF_SCHEDULE_MS[idx];
    this.retryAttempt++;
    this.emit('recovery:backoff', { delayMs, attempt: this.retryAttempt });
    await this.sleep(delayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// TAORLoop
// ============================================================================

/**
 * Core TAOR (Think-Act-Observe-Repeat) loop for IOE agents.
 *
 * ```
 *  ┌──────────────────────────────────────────────┐
 *  │  run()                                       │
 *  │   └─ loop:                                   │
 *  │       1. think()   — LLM call                │
 *  │       2. act()     — tool execution           │
 *  │       3. observe() — append tool results     │
 *  │       4. shouldContinue() — stop conditions  │
 *  └──────────────────────────────────────────────┘
 * ```
 *
 * The loop is intentionally thin. All domain intelligence lives in tool
 * implementations and in the system/task prompts supplied by the caller.
 *
 * ### Emitted events
 * | Event | Payload description |
 * |---|---|
 * | `loop:start` | Initial state snapshot |
 * | `loop:think` | Before each LLM call |
 * | `loop:think_complete` | After successful LLM response |
 * | `loop:act` | Before tool batch execution |
 * | `loop:observe` | After appending tool results |
 * | `loop:repeat` | Before the next turn |
 * | `loop:complete` | Final state on clean exit |
 * | `loop:error` | Error detail on abort |
 * | `recovery:*` | Forwarded from {@link ErrorRecoveryPipeline} |
 * | `tool:pre_execute` | Forwarded from {@link ToolExecutor} |
 * | `tool:post_execute` | Forwarded from {@link ToolExecutor} |
 *
 * @example
 * ```ts
 * const loop = new TAORLoop({ llmAdapter, tools, context });
 * loop.on('tool:pre_execute', ({ toolName }) => logger.debug(`→ ${toolName}`));
 * const result = await loop.run(initialMessages, config);
 * ```
 */
export class TAORLoop extends EventEmitter {
  private readonly llm:      LLMAdapter;
  private readonly executor: ToolExecutor;
  private readonly recovery: ErrorRecoveryPipeline;

  constructor(opts: {
    llmAdapter: LLMAdapter;
    tools:      Tool[];
    context:    ToolContext;
  }) {
    super();
    this.llm      = opts.llmAdapter;
    this.executor = new ToolExecutor(opts.tools, opts.context);
    this.recovery = new ErrorRecoveryPipeline();

    // Bubble executor and recovery events up to the loop surface.
    this.executor.on('tool:pre_execute',  e => this.emit('tool:pre_execute',  e));
    this.executor.on('tool:post_execute', e => this.emit('tool:post_execute', e));
    this.recovery.on('recovery:abort',           e => this.emit('recovery:abort',           e));
    this.recovery.on('recovery:rate_limit',      e => this.emit('recovery:rate_limit',      e));
    this.recovery.on('recovery:context_compress',e => this.emit('recovery:context_compress',e));
    this.recovery.on('recovery:context_collapse',e => this.emit('recovery:context_collapse',e));
    this.recovery.on('recovery:backoff',         e => this.emit('recovery:backoff',         e));
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Run the TAOR loop until a stop condition is met or an unrecoverable
   * error occurs.
   *
   * @param initialMessages - Conversation messages passed to the model on
   *   the first turn (system prompt + any prior history).
   * @param config - Loop configuration (max turns, token budgets, etc.).
   * @returns A {@link TAORResult} describing the final loop state.
   */
  async run(initialMessages: Message[], config: TAORConfig): Promise<TAORResult> {
    const startTime = Date.now();

    const state: TAORState = {
      phase:            'think',
      turnCount:        0,
      messages:         [...initialMessages],
      taskId:           `taor_${Date.now()}`,
      startTime,
      lastActivityTime: startTime,
      metadata:         {},
    };

    this.emit('loop:start', { state });

    let finalMessage: Message | null = null;

    while (true) {
      // ── THINK ──────────────────────────────────────────────────────────────
      let llmResponse: LLMResponse;
      try {
        state.phase = 'think';
        llmResponse = await this.think(state, config);
        this.recovery.onSuccess();
      } catch (err) {
        this.emit('loop:error', { phase: 'think', error: err, state });
        const shouldContinue = await this.recovery.recover(err, state);
        if (!shouldContinue) {
          return this.buildResult(state, finalMessage, startTime, false,
            err instanceof Error ? err.message : String(err));
        }
        continue; // retry the think phase
      }

      // Append the assistant message to history.
      const assistantMessage = this.buildAssistantMessage(llmResponse);
      state.messages.push(assistantMessage);
      state.lastActivityTime = Date.now();
      finalMessage = assistantMessage;
      this.emit('loop:think_complete', { state, llmResponse });

      // ── ACT ────────────────────────────────────────────────────────────────
      const toolCalls = this.extractToolCalls(llmResponse);
      if (toolCalls.length > 0) {
        state.phase = 'act';
        this.emit('loop:act', { state, toolCalls });

        let executions: ToolExecution[];
        try {
          executions = await this.act(toolCalls);
          this.recovery.onSuccess();
        } catch (err) {
          this.emit('loop:error', { phase: 'act', error: err, state });
          const shouldContinue = await this.recovery.recover(err, state);
          if (!shouldContinue) {
            return this.buildResult(state, finalMessage, startTime, false,
              err instanceof Error ? err.message : String(err));
          }
          continue;
        }

        // ── OBSERVE ──────────────────────────────────────────────────────────
        state.phase = 'observe';
        this.observe(executions, state);
        this.emit('loop:observe', { state, executions });
      }

      // ── REPEAT / COMPLETE ─────────────────────────────────────────────────
      state.turnCount++;
      if (!this.shouldContinue(llmResponse, state, config)) {
        state.phase = 'complete';
        this.emit('loop:complete', { state });
        return this.buildResult(state, finalMessage, startTime, true);
      }

      state.phase = 'repeat';
      this.emit('loop:repeat', { state });
    }
  }

  // ==========================================================================
  // TAOR Phase Methods
  // ==========================================================================

  /**
   * **Think** — Send the current message history to the LLM and receive a
   * response. The model may request tool calls or produce a final answer.
   *
   * @param state  - Current loop state (messages used as-is).
   * @param config - Configuration forwarded to the LLM adapter.
   */
  async think(state: TAORState, config: TAORConfig): Promise<LLMResponse> {
    this.emit('loop:think', { state });
    return this.llm.complete(state.messages, config);
  }

  /**
   * **Act** — Execute the tool calls requested by the model.
   *
   * Delegates to {@link ToolExecutor} which enforces concurrency limits,
   * result-size budgets, and emits pre/post events for hook integration.
   *
   * @param toolCalls - `ToolUseContent` blocks extracted from the LLM response.
   */
  async act(toolCalls: ToolUseContent[]): Promise<ToolExecution[]> {
    return this.executor.executeBatch(toolCalls);
  }

  /**
   * **Observe** — Convert tool execution results into `ToolResultContent`
   * blocks and append them to the message history as a `user`-role message,
   * which is the format expected by the Anthropic API.
   *
   * @param executions - Results returned by {@link act}.
   * @param state      - Current loop state (mutated in place).
   */
  observe(executions: ToolExecution[], state: TAORState): void {
    const resultContents: ToolResultContent[] = executions.map(exec => ({
      type:    'tool_result',
      toolId:  exec.toolId,
      content: exec.result.success
        ? this.serializeToolData(exec.result.data)
        : `Error: ${exec.result.error ?? 'Unknown error'}`,
      isError: !exec.result.success,
    }));

    const toolResultMessage: Message = {
      id:        `msg_${Date.now()}_tool_results`,
      role:      'user',
      content:   resultContents,
      timestamp: Date.now(),
    };

    state.messages.push(toolResultMessage);
    state.lastActivityTime = Date.now();
  }

  /**
   * **Should Continue** — Evaluate all stop conditions and return `true` if
   * the loop should proceed to the next turn, or `false` to terminate.
   *
   * Stop conditions (any one triggers termination):
   * - Model issued `end_turn` or `stop_sequence` and made no tool calls.
   * - `max_tokens` stop reason (model ran out of output budget).
   * - Turn limit reached (`config.maxTurns`).
   * - No tool calls were requested and `stopReason` is not `tool_use`.
   *
   * @param llmResponse - The most recent LLM response.
   * @param state       - Current loop state.
   * @param config      - Loop configuration.
   */
  shouldContinue(
    llmResponse: LLMResponse,
    state: TAORState,
    config: TAORConfig
  ): boolean {
    // Hard limit on turns.
    if (state.turnCount >= config.maxTurns) return false;

    // Model explicitly finished.
    if (
      llmResponse.stopReason === 'end_turn' ||
      llmResponse.stopReason === 'stop_sequence'
    ) {
      return false;
    }

    // Model ran out of output tokens — do not loop endlessly.
    if (llmResponse.stopReason === 'max_tokens') return false;

    // There are pending tool calls — the model wants to continue.
    if (llmResponse.stopReason === 'tool_use') return true;

    // Default: stop if nothing else warrants continuation.
    return false;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /** Extract all `tool_use` content blocks from an LLM response. */
  private extractToolCalls(response: LLMResponse): ToolUseContent[] {
    return response.content.filter(
      (c): c is ToolUseContent => c.type === 'tool_use'
    );
  }

  /** Build a `Message` object from an LLM response. */
  private buildAssistantMessage(response: LLMResponse): Message {
    return {
      id:        `msg_${Date.now()}_assistant`,
      role:      'assistant',
      content:   response.content,
      timestamp: Date.now(),
      metadata:  {
        tokenCount: response.usage.inputTokens + response.usage.outputTokens,
      },
    };
  }

  /** Serialize tool result data to a string the model can read. */
  private serializeToolData(data: unknown): string {
    if (data == null)              return '';
    if (typeof data === 'string')  return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  /** Assemble the final {@link TAORResult} from current loop state. */
  private buildResult(
    state:        TAORState,
    finalMessage: Message | null,
    startTime:    number,
    success:      boolean,
    error?:       string
  ): TAORResult {
    return {
      state,
      finalMessage,
      durationMs:  Date.now() - startTime,
      turnsUsed:   state.turnCount,
      success,
      error,
    };
  }
}
