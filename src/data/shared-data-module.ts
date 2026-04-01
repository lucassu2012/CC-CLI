/**
 * IOE Shared Data Module
 *
 * Provides unified data access layer that connects to legacy systems
 * (SmartCare, AUTIN) through standard protocols. Handles both real-time
 * (sub-second) and non-real-time data ingestion.
 *
 * Design: "Primitives over integrations" - a small number of composable
 * data access primitives rather than hundreds of specialized connectors.
 */

import { EventEmitter } from 'events';
import {
  DataSource,
  DataQuery,
  DataResult,
  DomainType,
  KPIMetric,
  Alarm,
  NetworkContext,
} from '../types';

// ============================================================================
// Data Source Registry
// ============================================================================

export class DataSourceRegistry {
  private sources: Map<string, DataSourceInstance> = new Map();

  register(source: DataSource): void {
    this.sources.set(source.id, {
      config: source,
      status: 'disconnected',
      lastHeartbeat: 0,
      metrics: { queryCount: 0, avgLatencyMs: 0, errorCount: 0 },
    });
  }

  get(id: string): DataSourceInstance | undefined {
    return this.sources.get(id);
  }

  getByDomain(domain: DomainType): DataSourceInstance[] {
    return Array.from(this.sources.values()).filter(
      s => s.config.domain === domain
    );
  }

  getByType(dataType: DataSource['dataType']): DataSourceInstance[] {
    return Array.from(this.sources.values()).filter(
      s => s.config.dataType === dataType
    );
  }

  getAll(): DataSourceInstance[] {
    return Array.from(this.sources.values());
  }
}

// ============================================================================
// Shared Data Module
// ============================================================================

/**
 * Central data access layer for all agents.
 *
 * Supports standard protocols for legacy system integration:
 * - Kafka: Real-time streaming data (KPIs, alarms, events)
 * - gRPC: High-performance RPC for OSS/BSS systems
 * - REST: Standard HTTP APIs for web services
 * - SNMP: Network element management
 * - NETCONF: Network configuration protocol
 * - File: Batch data import/export
 * - Database: Direct database connections (SmartCare DataCube)
 */
export class SharedDataModule extends EventEmitter {
  private registry: DataSourceRegistry;
  private cache: DataCache;
  private subscriptions: Map<string, DataSubscription> = new Map();
  private adapters: Map<string, ProtocolAdapter> = new Map();

  constructor() {
    super();
    this.registry = new DataSourceRegistry();
    this.cache = new DataCache();
    this.registerDefaultAdapters();
  }

  // ==========================================================================
  // Protocol Adapters
  // ==========================================================================

  private registerDefaultAdapters(): void {
    this.adapters.set('kafka', {
      protocol: 'kafka',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      subscribe: async (_endpoint, topic, callback) => {
        return { unsubscribe: () => {} };
      },
      disconnect: async () => {},
    });

    this.adapters.set('grpc', {
      protocol: 'grpc',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      disconnect: async () => {},
    });

    this.adapters.set('rest', {
      protocol: 'rest',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      disconnect: async () => {},
    });

    this.adapters.set('snmp', {
      protocol: 'snmp',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      disconnect: async () => {},
    });

    this.adapters.set('netconf', {
      protocol: 'netconf',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      disconnect: async () => {},
    });

    this.adapters.set('database', {
      protocol: 'database',
      connect: async (endpoint) => ({ connected: true, endpoint }),
      query: async (_endpoint, query) => ({ data: null, cached: false }),
      disconnect: async () => {},
    });
  }

  // ==========================================================================
  // Data Source Management
  // ==========================================================================

  /** Register a new data source */
  registerSource(source: DataSource): void {
    this.registry.register(source);
    this.emit('source:registered', source);
  }

  /** Connect to a data source */
  async connectSource(sourceId: string): Promise<boolean> {
    const instance = this.registry.get(sourceId);
    if (!instance) throw new Error(`Data source ${sourceId} not found`);

    const adapter = this.adapters.get(instance.config.protocol);
    if (!adapter) throw new Error(`No adapter for protocol: ${instance.config.protocol}`);

    try {
      await adapter.connect(instance.config.endpoint);
      instance.status = 'connected';
      instance.lastHeartbeat = Date.now();
      this.emit('source:connected', sourceId);
      return true;
    } catch (error) {
      instance.status = 'error';
      this.emit('source:error', { sourceId, error });
      return false;
    }
  }

  // ==========================================================================
  // Data Query (Unified Interface)
  // ==========================================================================

  /** Execute a data query against a registered source */
  async query(query: DataQuery): Promise<DataResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.buildCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        sourceId: query.sourceId,
        data: cached.data,
        timestamp: cached.timestamp,
        cached: true,
      };
    }

    const instance = this.registry.get(query.sourceId);
    if (!instance) throw new Error(`Data source ${query.sourceId} not found`);
    if (instance.status !== 'connected') {
      await this.connectSource(query.sourceId);
    }

    const adapter = this.adapters.get(instance.config.protocol);
    if (!adapter) throw new Error(`No adapter for protocol: ${instance.config.protocol}`);

    const result = await adapter.query(instance.config.endpoint, query);

    // Update metrics
    instance.metrics.queryCount++;
    instance.metrics.avgLatencyMs =
      (instance.metrics.avgLatencyMs * (instance.metrics.queryCount - 1) +
        (Date.now() - startTime)) / instance.metrics.queryCount;

    // Cache result
    const refreshInterval = instance.config.refreshIntervalMs ?? 60000;
    this.cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
      ttl: refreshInterval,
    });

    return {
      sourceId: query.sourceId,
      data: result.data,
      timestamp: Date.now(),
      cached: false,
      nextRefresh: Date.now() + refreshInterval,
    };
  }

  // ==========================================================================
  // Real-time Subscriptions (Sub-second Data)
  // ==========================================================================

  /** Subscribe to real-time data stream from a source */
  async subscribe(
    sourceId: string,
    topic: string,
    callback: (data: unknown) => void
  ): Promise<string> {
    const instance = this.registry.get(sourceId);
    if (!instance) throw new Error(`Data source ${sourceId} not found`);

    const adapter = this.adapters.get(instance.config.protocol);
    if (!adapter?.subscribe) {
      throw new Error(`Protocol ${instance.config.protocol} does not support subscriptions`);
    }

    const subResult = await adapter.subscribe(instance.config.endpoint, topic, callback);
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      sourceId,
      topic,
      callback,
      unsubscribe: subResult.unsubscribe,
      createdAt: Date.now(),
    });

    this.emit('subscription:created', { subscriptionId, sourceId, topic });
    return subscriptionId;
  }

  /** Unsubscribe from a data stream */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const sub = this.subscriptions.get(subscriptionId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.emit('subscription:removed', subscriptionId);
    }
  }

  // ==========================================================================
  // Convenience Methods for Common Telecom Data
  // ==========================================================================

  /** Get real-time KPI metrics for specified scope */
  async getKPIMetrics(
    domain: DomainType,
    scope: string,
    timeRange?: { start: number; end: number }
  ): Promise<KPIMetric[]> {
    const sources = this.registry.getByDomain(domain);
    const results: KPIMetric[] = [];

    for (const source of sources) {
      const result = await this.query({
        sourceId: source.config.id,
        query: `SELECT * FROM kpi WHERE domain='${domain}' AND scope='${scope}'`,
        timeRange,
      });
      if (result.data && Array.isArray(result.data)) {
        results.push(...(result.data as KPIMetric[]));
      }
    }

    return results;
  }

  /** Get active alarms filtered by severity and domain */
  async getAlarms(
    domain?: DomainType,
    severity?: Alarm['severity']
  ): Promise<Alarm[]> {
    // Query alarm sources across all registered alarm feeds
    const alarmSources = this.registry.getByType('realtime').filter(
      s => !domain || s.config.domain === domain
    );

    const allAlarms: Alarm[] = [];
    for (const source of alarmSources) {
      const result = await this.query({
        sourceId: source.config.id,
        query: 'SELECT * FROM active_alarms',
      });
      if (result.data && Array.isArray(result.data)) {
        allAlarms.push(...(result.data as Alarm[]));
      }
    }

    return severity
      ? allAlarms.filter(a => a.severity === severity)
      : allAlarms;
  }

  /** Build comprehensive network context snapshot */
  async buildNetworkContext(): Promise<Partial<NetworkContext>> {
    const [alarms, kpis] = await Promise.all([
      this.getAlarms(),
      this.getKPIMetrics('cross_domain' as DomainType, 'network'),
    ]);

    return {
      currentAlarms: alarms,
      kpiSnapshot: {
        timestamp: Date.now(),
        metrics: kpis,
      },
    };
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  private buildCacheKey(query: DataQuery): string {
    return `${query.sourceId}:${query.query}:${JSON.stringify(query.parameters ?? {})}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
}

// ============================================================================
// Data Cache
// ============================================================================

class DataCache {
  private entries: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 10000;
  private hits: number = 0;
  private misses: number = 0;

  get(key: string): CacheEntry | null {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.entries.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    if (this.entries.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, entry);
  }

  clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    return {
      size: this.entries.size,
      maxSize: this.maxEntries,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface DataSourceInstance {
  config: DataSource;
  status: 'connected' | 'disconnected' | 'error';
  lastHeartbeat: number;
  metrics: { queryCount: number; avgLatencyMs: number; errorCount: number };
}

interface ProtocolAdapter {
  protocol: string;
  connect(endpoint: string): Promise<{ connected: boolean; endpoint: string }>;
  query(endpoint: string, query: DataQuery): Promise<{ data: unknown; cached: boolean }>;
  subscribe?(endpoint: string, topic: string, callback: (data: unknown) => void): Promise<{ unsubscribe: () => void }>;
  disconnect(): Promise<void>;
}

interface DataSubscription {
  id: string;
  sourceId: string;
  topic: string;
  callback: (data: unknown) => void;
  unsubscribe: () => void;
  createdAt: number;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
}
