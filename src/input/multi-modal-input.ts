/**
 * IOE Multi-Modal Input Interface
 *
 * Provides multiple entry points for task submission:
 * - CLI: Command-line interface for engineers and automated scripts
 * - Chat: Conversational interface for natural language interaction
 * - API: Programmatic interface for system integration
 * - Event: Event-driven input from monitoring systems
 *
 * Like Claude Code's Chat/CLI entry points, but extended for telecom
 * operations with multi-modal support (text, voice, images of network
 * topology or screenshots, structured data).
 */

import { EventEmitter } from 'events';
import { Session, Message, MessageContent, TextContent } from '../types';

// ============================================================================
// Input Router
// ============================================================================

/**
 * Routes input from multiple modalities to the Main Agent.
 * Handles intent pre-processing, language detection, and input normalization.
 */
export class InputRouter extends EventEmitter {
  private handlers: Map<InputMode, InputHandler> = new Map();
  private preprocessors: InputPreprocessor[] = [];
  private activeSessions: Map<string, InputSession> = new Map();

  constructor() {
    super();
    this.registerDefaultHandlers();
    this.registerDefaultPreprocessors();
  }

  private registerDefaultHandlers(): void {
    this.handlers.set('cli', new CLIHandler());
    this.handlers.set('chat', new ChatHandler());
    this.handlers.set('api', new APIHandler());
    this.handlers.set('event', new EventHandler());
  }

  private registerDefaultPreprocessors(): void {
    this.preprocessors.push(
      new LanguageDetector(),
      new TelecomTermNormalizer(),
      new CommandParser(),
    );
  }

  /** Process incoming input from any modality */
  async processInput(input: RawInput): Promise<ProcessedInput> {
    // Run through preprocessor chain
    let processed: ProcessedInput = {
      originalInput: input,
      normalizedText: input.content,
      language: 'auto',
      detectedEntities: [],
      suggestedDomain: undefined,
      metadata: {},
    };

    for (const preprocessor of this.preprocessors) {
      processed = await preprocessor.process(processed);
    }

    // Route to appropriate handler
    const handler = this.handlers.get(input.mode);
    if (handler) {
      processed = await handler.handle(processed);
    }

    this.emit('input:processed', processed);
    return processed;
  }

  /** Create a new input session */
  createSession(userId: string, mode: InputMode): InputSession {
    const session: InputSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      mode,
      startTime: Date.now(),
      lastActivity: Date.now(),
      history: [],
      context: {},
    };
    this.activeSessions.set(session.id, session);
    this.emit('session:created', session);
    return session;
  }

  /** Convert processed input to IOE Message format */
  toMessage(processed: ProcessedInput, sessionId: string): Message {
    const contents: MessageContent[] = [];

    // Add text content
    contents.push({
      type: 'text',
      text: processed.normalizedText,
    } as TextContent);

    // Add image content if present
    if (processed.originalInput.attachments) {
      for (const attachment of processed.originalInput.attachments) {
        if (attachment.type === 'image') {
          contents.push({
            type: 'image',
            source: attachment.data,
            mediaType: attachment.mimeType,
          });
        }
      }
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: contents,
      timestamp: Date.now(),
      metadata: {
        domainContext: processed.suggestedDomain,
      },
    };
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}

// ============================================================================
// Input Handlers
// ============================================================================

interface InputHandler {
  handle(input: ProcessedInput): Promise<ProcessedInput>;
}

/** CLI Handler - processes command-line style inputs */
class CLIHandler implements InputHandler {
  async handle(input: ProcessedInput): Promise<ProcessedInput> {
    const text = input.normalizedText.trim();

    // Parse CLI-style commands: /command [args]
    if (text.startsWith('/')) {
      const [command, ...args] = text.slice(1).split(/\s+/);
      input.metadata.cliCommand = command;
      input.metadata.cliArgs = args;
      input.metadata.isCommand = true;
    }

    // Parse flags: --key=value or --flag
    const flagPattern = /--(\w[\w-]*)(?:=(\S+))?/g;
    let match;
    const flags: Record<string, string> = {};
    while ((match = flagPattern.exec(text)) !== null) {
      flags[match[1]] = match[2] ?? 'true';
    }
    if (Object.keys(flags).length > 0) {
      input.metadata.flags = flags;
    }

    return input;
  }
}

/** Chat Handler - processes conversational natural language inputs */
class ChatHandler implements InputHandler {
  async handle(input: ProcessedInput): Promise<ProcessedInput> {
    // Chat-specific processing:
    // - Multi-turn context awareness
    // - Implicit intent resolution
    // - Conversational repair
    input.metadata.conversational = true;
    return input;
  }
}

/** API Handler - processes structured API requests */
class APIHandler implements InputHandler {
  async handle(input: ProcessedInput): Promise<ProcessedInput> {
    // Try to parse as JSON for structured requests
    try {
      const structured = JSON.parse(input.normalizedText);
      input.metadata.structured = true;
      input.metadata.structuredData = structured;
    } catch {
      // Not structured, treat as text
    }
    return input;
  }
}

/** Event Handler - processes events from monitoring systems */
class EventHandler implements InputHandler {
  async handle(input: ProcessedInput): Promise<ProcessedInput> {
    input.metadata.eventDriven = true;

    // Event-specific fields
    if (input.originalInput.eventData) {
      input.metadata.eventType = input.originalInput.eventData.type;
      input.metadata.eventSeverity = input.originalInput.eventData.severity;
      input.metadata.eventSource = input.originalInput.eventData.source;

      // Auto-escalate critical events
      if (input.originalInput.eventData.severity === 'critical') {
        input.metadata.autoEscalate = true;
        input.metadata.priority = 'critical';
      }
    }

    return input;
  }
}

// ============================================================================
// Preprocessors
// ============================================================================

interface InputPreprocessor {
  process(input: ProcessedInput): Promise<ProcessedInput>;
}

/** Detects input language (Chinese, English, mixed) */
class LanguageDetector implements InputPreprocessor {
  async process(input: ProcessedInput): Promise<ProcessedInput> {
    const text = input.normalizedText;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars === 0) {
      input.language = 'en';
    } else if (chineseChars / totalChars > 0.3) {
      input.language = chineseChars / totalChars > 0.7 ? 'zh' : 'mixed';
    } else {
      input.language = 'en';
    }

    return input;
  }
}

/** Normalizes telecom-specific terms and abbreviations */
class TelecomTermNormalizer implements InputPreprocessor {
  private termMap: Map<string, string> = new Map([
    // Chinese to standard terms
    ['小区', 'cell'],
    ['基站', 'site'],
    ['天线', 'antenna'],
    ['告警', 'alarm'],
    ['故障', 'fault'],
    ['割接', 'cutover'],
    ['扩容', 'capacity_expansion'],
    ['优化', 'optimization'],
    ['投诉', 'complaint'],
    ['离网', 'churn'],
    ['套餐', 'package'],
    // Abbreviations
    ['HO', 'handover'],
    ['HW', 'Huawei'],
    ['NE', 'network_element'],
    ['PM', 'performance_management'],
    ['FM', 'fault_management'],
    ['CM', 'configuration_management'],
  ]);

  async process(input: ProcessedInput): Promise<ProcessedInput> {
    // Detect telecom entities in text
    const entities: DetectedEntity[] = [];

    for (const [term, normalized] of this.termMap) {
      if (input.normalizedText.includes(term)) {
        entities.push({
          text: term,
          type: 'telecom_term',
          normalizedForm: normalized,
          confidence: 0.9,
        });
      }
    }

    // Detect cell IDs (pattern: digits with possible alphanumeric)
    const cellIdPattern = /\b([A-Z]{2,4}\d{4,8}[A-Z]?\d{0,2})\b/g;
    let match;
    while ((match = cellIdPattern.exec(input.normalizedText)) !== null) {
      entities.push({
        text: match[1],
        type: 'cell_id',
        normalizedForm: match[1],
        confidence: 0.8,
      });
    }

    // Detect IP addresses
    const ipPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
    while ((match = ipPattern.exec(input.normalizedText)) !== null) {
      entities.push({
        text: match[1],
        type: 'ip_address',
        normalizedForm: match[1],
        confidence: 0.95,
      });
    }

    input.detectedEntities.push(...entities);
    return input;
  }
}

/** Parses structured commands from natural language */
class CommandParser implements InputPreprocessor {
  private patterns: CommandPattern[] = [
    {
      pattern: /查询|query|show|display|get|获取/i,
      domain: 'cross_domain',
      action: 'query',
    },
    {
      pattern: /优化|optimize|tune|adjust|调整/i,
      domain: 'ran',
      action: 'optimize',
    },
    {
      pattern: /告警|alarm|alert|故障|fault/i,
      domain: 'cross_domain',
      action: 'diagnose',
    },
    {
      pattern: /规划|plan|design|设计/i,
      domain: 'ran',
      action: 'plan',
    },
    {
      pattern: /营销|market|campaign|推广|promote/i,
      domain: 'cross_domain',
      action: 'marketing',
    },
  ];

  async process(input: ProcessedInput): Promise<ProcessedInput> {
    for (const cmdPattern of this.patterns) {
      if (cmdPattern.pattern.test(input.normalizedText)) {
        input.suggestedDomain = cmdPattern.domain as import('../types').DomainType;
        input.metadata.suggestedAction = cmdPattern.action;
        break;
      }
    }
    return input;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export class IOECli {
  private inputRouter: InputRouter;

  constructor(inputRouter: InputRouter) {
    this.inputRouter = inputRouter;
  }

  /** Start the CLI interactive mode */
  async start(): Promise<void> {
    const session = this.inputRouter.createSession('cli_user', 'cli');

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  IOE - Intelligent Operations Engine                    ║');
    console.log('║  AI-Native Telecom Operations Harness                   ║');
    console.log('║                                                         ║');
    console.log('║  Commands:                                              ║');
    console.log('║    /help          - Show available commands              ║');
    console.log('║    /status        - Show system status                  ║');
    console.log('║    /agents        - List active agents                  ║');
    console.log('║    /simulate      - Run digital twin simulation         ║');
    console.log('║    /knowledge     - Search knowledge base               ║');
    console.log('║    /history       - Show task history                   ║');
    console.log('║    /quit          - Exit IOE                            ║');
    console.log('║                                                         ║');
    console.log('║  Or type naturally in Chinese/English to start a task   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // In production: readline loop for interactive CLI
    // For now, emit ready event
    this.inputRouter.emit('cli:ready', session);
  }
}

// ============================================================================
// Chat Entry Point
// ============================================================================

export class IOEChat {
  private inputRouter: InputRouter;

  constructor(inputRouter: InputRouter) {
    this.inputRouter = inputRouter;
  }

  /** Start the Chat interface (WebSocket/HTTP-based) */
  async start(port: number = 8080): Promise<void> {
    // In production: start WebSocket server for chat UI
    console.log(`IOE Chat interface starting on port ${port}`);
    this.inputRouter.emit('chat:ready', { port });
  }

  /** Process a chat message */
  async handleMessage(userId: string, message: string, attachments?: Attachment[]): Promise<string> {
    const rawInput: RawInput = {
      content: message,
      mode: 'chat',
      userId,
      attachments,
      timestamp: Date.now(),
    };

    const processed = await this.inputRouter.processInput(rawInput);
    // In production: forward to MainAgent and return response
    return `Processing: ${processed.normalizedText} [Domain: ${processed.suggestedDomain ?? 'auto'}]`;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

type InputMode = 'cli' | 'chat' | 'api' | 'event';

interface RawInput {
  content: string;
  mode: InputMode;
  userId: string;
  attachments?: Attachment[];
  eventData?: EventData;
  timestamp: number;
}

interface Attachment {
  type: 'image' | 'audio' | 'file' | 'data';
  data: string;
  mimeType: string;
  filename?: string;
}

interface EventData {
  type: string;
  severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
  source: string;
  data: Record<string, unknown>;
}

interface ProcessedInput {
  originalInput: RawInput;
  normalizedText: string;
  language: string;
  detectedEntities: DetectedEntity[];
  suggestedDomain: import('../types').DomainType | undefined;
  metadata: Record<string, unknown>;
}

interface DetectedEntity {
  text: string;
  type: string;
  normalizedForm: string;
  confidence: number;
}

interface InputSession {
  id: string;
  userId: string;
  mode: InputMode;
  startTime: number;
  lastActivity: number;
  history: ProcessedInput[];
  context: Record<string, unknown>;
}

interface CommandPattern {
  pattern: RegExp;
  domain: string;
  action: string;
}
