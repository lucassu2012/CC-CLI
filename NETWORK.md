# NETWORK.md - IOE Network Knowledge Declaration
# This is the telecom equivalent of Claude Code's CLAUDE.md
# Engineers can edit this file to define network context without coding

# ============================================================================
# Network Topology & Domain Boundaries
# ============================================================================

## Network Overview
- Operator: [OPERATOR_NAME]
- Country/Region: [REGION]
- Network Generations: 4G LTE, 5G NR NSA/SA
- Total Sites: [NUMBER]
- Total Cells: [NUMBER]
- Coverage Area: [AREA_KM2] km²

## Domain Boundaries
- RAN: Radio Access Network (eNodeB, gNodeB)
- Transport: Backhaul and fronthaul network
- Core: EPC, 5GC (AMF, SMF, UPF)
- Fixed: Fixed broadband access
- Cloud: Cloud infrastructure and edge computing

## Regions
<!-- Define regions for regional operations -->
<!-- - Region_A: [description, site_count, priority] -->
<!-- - Region_B: [description, site_count, priority] -->

# ============================================================================
# SLA Requirements
# ============================================================================

## Service Tiers
- Premium (Top 5%): 95% deterministic experience, latency < 10ms
- Gold (Experience Boost): Differentiated QoS, prioritized scheduling
- Silver (Standard): Best-effort with minimum guarantees
- Bronze (Basic): Best-effort service

## KPI Thresholds
### RAN KPIs
- Call Setup Success Rate: warning > 98%, critical > 95%
- Handover Success Rate: warning > 97%, critical > 95%
- RRC Connection Success Rate: warning > 99%, critical > 97%
- Average DL Throughput: warning > 50 Mbps, critical > 20 Mbps
- Average UL Throughput: warning > 10 Mbps, critical > 5 Mbps
- PRB Utilization: warning < 80%, critical < 90%

### Core KPIs
- Registration Success Rate: warning > 99.9%, critical > 99%
- PDU Session Setup Success Rate: warning > 99%, critical > 98%

### Experience KPIs
- Video MOS: warning > 4.0, critical > 3.5
- Gaming Latency: warning < 50ms, critical < 100ms
- Web Page Load Time: warning < 2s, critical < 5s

# ============================================================================
# Escalation Policies
# ============================================================================

## Escalation Path
1. L1 (Monitoring Center) → Auto-resolved by IOE Ops Monitoring Agent
2. L2 (Domain Expert) → IOE Fault Analysis Agent + human expert
3. L3 (Senior Engineer) → Cross-domain analysis with human oversight
4. L4 (Management) → Service-affecting issues, major outages

## Escalation Triggers
- Critical alarm unresolved > 15 minutes → L2
- Major alarm unresolved > 1 hour → L2
- Service-affecting fault > 30 minutes → L3
- Multiple correlated alarms > 5 → L3
- Customer-reported issue > 2 hours → L4

# ============================================================================
# Prohibited Operations
# ============================================================================

## Never-Do Rules
- NEVER restart core network elements during peak hours (08:00-22:00)
- NEVER modify inter-RAT handover parameters without simulation
- NEVER disable alarm monitoring on any element
- NEVER exceed maximum power limits defined by regulatory authority
- NEVER change frequency allocation without spectrum coordination
- NEVER delete configuration backup before verification
- NEVER perform software upgrade without rollback plan
- NEVER modify 5QI parameters for Premium users without L4 approval

## Restricted Operations
- Cell shutdown: Only during maintenance window with traffic migration
- Power adjustment: Maximum ±3dB per iteration
- Tilt adjustment: Maximum ±2° per iteration
- Handover parameter change: Maximum ±3dB offset per iteration

# ============================================================================
# Maintenance Windows
# ============================================================================

## Regular Maintenance
- Weekly: Tuesday 02:00-06:00 (non-critical maintenance)
- Monthly: First Saturday 00:00-06:00 (firmware updates, major changes)

## Change Freeze Periods
<!-- Define periods when no changes are allowed -->
<!-- - Chinese New Year: [dates] -->
<!-- - Major Sports Events: [dates] -->
<!-- - National Holidays: [dates] -->

# ============================================================================
# Vendor-Specific Considerations
# ============================================================================

## Huawei Equipment
- MML command format for parameter queries
- U2020/iManager for batch operations
- NAIE for AI model deployment

## Multi-Vendor Notes
<!-- Add vendor-specific considerations here -->

# ============================================================================
# Regulatory Compliance
# ============================================================================

## Spectrum Regulations
- Maximum EIRP limits per band
- Spurious emission requirements
- Inter-operator coordination requirements

## Data Privacy
- User data anonymization required for all analytics
- Location data retention: maximum 90 days
- Call detail records: encrypted storage only

## Reporting Requirements
- Monthly KPI reports to regulatory authority
- Immediate notification for major outages (> 10,000 users affected)
- Annual spectrum usage report

# ============================================================================
# IOE Agent Behavior Configuration
# ============================================================================

## Agent Preferences
- Default language: Chinese (with English technical terms)
- Preferred optimization approach: Conservative (small incremental changes)
- Auto-remediation threshold: Only for L1/L2 risk operations
- Digital twin validation: Required for all L3+ operations
- Knowledge base auto-update: Enabled after every task closure
- Separated evaluation: Enabled (Generator/Evaluator pattern)

## Integration Endpoints
<!-- Configure connections to existing systems -->
<!-- - SmartCare: [endpoint] -->
<!-- - AUTIN: [endpoint] -->
<!-- - Work Order System: [endpoint] -->
<!-- - CRM: [endpoint] -->
