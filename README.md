**English** | [中文](./README_zh.md)

# IOE - Intelligent Operations Engine
online demo: https://lucassu2012.github.io/CC-CLI/

**AI-Native Agent Harness for Telecom Network Operations & Market Operations**

IOE is a lightweight, overlay Agent Harness platform that gives existing telecom systems (SmartCare, AUTIN, etc.) AI-powered reasoning capabilities — without replacing them. Built on battle-tested patterns from Claude Code's Agent Harness architecture, IOE applies the "model is the CPU, harness is the OS" philosophy to telecommunications.

> "The best agent product is built by engineers who understand that their job is the Harness, not the Intelligence."

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IOE - Intelligent Operations Engine              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Multi-Modal Input Layer                        │   │
│  │              CLI  │  Chat  │  API  │  Event Listener              │   │
│  └──────────────────────┬───────────────────────────────────────────┘   │
│                          │                                               │
│  ┌──────────────────────▼───────────────────────────────────────────┐   │
│  │                     Main Agent Orchestrator                       │   │
│  │         Intent Understanding │ Task Decomposition │ DAG Execution │   │
│  │         Global Awareness │ Safety │ Separated Evaluation          │   │
│  └──┬────────┬────────┬────────┬────────┬───────────────────────────┘   │
│     │        │        │        │        │                                │
│  ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐    Domain Agents            │
│  │Plan │ │Optim│ │Exper│ │ Ops │ │Mktg │    (Isolated Context)        │
│  │Agent│ │Agent│ │Agent│ │Agent│ │Agent│                               │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                              │
│     │        │        │        │        │     16 Sub-Agents              │
│  ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐                             │
│  │4 sub│ │3 sub│ │3 sub│ │3 sub│ │3 sub│                               │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Core Harness Layer                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ TAOR Loop│ │ Context  │ │ Memory   │ │Permission│            │   │
│  │  │  Engine  │ │ Engine   │ │ 6-Layer  │ │  L1-L5   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │  Hook    │ │  Tool    │ │ Digital  │ │Knowledge │            │   │
│  │  │  Engine  │ │ Registry │ │  Twin    │ │  Base    │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Integration Layer                               │   │
│  │  Shared Data Module │ OSS Connector │ External Systems             │   │
│  │  Kafka│gRPC│REST│SNMP│NETCONF│DB │ Ticketing│CRM│Inventory        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │               Existing Telecom Systems (Overlay Target)           │   │
│  │        SmartCare  │  AUTIN  │  ADN  │  OSS/BSS  │  NMS           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Design Philosophy

IOE follows seven Harness Engineering principles distilled from Claude Code and industry best practices:

| # | Principle | IOE Implementation |
|---|-----------|-------------------|
| 1 | **Context is the scarcest resource** | Multi-strategy compression engine (Auto/Snip/Collapse/Micro), 92% threshold trigger |
| 2 | **Primitives over integrations** | ~18 composable telecom tool primitives instead of hundreds of specialized connectors |
| 3 | **Shrinking harness** | Feature flags on all scaffolding; designed for removal as models improve |
| 4 | **Separated self-evaluation** | Generator/Evaluator pattern — different agents create and assess actions |
| 5 | **Fail-safe permissions** | Deny-first L1-L5 trust hierarchy with digital twin pre-validation |
| 6 | **Deterministic hooks around non-deterministic LLM** | 21 lifecycle events, 4 handler types |
| 7 | **Design for deletion** | Every decision tree, workflow, and rule has an expiry checkpoint |

## Key Features

### 1. TAOR Loop Engine
The deliberate "dumb loop" that drives all agent behavior:
```
Think → Act → Observe → Repeat (until complete)
```
- Model-driven decisions (no hardcoded workflow constraints)
- Streaming tool execution (tools start while model outputs)
- Read-only tools run concurrently (up to 10), write tools serial
- Multi-strategy error recovery with exponential backoff

### 2. Five Domain Agents + 16 Sub-Agents

**Planning Agent** — Network planning with market-network synergy
- Value Insight Agent: Business opportunity discovery, traffic prediction
- Network Simulation Agent: Coverage/capacity/performance simulation
- Market Revenue Prediction Agent: ROI from network investment
- ROI Estimation Agent: Comprehensive investment analysis

**Network Optimization Agent** — Full-network automated optimization
- Realtime Optimization Agent: Live parameter tuning for optimal KPI
- Engineering Optimization Agent: New site/cell parameter optimization
- Event Assurance Agent: Surge traffic handling (concerts, sports)

**Experience Assurance Agent** — Proactive user experience management
- Complaint Prevention Agent: Pre-emptive issue detection and care
- Differentiated Experience Agent: 5QI/scheduling priority management
- Deterministic Experience Agent: Network-follows-user for top 5%

**Network Operations Agent** — Proactive maintenance and fault management
- Operations Monitoring Agent: Real-time monitoring and auto-remediation
- Fault Analysis Agent: Cross-domain root cause analysis
- Field Maintenance Agent: On-site repair guidance

**Operations Support Agent** — Intelligent marketing decision support
- Prospect Identification Agent: Precision customer targeting
- Realtime Marketing Agent: Moment-of-need marketing triggers
- Churn Prevention Agent: Predictive retention campaigns

### 3. NETWORK.md Standard
The telecom equivalent of Claude Code's CLAUDE.md — a declarative, engineer-editable file defining:
- Network topology and domain boundaries
- SLA requirements and KPI thresholds
- Escalation policies and paths
- Prohibited operations ("never restart core during peak")
- Maintenance windows and change freeze periods
- Vendor-specific considerations
- Regulatory compliance requirements

### 4. L1-L5 Permission Model with Digital Twin Validation

| Level | Operations | Approval |
|-------|-----------|----------|
| L1 Read-only | Query KPI, view alarms, read config | Always allowed |
| L2 Low-risk | Create tickets, safe-range parameter adjustment | Auto-approve + log |
| L3 Medium | Config changes, traffic rerouting | Human approval required |
| L4 High-risk | Device restart, service-affecting changes | Senior approval + digital twin sim |
| L5 Emergency | Critical fault bypass | Forced post-audit |

### 5. Context Compression Engine
Four compression strategies managing PB-scale telecom telemetry:
- **AutoCompact**: Triggers at 92% context window, 6.8x compression, <3% semantic loss
- **SnipCompact**: Truncates beyond boundary, preserves assistant's "protected tail"
- **ContextCollapse**: Lazy-committed, activates only on 413 errors
- **MicroCompression**: Continuous background — time-based expiry, size-based truncation

### 6. 6-Layer Memory with Dream Consolidation
| Layer | Content |
|-------|---------|
| L1 Managed | Enterprise/MDM policies |
| L2 Project | NETWORK.md at project root |
| L3 Rules | Domain-specific rules |
| L4 User | Operator preferences |
| L5 Local | Per-directory auto-discovery |
| L6 Dream | Auto-generated from Dream system |

Dream consolidation runs as a background process:
Orient → Gather → Consolidate → Prune (keeps index under 200 lines / ~25KB)

### 7. Auto-Learning Knowledge Base
Every task closure automatically generates knowledge entries:
- Incident records with root cause and resolution
- Verified resolution procedures
- Lessons learned
- Periodic consolidation merges duplicates and prunes outdated entries

### 8. Digital Twin Pre-Validation
All L3+ operations MUST pass digital twin simulation before execution:
- Coverage, capacity, performance, experience simulation
- Configuration change impact prediction
- Failure injection for resilience testing
- Risk assessment with auto-abort on critical risk

### 9. Hook System (21 Lifecycle Events)
Deterministic guarantees around non-deterministic LLM reasoning:

| Hook Type | Telecom Application |
|-----------|-------------------|
| Pre-Action | Validate config against compliance; check change window |
| Post-Action | Log to audit trail; trigger monitoring |
| Safety | Simulate on digital twin before any write |
| Regulatory | Ensure local telecom regulation compliance |

### 10. Multi-Protocol Data Integration
Connects to legacy systems through standard protocols:
Kafka, gRPC, REST, SNMP, NETCONF, Database

Supports both real-time (sub-second) and non-real-time data ingestion.

## Project Structure

```
src/
├── core/                    # Core engine
│   ├── taor-loop.ts         # TAOR loop engine (Think-Act-Observe-Repeat)
│   ├── query-engine.ts      # Session state manager (singleton)
│   └── main-agent.ts        # Main Agent orchestrator + domain agent definitions
├── agents/                  # Domain agent implementations
│   ├── planning/            # Planning domain
│   ├── network-optimization/# Optimization domain
│   ├── experience-assurance/# Experience domain
│   ├── network-ops/         # Operations domain
│   └── operations-support/  # Marketing domain
├── tools/                   # Tool system
│   ├── tool-registry.ts     # Tool registry + base tool + deferred loading
│   └── telecom-tools.ts     # Telecom-specific tool implementations
├── context/                 # Context management
│   └── context-engine.ts    # Multi-strategy compression engine
├── memory/                  # Memory system
│   └── memory-system.ts     # 6-layer hierarchy + Dream engine
├── permissions/             # Permission model
│   └── permission-engine.ts # L1-L5 trust hierarchy
├── hooks/                   # Hook system
│   └── hook-engine.ts       # 21 lifecycle events, 4 handler types
├── data/                    # Data access
│   └── shared-data-module.ts# Multi-protocol data integration
├── digital-twin/            # Digital twin
│   └── digital-twin-engine.ts# Simulation and pre-validation
├── knowledge/               # Knowledge base
│   └── knowledge-base.ts    # Auto-learning knowledge system
├── integration/             # External integration
│   └── oss-connector.ts     # OSS/BSS/ticketing integration
├── input/                   # Input interfaces
│   └── multi-modal-input.ts # CLI, Chat, API, Event handlers
├── config/                  # Configuration
│   └── ioe-config.ts        # Cascaded config resolution
├── types/                   # Type definitions
│   └── index.ts             # Core type system
├── index.ts                 # Main entry + IOEApplication bootstrap
├── cli.ts                   # CLI entry point
└── chat.ts                  # Chat entry point
```

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start CLI
npm run dev
# or
ioe

# Start Chat interface
npm run chat
# or
ioe-chat
```

## Configuration

IOE uses a cascaded configuration system:
```
Enterprise Policy → Operator Config → Project NETWORK.md → User Prefs → Defaults
```

Configure via environment variables:
```bash
IOE_OPERATOR_NAME="China Mobile"
IOE_REGION="guangdong"
IOE_MODEL_ID="pangu-telecom-72b"
IOE_CHAT_PORT=8080
```

Or programmatically:
```typescript
import { IOEApplication } from '@ioe/intelligent-operations-engine';

const app = new IOEApplication({
  operatorName: 'China Mobile',
  region: 'guangdong',
  defaultModelId: 'pangu-telecom-72b',
  digitalTwinEnabled: true,
  separatedEvaluation: true,
});

await app.initialize();
await app.startCli();
```

## Relationship to Existing Systems

```
IOE does NOT replace existing systems. It overlays on them.

┌─────────────────────────┐
│         IOE             │  ← AI reasoning layer (new)
│   Agent Harness         │
├─────────────────────────┤
│  SmartCare │ AUTIN │ADN │  ← Existing products (unchanged)
│  DataCube  │ 900+APP│DT │
├─────────────────────────┤
│  Network Elements       │  ← Physical/virtual network
│  eNB │ gNB │ Core │ TN  │
└─────────────────────────┘
```

- **SmartCare**: Provides DataCube (200+ topic domains), experience analytics → IOE accesses via Shared Data Module
- **AUTIN**: Provides 900+ APPs, fault management, maintenance workflows → IOE accesses via OSS Connector
- **ADN**: Provides digital twin simulation environment → IOE uses for pre-action validation

## Competitive Advantages

| Asset | Description | Moat |
|-------|-------------|------|
| GTS-LLM-s Large Model | 718B parameter telecom-specialized model | Only comparable self-developed telecom large mdoel |
| 30+ years domain knowledge | 900+ APPs | Years of competitive head start |
| Digital Twin | DTN + Experience + User digital twin | Pre-action validation hooks |
| Full-stack AI hardware | Ascend chips | On-premise deployment + data sovereignty |

## Design for the Future

Following the "Shrinking Harness" principle, IOE's scaffolding is designed to be progressively removed:

```typescript
featureFlags: {
  'use_decision_tree_fallback': true,    // Remove when model handles all cases
  'enforce_parameter_limits': true,       // Remove when model learns limits
  'require_manual_approval_l3': true,     // Reduce as trust increases
}
```

Every hardcoded workflow, decision tree, and diagnostic procedure should have an expiry date and be re-tested against newer model capabilities.

## License

Proprietary - All rights reserved.
