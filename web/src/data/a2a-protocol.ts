/**
 * A2A-T (Agent-to-Agent Telecom) Protocol — collaboration data types and defaults
 */

export type A2AMessageType =
  | 'task-delegate'
  | 'context-share'
  | 'result-report'
  | 'conflict-escalate'
  | 'conflict-resolve'
  | 'peer-request'
  | 'peer-response';

export interface A2AMessage {
  id: string;
  timestamp: string;
  type: A2AMessageType;
  from: string;
  to: string;
  subject: string;
  subjectZh: string;
  payload?: string;
  payloadZh?: string;
  status: 'sent' | 'delivered' | 'processing' | 'completed';
}

export interface CollaborationEvent {
  id: string;
  timestamp: string;
  type: 'delegation' | 'context-sync' | 'conflict' | 'resolution' | 'completion' | 'escalation';
  agents: string[];
  description: string;
  descriptionZh: string;
}

export interface SharedContextEntry {
  id: string;
  key: string;
  keyZh: string;
  value: string;
  valueZh: string;
  source: string;
  consumers: string[];
  updatedAt: string;
}

export interface ConflictResolution {
  id: string;
  timestamp: string;
  conflictingAgents: string[];
  issue: string;
  issueZh: string;
  resolution: string;
  resolutionZh: string;
  decision: 'priority-override' | 'parameter-merge' | 'sequential-execution' | 'rollback';
}

/* ─── Default data for routine mode ─── */

export const defaultA2AMessages: A2AMessage[] = [
  { id: 'a2a-1', timestamp: '14:23:05', type: 'task-delegate', from: 'ioe-supervisor', to: 'optimization', subject: 'Start daily optimization cycle #1247', subjectZh: '启动日常优化周期 #1247', status: 'completed' },
  { id: 'a2a-2', timestamp: '14:23:06', type: 'peer-request', from: 'optimization', to: 'ops', subject: 'Request current alarm status for GD region', subjectZh: '请求广东区域当前告警状态', status: 'completed' },
  { id: 'a2a-3', timestamp: '14:23:07', type: 'peer-response', from: 'ops', to: 'optimization', subject: 'GD region: 32 active alarms, no critical', subjectZh: '广东区域：32条活跃告警，无严重告警', status: 'completed' },
  { id: 'a2a-4', timestamp: '14:23:08', type: 'context-share', from: 'experience', to: 'ioe-supervisor', subject: 'Updated user QoE baseline for all regions', subjectZh: '更新所有区域用户QoE基线', status: 'completed' },
  { id: 'a2a-5', timestamp: '14:23:10', type: 'task-delegate', from: 'ioe-supervisor', to: 'planning', subject: 'Evaluate capacity for Tianhe district 5G expansion', subjectZh: '评估天河区5G扩容容量', status: 'processing' },
  { id: 'a2a-6', timestamp: '14:23:12', type: 'peer-request', from: 'marketing', to: 'experience', subject: 'Request churn risk scores for campaign targeting', subjectZh: '请求流失风险评分用于营销定向', status: 'completed' },
  { id: 'a2a-7', timestamp: '14:23:14', type: 'result-report', from: 'optimization', to: 'ioe-supervisor', subject: 'Cycle #1247 batch 1 complete: 50 cells optimized, KPI +2.1%', subjectZh: '周期 #1247 批次1完成：50小区优化，KPI +2.1%', status: 'completed' },
  { id: 'a2a-8', timestamp: '14:23:16', type: 'conflict-escalate', from: 'optimization', to: 'ioe-supervisor', subject: 'Parameter conflict: coverage vs capacity on cells BY-042~045', subjectZh: '参数冲突：BY-042~045小区覆盖与容量矛盾', status: 'processing' },
  { id: 'a2a-9', timestamp: '14:23:18', type: 'conflict-resolve', from: 'ioe-supervisor', to: 'optimization', subject: 'Resolution: prioritize coverage, cap capacity loss at 5%', subjectZh: '决策：优先覆盖，容量损失不超5%', status: 'completed' },
  { id: 'a2a-10', timestamp: '14:23:20', type: 'task-delegate', from: 'ioe-supervisor', to: 'marketing', subject: 'Launch churn prevention micro-campaign for Baiyun district', subjectZh: '启动白云区离网微营销活动', status: 'processing' },
];

export const defaultCollaborationEvents: CollaborationEvent[] = [
  { id: 'ce-1', timestamp: '14:23:05', type: 'delegation', agents: ['ioe-supervisor', 'optimization'], description: 'Supervisor delegated daily optimization cycle #1247 to Optimization Agent', descriptionZh: 'Supervisor 将日常优化周期 #1247 委派给优化Agent' },
  { id: 'ce-2', timestamp: '14:23:06', type: 'context-sync', agents: ['optimization', 'ops'], description: 'Optimization requested alarm context from O&M → received GD region status', descriptionZh: '优化Agent 向运维Agent 请求告警上下文 → 收到广东区域状态' },
  { id: 'ce-3', timestamp: '14:23:08', type: 'context-sync', agents: ['experience', 'ioe-supervisor'], description: 'Experience Agent synced QoE baseline update to shared context pool', descriptionZh: '体验Agent 将QoE基线更新同步到共享上下文池' },
  { id: 'ce-4', timestamp: '14:23:10', type: 'delegation', agents: ['ioe-supervisor', 'planning'], description: 'Supervisor assigned Tianhe 5G capacity evaluation to Planning Agent', descriptionZh: 'Supervisor 将天河区5G容量评估分配给规划Agent' },
  { id: 'ce-5', timestamp: '14:23:12', type: 'context-sync', agents: ['marketing', 'experience'], description: 'Marketing requested churn risk data from Experience Agent for targeting', descriptionZh: '营销Agent 向体验Agent 请求流失风险数据用于定向' },
  { id: 'ce-6', timestamp: '14:23:14', type: 'completion', agents: ['optimization', 'ioe-supervisor'], description: 'Optimization completed batch 1: 50 cells, KPI improvement +2.1%', descriptionZh: '优化Agent 完成批次1：50小区，KPI提升 +2.1%' },
  { id: 'ce-7', timestamp: '14:23:16', type: 'conflict', agents: ['optimization'], description: 'Parameter conflict detected: coverage vs capacity on BY-042~045', descriptionZh: '检测到参数冲突：BY-042~045 覆盖与容量矛盾' },
  { id: 'ce-8', timestamp: '14:23:18', type: 'resolution', agents: ['ioe-supervisor', 'optimization'], description: 'Supervisor resolved conflict: prioritize coverage, cap capacity loss at 5%', descriptionZh: 'Supervisor 解决冲突：优先覆盖，容量损失上限5%' },
  { id: 'ce-9', timestamp: '14:23:20', type: 'delegation', agents: ['ioe-supervisor', 'marketing'], description: 'Supervisor launched churn prevention micro-campaign via Marketing Agent', descriptionZh: 'Supervisor 通过营销Agent 启动离网微营销活动' },
  { id: 'ce-10', timestamp: '14:23:22', type: 'context-sync', agents: ['planning', 'optimization', 'experience'], description: 'Planning shared Tianhe capacity forecast → consumed by Optimization & Experience', descriptionZh: '规划Agent 共享天河容量预测 → 优化Agent 和体验Agent 消费' },
];

export const defaultSharedContext: SharedContextEntry[] = [
  { id: 'sc-1', key: 'Network Health Index', keyZh: '网络健康指数', value: '97.2% — 32 active alarms, 0 critical', valueZh: '97.2% — 32条活跃告警，0条严重', source: 'ops', consumers: ['optimization', 'experience', 'ioe-supervisor'], updatedAt: '14:23:07' },
  { id: 'sc-2', key: 'QoE Baseline (All Regions)', keyZh: 'QoE基线（全区域）', value: 'Avg MOS 4.2, P95 latency 18ms, video MOS 4.5', valueZh: '平均MOS 4.2，P95时延18ms，视频MOS 4.5', source: 'experience', consumers: ['optimization', 'marketing', 'ioe-supervisor'], updatedAt: '14:23:08' },
  { id: 'sc-3', key: 'Tianhe 5G Capacity', keyZh: '天河区5G容量', value: 'Current: 78% utilization, forecast +15% in 30 days', valueZh: '当前：78%利用率，预测30天增长15%', source: 'planning', consumers: ['optimization', 'experience'], updatedAt: '14:23:22' },
  { id: 'sc-4', key: 'Churn Risk Cohort', keyZh: '流失风险群体', value: '238 high-value users, avg risk score 0.72', valueZh: '238位高价值用户，平均风险分0.72', source: 'marketing', consumers: ['experience', 'ioe-supervisor'], updatedAt: '14:23:12' },
  { id: 'sc-5', key: 'Optimization Cycle Status', keyZh: '优化周期状态', value: 'Cycle #1247: batch 1/3 done, 50/150 cells', valueZh: '周期 #1247：批次1/3完成，50/150小区', source: 'optimization', consumers: ['ops', 'ioe-supervisor'], updatedAt: '14:23:14' },
  { id: 'sc-6', key: 'Active SLA Violations', keyZh: '活跃SLA违规', value: '0 enterprise, 2 gold-tier (auto-remediation in progress)', valueZh: '0企业客户，2金卡用户（自动修复中）', source: 'experience', consumers: ['ops', 'marketing', 'ioe-supervisor'], updatedAt: '14:23:10' },
];

export const defaultConflictResolutions: ConflictResolution[] = [
  { id: 'cr-1', timestamp: '14:23:18', conflictingAgents: ['optimization', 'experience'], issue: 'Optimization wants to reduce Tx power on BY-042 for interference mitigation, but Experience reports VIP users on that cell', issueZh: '优化Agent 要降低BY-042发射功率以抑制干扰，但体验Agent 报告该小区有VIP用户', resolution: 'Reduce Tx power by 1dB (not 3dB), activate QoS bearer for VIP users first', resolutionZh: '发射功率仅降低1dB（非3dB），先为VIP用户激活QoS承载', decision: 'parameter-merge' },
  { id: 'cr-2', timestamp: '14:18:42', conflictingAgents: ['planning', 'optimization'], issue: 'Planning recommends activating new site GD-NEW-003, Optimization wants to delay until current cycle completes', issueZh: '规划Agent 建议激活新站GD-NEW-003，优化Agent 要求等当前周期完成', resolution: 'Delay activation by 2 hours until cycle #1247 completes, then proceed', resolutionZh: '延迟2小时等周期 #1247 完成后再激活', decision: 'sequential-execution' },
  { id: 'cr-3', timestamp: '14:10:15', conflictingAgents: ['marketing', 'ops'], issue: 'Marketing wants to push campaign SMS to 5000 users, O&M reports BSS interface at 85% load', issueZh: '营销Agent 要向5000用户推送营销短信，运维Agent 报告BSS接口负载85%', resolution: 'Throttle campaign to 500 users/batch with 5min intervals, monitor BSS load', resolutionZh: '限制为500用户/批，间隔5分钟，监控BSS负载', decision: 'parameter-merge' },
];
