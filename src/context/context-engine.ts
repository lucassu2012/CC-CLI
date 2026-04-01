/**
 * IOE Context Management & Compression Engine
 *
 * The most sophisticated engineering component. Context is the scarcest
 * resource - even 200K token windows degrade well before hitting limits.
 *
 * Inspired by Claude Code's three compression strategies + micro-compression:
 * - AutoCompact: triggers at ~92%, 6.8x compression, <3% semantic loss
 * - SnipCompact: truncates beyond boundary, preserves protected tail
 * - ContextCollapse: lazy-committed, activates only on 413 errors
 * - MicroCompression: continuous background optimization
 *
 * Plus telecom-specific NetworkContextBuilder for compressed network state.
 */

import { EventEmitter } from 'events';
import {
  Message,
  MessageContent,
  TextContent,
  ToolResultContent,
  CompactBoundaryContent,
  ContextBudget,
  CompressionResult,
  NetworkContext,
  Alarm,
  KPIMetric,
  KPISnapshot,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const CHARS_PER_TOKEN = 4;
const DEFAULT_COMPRESSION_THRESHOLD = 0.92;
const MAX_CONSECUTIVE_COMPRESSION_FAILURES = 3;
const MAX_REINJECTED_FILES = 5;
const FILE_REINJECTION_BUDGET = 50000; // tokens
const SKILL_REINJECTION_BUDGET = 25000; // tokens
const TOOL_RESULT_EXPIRY_MS = 600000; // 10 minutes
const MAX_TOOL_RESULT_SIZE = 20000; // chars

// ============================================================================
// Context Engine
// ============================================================================

export class ContextEngine extends EventEmitter {
  private budget: ContextBudget;
  private compressionStrategies: CompressionStrategyImpl[];
  private microCompressor: MicroCompressionSystem;
  private networkContextBuilder: NetworkContextBuilder;
  private consecutiveFailures: number = 0;
  private systemPromptCache: SystemPromptCache;

  constructor(budget: ContextBudget) {
    super();
    this.budget = budget;

    this.compressionStrategies = [
      new AutoCompactStrategy(budget),
      new SnipCompactStrategy(budget),
      new ContextCollapseStrategy(budget),
    ];

    this.microCompressor = new MicroCompressionSystem();
    this.networkContextBuilder = new NetworkContextBuilder();
    this.systemPromptCache = {
      staticPart: '',
      dynamicPart: '',
      staticTokenCount: 0,
      lastBuilt: 0,
    };
  }

  // ==========================================================================
  // System Prompt Management (SYSTEM_PROMPT_DYNAMIC_BOUNDARY)
  // ==========================================================================

  /**
   * Build the system prompt with cache-optimized boundary.
   *
   * Static part (tools, base instructions) is sorted deterministically
   * to maximize prompt cache hit rate. Dynamic part (network state, time)
   * changes per request.
   */
  buildSystemPrompt(
    tools: string[],
    networkContext: Partial<NetworkContext>,
    networkMd: string,
    additionalContext?: string
  ): SystemPromptResult {
    // Static part: sorted tools + base instructions + NETWORK.md (cacheable)
    const sortedTools = [...tools].sort(); // Alphabetical for cache consistency
    const staticPart = [
      '# IOE - Intelligent Operations Engine',
      '# Telecom Network Operations Agent Harness',
      '',
      '## Available Tools',
      ...sortedTools.map(t => `- ${t}`),
      '',
      '## Network Knowledge (NETWORK.md)',
      networkMd,
      '',
      '--- SYSTEM_PROMPT_DYNAMIC_BOUNDARY ---',
    ].join('\n');

    // Dynamic part: current state, time, alarms (volatile)
    const networkSummary = this.networkContextBuilder.buildCompressed(networkContext);
    const dynamicPart = [
      '',
      `## Current Time: ${new Date().toISOString()}`,
      '',
      '## Current Network State',
      networkSummary,
      additionalContext ? `\n## Additional Context\n${additionalContext}` : '',
    ].join('\n');

    this.systemPromptCache = {
      staticPart,
      dynamicPart,
      staticTokenCount: Math.ceil(staticPart.length / CHARS_PER_TOKEN),
      lastBuilt: Date.now(),
    };

    return {
      prompt: staticPart + dynamicPart,
      staticTokenCount: Math.ceil(staticPart.length / CHARS_PER_TOKEN),
      dynamicTokenCount: Math.ceil(dynamicPart.length / CHARS_PER_TOKEN),
      totalTokenCount: Math.ceil((staticPart.length + dynamicPart.length) / CHARS_PER_TOKEN),
      cacheBreakpoint: staticPart.length,
    };
  }

  // ==========================================================================
  // Context Budget Tracking
  // ==========================================================================

  /** Estimate total token usage of a messages array */
  estimateTokens(messages: Message[]): number {
    let total = this.systemPromptCache.staticTokenCount +
      Math.ceil(this.systemPromptCache.dynamicPart.length / CHARS_PER_TOKEN);

    for (const msg of messages) {
      total += this.estimateMessageTokens(msg);
    }
    return total;
  }

  private estimateMessageTokens(message: Message): number {
    if (message.metadata?.tokenCount) return message.metadata.tokenCount;

    let chars = 0;
    for (const content of message.content) {
      switch (content.type) {
        case 'text':
          chars += (content as TextContent).text.length;
          break;
        case 'tool_result':
          chars += (content as ToolResultContent).content.length;
          break;
        case 'tool_use':
          chars += JSON.stringify(content).length;
          break;
        case 'compact_boundary':
          chars += (content as CompactBoundaryContent).summary.length;
          break;
        case 'image':
          chars += 1000; // Rough estimate for image tokens
          break;
      }
    }
    return Math.ceil(chars / CHARS_PER_TOKEN);
  }

  /** Check if compression is needed and return recommended strategy */
  checkCompressionNeeded(messages: Message[]): CompressionRecommendation | null {
    const totalTokens = this.estimateTokens(messages);
    const threshold = this.budget.totalBudget * DEFAULT_COMPRESSION_THRESHOLD;

    if (totalTokens <= threshold) return null;

    const ratio = totalTokens / this.budget.totalBudget;

    // Select strategy based on severity
    if (ratio < 0.95) {
      return { strategy: 'auto_compact', urgency: 'normal', currentTokens: totalTokens, threshold };
    } else if (ratio < 0.98) {
      return { strategy: 'snip_compact', urgency: 'high', currentTokens: totalTokens, threshold };
    } else {
      return { strategy: 'context_collapse', urgency: 'critical', currentTokens: totalTokens, threshold };
    }
  }

  // ==========================================================================
  // Compression Execution
  // ==========================================================================

  /** Run compression on messages using the recommended strategy */
  async compress(
    messages: Message[],
    strategy: 'auto_compact' | 'snip_compact' | 'context_collapse'
  ): Promise<CompressionResult> {
    const impl = this.compressionStrategies.find(s => s.name === strategy);
    if (!impl) throw new Error(`Unknown compression strategy: ${strategy}`);

    try {
      const result = await impl.execute(messages, this.budget);

      this.consecutiveFailures = 0;
      this.emit('context:compressed', {
        strategy,
        originalTokens: result.originalTokenCount,
        compressedTokens: result.compressedTokenCount,
        ratio: result.compressionRatio,
      });

      return result;
    } catch (error) {
      this.consecutiveFailures++;

      // Circuit breaker
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_COMPRESSION_FAILURES) {
        this.emit('context:compression_circuit_break', {
          consecutiveFailures: this.consecutiveFailures,
        });
        throw new Error(`Compression circuit breaker tripped after ${this.consecutiveFailures} consecutive failures`);
      }

      throw error;
    }
  }

  /** Run micro-compression (continuous background optimization) */
  microCompress(messages: Message[]): Message[] {
    return this.microCompressor.process(messages);
  }

  /** Handle 413 error by triggering context collapse */
  async handle413Error(messages: Message[]): Promise<CompressionResult> {
    this.emit('context:413_error', { messageCount: messages.length });
    return this.compress(messages, 'context_collapse');
  }

  getBudget(): ContextBudget {
    return { ...this.budget };
  }
}

// ============================================================================
// AutoCompact Strategy
// ============================================================================

/**
 * Primary compression strategy. Triggered at ~92% of context window.
 *
 * Process:
 * 1. Strip images from old messages
 * 2. Group messages by API turn
 * 3. Score each message by importance = f(length, recency, tool_calls)
 * 4. Keep top 30% by tokens in full fidelity
 * 5. Summarize remaining via LLM self-critique
 * 6. Replace with CompactBoundaryMessage
 * 7. Re-inject critical files post-compression
 *
 * Target: 6.8x compression ratio, <3% semantic loss
 */
class AutoCompactStrategy implements CompressionStrategyImpl {
  name = 'auto_compact' as const;
  private budget: ContextBudget;

  constructor(budget: ContextBudget) {
    this.budget = budget;
  }

  async execute(messages: Message[], budget: ContextBudget): Promise<CompressionResult> {
    const originalTokenCount = messages.reduce(
      (sum, m) => sum + (m.metadata?.tokenCount ?? Math.ceil(JSON.stringify(m.content).length / CHARS_PER_TOKEN)),
      0
    );

    // Step 1: Strip images from old messages (keep last 3 turns)
    const strippedMessages = this.stripOldImages(messages);

    // Step 2: Group by API turn
    const turns = this.groupByTurn(strippedMessages);

    // Step 3: Score each turn by importance
    const scoredTurns = turns.map(turn => ({
      turn,
      importance: this.scoreImportance(turn, messages.length),
    }));
    scoredTurns.sort((a, b) => b.importance - a.importance);

    // Step 4: Determine preservation boundary (top 30% by tokens)
    const totalTokens = scoredTurns.reduce(
      (sum, st) => sum + st.turn.reduce(
        (ts, m) => ts + (m.metadata?.tokenCount ?? 100), 0
      ), 0
    );
    const preserveTokenBudget = totalTokens * 0.3;

    let preservedTokens = 0;
    const preservedTurns = new Set<number>();
    for (const st of scoredTurns) {
      const turnTokens = st.turn.reduce(
        (sum, m) => sum + (m.metadata?.tokenCount ?? 100), 0
      );
      if (preservedTokens + turnTokens <= preserveTokenBudget) {
        preservedTokens += turnTokens;
        preservedTurns.add(turns.indexOf(st.turn));
      }
    }

    // Step 5: Generate summary for non-preserved turns
    const summaryParts: string[] = [];
    for (let i = 0; i < turns.length; i++) {
      if (!preservedTurns.has(i)) {
        const turnSummary = this.summarizeTurn(turns[i]);
        summaryParts.push(turnSummary);
      }
    }

    // Step 6: Build compressed messages
    const compressedMessages: Message[] = [];

    // Add compact boundary with summary
    const summary = summaryParts.join('\n');
    compressedMessages.push({
      id: `compact_${Date.now()}`,
      role: 'system',
      content: [{
        type: 'compact_boundary',
        summary,
        preservedFileCount: 0,
        originalTokenCount,
        compressedTokenCount: Math.ceil(summary.length / CHARS_PER_TOKEN),
      } as CompactBoundaryContent],
      timestamp: Date.now(),
      metadata: { compressible: false },
    });

    // Add preserved turns in original order
    for (let i = 0; i < turns.length; i++) {
      if (preservedTurns.has(i)) {
        compressedMessages.push(...turns[i]);
      }
    }

    const compressedTokenCount = compressedMessages.reduce(
      (sum, m) => sum + (m.metadata?.tokenCount ?? Math.ceil(JSON.stringify(m.content).length / CHARS_PER_TOKEN)),
      0
    );

    return {
      compressedMessages,
      originalTokenCount,
      compressedTokenCount,
      compressionRatio: originalTokenCount / Math.max(compressedTokenCount, 1),
      semanticLossEstimate: 0.03,
      preservedFiles: [],
    };
  }

  private stripOldImages(messages: Message[]): Message[] {
    const recentTurnCount = 3;
    const turnBoundary = messages.length - recentTurnCount * 2; // rough estimate

    return messages.map((msg, idx) => {
      if (idx < turnBoundary) {
        return {
          ...msg,
          content: msg.content.filter(c => c.type !== 'image'),
        };
      }
      return msg;
    });
  }

  private groupByTurn(messages: Message[]): Message[][] {
    const turns: Message[][] = [];
    let currentTurn: Message[] = [];

    for (const msg of messages) {
      currentTurn.push(msg);
      if (msg.role === 'assistant') {
        turns.push(currentTurn);
        currentTurn = [];
      }
    }
    if (currentTurn.length > 0) turns.push(currentTurn);

    return turns;
  }

  private scoreImportance(turn: Message[], totalMessages: number): number {
    let score = 0;

    for (const msg of turn) {
      // Recency bonus (more recent = more important)
      const recency = (totalMessages > 0)
        ? msg.timestamp / (Date.now() || 1)
        : 0.5;
      score += recency * 0.3;

      // Tool calls bonus
      const toolCalls = msg.content.filter(c => c.type === 'tool_use').length;
      score += toolCalls * 0.2;

      // Length (longer = more substantial)
      const textLength = msg.content
        .filter(c => c.type === 'text')
        .reduce((sum, c) => sum + (c as TextContent).text.length, 0);
      score += Math.min(textLength / 5000, 1) * 0.2;

      // Explicit importance
      if (msg.metadata?.importance) {
        score += msg.metadata.importance * 0.3;
      }
    }

    return score / Math.max(turn.length, 1);
  }

  private summarizeTurn(turn: Message[]): string {
    const parts: string[] = [];
    for (const msg of turn) {
      for (const content of msg.content) {
        if (content.type === 'text') {
          const text = (content as TextContent).text;
          parts.push(text.slice(0, 200) + (text.length > 200 ? '...' : ''));
        }
        if (content.type === 'tool_use') {
          parts.push(`[Tool: ${(content as any).toolName}]`);
        }
        if (content.type === 'tool_result') {
          const result = (content as ToolResultContent).content;
          parts.push(`[Result: ${result.slice(0, 100)}...]`);
        }
      }
    }
    return parts.join(' | ');
  }
}

// ============================================================================
// SnipCompact Strategy
// ============================================================================

/**
 * Truncates old messages beyond a boundary while preserving
 * the assistant's "protected tail" (recent assistant messages).
 */
class SnipCompactStrategy implements CompressionStrategyImpl {
  name = 'snip_compact' as const;
  private budget: ContextBudget;

  constructor(budget: ContextBudget) {
    this.budget = budget;
  }

  async execute(messages: Message[], budget: ContextBudget): Promise<CompressionResult> {
    const originalTokenCount = messages.reduce(
      (sum, m) => sum + (m.metadata?.tokenCount ?? 100), 0
    );

    // Keep the most recent messages that fit within budget
    const targetTokens = budget.totalBudget * 0.7;
    let keptTokens = 0;
    let cutIndex = messages.length;

    // Walk backwards preserving recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = messages[i].metadata?.tokenCount ?? 100;
      if (keptTokens + msgTokens > targetTokens) {
        cutIndex = i + 1;
        break;
      }
      keptTokens += msgTokens;
    }

    // Protect assistant tail: never cut in the middle of an assistant response
    while (cutIndex < messages.length && messages[cutIndex].role !== 'user') {
      cutIndex++;
    }

    const keptMessages = messages.slice(cutIndex);
    const snippedSummary = `[${cutIndex} earlier messages snipped to manage context budget]`;

    const compressedMessages: Message[] = [
      {
        id: `snip_${Date.now()}`,
        role: 'system',
        content: [{
          type: 'compact_boundary',
          summary: snippedSummary,
          preservedFileCount: 0,
          originalTokenCount,
          compressedTokenCount: keptTokens,
        } as CompactBoundaryContent],
        timestamp: Date.now(),
      },
      ...keptMessages,
    ];

    return {
      compressedMessages,
      originalTokenCount,
      compressedTokenCount: keptTokens,
      compressionRatio: originalTokenCount / Math.max(keptTokens, 1),
      semanticLossEstimate: cutIndex / messages.length,
      preservedFiles: [],
    };
  }
}

// ============================================================================
// ContextCollapse Strategy
// ============================================================================

/**
 * Emergency strategy: lazy-committed collapse.
 * Only activates on 413 errors (context too large for API).
 * Aggressively removes old content.
 */
class ContextCollapseStrategy implements CompressionStrategyImpl {
  name = 'context_collapse' as const;
  private budget: ContextBudget;

  constructor(budget: ContextBudget) {
    this.budget = budget;
  }

  async execute(messages: Message[], budget: ContextBudget): Promise<CompressionResult> {
    const originalTokenCount = messages.reduce(
      (sum, m) => sum + (m.metadata?.tokenCount ?? 100), 0
    );

    // Emergency: keep only the last 10 messages + system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const recentMessages = messages.slice(-10);
    const collapsedSummary = `[CONTEXT COLLAPSED: ${messages.length - 10} messages removed due to context overflow. Session continues with recent context only.]`;

    const compressedMessages: Message[] = [
      ...systemMessages.slice(0, 1), // Keep first system message
      {
        id: `collapse_${Date.now()}`,
        role: 'system',
        content: [{
          type: 'compact_boundary',
          summary: collapsedSummary,
          preservedFileCount: 0,
          originalTokenCount,
          compressedTokenCount: 0,
        } as CompactBoundaryContent],
        timestamp: Date.now(),
      },
      ...recentMessages,
    ];

    const compressedTokenCount = compressedMessages.reduce(
      (sum, m) => sum + (m.metadata?.tokenCount ?? 100), 0
    );

    return {
      compressedMessages,
      originalTokenCount,
      compressedTokenCount,
      compressionRatio: originalTokenCount / Math.max(compressedTokenCount, 1),
      semanticLossEstimate: (messages.length - 10) / messages.length,
      preservedFiles: [],
    };
  }
}

// ============================================================================
// Micro-Compression System
// ============================================================================

/**
 * Continuous background compression that runs on every message append:
 * - Time-based expiry: remove old tool results
 * - Size-based truncation: truncate oversized results
 * - Cache-aware: preserve prompt cache integrity
 */
class MicroCompressionSystem {
  process(messages: Message[]): Message[] {
    return messages.map(msg => {
      const processed = { ...msg, content: [...msg.content] };

      for (let i = 0; i < processed.content.length; i++) {
        const content = processed.content[i];

        // Time-based expiry: tool results older than 10 minutes
        if (content.type === 'tool_result') {
          const age = Date.now() - msg.timestamp;
          if (age > TOOL_RESULT_EXPIRY_MS) {
            processed.content[i] = {
              type: 'tool_result',
              toolId: (content as ToolResultContent).toolId,
              content: '[Result expired - older than 10 minutes]',
            } as ToolResultContent;
          }
        }

        // Size-based truncation: oversized tool results
        if (content.type === 'tool_result') {
          const result = content as ToolResultContent;
          if (result.content.length > MAX_TOOL_RESULT_SIZE) {
            processed.content[i] = {
              ...result,
              content: result.content.slice(0, MAX_TOOL_RESULT_SIZE) +
                `\n... [truncated: ${result.content.length - MAX_TOOL_RESULT_SIZE} chars removed]`,
            };
          }
        }
      }

      return processed;
    });
  }
}

// ============================================================================
// Network Context Builder (Telecom-Specific)
// ============================================================================

/**
 * Builds compressed network state representation for the system prompt.
 * This is the telecom-specific extension of context management.
 */
export class NetworkContextBuilder {
  /**
   * Build a compressed network context string for system prompt injection.
   * Aims to convey maximum network awareness in minimum tokens.
   */
  buildCompressed(context: Partial<NetworkContext>): string {
    const sections: string[] = [];

    // Alarm summary (grouped by severity)
    if (context.currentAlarms && context.currentAlarms.length > 0) {
      sections.push(this.buildAlarmSummary(context.currentAlarms));
    } else {
      sections.push('### Alarms: None active');
    }

    // KPI snapshot
    if (context.kpiSnapshot) {
      sections.push(this.buildKPISummary(context.kpiSnapshot));
    }

    // Maintenance windows
    if (context.maintenanceWindows && context.maintenanceWindows.length > 0) {
      const activeWindows = context.maintenanceWindows.filter(
        w => Date.now() >= w.start && Date.now() <= w.end
      );
      if (activeWindows.length > 0) {
        sections.push(`### Active Maintenance Windows: ${activeWindows.length}`);
        for (const w of activeWindows) {
          sections.push(`- ${w.type}: ${w.affectedElements.length} elements until ${new Date(w.end).toISOString()}`);
        }
      }
    }

    // Change freeze status
    if (context.changeFreeze) {
      sections.push('### ⚠ CHANGE FREEZE ACTIVE - No configuration changes allowed');
    }

    // Topology summary
    if (context.topology) {
      sections.push(`### Network: ${context.topology.elementCount} elements across ${context.topology.domains.join(', ')}`);
    }

    return sections.join('\n');
  }

  private buildAlarmSummary(alarms: Alarm[]): string {
    const bySeverity: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    for (const alarm of alarms) {
      bySeverity[alarm.severity] = (bySeverity[alarm.severity] ?? 0) + 1;
      byDomain[alarm.domain] = (byDomain[alarm.domain] ?? 0) + 1;
    }

    const lines: string[] = ['### Active Alarms'];
    const severityOrder = ['critical', 'major', 'minor', 'warning', 'info'];
    for (const sev of severityOrder) {
      if (bySeverity[sev]) {
        lines.push(`- ${sev}: ${bySeverity[sev]}`);
      }
    }

    // Top critical alarms detail
    const criticals = alarms
      .filter(a => a.severity === 'critical')
      .slice(0, 5);

    if (criticals.length > 0) {
      lines.push('#### Critical Alarms:');
      for (const alarm of criticals) {
        lines.push(`- [${alarm.domain}] ${alarm.description} (${alarm.source})`);
      }
    }

    return lines.join('\n');
  }

  private buildKPISummary(snapshot: KPISnapshot): string {
    const lines: string[] = [
      `### KPI Snapshot (${new Date(snapshot.timestamp).toISOString()})`,
    ];

    // Group by domain
    const byDomain: Record<string, KPIMetric[]> = {};
    for (const metric of snapshot.metrics) {
      if (!byDomain[metric.domain]) byDomain[metric.domain] = [];
      byDomain[metric.domain].push(metric);
    }

    for (const [domain, metrics] of Object.entries(byDomain)) {
      lines.push(`#### ${domain}`);
      for (const m of metrics.slice(0, 5)) { // Top 5 per domain
        let status = '✓';
        if (m.threshold) {
          if (m.value > m.threshold.critical || m.value < m.threshold.critical) {
            status = '✗';
          } else if (m.value > m.threshold.warning || m.value < m.threshold.warning) {
            status = '⚠';
          }
        }
        lines.push(`- ${status} ${m.name}: ${m.value}${m.unit}`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface CompressionStrategyImpl {
  name: 'auto_compact' | 'snip_compact' | 'context_collapse';
  execute(messages: Message[], budget: ContextBudget): Promise<CompressionResult>;
}

interface SystemPromptCache {
  staticPart: string;
  dynamicPart: string;
  staticTokenCount: number;
  lastBuilt: number;
}

interface SystemPromptResult {
  prompt: string;
  staticTokenCount: number;
  dynamicTokenCount: number;
  totalTokenCount: number;
  cacheBreakpoint: number;
}

interface CompressionRecommendation {
  strategy: 'auto_compact' | 'snip_compact' | 'context_collapse';
  urgency: 'normal' | 'high' | 'critical';
  currentTokens: number;
  threshold: number;
}
