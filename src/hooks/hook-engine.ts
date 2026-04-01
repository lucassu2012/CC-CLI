/**
 * IOE Hook Engine
 * Intelligent Operations Engine - Deterministic Guarantees via Lifecycle Hooks
 *
 * The hook engine wraps every non-deterministic LLM action with deterministic
 * pre/post guards. Hooks are evaluated synchronously (by priority) so the
 * calling code always knows the outcome before proceeding.
 *
 * Handler types:
 *   command - Shell script executed via child_process; stdout is parsed for a
 *             {@link HookResult} JSON object on the last line.
 *   http    - Outbound webhook (POST); response body must be a JSON
 *             {@link HookResult}.
 *   prompt  - Single-turn LLM call for validation; the model responds with a
 *             JSON {@link HookResult}.
 *   agent   - Multi-turn LLM sub-agent; result delivered via the agent's
 *             final message.
 *
 * Result actions:
 *   allow   - Continue with the original parameters.
 *   deny    - Block the action; throw/return the deny reason to the caller.
 *   modify  - Replace the action parameters with {@link HookResult.modifiedParams}.
 *   log     - Record and continue (no behavioural change).
 *
 * Built-in telecom hooks registered by {@link HookEngine.loadTelecomHooks}:
 *   pre_tool_use          → pre-action compliance check
 *   post_tool_use         → post-action audit trail
 *   pre_simulation        → safety simulation gate
 *   compliance_check      → regulatory constraint check
 *   maintenance_window_check → maintenance window awareness
 *
 * Priority: lower numbers execute first (priority 1 runs before priority 100).
 */

import { spawn } from 'child_process';
import {
  HookEvent,
  HookHandlerType,
  HookDefinition,
  HookCondition,
  HookResult,
} from '../types';

// ============================================================================
// Supplementary types local to this module
// ============================================================================

/** Context object passed to every hook handler invocation. */
export interface HookContext {
  /** The lifecycle event that triggered the hook. */
  event: HookEvent;
  /** Arbitrary key-value metadata from the caller. */
  payload: Record<string, unknown>;
  /** Agent that initiated the action. */
  agentId: string;
  /** Active IOE session identifier. */
  sessionId: string;
  /** Wall-clock timestamp when the hook was triggered (Unix ms). */
  triggeredAt: number;
}

/** Full execution record for a single hook handler invocation. */
export interface HookExecution {
  hookId: string;
  event: HookEvent;
  handlerType: HookHandlerType;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  result: HookResult;
  error?: string;
  timedOut: boolean;
}

/** Aggregate result of running all hooks for one event. */
export interface HookRunResult {
  event: HookEvent;
  executions: HookExecution[];
  /** Final merged action after all hooks have run. */
  finalAction: HookResult['action'];
  /** Parameters as modified by any `modify` hooks (or original if none). */
  params: Record<string, unknown>;
  /** Denial reason if `finalAction === 'deny'`. */
  denyReason?: string;
  totalDurationMs: number;
}

/** Adapter interface for prompt/agent handler backends. */
export interface LLMAdapter {
  /**
   * Invoke the LLM and return a structured {@link HookResult}.
   *
   * @param prompt    - System + user prompt text.
   * @param isAgent   - When `true`, the adapter should run a multi-turn loop.
   * @param timeoutMs - Maximum allowed elapsed time in ms.
   */
  invoke(prompt: string, isAgent: boolean, timeoutMs: number): Promise<HookResult>;
}

// ============================================================================
// Built-in telecom hook definitions
// ============================================================================

/** IDs of the built-in telecom hooks registered by {@link HookEngine.loadTelecomHooks}. */
export const TELECOM_HOOK_IDS = {
  PRE_ACTION_COMPLIANCE: 'telecom:pre_action_compliance',
  POST_ACTION_AUDIT: 'telecom:post_action_audit',
  SAFETY_SIMULATION: 'telecom:safety_simulation',
  REGULATORY_CHECK: 'telecom:regulatory_check',
  MAINTENANCE_WINDOW_CHECK: 'telecom:maintenance_window_check',
} as const;

// ============================================================================
// HookEngine
// ============================================================================

/**
 * Lifecycle hook engine for IOE.
 *
 * The engine maintains a registry of {@link HookDefinition} objects indexed by
 * {@link HookEvent}. When {@link run} is called:
 *
 * 1. All hooks registered for the event are collected and sorted by priority
 *    (ascending – lower numbers run first).
 * 2. Each hook's conditions are evaluated against the context payload.
 * 3. Matching hooks are executed sequentially (to preserve determinism).
 * 4. The result pipeline applies:
 *    - A single `deny` result short-circuits remaining hooks and returns the
 *      denial immediately.
 *    - `modify` results accumulate: each modifier's params are merged into the
 *      running params object.
 *    - `log` results are recorded but do not alter flow.
 *    - `allow` is the default (no action required).
 * 5. The aggregate {@link HookRunResult} is returned to the caller.
 *
 * Handler execution honours per-hook timeout values. Timed-out handlers
 * produce a `deny` result (fail-closed).
 */
export class HookEngine {
  /** Registry keyed by event, then sorted by priority on read. */
  private readonly registry = new Map<HookEvent, HookDefinition[]>();

  /** Optional LLM adapter for `prompt` and `agent` handlers. */
  private llmAdapter?: LLMAdapter;

  /**
   * All 21 supported lifecycle events. Used for registry initialisation and
   * documentation.
   */
  static readonly ALL_EVENTS: HookEvent[] = [
    'pre_tool_use',
    'post_tool_use',
    'pre_config_change',
    'post_config_change',
    'pre_command_execute',
    'post_command_execute',
    'pre_simulation',
    'post_simulation',
    'permission_request',
    'task_start',
    'task_complete',
    'task_error',
    'agent_spawn',
    'agent_terminate',
    'context_compress',
    'memory_update',
    'escalation',
    'maintenance_window_check',
    'compliance_check',
    'safety_check',
    'audit_log',
  ];

  constructor(options: { llmAdapter?: LLMAdapter } = {}) {
    this.llmAdapter = options.llmAdapter;

    // Pre-initialise registry buckets for every known event
    for (const event of HookEngine.ALL_EVENTS) {
      this.registry.set(event, []);
    }
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  /**
   * Register a single hook definition.
   * If a hook with the same `id` already exists for the same event, it is
   * replaced.
   */
  register(hook: HookDefinition): void {
    this._assertValidEvent(hook.event);
    const bucket = this._bucket(hook.event);
    const existingIdx = bucket.findIndex(h => h.id === hook.id);
    if (existingIdx >= 0) {
      bucket[existingIdx] = hook;
    } else {
      bucket.push(hook);
    }
  }

  /**
   * Register multiple hook definitions at once.
   */
  registerAll(hooks: HookDefinition[]): void {
    for (const hook of hooks) {
      this.register(hook);
    }
  }

  /**
   * Unregister a hook by id.
   * @returns `true` if the hook was found and removed, `false` otherwise.
   */
  unregister(hookId: string): boolean {
    for (const [, bucket] of this.registry) {
      const idx = bucket.findIndex(h => h.id === hookId);
      if (idx >= 0) {
        bucket.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  /** Enable or disable an existing hook by id. */
  setEnabled(hookId: string, enabled: boolean): boolean {
    for (const [, bucket] of this.registry) {
      const hook = bucket.find(h => h.id === hookId);
      if (hook) {
        hook.enabled = enabled;
        return true;
      }
    }
    return false;
  }

  /** Return all hooks registered for a given event, sorted by priority. */
  getHooks(event: HookEvent): HookDefinition[] {
    return [...this._bucket(event)].sort((a, b) => a.priority - b.priority);
  }

  // --------------------------------------------------------------------------
  // LLM adapter
  // --------------------------------------------------------------------------

  /** Register or replace the LLM adapter used for `prompt` and `agent` hooks. */
  setLLMAdapter(adapter: LLMAdapter): void {
    this.llmAdapter = adapter;
  }

  // --------------------------------------------------------------------------
  // Execution
  // --------------------------------------------------------------------------

  /**
   * Run all hooks registered for `event` against the provided context.
   *
   * @param event   - The lifecycle event to fire.
   * @param context - Execution context including the event payload.
   * @returns A {@link HookRunResult} describing what happened.
   */
  async run(event: HookEvent, context: HookContext): Promise<HookRunResult> {
    const hooks = this.getHooks(event).filter(h => h.enabled);
    const executions: HookExecution[] = [];
    const startTime = Date.now();

    let currentParams = { ...context.payload };
    let denyReason: string | undefined;
    let denied = false;

    for (const hook of hooks) {
      // Condition filter
      if (!this._conditionsMatch(hook.conditions ?? [], context.payload)) {
        continue;
      }

      const exec = await this._executeHook(hook, context, currentParams);
      executions.push(exec);

      switch (exec.result.action) {
        case 'deny':
          denyReason = exec.result.message ?? `Hook '${hook.id}' denied the action.`;
          denied = true;
          break; // short-circuit

        case 'modify':
          if (exec.result.modifiedParams) {
            currentParams = { ...currentParams, ...exec.result.modifiedParams };
          }
          break;

        case 'allow':
        case 'log':
          // No state change required
          break;
      }

      if (denied) break;
    }

    return {
      event,
      executions,
      finalAction: denied ? 'deny' : executions.length > 0 ? this._computeFinalAction(executions) : 'allow',
      params: currentParams,
      denyReason,
      totalDurationMs: Date.now() - startTime,
    };
  }

  // --------------------------------------------------------------------------
  // Built-in telecom hooks
  // --------------------------------------------------------------------------

  /**
   * Register the standard set of telecom-specific hooks.
   *
   * These are no-op stubs using `command` handlers that print a JSON allow
   * result.  In production they should be overridden with real handler scripts
   * or an LLM adapter via {@link register}.
   *
   * Hooks registered:
   * - Pre-action compliance check  (`pre_tool_use`, priority 1)
   * - Post-action audit trail      (`post_tool_use`, priority 100)
   * - Safety simulation gate       (`pre_simulation`, priority 1)
   * - Regulatory constraint check  (`compliance_check`, priority 1)
   * - Maintenance window check     (`maintenance_window_check`, priority 1)
   */
  loadTelecomHooks(): void {
    const allow = JSON.stringify({ hookId: '', action: 'allow', message: 'ok' });

    const telecomHooks: HookDefinition[] = [
      // ----------------------------------------------------------------
      // pre_tool_use: compliance check before any tool call
      // ----------------------------------------------------------------
      {
        id: TELECOM_HOOK_IDS.PRE_ACTION_COMPLIANCE,
        event: 'pre_tool_use',
        handlerType: 'command',
        handler: `echo '${allow}'`,
        priority: 1,
        enabled: true,
        timeout: 5_000,
        conditions: [],
      },

      // ----------------------------------------------------------------
      // post_tool_use: audit trail after any tool call
      // ----------------------------------------------------------------
      {
        id: TELECOM_HOOK_IDS.POST_ACTION_AUDIT,
        event: 'post_tool_use',
        handlerType: 'command',
        handler: `echo '${allow}'`,
        priority: 100,
        enabled: true,
        timeout: 5_000,
        conditions: [],
      },

      // ----------------------------------------------------------------
      // pre_simulation: safety gate before digital-twin simulations
      // ----------------------------------------------------------------
      {
        id: TELECOM_HOOK_IDS.SAFETY_SIMULATION,
        event: 'pre_simulation',
        handlerType: 'command',
        handler: `echo '${allow}'`,
        priority: 1,
        enabled: true,
        timeout: 10_000,
        conditions: [],
      },

      // ----------------------------------------------------------------
      // compliance_check: verify regulatory constraints
      // ----------------------------------------------------------------
      {
        id: TELECOM_HOOK_IDS.REGULATORY_CHECK,
        event: 'compliance_check',
        handlerType: 'command',
        handler: `echo '${allow}'`,
        priority: 1,
        enabled: true,
        timeout: 8_000,
        conditions: [],
      },

      // ----------------------------------------------------------------
      // maintenance_window_check: deny actions outside approved windows
      // ----------------------------------------------------------------
      {
        id: TELECOM_HOOK_IDS.MAINTENANCE_WINDOW_CHECK,
        event: 'maintenance_window_check',
        handlerType: 'command',
        handler: `echo '${allow}'`,
        priority: 1,
        enabled: true,
        timeout: 3_000,
        conditions: [],
      },
    ];

    this.registerAll(telecomHooks);
  }

  // --------------------------------------------------------------------------
  // Handler dispatch
  // --------------------------------------------------------------------------

  /**
   * Execute a single hook and return its {@link HookExecution} record.
   * Timeout enforcement: if the handler does not resolve within
   * `hook.timeout` ms, a `deny` result is synthesised (fail-closed).
   */
  private async _executeHook(
    hook: HookDefinition,
    context: HookContext,
    currentParams: Record<string, unknown>
  ): Promise<HookExecution> {
    const startedAt = Date.now();
    let result: HookResult;
    let error: string | undefined;
    let timedOut = false;

    try {
      result = await Promise.race([
        this._dispatch(hook, context, currentParams),
        this._timeoutPromise(hook.timeout, hook.id),
      ]);
    } catch (err: unknown) {
      if (err instanceof HookTimeoutError) {
        timedOut = true;
        error = err.message;
        result = {
          hookId: hook.id,
          action: 'deny',
          message: err.message,
        };
      } else {
        error = err instanceof Error ? err.message : String(err);
        result = {
          hookId: hook.id,
          action: 'deny',
          message: `Hook execution error: ${error}`,
        };
      }
    }

    // Stamp hookId into result in case the handler omitted it
    result = { ...result, hookId: hook.id };

    const completedAt = Date.now();
    return {
      hookId: hook.id,
      event: hook.event,
      handlerType: hook.handlerType,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      result,
      error,
      timedOut,
    };
  }

  /**
   * Dispatch to the correct handler implementation based on `handlerType`.
   */
  private async _dispatch(
    hook: HookDefinition,
    context: HookContext,
    params: Record<string, unknown>
  ): Promise<HookResult> {
    switch (hook.handlerType) {
      case 'command':
        return this._runCommand(hook, context, params);
      case 'http':
        return this._runHttp(hook, context, params);
      case 'prompt':
        return this._runPrompt(hook, context, params, false);
      case 'agent':
        return this._runPrompt(hook, context, params, true);
    }
  }

  // --------------------------------------------------------------------------
  // Handler implementations
  // --------------------------------------------------------------------------

  /**
   * Execute a shell command handler.
   *
   * The command string from `hook.handler` is executed via `/bin/sh -c`.
   * The context payload is passed as the environment variable
   * `IOE_HOOK_CONTEXT` (JSON-encoded).
   *
   * The last non-empty line of stdout must be a JSON-encoded {@link HookResult}.
   */
  private _runCommand(
    hook: HookDefinition,
    context: HookContext,
    params: Record<string, unknown>
  ): Promise<HookResult> {
    return new Promise<HookResult>((resolve, reject) => {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        IOE_HOOK_CONTEXT: JSON.stringify({ ...context, params }),
        IOE_HOOK_ID: hook.id,
        IOE_HOOK_EVENT: hook.event,
      };

      const child = spawn('/bin/sh', ['-c', hook.handler], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      child.on('error', (err) => reject(err));

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Command hook '${hook.id}' exited with code ${code}. stderr: ${stderr.trim()}`));
          return;
        }

        const lines = stdout.split('\n').filter(l => l.trim());
        const lastLine = lines[lines.length - 1] ?? '';
        try {
          const result = JSON.parse(lastLine) as HookResult;
          resolve(result);
        } catch {
          reject(new Error(`Command hook '${hook.id}' did not return valid JSON. Last line: "${lastLine}"`));
        }
      });
    });
  }

  /**
   * Execute an HTTP webhook handler.
   *
   * Posts a JSON body `{ hookId, event, context, params }` to `hook.handler`
   * (treated as a URL). Expects a JSON {@link HookResult} response body.
   */
  private async _runHttp(
    hook: HookDefinition,
    context: HookContext,
    params: Record<string, unknown>
  ): Promise<HookResult> {
    const body = JSON.stringify({
      hookId: hook.id,
      event: hook.event,
      context: { ...context, params },
    });

    const response = await fetch(hook.handler, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IOE-Hook-Id': hook.id,
        'X-IOE-Hook-Event': hook.event,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `HTTP hook '${hook.id}' returned status ${response.status}: ${response.statusText}`
      );
    }

    const result = (await response.json()) as HookResult;
    return result;
  }

  /**
   * Execute a prompt (single-turn) or agent (multi-turn) LLM handler.
   *
   * The `hook.handler` string is treated as a system prompt template.
   * Context and params are injected as a structured user message. The LLM
   * must respond with a JSON-encoded {@link HookResult}.
   *
   * @param isAgent - When `true`, the LLM adapter runs a multi-turn agent loop.
   */
  private async _runPrompt(
    hook: HookDefinition,
    context: HookContext,
    params: Record<string, unknown>,
    isAgent: boolean
  ): Promise<HookResult> {
    if (!this.llmAdapter) {
      throw new Error(
        `Hook '${hook.id}' requires an LLM adapter but none is registered. ` +
        'Call HookEngine.setLLMAdapter() before using prompt/agent handlers.'
      );
    }

    const prompt = [
      hook.handler,                           // system prompt template
      '',
      '--- Hook Context ---',
      `Event: ${context.event}`,
      `Agent: ${context.agentId}`,
      `Session: ${context.sessionId}`,
      `Triggered at: ${new Date(context.triggeredAt).toISOString()}`,
      '',
      '--- Payload ---',
      JSON.stringify(params, null, 2),
      '',
      'Respond ONLY with a JSON object matching the HookResult schema:',
      '{ "hookId": string, "action": "allow"|"deny"|"modify"|"log", "message"?: string, "modifiedParams"?: object }',
    ].join('\n');

    return this.llmAdapter.invoke(prompt, isAgent, hook.timeout);
  }

  // --------------------------------------------------------------------------
  // Condition evaluation
  // --------------------------------------------------------------------------

  /**
   * Evaluate all conditions against the current payload.
   * All conditions must match (AND semantics). An empty conditions array
   * always matches.
   */
  private _conditionsMatch(
    conditions: HookCondition[],
    payload: Record<string, unknown>
  ): boolean {
    for (const cond of conditions) {
      const rawValue = this._getNestedValue(payload, cond.field);
      const ctxValue = String(rawValue ?? '');
      const condValue = String(cond.value);

      switch (cond.operator) {
        case 'eq':
          if (ctxValue !== condValue) return false;
          break;
        case 'neq':
          if (ctxValue === condValue) return false;
          break;
        case 'contains':
          if (!ctxValue.includes(condValue)) return false;
          break;
        case 'regex':
          if (!new RegExp(condValue).test(ctxValue)) return false;
          break;
        case 'gt':
          if (!(parseFloat(ctxValue) > parseFloat(condValue))) return false;
          break;
        case 'lt':
          if (!(parseFloat(ctxValue) < parseFloat(condValue))) return false;
          break;
      }
    }
    return true;
  }

  private _getNestedValue(obj: Record<string, unknown>, dotPath: string): unknown {
    return dotPath.split('.').reduce<unknown>((cur, key) => {
      if (cur !== null && typeof cur === 'object') {
        return (cur as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private _bucket(event: HookEvent): HookDefinition[] {
    if (!this.registry.has(event)) {
      this.registry.set(event, []);
    }
    return this.registry.get(event)!;
  }

  private _assertValidEvent(event: HookEvent): void {
    if (!HookEngine.ALL_EVENTS.includes(event)) {
      throw new Error(`Unknown HookEvent: '${event}'.`);
    }
  }

  private _timeoutPromise(ms: number, hookId: string): Promise<never> {
    return new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new HookTimeoutError(hookId, ms)),
        ms
      );
    });
  }

  /**
   * Derive the effective final action from all execution records.
   * Priority: deny > modify > allow > log.
   */
  private _computeFinalAction(executions: HookExecution[]): HookResult['action'] {
    const actions = executions.map(e => e.result.action);
    if (actions.includes('deny')) return 'deny';
    if (actions.includes('modify')) return 'modify';
    if (actions.includes('allow')) return 'allow';
    return 'log';
  }
}

// ============================================================================
// Errors
// ============================================================================

/** Thrown when a hook handler exceeds its allotted execution time. */
export class HookTimeoutError extends Error {
  constructor(hookId: string, timeoutMs: number) {
    super(`Hook '${hookId}' timed out after ${timeoutMs}ms. Fail-closed (deny).`);
    this.name = 'HookTimeoutError';
  }
}
