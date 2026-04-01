/**
 * IOE Configuration System
 *
 * Cascaded configuration resolution following Claude Code's pattern:
 * MDM Policy → Remote Managed → User Settings → Project Config → Global → Defaults
 *
 * For IOE:
 * Enterprise Policy → Operator Config → Project NETWORK.md → User Prefs → Defaults
 */

import {
  TAORConfig,
  ContextBudget,
  PermissionLevel,
  DomainType,
} from '../types';

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_TAOR_CONFIG: TAORConfig = {
  maxTurns: 200,
  maxTokens: 200000,
  contextWindowSize: 200000,
  compressionThreshold: 0.92,
  maxConcurrentReadTools: 10,
  maxRetries: 3,
  retryBackoffMs: [2000, 4000, 8000, 16000, 300000],
};

export const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  systemPromptTokens: 50000,
  sessionHistoryTokens: 100000,
  currentTurnTokens: 30000,
  toolResultTokens: 20000,
  totalBudget: 200000,
};

export const DOMAIN_AGENT_CONTEXT_BUDGET: ContextBudget = {
  systemPromptTokens: 20000,
  sessionHistoryTokens: 40000,
  currentTurnTokens: 15000,
  toolResultTokens: 15000,
  totalBudget: 90000,
};

export const SUB_AGENT_CONTEXT_BUDGET: ContextBudget = {
  systemPromptTokens: 10000,
  sessionHistoryTokens: 20000,
  currentTurnTokens: 10000,
  toolResultTokens: 10000,
  totalBudget: 50000,
};

// ============================================================================
// IOE Configuration
// ============================================================================

export interface IOEConfig {
  // Core
  instanceId: string;
  operatorName: string;
  region: string;
  defaultModelId: string;
  defaultLanguage: 'zh' | 'en' | 'auto';

  // TAOR Loop
  taor: TAORConfig;

  // Context Management
  mainAgentContextBudget: ContextBudget;
  domainAgentContextBudget: ContextBudget;
  subAgentContextBudget: ContextBudget;

  // Permissions
  defaultPermissionLevel: PermissionLevel;
  requireDigitalTwinForL3Plus: boolean;
  autoApproveL1L2: boolean;

  // Memory & Knowledge
  memoryBasePath: string;
  knowledgeBasePath: string;
  dreamEnabled: boolean;
  dreamIntervalHours: number;
  knowledgeAutoUpdate: boolean;

  // Digital Twin
  digitalTwinEnabled: boolean;
  digitalTwinEndpoint: string;
  autoAbortOnHighRisk: boolean;
  minSimulationConfidence: number;

  // Integration
  ossEndpoints: Record<string, string>;
  externalSystems: ExternalSystemConfig[];

  // Input
  cliEnabled: boolean;
  chatEnabled: boolean;
  chatPort: number;
  apiEnabled: boolean;
  apiPort: number;
  eventListenerEnabled: boolean;

  // Safety
  separatedEvaluation: boolean;
  auditLogEnabled: boolean;
  maxParameterChangePerIteration: ParameterLimits;
  prohibitedOperations: string[];
  maintenanceWindows: MaintenanceWindowConfig[];

  // Network.md paths
  networkMdPaths: string[];

  // Feature Flags (shrinking harness - design for removal)
  featureFlags: Record<string, boolean>;
}

export interface ExternalSystemConfig {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  authType: string;
  credentials?: string; // Reference to secure credential store
}

export interface ParameterLimits {
  maxPowerChangeDeltaDb: number;   // e.g., 3 dB
  maxTiltChangeDegrees: number;    // e.g., 2°
  maxHoOffsetChangeDeltaDb: number; // e.g., 3 dB
}

export interface MaintenanceWindowConfig {
  name: string;
  schedule: string; // cron expression
  duration: number; // minutes
  allowedOperations: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

export function createDefaultConfig(overrides?: Partial<IOEConfig>): IOEConfig {
  const defaults: IOEConfig = {
    instanceId: `ioe_${Date.now()}`,
    operatorName: 'Default Operator',
    region: 'default',
    defaultModelId: 'pangu-telecom-72b',
    defaultLanguage: 'auto',

    taor: DEFAULT_TAOR_CONFIG,
    mainAgentContextBudget: DEFAULT_CONTEXT_BUDGET,
    domainAgentContextBudget: DOMAIN_AGENT_CONTEXT_BUDGET,
    subAgentContextBudget: SUB_AGENT_CONTEXT_BUDGET,

    defaultPermissionLevel: 'L2_low_risk',
    requireDigitalTwinForL3Plus: true,
    autoApproveL1L2: true,

    memoryBasePath: '~/.ioe/memory',
    knowledgeBasePath: '~/.ioe/knowledge',
    dreamEnabled: true,
    dreamIntervalHours: 24,
    knowledgeAutoUpdate: true,

    digitalTwinEnabled: true,
    digitalTwinEndpoint: 'http://localhost:9090/digital-twin',
    autoAbortOnHighRisk: true,
    minSimulationConfidence: 0.7,

    ossEndpoints: {},
    externalSystems: [],

    cliEnabled: true,
    chatEnabled: true,
    chatPort: 8080,
    apiEnabled: true,
    apiPort: 8081,
    eventListenerEnabled: true,

    separatedEvaluation: true,
    auditLogEnabled: true,
    maxParameterChangePerIteration: {
      maxPowerChangeDeltaDb: 3,
      maxTiltChangeDegrees: 2,
      maxHoOffsetChangeDeltaDb: 3,
    },
    prohibitedOperations: [
      'restart_core_during_peak',
      'disable_alarm_monitoring',
      'exceed_regulatory_power_limit',
      'delete_config_backup_unverified',
    ],
    maintenanceWindows: [
      {
        name: 'Weekly Maintenance',
        schedule: '0 2 * * 2', // Tuesday 02:00
        duration: 240, // 4 hours
        allowedOperations: ['firmware_update', 'config_change', 'parameter_adjustment'],
      },
    ],

    networkMdPaths: ['./NETWORK.md', './domains/*/DOMAIN.md'],

    featureFlags: {
      // Shrinking harness: mark features for potential removal as models improve
      'use_decision_tree_fallback': true,    // Remove when model handles all cases
      'enforce_parameter_limits': true,       // Remove when model learns limits
      'require_manual_approval_l3': true,     // Reduce as trust increases
      'enable_dream_consolidation': true,
      'enable_separated_evaluation': true,
      'enable_cross_domain_correlation': true,
      'enable_realtime_marketing': false,     // Opt-in feature
      'enable_deterministic_experience': false, // Requires core network integration
    },
  };

  return { ...defaults, ...overrides };
}

// ============================================================================
// Configuration Resolution (Cascaded)
// ============================================================================

export class ConfigResolver {
  private layers: ConfigLayer[] = [];

  /** Add a configuration layer (higher index = higher priority) */
  addLayer(layer: ConfigLayer): void {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.priority - b.priority);
  }

  /** Resolve final configuration by cascading all layers */
  resolve(): IOEConfig {
    let config = createDefaultConfig();

    for (const layer of this.layers) {
      config = this.mergeConfig(config, layer.config);
    }

    return config;
  }

  private mergeConfig(base: IOEConfig, override: Partial<IOEConfig>): IOEConfig {
    return {
      ...base,
      ...override,
      // Deep merge nested objects
      taor: { ...base.taor, ...(override.taor ?? {}) },
      mainAgentContextBudget: {
        ...base.mainAgentContextBudget,
        ...(override.mainAgentContextBudget ?? {}),
      },
      featureFlags: {
        ...base.featureFlags,
        ...(override.featureFlags ?? {}),
      },
    } as IOEConfig;
  }
}

interface ConfigLayer {
  name: string;
  priority: number; // Higher = wins on conflict
  config: Partial<IOEConfig>;
}
