/**
 * IOE - Intelligent Operations Engine
 *
 * An AI-native Agent Harness platform for telecom network operations
 * and market operations. Designed to overlay on existing SmartCare
 * and AUTIN systems, giving them AI-powered reasoning capabilities.
 *
 * Architecture inspired by Claude Code Agent Harness v2.1.88:
 * - Model-driven TAOR loop (Think-Act-Observe-Repeat)
 * - 40+ composable tool primitives
 * - 6-layer memory hierarchy with Dream consolidation
 * - Multi-strategy context compression engine
 * - L1-L5 permission model with digital twin pre-validation
 * - 21-event lifecycle Hook system
 * - Sub-agent orchestration with context isolation
 * - Separated self-evaluation (Generator/Evaluator pattern)
 *
 * Key Principle: "The model is the CPU, the Harness is the OS."
 * IOE provides the Harness; the telecom LLM (Pangu) provides the Intelligence.
 */

// ============================================================================
// Core Exports
// ============================================================================

export { QueryEngine } from './core/query-engine';
export { MainAgent, DOMAIN_AGENT_DEFINITIONS } from './core/main-agent';

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Core Engine
// ============================================================================

export { TAORLoop, ToolExecutor, ErrorRecoveryPipeline } from './core/taor-loop';

// ============================================================================
// Context Management
// ============================================================================

export { ContextEngine, NetworkContextBuilder } from './context/context-engine';

// ============================================================================
// Tool System
// ============================================================================

export { ToolRegistry } from './tools/tool-registry';
export { getAllTelecomTools } from './tools/telecom-tools';

// ============================================================================
// Memory System
// ============================================================================

export { MemorySystem, DreamEngine } from './memory/memory-system';

// ============================================================================
// Permission & Hooks
// ============================================================================

export { PermissionEngine } from './permissions/permission-engine';
export { HookEngine } from './hooks/hook-engine';

// ============================================================================
// Data & Integration
// ============================================================================

export { SharedDataModule } from './data/shared-data-module';
export { DigitalTwinEngine } from './digital-twin/digital-twin-engine';
export { KnowledgeBase } from './knowledge/knowledge-base';
export { OSSConnector } from './integration/oss-connector';

// ============================================================================
// Input Interface
// ============================================================================

export { InputRouter, IOECli, IOEChat } from './input/multi-modal-input';

// ============================================================================
// Configuration
// ============================================================================

export { createDefaultConfig, ConfigResolver } from './config/ioe-config';
export type { IOEConfig } from './config/ioe-config';

// ============================================================================
// Application Bootstrap
// ============================================================================

import { EventEmitter } from 'events';
import { createDefaultConfig, ConfigResolver } from './config/ioe-config';
import type { IOEConfig } from './config/ioe-config';
import { QueryEngine } from './core/query-engine';
import { MainAgent } from './core/main-agent';
import { SharedDataModule } from './data/shared-data-module';
import { DigitalTwinEngine } from './digital-twin/digital-twin-engine';
import { KnowledgeBase } from './knowledge/knowledge-base';
import { OSSConnector } from './integration/oss-connector';
import { InputRouter, IOECli, IOEChat } from './input/multi-modal-input';
import type { Session } from './types';

/**
 * IOE Application - Main bootstrap class
 *
 * Wires together all subsystems and starts the engine.
 * This is the "Harness" that wraps the AI model.
 */
export class IOEApplication extends EventEmitter {
  private config: IOEConfig;
  private queryEngine!: QueryEngine;
  private mainAgent!: MainAgent;
  private dataModule!: SharedDataModule;
  private digitalTwin!: DigitalTwinEngine;
  private knowledgeBase!: KnowledgeBase;
  private ossConnector!: OSSConnector;
  private inputRouter!: InputRouter;
  private cli?: IOECli;
  private chat?: IOEChat;

  constructor(config?: Partial<IOEConfig>) {
    super();
    this.config = createDefaultConfig(config);
  }

  /**
   * Initialize all subsystems and start the IOE engine.
   *
   * Initialization order matters:
   * 1. Config resolution
   * 2. Data module (provides data access to all other modules)
   * 3. Digital twin (provides simulation for permission engine)
   * 4. Knowledge base (provides historical knowledge)
   * 5. OSS connector (provides system integration)
   * 6. Query engine (manages session state)
   * 7. Main agent (orchestrates domain agents)
   * 8. Input router (receives user/system input)
   */
  async initialize(): Promise<void> {
    console.log('[IOE] Initializing Intelligent Operations Engine...');
    console.log(`[IOE] Instance: ${this.config.instanceId}`);
    console.log(`[IOE] Operator: ${this.config.operatorName}`);
    console.log(`[IOE] Region: ${this.config.region}`);

    // Step 1: Initialize data module
    this.dataModule = new SharedDataModule();
    console.log('[IOE] ✓ Shared Data Module initialized');

    // Step 2: Initialize digital twin
    this.digitalTwin = new DigitalTwinEngine({
      autoAbortOnHighRisk: this.config.autoAbortOnHighRisk,
      minConfidenceThreshold: this.config.minSimulationConfidence,
    });
    console.log('[IOE] ✓ Digital Twin Engine initialized');

    // Step 3: Initialize knowledge base
    this.knowledgeBase = new KnowledgeBase();
    console.log('[IOE] ✓ Knowledge Base initialized');

    // Step 4: Initialize OSS connector
    this.ossConnector = new OSSConnector({
      auditLogEnabled: this.config.auditLogEnabled,
    });

    // Register configured external systems
    for (const sys of this.config.externalSystems) {
      this.ossConnector.registerSystem({
        id: sys.id,
        name: sys.name,
        type: sys.type as any,
        protocol: 'rest',
        endpoint: sys.endpoint,
        authType: sys.authType as any,
        capabilities: [],
      });
    }
    console.log('[IOE] ✓ OSS Connector initialized');

    // Step 5: Initialize query engine
    const session: Session = {
      id: `session_${Date.now()}`,
      userId: 'system',
      startTime: Date.now(),
      lastActivity: Date.now(),
      inputMode: 'cli',
      agents: [],
      contextState: this.config.mainAgentContextBudget,
    };
    this.queryEngine = QueryEngine.getInstance(session, this.config.taor);

    // Wire up knowledge auto-update
    this.queryEngine.on('knowledge:update', (update) => {
      if (this.config.knowledgeAutoUpdate) {
        this.knowledgeBase.learnFromTask(update.taskId, {
          success: true,
          summary: update.summary,
          actions: [],
          knowledgeUpdate: update,
        });
      }
    });
    console.log('[IOE] ✓ Query Engine initialized');

    // Step 6: Initialize main agent
    this.mainAgent = new MainAgent({
      mainAgentId: `main_agent_${this.config.instanceId}`,
      defaultModelId: this.config.defaultModelId,
      domainContextBudget: this.config.domainAgentContextBudget,
      subAgentContextBudget: this.config.subAgentContextBudget,
      enableSeparatedEvaluation: this.config.separatedEvaluation,
      enableDigitalTwinValidation: this.config.digitalTwinEnabled,
    });
    await this.mainAgent.initialize();
    console.log('[IOE] ✓ Main Agent initialized with 5 domain agents');

    // Step 7: Initialize input router
    this.inputRouter = new InputRouter();
    console.log('[IOE] ✓ Input Router initialized');

    // Step 8: Start input interfaces
    if (this.config.cliEnabled) {
      this.cli = new IOECli(this.inputRouter);
    }
    if (this.config.chatEnabled) {
      this.chat = new IOEChat(this.inputRouter);
    }

    console.log('[IOE] ✓ Intelligent Operations Engine ready');
    console.log('[IOE]');
    console.log('[IOE] Architecture Summary:');
    console.log('[IOE]   Main Agent → 5 Domain Agents → 16 Sub-Agents');
    console.log('[IOE]   TAOR Loop: Think → Act → Observe → Repeat');
    console.log('[IOE]   Context Compression: Auto/Snip/Collapse/Micro');
    console.log('[IOE]   Permission Model: L1-L5 Trust Hierarchy');
    console.log('[IOE]   Safety: Digital Twin Pre-validation + Separated Evaluation');
    console.log('[IOE]   Memory: 6-Layer Hierarchy + Dream Consolidation');
    console.log('[IOE]   Knowledge Base: Auto-learning from every task closure');
    console.log('[IOE]');

    this.emit('ioe:ready');
  }

  /** Start the CLI interface */
  async startCli(): Promise<void> {
    if (!this.cli) throw new Error('CLI not enabled in configuration');
    await this.cli.start();
  }

  /** Start the Chat interface */
  async startChat(): Promise<void> {
    if (!this.chat) throw new Error('Chat not enabled in configuration');
    await this.chat.start(this.config.chatPort);
  }

  /** Get system status */
  getStatus(): IOEStatus {
    return {
      instanceId: this.config.instanceId,
      uptime: Date.now() - (this.queryEngine?.getSession().startTime ?? Date.now()),
      domainAgents: this.mainAgent?.getDomainAgentStatus() ?? [],
      knowledgeBaseStats: this.knowledgeBase?.getStats(),
      digitalTwinStatus: {
        activeSimulations: this.digitalTwin?.getActiveSimulations().length ?? 0,
        accuracy: this.digitalTwin?.getAccuracyReport(),
      },
      dataSources: this.dataModule?.getCacheStats(),
      connectedSystems: this.ossConnector?.getSystemStatus() ?? [],
    };
  }

  /** Graceful shutdown */
  async shutdown(): Promise<void> {
    console.log('[IOE] Shutting down Intelligent Operations Engine...');
    QueryEngine.reset();
    this.removeAllListeners();
    console.log('[IOE] Shutdown complete.');
  }
}

interface IOEStatus {
  instanceId: string;
  uptime: number;
  domainAgents: unknown[];
  knowledgeBaseStats: unknown;
  digitalTwinStatus: {
    activeSimulations: number;
    accuracy: unknown;
  };
  dataSources: unknown;
  connectedSystems: unknown[];
}
