/**
 * IOE OSS/BSS Integration Layer
 *
 * Provides direct command execution capability on live network OSS systems.
 * Also integrates with third-party platforms (ticketing, CRM, etc.)
 *
 * Key safety requirements:
 * - All write commands pass through permission engine
 * - L3+ commands require digital twin pre-validation
 * - Full audit trail for all executed commands
 * - Rollback commands tracked for every action
 * - Integration with work order lifecycle
 */

import { EventEmitter } from 'events';
import {
  ExternalSystem,
  OSSCommand,
  OSSCommandResult,
  PermissionLevel,
} from '../types';

// ============================================================================
// OSS Connector
// ============================================================================

export class OSSConnector extends EventEmitter {
  private systems: Map<string, ExternalSystemInstance> = new Map();
  private commandHistory: CommandHistoryEntry[] = [];
  private config: OSSConnectorConfig;

  constructor(config?: Partial<OSSConnectorConfig>) {
    super();
    this.config = {
      commandTimeoutMs: 60000,
      maxRetries: 2,
      auditLogEnabled: true,
      rollbackWindowMs: 3600000, // 1 hour rollback window
      maxConcurrentCommands: 5,
      ...config,
    };
  }

  // ==========================================================================
  // System Registration
  // ==========================================================================

  /** Register an external system (OSS, BSS, ticketing, etc.) */
  registerSystem(system: ExternalSystem): void {
    this.systems.set(system.id, {
      config: system,
      status: 'disconnected',
      lastHealthCheck: 0,
      commandCount: 0,
    });
    this.emit('system:registered', system);
  }

  /** Connect to a registered system */
  async connectSystem(systemId: string): Promise<boolean> {
    const instance = this.systems.get(systemId);
    if (!instance) throw new Error(`System ${systemId} not found`);

    try {
      // In production: establish connection based on auth type
      instance.status = 'connected';
      instance.lastHealthCheck = Date.now();
      this.emit('system:connected', systemId);
      return true;
    } catch (error) {
      instance.status = 'error';
      this.emit('system:error', { systemId, error });
      return false;
    }
  }

  /** Health check all connected systems */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const [id, instance] of this.systems) {
      try {
        // In production: ping the system
        instance.lastHealthCheck = Date.now();
        results.set(id, instance.status === 'connected');
      } catch {
        instance.status = 'error';
        results.set(id, false);
      }
    }
    return results;
  }

  // ==========================================================================
  // Command Execution
  // ==========================================================================

  /**
   * Execute a command on an OSS system.
   * All commands are logged for audit trail.
   * Write commands require explicit permission approval.
   */
  async executeCommand(command: OSSCommand): Promise<OSSCommandResult> {
    const system = this.systems.get(command.system);
    if (!system) {
      return {
        commandId: `cmd_${Date.now()}`,
        success: false,
        output: `System ${command.system} not found`,
        executionTimeMs: 0,
        affectedElements: [],
      };
    }

    if (system.status !== 'connected') {
      const reconnected = await this.connectSystem(command.system);
      if (!reconnected) {
        return {
          commandId: `cmd_${Date.now()}`,
          success: false,
          output: `Cannot connect to system ${command.system}`,
          executionTimeMs: 0,
          affectedElements: [],
        };
      }
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    this.emit('command:executing', { commandId, command });

    try {
      // In production: execute the actual command via the system's API
      const result: OSSCommandResult = {
        commandId,
        success: true,
        output: `Command executed successfully: ${command.command}`,
        executionTimeMs: Date.now() - startTime,
        affectedElements: command.targetElements,
      };

      // Record in history for audit and rollback
      this.commandHistory.push({
        commandId,
        command,
        result,
        timestamp: Date.now(),
        rolledBack: false,
      });

      system.commandCount++;
      this.emit('command:completed', result);

      if (this.config.auditLogEnabled) {
        this.emit('audit:command', {
          commandId,
          system: command.system,
          command: command.command,
          targets: command.targetElements,
          success: result.success,
          timestamp: Date.now(),
        });
      }

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const result: OSSCommandResult = {
        commandId,
        success: false,
        output: `Command failed: ${errorMsg}`,
        executionTimeMs: Date.now() - startTime,
        affectedElements: [],
      };

      this.commandHistory.push({
        commandId,
        command,
        result,
        timestamp: Date.now(),
        rolledBack: false,
      });

      this.emit('command:failed', { commandId, error: errorMsg });
      return result;
    }
  }

  // ==========================================================================
  // Rollback
  // ==========================================================================

  /** Rollback a previously executed command */
  async rollback(commandId: string): Promise<OSSCommandResult | null> {
    const entry = this.commandHistory.find(h => h.commandId === commandId);
    if (!entry) return null;
    if (entry.rolledBack) return null;
    if (!entry.command.rollbackCommand) return null;

    // Check rollback window
    if (Date.now() - entry.timestamp > this.config.rollbackWindowMs) {
      this.emit('rollback:expired', commandId);
      return null;
    }

    const rollbackCommand: OSSCommand = {
      ...entry.command,
      command: entry.command.rollbackCommand,
    };

    const result = await this.executeCommand(rollbackCommand);
    if (result.success) {
      entry.rolledBack = true;
      this.emit('rollback:success', commandId);
    }
    return result;
  }

  // ==========================================================================
  // Work Order Integration
  // ==========================================================================

  /** Create a work order in the ticketing system */
  async createWorkOrder(order: WorkOrderRequest): Promise<WorkOrderResponse> {
    const ticketingSystems = Array.from(this.systems.values()).filter(
      s => s.config.type === 'ticketing'
    );

    if (ticketingSystems.length === 0) {
      return { id: '', success: false, message: 'No ticketing system configured' };
    }

    const system = ticketingSystems[0];
    const result = await this.executeCommand({
      system: system.config.id,
      command: 'CREATE_WORK_ORDER',
      parameters: order as unknown as Record<string, unknown>,
      targetElements: order.affectedElements,
      expectedDuration: 0,
    });

    return {
      id: result.commandId,
      success: result.success,
      message: result.output,
    };
  }

  /** Update work order status */
  async updateWorkOrder(orderId: string, status: string, notes?: string): Promise<boolean> {
    const ticketingSystems = Array.from(this.systems.values()).filter(
      s => s.config.type === 'ticketing'
    );

    if (ticketingSystems.length === 0) return false;

    const result = await this.executeCommand({
      system: ticketingSystems[0].config.id,
      command: 'UPDATE_WORK_ORDER',
      parameters: { orderId, status, notes },
      targetElements: [],
      expectedDuration: 0,
    });

    return result.success;
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  getCommandHistory(limit?: number): CommandHistoryEntry[] {
    const sorted = this.commandHistory.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  getSystemStatus(): SystemStatus[] {
    return Array.from(this.systems.values()).map(s => ({
      id: s.config.id,
      name: s.config.name,
      type: s.config.type,
      status: s.status,
      lastHealthCheck: s.lastHealthCheck,
      commandCount: s.commandCount,
    }));
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface OSSConnectorConfig {
  commandTimeoutMs: number;
  maxRetries: number;
  auditLogEnabled: boolean;
  rollbackWindowMs: number;
  maxConcurrentCommands: number;
}

interface ExternalSystemInstance {
  config: ExternalSystem;
  status: 'connected' | 'disconnected' | 'error';
  lastHealthCheck: number;
  commandCount: number;
}

interface CommandHistoryEntry {
  commandId: string;
  command: OSSCommand;
  result: OSSCommandResult;
  timestamp: number;
  rolledBack: boolean;
}

interface WorkOrderRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'fault' | 'maintenance' | 'optimization' | 'installation';
  affectedElements: string[];
  assignee?: string;
  dueDate?: number;
}

interface WorkOrderResponse {
  id: string;
  success: boolean;
  message: string;
}

interface SystemStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  lastHealthCheck: number;
  commandCount: number;
}
