# IOE Architecture Deep Dive

## 1. System Architecture

### 1.1 Layered Architecture

IOE follows a 5-layer architecture:

```
Layer 5: Input Interface (Multi-modal entry points)
Layer 4: Agent Orchestration (Main Agent + Domain Agents)
Layer 3: Core Harness (TAOR, Context, Memory, Permissions, Hooks, Tools)
Layer 2: Integration (Data, OSS, Digital Twin, Knowledge)
Layer 1: Existing Systems (SmartCare, AUTIN, ADN, OSS/BSS)
```

### 1.2 Core Loop: TAOR (Think-Act-Observe-Repeat)

The TAOR loop is deliberately simple (~50 lines of core logic):

```
1. Build system prompt (NETWORK.md + compressed network state + tools)
2. Send messages[] to LLM API
3. Check stop_reason:
   - "tool_use" → execute tools → append results → goto 2
   - "end_turn" → task complete
4. Error recovery: compress → collapse → retry → fallback
```

Key design: The model decides what to do. The harness provides what to do it with.

### 1.3 Agent Hierarchy

```
Main Agent (Global Awareness, Safety, Evaluation)
│
├── Planning Agent
│   ├── Value Insight Sub-Agent
│   ├── Network Simulation Sub-Agent
│   ├── Market Revenue Sub-Agent
│   └── ROI Estimation Sub-Agent
│
├── Network Optimization Agent
│   ├── Realtime Optimization Sub-Agent
│   ├── Engineering Optimization Sub-Agent
│   └── Event Assurance Sub-Agent
│
├── Experience Assurance Agent
│   ├── Complaint Prevention Sub-Agent
│   ├── Differentiated Experience Sub-Agent
│   └── Deterministic Experience Sub-Agent
│
├── Network Operations Agent
│   ├── Operations Monitoring Sub-Agent
│   ├── Fault Analysis Sub-Agent
│   └── Field Maintenance Sub-Agent
│
└── Operations Support Agent
    ├── Prospect Identification Sub-Agent
    ├── Realtime Marketing Sub-Agent
    └── Churn Prevention Sub-Agent
```

### 1.4 Context Isolation

Each sub-agent gets a fresh messages[] array (isolated context window).
Only summaries return to the parent agent, protecting the main context budget.

This is critical for telecom operations where:
- PB-scale telemetry could overwhelm any context window
- Domain-specific analysis requires deep context
- Cross-domain synthesis requires broad context

## 2. Key Design Patterns

### 2.1 Separated Self-Evaluation

```
Generator Agent → Proposed Actions → Evaluator Agent → Validated Actions
                                          ↓
                                   Digital Twin Simulation
```

The evaluator has NO access to the generator's reasoning/confidence.
This prevents the "confidently praising mediocre work" failure mode.

### 2.2 Deny-First Permission Pipeline

```
Rule Evaluation Order: Deny → Ask → Allow (first match wins)

This ensures denied operations ALWAYS override allowed operations.
```

### 2.3 Digital Twin as Safety Gate

```
Action Proposed → Permission Check
                      ↓
              L1-L2: Auto-approve + log
              L3-L5: Digital Twin Simulation Required
                      ↓
              Simulation Result → Risk Assessment
                      ↓
              Low/Medium Risk: Proceed with monitoring
              High Risk: Human review required
              Critical Risk: Auto-abort
```

### 2.4 Async Mailbox Communication

Domain agents communicate via async mailboxes:
```
RAN Agent discovers backhaul issue → Message to Transport Agent
Transport Agent confirms link degradation → Message back to RAN Agent
Main Agent synthesizes: "Root cause is transport, not RAN"
```

### 2.5 Knowledge Auto-Learning Loop

```
Task Start → Agent Execution → Task Complete
                                    ↓
                            Auto-Generate Knowledge
                            - Incident record
                            - Resolution procedure
                            - Lessons learned
                                    ↓
                            Knowledge Base Update
                                    ↓
                            Dream Consolidation (periodic)
                            - Merge duplicates
                            - Update confidence
                            - Prune outdated
```

## 3. Integration Patterns

### 3.1 Overlay Architecture

IOE overlays on existing systems without modification:

```
IOE reads from SmartCare DataCube → via Shared Data Module (SQL/API)
IOE reads from AUTIN → via OSS Connector (MML/API)
IOE validates via ADN Digital Twin → via Digital Twin Engine (API)
IOE acts via OSS → via OSS Connector (command execution)
IOE tracks via Work Orders → via Ticketing Integration (API)
```

### 3.2 Protocol Support

| Protocol | Use Case | Data Type |
|----------|----------|-----------|
| Kafka | Real-time KPI/alarm streaming | Sub-second |
| gRPC | High-performance OSS/BSS calls | Near-real-time |
| REST | Web service integration | On-demand |
| SNMP | Network element management | Polling |
| NETCONF | Network configuration | On-demand |
| Database | SmartCare DataCube access | Batch/On-demand |

## 4. Security Model

### 4.1 Six-Layer Security Gate

Every tool call passes through:
1. Input validation (schema check)
2. Permission level check (L1-L5)
3. Policy evaluation (deny-first pipeline)
4. Maintenance window check
5. Digital twin pre-validation (L3+)
6. Audit logging

### 4.2 Regulatory Compliance

- User data anonymization for all analytics
- Spectrum regulation enforcement
- Change management audit trails
- Data sovereignty (on-premise deployment via Ascend)

## 5. Deployment Model

```
┌─────────────────────────────────┐
│      IOE Deployment Options      │
├─────────────────────────────────┤
│ Option A: On-Premise            │
│   - Ascend hardware             │
│   - Pangu telecom model local   │
│   - Full data sovereignty       │
├─────────────────────────────────┤
│ Option B: Hybrid Cloud          │
│   - IOE harness on-premise      │
│   - Model API in cloud          │
│   - Data stays local            │
├─────────────────────────────────┤
│ Option C: Edge + Central        │
│   - Edge IOE for real-time ops  │
│   - Central IOE for planning    │
│   - Federated knowledge base    │
└─────────────────────────────────┘
```
