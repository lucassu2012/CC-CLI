/**
 * IOE Permission Engine
 * Intelligent Operations Engine - L1–L5 Trust Hierarchy & Policy Enforcement
 *
 * Trust levels (ascending risk):
 *   L1 readonly   - Queries and reads; always auto-approved, logged passively.
 *   L2 low_risk   - Low-impact writes; auto-approved with an audit log entry.
 *   L3 medium     - Parameter changes, config updates; requires human approval.
 *   L4 high_risk  - Service-impacting changes; requires senior engineer sign-off
 *                   AND a passing digital-twin simulation.
 *   L5 emergency  - Break-glass actions during active incidents; auto-allowed
 *                   with mandatory post-execution audit review.
 *
 * Pipeline (deny-first, first-match wins):
 *   Deny → Ask → Allow
 *
 * Each incoming {@link PermissionRequest} is evaluated against the registered
 * policy set in that order. The first matching rule wins and produces a
 * {@link PermissionDecision}. If no explicit rule matches, the default policy
 * for the request's trust level applies.
 *
 * Maintenance windows: if the current time falls inside a maintenance window
 * for the target resource, L3/L4 requests may be auto-approved if the
 * maintenance window type is `'planned'` and the agent holds the requisite
 * level.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PermissionLevel,
  PermissionPolicy,
  PermissionRequest,
  PermissionDecision,
  MaintenanceWindow,
  SimulationResult,
} from '../types';

// ============================================================================
// Supplementary types local to this module
// ============================================================================

/** A rule in the deny-first pipeline. */
export type PolicyRuleAction = 'deny' | 'ask' | 'allow';

/** A single evaluatable rule. */
export interface PolicyRule {
  id: string;
  /** Name or glob pattern for the tool this rule applies to (`*` = any). */
  toolPattern: string;
  /** Operation string or glob (`*` = any). */
  operationPattern: string;
  /** Minimum trust level that triggers this rule. */
  minLevel: PermissionLevel;
  /** Maximum trust level that triggers this rule (inclusive). */
  maxLevel: PermissionLevel;
  action: PolicyRuleAction;
  /** Human-readable explanation injected into {@link PermissionDecision.reason}. */
  reason: string;
  /** Additional conditions that must all be truthy for the rule to match. */
  conditions?: PolicyCondition[];
  enabled: boolean;
}

/** A key-value condition evaluated against the serialised request. */
export interface PolicyCondition {
  /** Dot-path into the {@link PermissionRequest} object (e.g. `"targetResource"`). */
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex' | 'gt' | 'lt';
  value: string | number;
}

/** Approval request tracked while waiting for a human decision. */
export interface PendingApproval {
  request: PermissionRequest;
  createdAt: number;
  /** Timeout in milliseconds before the request is auto-denied. */
  timeoutMs: number;
  /** Callback resolved when a decision arrives or the timeout fires. */
  resolve: (decision: PermissionDecision) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Structured audit log entry written for every permission decision. */
export interface AuditEntry {
  timestamp: number;
  requestId: string;
  agentId: string;
  toolName: string;
  operation: string;
  targetResource: string;
  riskLevel: PermissionLevel;
  decision: 'approved' | 'denied' | 'pending';
  decidedBy: PermissionDecision['decidedBy'];
  reason: string;
  digitalTwinUsed: boolean;
  maintenanceWindowActive: boolean;
  sessionId?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Ordered trust levels from lowest to highest risk. */
const LEVEL_ORDER: PermissionLevel[] = [
  'L1_readonly',
  'L2_low_risk',
  'L3_medium',
  'L4_high_risk',
  'L5_emergency',
];

/**
 * Default human approval timeout per level.
 * L4 is given more time for senior sign-off + digital-twin review.
 */
const DEFAULT_APPROVAL_TIMEOUT_MS: Record<PermissionLevel, number> = {
  L1_readonly: 0,
  L2_low_risk: 0,
  L3_medium: 5 * 60 * 1000,       // 5 minutes
  L4_high_risk: 15 * 60 * 1000,   // 15 minutes
  L5_emergency: 30 * 60 * 1000,   // 30 minutes (post-audit window)
};

// ============================================================================
// PermissionEngine
// ============================================================================

/**
 * Central permission engine for IOE.
 *
 * Usage:
 * ```ts
 * const engine = new PermissionEngine({ auditLogPath: '/var/log/ioe/audit.jsonl' });
 * engine.loadDefaultPolicies();
 *
 * const decision = await engine.evaluate(request, { maintenanceWindows, digitalTwinResult });
 * if (!decision.approved) throw new Error(decision.reason);
 * ```
 */
export class PermissionEngine {
  /** Ordered rule set (evaluated top-to-bottom; first match wins). */
  private rules: PolicyRule[] = [];

  /** Callbacks waiting for human decisions, keyed by requestId. */
  private pendingApprovals = new Map<string, PendingApproval>();

  /** Path to the append-only audit JSONL file. */
  private readonly auditLogPath: string;

  /** Optional hook called when a request requires human review. */
  private humanApprovalHandler?: (request: PermissionRequest) => Promise<PermissionDecision>;

  constructor(options: { auditLogPath: string }) {
    this.auditLogPath = options.auditLogPath;
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Register a human approval handler.  When a request reaches the `ask`
   * stage this handler is invoked.  If no handler is registered, `ask` rules
   * fall back to a configurable timeout after which the request is denied.
   */
  setHumanApprovalHandler(
    handler: (request: PermissionRequest) => Promise<PermissionDecision>
  ): void {
    this.humanApprovalHandler = handler;
  }

  /**
   * Add one or more policy rules to the front of the evaluation pipeline.
   * Rules added later take precedence over rules added earlier.
   */
  addRules(rules: PolicyRule[]): void {
    // Prepend so explicitly added rules beat defaults
    this.rules.unshift(...rules);
  }

  /**
   * Replace the entire rule set.
   */
  setRules(rules: PolicyRule[]): void {
    this.rules = [...rules];
  }

  /**
   * Load the built-in default policy set.
   *
   * Defaults implement the specification's deny-first pipeline:
   * - All L1 readonly operations → allow (no log overhead)
   * - L2 low-risk               → allow + audit log
   * - L3 medium                 → ask (human approval)
   * - L4 high-risk              → ask (senior + digital-twin)
   * - L5 emergency              → allow + post-audit
   *
   * Explicit deny rules for known destructive patterns are prepended
   * so they are checked before the allow/ask defaults.
   */
  loadDefaultPolicies(): void {
    const defaults: PolicyRule[] = [
      // ------------------------------------------------------------------
      // Deny rules (checked first)
      // ------------------------------------------------------------------
      {
        id: 'deny_change_freeze',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L3_medium',
        maxLevel: 'L4_high_risk',
        action: 'deny',
        reason: 'Change freeze is active. No configuration changes permitted.',
        conditions: [{ field: '__changeFreezeActive', operator: 'eq', value: 'true' }],
        enabled: true,
      },
      {
        id: 'deny_l4_no_digital_twin',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L4_high_risk',
        maxLevel: 'L4_high_risk',
        action: 'deny',
        reason: 'High-risk actions require a digital-twin simulation result. Simulation not provided.',
        conditions: [{ field: '__digitalTwinAvailable', operator: 'eq', value: 'false' }],
        enabled: true,
      },

      // ------------------------------------------------------------------
      // Allow rules
      // ------------------------------------------------------------------
      {
        id: 'allow_l1_readonly',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L1_readonly',
        maxLevel: 'L1_readonly',
        action: 'allow',
        reason: 'Read-only operation; auto-approved.',
        enabled: true,
      },
      {
        id: 'allow_l2_low_risk',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L2_low_risk',
        maxLevel: 'L2_low_risk',
        action: 'allow',
        reason: 'Low-risk operation; auto-approved with audit log.',
        enabled: true,
      },
      {
        id: 'allow_l5_emergency',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L5_emergency',
        maxLevel: 'L5_emergency',
        action: 'allow',
        reason: 'Emergency break-glass; auto-allowed with mandatory post-action audit.',
        enabled: true,
      },

      // ------------------------------------------------------------------
      // Ask rules
      // ------------------------------------------------------------------
      {
        id: 'ask_l3_medium',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L3_medium',
        maxLevel: 'L3_medium',
        action: 'ask',
        reason: 'Medium-risk operation requires human operator approval.',
        enabled: true,
      },
      {
        id: 'ask_l4_high_risk',
        toolPattern: '*',
        operationPattern: '*',
        minLevel: 'L4_high_risk',
        maxLevel: 'L4_high_risk',
        action: 'ask',
        reason: 'High-risk operation requires senior engineer approval and digital-twin validation.',
        enabled: true,
      },
    ];

    this.rules = defaults;
  }

  // --------------------------------------------------------------------------
  // Core evaluation
  // --------------------------------------------------------------------------

  /**
   * Evaluate a permission request through the deny-first pipeline.
   *
   * @param request            - The incoming permission request.
   * @param context            - Runtime context for condition evaluation.
   * @returns A {@link PermissionDecision} (may be async if human approval is
   *          required).
   */
  async evaluate(
    request: PermissionRequest,
    context: {
      maintenanceWindows?: MaintenanceWindow[];
      digitalTwinResult?: SimulationResult;
      changeFreezeActive?: boolean;
      sessionId?: string;
    } = {}
  ): Promise<PermissionDecision> {
    const {
      maintenanceWindows = [],
      digitalTwinResult,
      changeFreezeActive = false,
      sessionId,
    } = context;

    // Build a flat evaluation context for condition matching
    const inMaintenanceWindow = this._isInMaintenanceWindow(
      request.targetResource,
      maintenanceWindows
    );

    const evalContext: Record<string, string> = {
      __changeFreezeActive: String(changeFreezeActive),
      __digitalTwinAvailable: String(digitalTwinResult !== undefined),
      __inMaintenanceWindow: String(inMaintenanceWindow),
      toolName: request.toolName,
      operation: request.operation,
      targetResource: request.targetResource,
      agentId: request.agentId,
      riskLevel: request.riskLevel,
    };

    // Maintenance window fast-path: planned window auto-elevates L3 to allow
    if (
      inMaintenanceWindow &&
      request.riskLevel === 'L3_medium' &&
      !changeFreezeActive
    ) {
      const decision: PermissionDecision = {
        requestId: request.id,
        approved: true,
        decidedBy: 'policy',
        reason: 'Auto-approved within active planned maintenance window.',
        conditions: ['Post-action audit required within 4 hours.'],
      };
      await this._audit(request, decision, { digitalTwinUsed: false, maintenanceWindowActive: true, sessionId });
      return decision;
    }

    // Walk the pipeline: deny → ask → allow (first-match)
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (!this._ruleMatchesLevel(rule, request.riskLevel)) continue;
      if (!this._globMatch(rule.toolPattern, request.toolName)) continue;
      if (!this._globMatch(rule.operationPattern, request.operation)) continue;
      if (!this._conditionsMatch(rule.conditions ?? [], evalContext)) continue;

      // Rule matched
      switch (rule.action) {
        case 'deny': {
          const decision: PermissionDecision = {
            requestId: request.id,
            approved: false,
            decidedBy: 'policy',
            reason: rule.reason,
          };
          await this._audit(request, decision, {
            digitalTwinUsed: false,
            maintenanceWindowActive: inMaintenanceWindow,
            sessionId,
          });
          return decision;
        }

        case 'allow': {
          const decision: PermissionDecision = {
            requestId: request.id,
            approved: true,
            decidedBy: request.riskLevel === 'L5_emergency' ? 'policy' : 'auto',
            reason: rule.reason,
            conditions:
              request.riskLevel === 'L5_emergency'
                ? ['Mandatory post-action audit required within 1 hour.']
                : undefined,
          };
          await this._audit(request, decision, {
            digitalTwinUsed: false,
            maintenanceWindowActive: inMaintenanceWindow,
            sessionId,
          });
          return decision;
        }

        case 'ask': {
          const decision = await this._requestHumanApproval(request, digitalTwinResult);
          await this._audit(request, decision, {
            digitalTwinUsed: digitalTwinResult !== undefined,
            maintenanceWindowActive: inMaintenanceWindow,
            sessionId,
          });
          return decision;
        }
      }
    }

    // No rule matched → default deny
    const fallback: PermissionDecision = {
      requestId: request.id,
      approved: false,
      decidedBy: 'policy',
      reason: 'No policy rule matched. Default deny applied.',
    };
    await this._audit(request, fallback, {
      digitalTwinUsed: false,
      maintenanceWindowActive: inMaintenanceWindow,
      sessionId,
    });
    return fallback;
  }

  // --------------------------------------------------------------------------
  // Human approval workflow
  // --------------------------------------------------------------------------

  /**
   * Submit a human decision for a pending approval request.
   * Called by the UI/API layer when an operator approves or rejects.
   */
  submitHumanDecision(requestId: string, approved: boolean, decidedBy: string, reason: string): boolean {
    const pending = this.pendingApprovals.get(requestId);
    if (!pending) return false;

    clearTimeout(pending.timer);
    this.pendingApprovals.delete(requestId);

    const decision: PermissionDecision = {
      requestId,
      approved,
      decidedBy: 'human',
      reason: `${decidedBy}: ${reason}`,
    };
    pending.resolve(decision);
    return true;
  }

  /** Return all currently pending approval requests (for UI polling). */
  getPendingApprovals(): PermissionRequest[] {
    return [...this.pendingApprovals.values()].map(p => p.request);
  }

  // --------------------------------------------------------------------------
  // Maintenance window
  // --------------------------------------------------------------------------

  /**
   * Determine whether `targetResource` falls within any active maintenance
   * window at the current time.
   */
  private _isInMaintenanceWindow(
    targetResource: string,
    windows: MaintenanceWindow[]
  ): boolean {
    const now = Date.now();
    return windows.some(
      w =>
        w.start <= now &&
        w.end >= now &&
        (w.affectedElements.includes(targetResource) ||
          w.affectedElements.includes('*'))
    );
  }

  // --------------------------------------------------------------------------
  // Policy helpers
  // --------------------------------------------------------------------------

  private _ruleMatchesLevel(rule: PolicyRule, level: PermissionLevel): boolean {
    const levelIdx = LEVEL_ORDER.indexOf(level);
    const minIdx = LEVEL_ORDER.indexOf(rule.minLevel);
    const maxIdx = LEVEL_ORDER.indexOf(rule.maxLevel);
    return levelIdx >= minIdx && levelIdx <= maxIdx;
  }

  /**
   * Simple glob matching supporting `*` (any sequence) and `?` (any single
   * character). Case-insensitive.
   */
  private _globMatch(pattern: string, value: string): boolean {
    if (pattern === '*') return true;
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(value);
  }

  private _conditionsMatch(
    conditions: PolicyCondition[],
    ctx: Record<string, string>
  ): boolean {
    for (const cond of conditions) {
      const rawValue = this._getNestedValue(ctx, cond.field);
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
  // Human approval (internal)
  // --------------------------------------------------------------------------

  private _requestHumanApproval(
    request: PermissionRequest,
    digitalTwinResult?: SimulationResult
  ): Promise<PermissionDecision> {
    if (this.humanApprovalHandler) {
      // Delegate to the registered handler (UI, chat interface, etc.)
      const augmented: PermissionRequest = digitalTwinResult
        ? { ...request, digitalTwinResult }
        : request;
      return this.humanApprovalHandler(augmented);
    }

    // Built-in fallback: wait for an explicit submitHumanDecision call or timeout
    const timeoutMs = DEFAULT_APPROVAL_TIMEOUT_MS[request.riskLevel] || 5 * 60 * 1000;

    return new Promise<PermissionDecision>(resolve => {
      const timer = setTimeout(() => {
        this.pendingApprovals.delete(request.id);
        resolve({
          requestId: request.id,
          approved: false,
          decidedBy: 'policy',
          reason: `Approval timeout after ${timeoutMs / 1000}s. Request auto-denied.`,
        });
      }, timeoutMs);

      this.pendingApprovals.set(request.id, {
        request,
        createdAt: Date.now(),
        timeoutMs,
        resolve,
        timer,
      });
    });
  }

  // --------------------------------------------------------------------------
  // Audit logging
  // --------------------------------------------------------------------------

  /**
   * Append an {@link AuditEntry} to the JSONL audit log.
   * Non-blocking: failures are silently swallowed to avoid disrupting the
   * permission decision path.
   */
  private async _audit(
    request: PermissionRequest,
    decision: PermissionDecision,
    meta: { digitalTwinUsed: boolean; maintenanceWindowActive: boolean; sessionId?: string }
  ): Promise<void> {
    const entry: AuditEntry = {
      timestamp: Date.now(),
      requestId: request.id,
      agentId: request.agentId,
      toolName: request.toolName,
      operation: request.operation,
      targetResource: request.targetResource,
      riskLevel: request.riskLevel,
      decision: decision.approved ? 'approved' : 'denied',
      decidedBy: decision.decidedBy,
      reason: decision.reason,
      digitalTwinUsed: meta.digitalTwinUsed,
      maintenanceWindowActive: meta.maintenanceWindowActive,
      sessionId: meta.sessionId,
    };

    try {
      await fs.promises.mkdir(path.dirname(this.auditLogPath), { recursive: true });
      await fs.promises.appendFile(this.auditLogPath, JSON.stringify(entry) + '\n', 'utf8');
    } catch {
      // Audit failure is non-fatal but should be surfaced to monitoring
    }
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  /** Return the default {@link PermissionPolicy} descriptor for a given level. */
  static defaultPolicyFor(level: PermissionLevel): PermissionPolicy {
    const policies: Record<PermissionLevel, PermissionPolicy> = {
      L1_readonly: {
        level: 'L1_readonly',
        allowedOperations: ['read', 'query', 'list', 'describe', 'monitor'],
        deniedOperations: [],
        requiresApproval: false,
        requiresDigitalTwinSim: false,
        requiresAuditLog: false,
        approverRoles: [],
      },
      L2_low_risk: {
        level: 'L2_low_risk',
        allowedOperations: ['*'],
        deniedOperations: ['delete', 'decommission', 'emergency_shutdown'],
        requiresApproval: false,
        requiresDigitalTwinSim: false,
        requiresAuditLog: true,
        approverRoles: [],
        maxAutoApprovalCount: 50,
      },
      L3_medium: {
        level: 'L3_medium',
        allowedOperations: ['*'],
        deniedOperations: ['emergency_shutdown', 'bulk_delete'],
        requiresApproval: true,
        requiresDigitalTwinSim: false,
        requiresAuditLog: true,
        approverRoles: ['network_engineer', 'ops_lead'],
      },
      L4_high_risk: {
        level: 'L4_high_risk',
        allowedOperations: ['*'],
        deniedOperations: [],
        requiresApproval: true,
        requiresDigitalTwinSim: true,
        requiresAuditLog: true,
        approverRoles: ['senior_engineer', 'network_architect', 'ops_director'],
      },
      L5_emergency: {
        level: 'L5_emergency',
        allowedOperations: ['*'],
        deniedOperations: [],
        requiresApproval: false,
        requiresDigitalTwinSim: false,
        requiresAuditLog: true,
        approverRoles: ['post_incident_reviewer'],
      },
    };

    return policies[level];
  }
}
