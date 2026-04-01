/**
 * IOE Knowledge Base
 *
 * Auto-learning knowledge system that automatically summarizes and updates
 * after every task closure. Implements the principle that "every resolved
 * incident makes the system smarter."
 *
 * Inspired by Claude Code's 6-layer memory with Dream consolidation,
 * but specialized for telecom operational knowledge:
 * - Incident patterns and root causes
 * - Successful resolution procedures
 * - Optimization best practices
 * - Seasonal traffic patterns
 * - Regulatory compliance requirements
 */

import { EventEmitter } from 'events';
import {
  KnowledgeEntry,
  KnowledgeUpdate,
  DomainType,
  TaskResult,
} from '../types';

// ============================================================================
// Knowledge Base
// ============================================================================

export class KnowledgeBase extends EventEmitter {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private indices: KnowledgeIndices;
  private config: KnowledgeConfig;

  constructor(config?: Partial<KnowledgeConfig>) {
    super();
    this.config = {
      maxEntries: 100000,
      similarityThreshold: 0.8,
      autoMerge: true,
      retentionDays: 365,
      minConfidence: 0.5,
      ...config,
    };
    this.indices = {
      byDomain: new Map(),
      byType: new Map(),
      byTag: new Map(),
      fullText: [],
    };
  }

  // ==========================================================================
  // Knowledge CRUD
  // ==========================================================================

  /** Add a new knowledge entry */
  add(entry: KnowledgeEntry): void {
    // Check for duplicates/similar entries
    if (this.config.autoMerge) {
      const similar = this.findSimilar(entry);
      if (similar) {
        this.merge(similar.id, entry);
        return;
      }
    }

    this.entries.set(entry.id, entry);
    this.indexEntry(entry);
    this.emit('knowledge:added', entry);

    // Enforce max entries
    if (this.entries.size > this.config.maxEntries) {
      this.evictLeastUsed();
    }
  }

  /** Get a knowledge entry by ID */
  get(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  /** Update an existing entry */
  update(id: string, updates: Partial<KnowledgeEntry>): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    Object.assign(entry, updates, { updatedAt: Date.now() });
    this.reindexEntry(entry);
    this.emit('knowledge:updated', entry);
  }

  /** Remove an entry */
  remove(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      this.deindexEntry(entry);
      this.entries.delete(id);
      this.emit('knowledge:removed', id);
    }
  }

  // ==========================================================================
  // Search & Retrieval
  // ==========================================================================

  /** Search by domain */
  searchByDomain(domain: DomainType): KnowledgeEntry[] {
    const ids = this.indices.byDomain.get(domain) ?? new Set();
    return Array.from(ids)
      .map(id => this.entries.get(id))
      .filter((e): e is KnowledgeEntry => !!e)
      .sort((a, b) => b.importance - a.importance);
  }

  /** Search by type */
  searchByType(type: KnowledgeEntry['type']): KnowledgeEntry[] {
    const ids = this.indices.byType.get(type) ?? new Set();
    return Array.from(ids)
      .map(id => this.entries.get(id))
      .filter((e): e is KnowledgeEntry => !!e);
  }

  /** Search by tags */
  searchByTags(tags: string[]): KnowledgeEntry[] {
    const matchingSets = tags
      .map(tag => this.indices.byTag.get(tag) ?? new Set<string>());

    if (matchingSets.length === 0) return [];

    // Intersection of all tag sets
    const intersection = matchingSets.reduce((acc, set) => {
      return new Set(Array.from(acc).filter(id => set.has(id)));
    });

    return Array.from(intersection)
      .map(id => this.entries.get(id))
      .filter((e): e is KnowledgeEntry => !!e);
  }

  /** Full-text search with relevance scoring */
  search(query: string, options?: SearchOptions): KnowledgeSearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: KnowledgeSearchResult[] = [];

    for (const entry of this.entries.values()) {
      // Apply filters
      if (options?.domain && !entry.domain.includes(options.domain)) continue;
      if (options?.type && entry.type !== options.type) continue;
      if (options?.minConfidence && entry.confidence < options.minConfidence) continue;

      // Simple relevance scoring
      const text = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) score += 1;
      }

      if (score > 0) {
        // Boost by importance and recency
        const recencyBoost = 1 / (1 + (Date.now() - entry.updatedAt) / 86400000);
        const importanceBoost = entry.importance;
        const usageBoost = Math.log2(entry.usageCount + 1) / 10;
        const finalScore = score * (1 + recencyBoost + importanceBoost + usageBoost);

        results.push({ entry, relevanceScore: finalScore });
      }
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, options?.limit ?? 20);
  }

  /** Find entries relevant to a specific fault/incident for resolution guidance */
  findResolutionGuidance(
    domain: DomainType,
    symptoms: string[]
  ): KnowledgeEntry[] {
    const query = symptoms.join(' ');
    const results = this.search(query, {
      domain,
      type: 'resolution',
      limit: 10,
    });

    // Also search for related SOPs and best practices
    const sopResults = this.search(query, {
      domain,
      type: 'sop',
      limit: 5,
    });

    const allResults = [...results, ...sopResults];
    return allResults
      .map(r => r.entry)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // ==========================================================================
  // Auto-Learning from Task Closures
  // ==========================================================================

  /**
   * Automatically generate knowledge from a completed task.
   * This is called after every task closure to ensure continuous learning.
   *
   * "每一次的任务闭环，都可以自动总结并且更新知识库"
   */
  async learnFromTask(taskId: string, result: TaskResult): Promise<KnowledgeEntry[]> {
    const newEntries: KnowledgeEntry[] = [];

    // Generate incident record
    if (result.knowledgeUpdate) {
      const update = result.knowledgeUpdate;

      // Create incident entry
      const incidentEntry: KnowledgeEntry = {
        id: `kb_incident_${taskId}_${Date.now()}`,
        type: 'incident',
        title: update.summary,
        content: JSON.stringify({
          summary: update.summary,
          rootCause: update.rootCause,
          resolution: update.resolution,
          actions: result.actions,
        }),
        domain: update.affectedDomain,
        tags: this.extractTags(update.summary),
        source: update.autoGenerated ? 'auto_generated' : 'manual',
        confidence: result.success ? 0.8 : 0.5,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        relatedEntries: [],
      };
      this.add(incidentEntry);
      newEntries.push(incidentEntry);

      // Create resolution entry if successful
      if (result.success && update.resolution) {
        const resolutionEntry: KnowledgeEntry = {
          id: `kb_resolution_${taskId}_${Date.now()}`,
          type: 'resolution',
          title: `Resolution: ${update.summary}`,
          content: JSON.stringify({
            problem: update.summary,
            rootCause: update.rootCause,
            resolution: update.resolution,
            steps: result.actions.map(a => `${a.action} on ${a.target}: ${a.result}`),
          }),
          domain: update.affectedDomain,
          tags: [...this.extractTags(update.summary), 'resolution', 'verified'],
          source: 'auto_generated',
          confidence: 0.85,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          relatedEntries: [incidentEntry.id],
        };
        this.add(resolutionEntry);
        newEntries.push(resolutionEntry);
      }

      // Create lessons learned entries
      for (const lesson of update.lessonsLearned) {
        const lessonEntry: KnowledgeEntry = {
          id: `kb_lesson_${taskId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'lesson_learned',
          title: lesson,
          content: lesson,
          domain: update.affectedDomain,
          tags: [...this.extractTags(lesson), 'lesson'],
          source: 'auto_generated',
          confidence: 0.7,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          relatedEntries: [incidentEntry.id],
        };
        this.add(lessonEntry);
        newEntries.push(lessonEntry);
      }
    }

    this.emit('knowledge:learned_from_task', { taskId, newEntries: newEntries.length });
    return newEntries;
  }

  // ==========================================================================
  // Knowledge Consolidation (Dream-like)
  // ==========================================================================

  /**
   * Periodic knowledge consolidation - similar to Claude Code's Dream system.
   * Merges duplicates, updates confidence scores, prunes outdated entries.
   */
  async consolidate(): Promise<ConsolidationReport> {
    const report: ConsolidationReport = {
      merged: 0,
      pruned: 0,
      updated: 0,
      totalBefore: this.entries.size,
      totalAfter: 0,
      timestamp: Date.now(),
    };

    // Phase 1: Merge similar entries
    const entryList = Array.from(this.entries.values());
    const processed = new Set<string>();

    for (const entry of entryList) {
      if (processed.has(entry.id)) continue;

      for (const other of entryList) {
        if (entry.id === other.id || processed.has(other.id)) continue;
        if (this.isSimilar(entry, other)) {
          this.merge(entry.id, other);
          processed.add(other.id);
          report.merged++;
        }
      }
    }

    // Phase 2: Prune expired/low-confidence entries
    const now = Date.now();
    const cutoff = now - this.config.retentionDays * 86400000;

    for (const [id, entry] of this.entries) {
      if (entry.updatedAt < cutoff && entry.usageCount === 0) {
        this.remove(id);
        report.pruned++;
      }
      if (entry.confidence < this.config.minConfidence && entry.usageCount < 3) {
        this.remove(id);
        report.pruned++;
      }
    }

    // Phase 3: Update confidence based on usage patterns
    for (const entry of this.entries.values()) {
      const usageBoost = Math.min(entry.usageCount * 0.02, 0.15);
      const newConfidence = Math.min(entry.confidence + usageBoost, 0.99);
      if (newConfidence !== entry.confidence) {
        entry.confidence = newConfidence;
        report.updated++;
      }
    }

    report.totalAfter = this.entries.size;
    this.emit('knowledge:consolidated', report);
    return report;
  }

  // ==========================================================================
  // Import/Export
  // ==========================================================================

  /** Export knowledge base as JSON for backup or sharing */
  export(): string {
    const entries = Array.from(this.entries.values());
    return JSON.stringify(entries, null, 2);
  }

  /** Import knowledge entries from JSON */
  import(json: string): number {
    const entries: KnowledgeEntry[] = JSON.parse(json);
    let imported = 0;
    for (const entry of entries) {
      entry.source = 'imported';
      this.add(entry);
      imported++;
    }
    return imported;
  }

  /** Get knowledge base statistics */
  getStats(): KnowledgeStats {
    const entries = Array.from(this.entries.values());
    const domainCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const entry of entries) {
      for (const domain of entry.domain) {
        domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
      }
      typeCounts[entry.type] = (typeCounts[entry.type] ?? 0) + 1;
    }

    return {
      totalEntries: entries.length,
      byDomain: domainCounts,
      byType: typeCounts,
      avgConfidence: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length
        : 0,
      totalUsageCount: entries.reduce((sum, e) => sum + e.usageCount, 0),
      autoGeneratedRatio: entries.filter(e => e.source === 'auto_generated').length / Math.max(entries.length, 1),
    };
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  private findSimilar(entry: KnowledgeEntry): KnowledgeEntry | null {
    for (const existing of this.entries.values()) {
      if (this.isSimilar(entry, existing)) return existing;
    }
    return null;
  }

  private isSimilar(a: KnowledgeEntry, b: KnowledgeEntry): boolean {
    // Simple Jaccard similarity on tags + title words
    const aTokens = new Set([...a.tags, ...a.title.toLowerCase().split(/\s+/)]);
    const bTokens = new Set([...b.tags, ...b.title.toLowerCase().split(/\s+/)]);
    const intersection = new Set(Array.from(aTokens).filter(t => bTokens.has(t)));
    const union = new Set([...aTokens, ...bTokens]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    return similarity >= this.config.similarityThreshold;
  }

  private merge(existingId: string, newEntry: KnowledgeEntry): void {
    const existing = this.entries.get(existingId);
    if (!existing) return;

    // Merge content, keeping the higher confidence version
    if (newEntry.confidence > existing.confidence) {
      existing.content = newEntry.content;
    }
    existing.confidence = Math.max(existing.confidence, newEntry.confidence);
    existing.tags = Array.from(new Set([...existing.tags, ...newEntry.tags]));
    existing.domain = Array.from(new Set([...existing.domain, ...newEntry.domain])) as DomainType[];
    existing.usageCount += newEntry.usageCount;
    existing.updatedAt = Date.now();
    existing.relatedEntries = Array.from(new Set([...existing.relatedEntries, ...newEntry.relatedEntries]));

    this.emit('knowledge:merged', { existingId, newEntryId: newEntry.id });
  }

  private indexEntry(entry: KnowledgeEntry): void {
    for (const domain of entry.domain) {
      if (!this.indices.byDomain.has(domain)) {
        this.indices.byDomain.set(domain, new Set());
      }
      this.indices.byDomain.get(domain)!.add(entry.id);
    }

    if (!this.indices.byType.has(entry.type)) {
      this.indices.byType.set(entry.type, new Set());
    }
    this.indices.byType.get(entry.type)!.add(entry.id);

    for (const tag of entry.tags) {
      if (!this.indices.byTag.has(tag)) {
        this.indices.byTag.set(tag, new Set());
      }
      this.indices.byTag.get(tag)!.add(entry.id);
    }
  }

  private deindexEntry(entry: KnowledgeEntry): void {
    for (const domain of entry.domain) {
      this.indices.byDomain.get(domain)?.delete(entry.id);
    }
    this.indices.byType.get(entry.type)?.delete(entry.id);
    for (const tag of entry.tags) {
      this.indices.byTag.get(tag)?.delete(entry.id);
    }
  }

  private reindexEntry(entry: KnowledgeEntry): void {
    this.deindexEntry(entry);
    this.indexEntry(entry);
  }

  private evictLeastUsed(): void {
    let leastUsed: KnowledgeEntry | null = null;
    for (const entry of this.entries.values()) {
      if (!leastUsed || entry.usageCount < leastUsed.usageCount) {
        leastUsed = entry;
      }
    }
    if (leastUsed) this.remove(leastUsed.id);
  }

  private extractTags(text: string): string[] {
    const telecomKeywords = [
      'alarm', 'fault', 'kpi', 'coverage', 'capacity', 'handover',
      'interference', 'throughput', 'latency', 'packet_loss', 'rsrp',
      'sinr', 'cell', 'site', 'sector', 'antenna', 'power', 'tilt',
      'frequency', 'bandwidth', 'prb', 'bler', 'retransmission',
      '5g', '4g', 'lte', 'nr', 'ran', 'core', 'transport',
      'qos', 'qoe', 'experience', 'subscriber', 'traffic',
      '告警', '故障', '优化', '覆盖', '容量', '切换', '干扰',
      '吞吐量', '时延', '丢包', '小区', '站点', '天线', '功率',
    ];

    const lowerText = text.toLowerCase();
    return telecomKeywords.filter(kw => lowerText.includes(kw));
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface KnowledgeConfig {
  maxEntries: number;
  similarityThreshold: number;
  autoMerge: boolean;
  retentionDays: number;
  minConfidence: number;
}

interface KnowledgeIndices {
  byDomain: Map<DomainType, Set<string>>;
  byType: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
  fullText: unknown[];
}

interface SearchOptions {
  domain?: DomainType;
  type?: KnowledgeEntry['type'];
  minConfidence?: number;
  limit?: number;
}

interface KnowledgeSearchResult {
  entry: KnowledgeEntry;
  relevanceScore: number;
}

interface ConsolidationReport {
  merged: number;
  pruned: number;
  updated: number;
  totalBefore: number;
  totalAfter: number;
  timestamp: number;
}

interface KnowledgeStats {
  totalEntries: number;
  byDomain: Record<string, number>;
  byType: Record<string, number>;
  avgConfidence: number;
  totalUsageCount: number;
  autoGeneratedRatio: number;
}
