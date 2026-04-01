/**
 * IOE Tool Registry & Base Infrastructure
 * Intelligent Operations Engine - Tool System
 *
 * Design Philosophy:
 * - Primitives over integrations: composable building blocks, not monolithic adapters
 * - Deferred (lazy) tool discovery: tools are hidden until explicitly searched, reducing context noise
 * - Budget enforcement: hard limits on output size prevent context window exhaustion
 * - Overflow handling: results exceeding budget are saved to temp files, paths returned instead
 * - Uniform interface: all tools share Tool<Input, Output, Progress> contract
 * - Four-level rendering: use/progress/result/error for full observability
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  Tool,
  ToolCategory,
  ToolContext,
  ToolResult,
  ToolRenderOutput,
  ValidationResult,
  DomainType,
  PermissionLevel,
} from '../types/index';

// ============================================================================
// Constants
// ============================================================================

/** Default output budget in characters for command/query results (~30K chars ≈ ~7.5K tokens) */
export const DEFAULT_COMMAND_OUTPUT_BUDGET = 30_000;

/** Default output budget for query/data results (~20K chars ≈ ~5K tokens) */
export const DEFAULT_QUERY_OUTPUT_BUDGET = 20_000;

/** Approximate characters per token (conservative estimate for mixed content) */
const CHARS_PER_TOKEN = 4;

/** Temporary directory for overflowed tool output files */
const OVERFLOW_TMP_DIR = path.join(os.tmpdir(), 'ioe-tool-overflow');

// ============================================================================
// Extended Tool Metadata (registry-side decoration)
// ============================================================================

/**
 * Registry entry wrapping a Tool with discovery metadata.
 * Deferred tools are not listed in normal tool enumeration;
 * they must be surfaced via ToolSearchTool before the model can call them.
 */
export interface ToolRegistryEntry<TInput = unknown, TOutput = unknown, TProgress = unknown> {
  tool: Tool<TInput, TOutput, TProgress>;
  /** Whether this tool requires explicit search before it appears in the active tool list */
  isDeferred: boolean;
  /** Rich search tags for ToolSearchTool discovery */
  searchTags: string[];
  /** Domains this tool most naturally serves */
  domainAffinity: DomainType[];
  /** Hard character budget for this tool's output */
  outputBudget: number;
  /** If true, output overflow saves to a temp file and returns the path */
  overflowToFile: boolean;
  /** ISO-8601 registration timestamp */
  registeredAt: string;
  /** How many times this tool has been successfully invoked in this session */
  invocationCount: number;
}

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Central registry for all IOE tools.
 *
 * Responsibilities:
 * - Register, retrieve, and enumerate tools
 * - Enforce deferred (lazy) discovery: deferred tools are invisible to the model
 *   until ToolSearchTool surfaces them, preventing context bloat
 * - Filter tools by category and domain affinity
 * - Track per-tool invocation counts within a session
 */
export class ToolRegistry {
  private readonly entries = new Map<string, ToolRegistryEntry>();
  /** Names of deferred tools that have been unlocked for this session */
  private readonly unlockedDeferred = new Set<string>();

  /**
   * Register a tool with the registry.
   *
   * @param tool - The tool implementation
   * @param options - Registry-level metadata and policy overrides
   */
  register<TInput, TOutput, TProgress>(
    tool: Tool<TInput, TOutput, TProgress>,
    options: Partial<Omit<ToolRegistryEntry, 'tool' | 'registeredAt' | 'invocationCount'>> = {},
  ): void {
    if (this.entries.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered. Use a unique name.`);
    }

    const entry: ToolRegistryEntry<TInput, TOutput, TProgress> = {
      tool,
      isDeferred: options.isDeferred ?? tool.isDeferred ?? false,
      searchTags: options.searchTags ?? [],
      domainAffinity: options.domainAffinity ?? tool.domainAffinity ?? [],
      outputBudget:
        options.outputBudget ??
        (tool.category === 'execute' ? DEFAULT_COMMAND_OUTPUT_BUDGET : DEFAULT_QUERY_OUTPUT_BUDGET),
      overflowToFile: options.overflowToFile ?? true,
      registeredAt: new Date().toISOString(),
      invocationCount: 0,
    };

    this.entries.set(tool.name, entry as ToolRegistryEntry);
  }

  /**
   * Retrieve a tool by exact name.
   * Returns undefined if the tool is deferred and has not been unlocked.
   */
  get(name: string): Tool | undefined {
    const entry = this.entries.get(name);
    if (!entry) return undefined;
    if (entry.isDeferred && !this.unlockedDeferred.has(name)) return undefined;
    return entry.tool;
  }

  /**
   * Get a tool entry including metadata, regardless of deferred status.
   * Used internally by ToolSearchTool and for admin/audit purposes.
   */
  getEntry(name: string): ToolRegistryEntry | undefined {
    return this.entries.get(name);
  }

  /**
   * List all tools visible to the model in the current session.
   * Deferred tools appear only after being unlocked via ToolSearchTool.
   *
   * @param category - Optional filter by ToolCategory
   * @param domain - Optional filter by domain affinity
   */
  list(category?: ToolCategory, domain?: DomainType): Tool[] {
    const results: Tool[] = [];
    for (const [name, entry] of this.entries) {
      if (entry.isDeferred && !this.unlockedDeferred.has(name)) continue;
      if (category && entry.tool.category !== category) continue;
      if (domain && !entry.domainAffinity.includes(domain)) continue;
      results.push(entry.tool);
    }
    return results;
  }

  /**
   * Search ALL registered tools (including deferred) by keyword, category, or domain.
   * Returns registry entries so callers can inspect metadata.
   * This is the mechanism behind ToolSearchTool.
   *
   * @param query - Free-text search against name, description, and searchTags
   * @param category - Optional category filter
   * @param domain - Optional domain affinity filter
   */
  search(query: string, category?: ToolCategory, domain?: DomainType): ToolRegistryEntry[] {
    const q = query.toLowerCase();
    const results: ToolRegistryEntry[] = [];

    for (const entry of this.entries.values()) {
      if (category && entry.tool.category !== category) continue;
      if (domain && !entry.domainAffinity.includes(domain)) continue;

      const haystack = [
        entry.tool.name,
        entry.tool.description,
        ...entry.searchTags,
        entry.tool.category,
        ...entry.domainAffinity,
      ]
        .join(' ')
        .toLowerCase();

      if (haystack.includes(q)) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Unlock a deferred tool, making it visible to the model.
   * Called by ToolSearchTool after surfacing the tool to the model.
   */
  unlockDeferred(name: string): boolean {
    const entry = this.entries.get(name);
    if (!entry || !entry.isDeferred) return false;
    this.unlockedDeferred.add(name);
    return true;
  }

  /**
   * Record a successful invocation for session-level analytics.
   */
  recordInvocation(name: string): void {
    const entry = this.entries.get(name);
    if (entry) entry.invocationCount += 1;
  }

  /**
   * Return a summary of all registered tools (name, category, deferred status, invocations).
   * Useful for status dashboards and debugging.
   */
  summary(): Array<{
    name: string;
    category: ToolCategory;
    isDeferred: boolean;
    unlocked: boolean;
    invocationCount: number;
  }> {
    return Array.from(this.entries.entries()).map(([name, entry]) => ({
      name,
      category: entry.tool.category,
      isDeferred: entry.isDeferred,
      unlocked: this.unlockedDeferred.has(name),
      invocationCount: entry.invocationCount,
    }));
  }
}

/** Singleton registry instance shared across the IOE runtime */
export const globalRegistry = new ToolRegistry();

// ============================================================================
// Output Budget Enforcement & Overflow Handling
// ============================================================================

/**
 * Enforce the character budget on a serialised tool output string.
 *
 * If the output fits within the budget it is returned as-is.
 * If it overflows and `overflowToFile` is true the full content is written to
 * a temp file and a short reference string is returned in its place so the
 * model can read the file on demand.
 *
 * @param content - The raw string output to budget-check
 * @param budget - Maximum allowed characters
 * @param toolName - Used to construct a meaningful temp file name
 * @param overflowToFile - Whether to persist overflow to a temp file
 * @returns `{ enforced, truncated, overflowPath }` where `enforced` is the
 *          budget-compliant string delivered to the model
 */
export function enforceBudget(
  content: string,
  budget: number,
  toolName: string,
  overflowToFile = true,
): { enforced: string; truncated: boolean; overflowPath?: string } {
  if (content.length <= budget) {
    return { enforced: content, truncated: false };
  }

  if (overflowToFile) {
    try {
      if (!fs.existsSync(OVERFLOW_TMP_DIR)) {
        fs.mkdirSync(OVERFLOW_TMP_DIR, { recursive: true });
      }
      const timestamp = Date.now();
      const filename = `${toolName.replace(/[^a-z0-9_-]/gi, '_')}_${timestamp}.txt`;
      const filePath = path.join(OVERFLOW_TMP_DIR, filename);
      fs.writeFileSync(filePath, content, 'utf8');

      const header =
        `[OUTPUT TRUNCATED - full result saved to: ${filePath}]\n` +
        `[Total output size: ${content.length} chars, budget: ${budget} chars]\n` +
        `[First ${budget} chars shown below]\n\n`;

      return {
        enforced: header + content.slice(0, budget),
        truncated: true,
        overflowPath: filePath,
      };
    } catch {
      // Fall through to simple truncation if file write fails
    }
  }

  const truncationNotice =
    `\n\n[OUTPUT TRUNCATED: ${content.length} chars exceeded budget of ${budget} chars. ` +
    `${content.length - budget} chars dropped.]`;

  return {
    enforced: content.slice(0, budget) + truncationNotice,
    truncated: true,
  };
}

/**
 * Estimate token count for a string using the conservative CHARS_PER_TOKEN ratio.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ============================================================================
// BaseTool Abstract Class
// ============================================================================

/**
 * Abstract base class for all IOE tools.
 *
 * Subclasses implement `executeImpl` and `renderResult`; the base class
 * handles the cross-cutting concerns:
 * - Input validation gate (calls `validate` before `executeImpl`)
 * - Permission level check against `ToolContext`
 * - Concurrency guard (prevents re-entrant execution on the same instance)
 * - Automatic execution timing
 * - Token counting on the serialised output
 * - Budget enforcement with optional overflow-to-file
 * - Four-level render surface (use / progress / result / error)
 */
export abstract class BaseTool<TInput = unknown, TOutput = unknown, TProgress = unknown>
  implements Tool<TInput, TOutput, TProgress>
{
  abstract readonly name: string;
  abstract readonly category: ToolCategory;
  abstract readonly description: string;
  abstract readonly inputSchema: Record<string, unknown>;
  abstract readonly isReadOnly: boolean;
  abstract readonly requiredPermission: PermissionLevel;

  /** Override in subclasses that should be hidden until searched. */
  readonly isDeferred: boolean = false;

  /** Override to restrict this tool to specific network domains. */
  readonly domainAffinity: DomainType[] = [];

  /** Character budget for this tool's output. Override for tool-specific limits. */
  protected outputBudget: number = DEFAULT_QUERY_OUTPUT_BUDGET;

  /** Whether overflow content should be persisted to a temp file. */
  protected overflowToFile: boolean = true;

  private _executing = false;

  // --------------------------------------------------------------------------
  // Public interface (implements Tool<TInput, TOutput, TProgress>)
  // --------------------------------------------------------------------------

  /**
   * Validate the provided input against the tool's expected schema.
   * Subclasses may call `super.validate(input)` and add additional checks.
   */
  validate(input: TInput): ValidationResult {
    if (input === null || input === undefined) {
      return { valid: false, errors: ['Input must not be null or undefined'] };
    }
    if (typeof input !== 'object') {
      return { valid: false, errors: [`Input must be an object, received: ${typeof input}`] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Execute the tool with full cross-cutting concern enforcement.
   *
   * Execution pipeline:
   * 1. Concurrency guard
   * 2. Input validation
   * 3. Permission check
   * 4. `executeImpl` (subclass logic)
   * 5. Output budget enforcement + token count
   * 6. Timing
   */
  async execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>> {
    // 1. Concurrency guard
    if (this._executing) {
      return this._errorResult(
        'Concurrent execution detected. This tool is already running.',
        0,
      );
    }

    this._executing = true;
    const startTime = Date.now();

    try {
      // 2. Input validation
      const validation = this.validate(input);
      if (!validation.valid) {
        return this._errorResult(
          `Validation failed: ${validation.errors.join('; ')}`,
          Date.now() - startTime,
        );
      }

      // 3. Permission check
      const permErr = this._checkPermission(context.permissionLevel);
      if (permErr) {
        return this._errorResult(permErr, Date.now() - startTime);
      }

      // 4. Core execution
      const rawResult = await this.executeImpl(input, context);
      const executionTimeMs = Date.now() - startTime;

      if (!rawResult.success) {
        return { ...rawResult, executionTimeMs };
      }

      // 5. Budget enforcement on serialised output
      const serialised = this.serialiseOutput(rawResult.data);
      const { enforced, truncated, overflowPath: _overflow } =
        enforceBudget(serialised, this.outputBudget, this.name, this.overflowToFile);

      const tokenCount = estimateTokenCount(enforced);

      return {
        success: true,
        data: this.deserialiseOutput(enforced) as TOutput,
        tokenCount,
        truncated,
        executionTimeMs,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return this._errorResult(`Unhandled error in ${this.name}: ${message}`, Date.now() - startTime);
    } finally {
      this._executing = false;
    }
  }

  /**
   * Optional progress callback. Subclasses may emit progress events during long operations.
   */
  onProgress?(progress: TProgress): void;

  /**
   * Four-level render surface used by the IOE CLI/UI renderer.
   *
   * Override `renderResult` and optionally `renderError` in subclasses for
   * richer output formatting. The `use` and `progress` surfaces have sensible
   * defaults here.
   */
  render(result: ToolResult<TOutput>): ToolRenderOutput {
    const use = `[${this.category.toUpperCase()}] ${this.name}`;
    const progress = result.success
      ? `Completed in ${result.executionTimeMs}ms (${result.tokenCount} tokens)`
      : undefined;

    if (!result.success) {
      return {
        use,
        progress,
        result: '',
        error: result.error ?? 'Unknown error',
      };
    }

    return {
      use,
      progress,
      result: this.renderResult(result.data),
    };
  }

  // --------------------------------------------------------------------------
  // Abstract methods — subclasses must implement these
  // --------------------------------------------------------------------------

  /**
   * Core execution logic. The base class has already validated input and
   * checked permissions before calling this method.
   *
   * Return a `ToolResult` with `success: false` and an `error` message to
   * signal a domain-level failure (distinct from thrown exceptions).
   */
  protected abstract executeImpl(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;

  /**
   * Produce a human-readable string for the result data.
   * Used by the default `render` implementation.
   */
  protected abstract renderResult(data: TOutput | undefined): string;

  // --------------------------------------------------------------------------
  // Protected helpers
  // --------------------------------------------------------------------------

  /**
   * Serialise tool output to a string for budget enforcement.
   * Override for custom serialisation (e.g., pretty-printed JSON, table format).
   */
  protected serialiseOutput(data: TOutput | undefined): string {
    if (data === undefined || data === null) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  }

  /**
   * Deserialise the budget-enforced string back to TOutput.
   * The default implementation returns the string cast to TOutput.
   * Override when TOutput is not a string.
   */
  protected deserialiseOutput(enforced: string): unknown {
    return enforced as unknown;
  }

  /** Build a failed ToolResult with zero token count */
  protected _errorResult(error: string, executionTimeMs: number): ToolResult<TOutput> {
    return {
      success: false,
      error,
      tokenCount: estimateTokenCount(error),
      truncated: false,
      executionTimeMs,
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _checkPermission(contextLevel: PermissionLevel): string | null {
    const hierarchy: PermissionLevel[] = [
      'L1_readonly',
      'L2_low_risk',
      'L3_medium',
      'L4_high_risk',
      'L5_emergency',
    ];
    const contextIdx = hierarchy.indexOf(contextLevel);
    const requiredIdx = hierarchy.indexOf(this.requiredPermission);
    if (contextIdx < requiredIdx) {
      return (
        `Insufficient permissions: tool '${this.name}' requires ${this.requiredPermission}, ` +
        `but agent context provides ${contextLevel}.`
      );
    }
    return null;
  }
}

// ============================================================================
// ToolSearchTool — meta-tool for deferred tool discovery
// ============================================================================

/** Input schema for ToolSearchTool */
export interface ToolSearchInput {
  /** Free-text search query matched against name, description, and tags */
  query: string;
  /** Optional: restrict search to a specific tool category */
  category?: ToolCategory;
  /** Optional: restrict search to tools with affinity for a specific domain */
  domain?: DomainType;
  /** Maximum number of results to return (default: 10) */
  maxResults?: number;
}

/** Single result item returned by ToolSearchTool */
export interface ToolSearchResultItem {
  name: string;
  category: ToolCategory;
  description: string;
  isDeferred: boolean;
  domainAffinity: DomainType[];
  requiredPermission: PermissionLevel;
  searchTags: string[];
}

/** Output of ToolSearchTool */
export interface ToolSearchOutput {
  query: string;
  totalMatches: number;
  results: ToolSearchResultItem[];
  /** Names of deferred tools that were unlocked as a result of this search */
  unlockedTools: string[];
}

/**
 * ToolSearchTool — the meta-tool for discovering and unlocking deferred tools.
 *
 * Inspired by Claude Code's ToolSearchTool, this tool allows the IOE agent to
 * discover specialised tools on demand without pre-loading all tool schemas
 * into the context window. When a deferred tool is surfaced by this tool it is
 * automatically unlocked and becomes callable for the remainder of the session.
 *
 * Usage pattern:
 *   1. Agent encounters a task requiring an unfamiliar capability
 *   2. Agent calls ToolSearchTool with a descriptive query
 *   3. Matching tools (including deferred ones) are returned with descriptions
 *   4. Deferred matches are automatically unlocked
 *   5. Agent can now call the previously-hidden tools directly
 */
export class ToolSearchTool extends BaseTool<ToolSearchInput, ToolSearchOutput> {
  readonly name = 'ToolSearch';
  readonly category: ToolCategory = 'orchestrate';
  readonly description =
    'Search and discover available tools by keyword, category, or domain. ' +
    'Deferred tools hidden from the default tool list are surfaced and unlocked by this tool. ' +
    'Use this when you need a capability that is not in your current tool list.';
  readonly inputSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Free-text search query' },
      category: {
        type: 'string',
        enum: ['read', 'write', 'execute', 'connect', 'analyze', 'simulate', 'orchestrate'],
        description: 'Optional category filter',
      },
      domain: {
        type: 'string',
        enum: ['ran', 'transport', 'core', 'fixed', 'cloud', 'cross_domain'],
        description: 'Optional domain affinity filter',
      },
      maxResults: { type: 'number', description: 'Maximum results (default: 10)' },
    },
    required: ['query'],
  };
  readonly isReadOnly = true;
  readonly isDeferred = false; // ToolSearch is always available
  readonly requiredPermission: PermissionLevel = 'L1_readonly';

  private readonly registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    super();
    this.registry = registry;
  }

  validate(input: ToolSearchInput): ValidationResult {
    const base = super.validate(input);
    if (!base.valid) return base;
    if (!input.query || typeof input.query !== 'string' || input.query.trim() === '') {
      return { valid: false, errors: ['query must be a non-empty string'] };
    }
    return { valid: true, errors: [] };
  }

  protected async executeImpl(
    input: ToolSearchInput,
    _context: ToolContext,
  ): Promise<ToolResult<ToolSearchOutput>> {
    const maxResults = input.maxResults ?? 10;
    const matches = this.registry.search(input.query, input.category, input.domain);
    const limited = matches.slice(0, maxResults);

    const unlockedTools: string[] = [];
    for (const entry of limited) {
      if (entry.isDeferred) {
        const unlocked = this.registry.unlockDeferred(entry.tool.name);
        if (unlocked) unlockedTools.push(entry.tool.name);
      }
    }

    const output: ToolSearchOutput = {
      query: input.query,
      totalMatches: matches.length,
      results: limited.map((entry) => ({
        name: entry.tool.name,
        category: entry.tool.category,
        description: entry.tool.description,
        isDeferred: entry.isDeferred,
        domainAffinity: entry.domainAffinity,
        requiredPermission: entry.tool.requiredPermission,
        searchTags: entry.searchTags,
      })),
      unlockedTools,
    };

    const serialised = JSON.stringify(output, null, 2);
    return {
      success: true,
      data: output,
      tokenCount: estimateTokenCount(serialised),
      truncated: false,
      executionTimeMs: 0, // filled in by base class
    };
  }

  protected renderResult(data: ToolSearchOutput | undefined): string {
    if (!data) return 'No results';
    const lines: string[] = [
      `Search: "${data.query}" — ${data.totalMatches} match(es), showing ${data.results.length}`,
    ];
    if (data.unlockedTools.length > 0) {
      lines.push(`Unlocked deferred tools: ${data.unlockedTools.join(', ')}`);
    }
    lines.push('');
    for (const r of data.results) {
      lines.push(
        `  [${r.category}] ${r.name}${r.isDeferred ? ' (deferred→unlocked)' : ''}`,
        `    ${r.description}`,
        `    Permission: ${r.requiredPermission} | Domains: ${r.domainAffinity.join(', ') || 'any'}`,
        '',
      );
    }
    return lines.join('\n');
  }
}

// ============================================================================
// Register ToolSearchTool on the global registry
// ============================================================================

globalRegistry.register(new ToolSearchTool(globalRegistry), {
  searchTags: ['discover', 'find', 'search', 'tools', 'deferred', 'hidden', 'unlock', 'meta'],
  isDeferred: false,
  outputBudget: DEFAULT_QUERY_OUTPUT_BUDGET,
});
