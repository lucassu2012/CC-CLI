/* ─── Lab Experiments: Real-world Telecom Scenarios powered by Gemma 4 ─── */

export interface ExperimentInput {
  label: string;
  labelZh: string;
  value: string;
}

export interface ReasoningStep {
  phase: string;
  phaseZh: string;
  detail: string;
  detailZh: string;
  duration: number; // ms
}

export interface ExperimentAction {
  en: string;
  zh: string;
}

export interface ImpactMetric {
  label: string;
  labelZh: string;
  value: string;
  color: string;
}

export interface LabExperiment {
  id: string;
  name: string;
  nameZh: string;
  domain: string;
  domainZh: string;
  icon: string; // lucide icon name
  color: string;
  loraAdapter: string;
  description: string;
  descriptionZh: string;
  problem: string;
  problemZh: string;
  inputs: ExperimentInput[];
  reasoning: ReasoningStep[];
  outputTitle: string;
  outputTitleZh: string;
  outputSummary: string;
  outputSummaryZh: string;
  actions: ExperimentAction[];
  impact: ImpactMetric[];
  runs: number;
  successRate: number;
  avgLatency: number; // ms
  productionDeployed: boolean;
}

export const labExperiments: LabExperiment[] = [
  /* ── 1. Alarm Storm Root Cause Analysis ── */
  {
    id: 'alarm-rca',
    name: 'Alarm Storm Root Cause',
    nameZh: '告警风暴根因分析',
    domain: 'Network Operations',
    domainZh: '运维管理',
    icon: 'AlertTriangle',
    color: '#ef4444',
    loraAdapter: 'Network Ops LoRA',
    description: 'Correlate hundreds of cascading alarms to a single root cause in seconds',
    descriptionZh: '在数秒内将上百条级联告警关联到单一根因',
    problem: '47 alarms triggered across 23 base stations in 5-minute window. Operator needs to identify the root cause immediately.',
    problemZh: '5分钟内23个基站触发47条告警，运维人员需要立即识别根因。',
    inputs: [
      { label: 'Alarm Count', labelZh: '告警数量', value: '47' },
      { label: 'Affected NEs', labelZh: '受影响网元', value: '23 sites' },
      { label: 'Time Window', labelZh: '时间窗口', value: '5 min' },
      { label: 'Severity Mix', labelZh: '严重程度', value: 'CRIT:12 / MAJR:28 / WARN:7' },
      { label: 'Region', labelZh: '区域', value: 'Shanghai-Pudong-East' },
    ],
    reasoning: [
      { phase: 'Cluster', phaseZh: '聚类', detail: 'Group 47 alarms by NE topology and timestamp using DBSCAN. Found 1 dominant cluster of 41 alarms.', detailZh: '基于网元拓扑和时间戳使用DBSCAN聚类47条告警，发现1个主要簇包含41条告警。', duration: 18 },
      { phase: 'Correlate', phaseZh: '关联', detail: 'Cross-reference cluster with topology graph. All 23 affected sites share upstream transmission path via SDH ring R1.', detailZh: '将告警簇与拓扑图关联，发现23个受影响站点共享通过 SDH 环 R1 的上游传输路径。', duration: 32 },
      { phase: 'Diagnose', phaseZh: '诊断', detail: 'Match pattern against historical fault library (RAG). Top match: SDH ring fiber break (94% similarity to incident #2024-1083).', detailZh: '将模式与历史故障库（RAG）匹配。最佳匹配: SDH 环光纤断裂（与事件 #2024-1083 相似度 94%）。', duration: 58 },
      { phase: 'Recommend', phaseZh: '建议', detail: 'Generate remediation plan: switch to backup ring R2, dispatch fiber repair team to suspected break location.', detailZh: '生成修复方案：切换到备份环 R2，派遣光纤抢修队到疑似断点位置。', duration: 41 },
    ],
    outputTitle: 'Root Cause Identified',
    outputTitleZh: '根因已识别',
    outputSummary: 'SDH transmission ring R1 fiber break between NE-SH-PD-001 and NE-SH-PD-007. 41 of 47 alarms are downstream symptoms.',
    outputSummaryZh: 'NE-SH-PD-001 与 NE-SH-PD-007 之间的 SDH 传输环 R1 光纤断裂。47 条告警中有 41 条为下游衍生症状。',
    actions: [
      { en: 'Auto-switch traffic to backup ring R2 (no impact)', zh: '自动切换流量到备份环 R2（无影响）' },
      { en: 'Dispatch fiber repair team to suspected break point', zh: '派遣光纤抢修队到疑似断点' },
      { en: 'Suppress 41 derived alarms, retain 6 independent', zh: '抑制 41 条衍生告警，保留 6 条独立告警' },
    ],
    impact: [
      { label: 'MTTR Reduced', labelZh: 'MTTR 降低', value: '47min → 8min', color: '#22c55e' },
      { label: 'Alarms Suppressed', labelZh: '告警抑制', value: '41 / 47', color: '#06b6d4' },
      { label: 'Service Impact', labelZh: '业务影响', value: 'Zero (auto-switched)', color: '#22c55e' },
    ],
    runs: 1247,
    successRate: 96.8,
    avgLatency: 149,
    productionDeployed: true,
  },

  /* ── 2. Coverage Hole Detection ── */
  {
    id: 'coverage-hole',
    name: 'Coverage Hole Detection',
    nameZh: '覆盖盲区检测',
    domain: 'Network Planning',
    domainZh: '网络规划',
    icon: 'MapPin',
    color: '#f97316',
    loraAdapter: 'Telecom Planning LoRA',
    description: 'Identify weak coverage zones from RSRP grid and complaint data, recommend new sites',
    descriptionZh: '从 RSRP 栅格和投诉数据识别弱覆盖区域，推荐新建站点',
    problem: 'District B has received 87 indoor coverage complaints in past 30 days. Identify coverage holes and propose new sites.',
    problemZh: 'B 区在过去 30 天收到 87 条室内覆盖投诉。识别覆盖盲区并提出新站建议。',
    inputs: [
      { label: 'Region', labelZh: '区域', value: 'District B (3.2 km²)' },
      { label: 'Complaints', labelZh: '投诉数量', value: '87 (30 days)' },
      { label: 'RSRP Grid', labelZh: 'RSRP 栅格', value: '12,800 measurement points' },
      { label: 'Existing Sites', labelZh: '现有站点', value: '14 macro + 6 small cell' },
    ],
    reasoning: [
      { phase: 'Heatmap', phaseZh: '热力图', detail: 'Generate RSRP heatmap from 12,800 grid points. Identified 3 zones with median RSRP < -110 dBm.', detailZh: '从 12,800 个栅格点生成 RSRP 热力图，识别 3 个中位 RSRP < -110 dBm 的区域。', duration: 24 },
      { phase: 'Correlate', phaseZh: '关联', detail: 'Cross-reference complaint locations with weak zones. 73 of 87 complaints fall within identified holes.', detailZh: '将投诉位置与弱覆盖区域关联，87 条投诉中有 73 条落在已识别盲区内。', duration: 19 },
      { phase: 'Optimize', phaseZh: '优化', detail: 'Run candidate site optimization (2 new pole sites + 1 small cell). Coverage simulation predicts 94% complaint resolution.', detailZh: '运行候选站址优化（2 个新杆站 + 1 个小微站）。覆盖仿真预测可解决 94% 投诉。', duration: 87 },
    ],
    outputTitle: '3 Coverage Holes Identified',
    outputTitleZh: '识别 3 个覆盖盲区',
    outputSummary: 'Largest hole at (31.234N, 121.456E), 0.8 km², 47 affected users. 2 new pole sites + 1 small cell would close all holes.',
    outputSummaryZh: '最大盲区位于 (31.234N, 121.456E)，0.8 km²，影响 47 用户。新建 2 个杆站 + 1 个小微站可关闭所有盲区。',
    actions: [
      { en: 'Submit site application: 2 pole sites at recommended coordinates', zh: '提交建站申请：在推荐坐标新建 2 个杆站' },
      { en: 'Deploy small cell at office tower lobby (high complaint density)', zh: '在办公楼大堂部署小微站（投诉密集区）' },
      { en: 'Schedule follow-up DT/CQT after deployment', zh: '部署后安排跟进 DT/CQT 测试' },
    ],
    impact: [
      { label: 'Complaints Resolved', labelZh: '投诉解决', value: '82 / 87 (94%)', color: '#22c55e' },
      { label: 'Coverage Gain', labelZh: '覆盖增益', value: '+11.2 dB avg', color: '#06b6d4' },
      { label: 'ROI Period', labelZh: '投资回收期', value: '14 months', color: '#eab308' },
    ],
    runs: 326,
    successRate: 92.4,
    avgLatency: 184,
    productionDeployed: true,
  },

  /* ── 3. VIP Churn Risk Scoring ── */
  {
    id: 'churn-risk',
    name: 'VIP Churn Risk Scoring',
    nameZh: 'VIP 离网风险评分',
    domain: 'Smart Marketing',
    domainZh: '智慧营销',
    icon: 'TrendingDown',
    color: '#eab308',
    loraAdapter: 'Smart Marketing LoRA',
    description: 'Multi-factor churn prediction integrating network experience, billing, and behavioral signals',
    descriptionZh: '整合网络体验、账单和行为信号的多因子离网预测',
    problem: 'VIP user (Diamond tier, 8 years) showed 35% MoU drop and filed 3 complaints. Predict churn risk and recommend retention.',
    problemZh: 'VIP 用户（钻石级，在网 8 年）通话量下降 35% 且发起 3 次投诉。预测离网风险并推荐挽留方案。',
    inputs: [
      { label: 'User Tier', labelZh: '用户等级', value: 'Diamond (Top 1%)' },
      { label: 'ARPU', labelZh: 'ARPU', value: '¥486 / month' },
      { label: 'MoU Trend', labelZh: '通话量趋势', value: '-35% (90 days)' },
      { label: 'Complaints', labelZh: '投诉记录', value: '3 unresolved (5G QoE)' },
      { label: 'NPS Score', labelZh: 'NPS 评分', value: '4 / 10 (Detractor)' },
    ],
    reasoning: [
      { phase: 'Profile', phaseZh: '画像', detail: 'Build 360° user profile from CRM, network experience metrics, and billing data. Detected 7 risk signals.', detailZh: '从 CRM、网络体验指标和账单数据构建 360° 用户画像，检测到 7 个风险信号。', duration: 32 },
      { phase: 'Score', phaseZh: '评分', detail: 'Apply churn prediction model with LoRA-fine-tuned features. Risk score: 78% (HIGH) with 91% confidence.', detailZh: '应用 LoRA 微调特征的离网预测模型。风险评分：78%（高）置信度 91%。', duration: 41 },
      { phase: 'Diagnose', phaseZh: '诊断', detail: 'Top drivers: (1) 5G QoE drop in workplace 47%, (2) unresolved complaints 28%, (3) competitor offer signal 18%.', detailZh: '主要驱动因素：(1) 工作地点 5G 体验下降 47%，(2) 未解决投诉 28%，(3) 竞争对手要约信号 18%。', duration: 38 },
      { phase: 'Recommend', phaseZh: '推荐', detail: 'Generate personalized retention package: VIP outreach call + workplace coverage fix + 6-month plan upgrade.', detailZh: '生成个性化挽留方案：VIP 外呼 + 工作地点覆盖修复 + 6 个月套餐升级。', duration: 53 },
    ],
    outputTitle: 'Churn Risk: 78% HIGH',
    outputTitleZh: '离网风险：78% 高危',
    outputSummary: 'Primary driver is workplace 5G coverage degradation. Combined retention package estimated to reduce risk to 21%.',
    outputSummaryZh: '主要驱动因素为工作地点 5G 覆盖恶化。综合挽留方案预计可将风险降至 21%。',
    actions: [
      { en: 'VIP outreach within 24h with personal apology', zh: '24 小时内 VIP 外呼并致歉' },
      { en: 'Schedule workplace indoor coverage optimization', zh: '安排工作地点室内覆盖优化' },
      { en: 'Offer 6-month plan upgrade + 30% loyalty discount', zh: '提供 6 个月套餐升级 + 30% 忠诚度折扣' },
    ],
    impact: [
      { label: 'Risk Reduction', labelZh: '风险降低', value: '78% → 21%', color: '#22c55e' },
      { label: 'Revenue Saved', labelZh: '挽回收入', value: '¥58,320 / 10 yr', color: '#06b6d4' },
      { label: 'Retention Cost', labelZh: '挽留成本', value: '¥1,200', color: '#eab308' },
    ],
    runs: 8420,
    successRate: 89.2,
    avgLatency: 164,
    productionDeployed: true,
  },

  /* ── 4. 5G Slice SLA Violation Recovery ── */
  {
    id: 'slice-sla',
    name: '5G Slice SLA Recovery',
    nameZh: '5G 切片 SLA 恢复',
    domain: 'Network Optimization',
    domainZh: '网络优化',
    icon: 'Zap',
    color: '#3b82f6',
    loraAdapter: 'Network Optimization LoRA',
    description: 'Detect SLA violations on URLLC slices and execute auto-recovery',
    descriptionZh: '检测 URLLC 切片 SLA 违规并执行自动恢复',
    problem: 'URLLC slice "Industrial-A" latency rose to 47ms (target ≤20ms). 14 enterprise customers affected. Restore SLA.',
    problemZh: 'URLLC 切片 "Industrial-A" 时延升至 47ms（目标 ≤20ms）。14 个企业客户受影响。恢复 SLA。',
    inputs: [
      { label: 'Slice ID', labelZh: '切片 ID', value: 'URLLC-Industrial-A' },
      { label: 'Current Latency', labelZh: '当前时延', value: '47ms (SLA: ≤20ms)' },
      { label: 'PRB Utilization', labelZh: 'PRB 利用率', value: '94% (gNB-001)' },
      { label: 'Affected Customers', labelZh: '受影响客户', value: '14 enterprise' },
      { label: 'Penalty Risk', labelZh: '违约风险', value: '¥120K / hour' },
    ],
    reasoning: [
      { phase: 'Localize', phaseZh: '定位', detail: 'Trace latency contribution across RAN/Core/Transport. RAN side dominates (38ms of 47ms) at gNB-PD-001.', detailZh: '追踪 RAN/核心/传输的时延贡献。RAN 侧主导（47ms 中 38ms）位于 gNB-PD-001。', duration: 28 },
      { phase: 'Analyze', phaseZh: '分析', detail: 'gNB-001 PRB at 94%, eMBB slice consuming 71%. URLLC starved by lower scheduling priority. Standard symptom.', detailZh: 'gNB-001 PRB 94%，eMBB 切片占用 71%。URLLC 因调度优先级较低被饿死。标准症状。', duration: 22 },
      { phase: 'Plan', phaseZh: '规划', detail: 'Generate 3 candidate fixes. Best: reallocate 30% PRB from eMBB to URLLC + raise URLLC scheduling weight to 90.', detailZh: '生成 3 种候选方案。最佳：将 30% PRB 从 eMBB 重分配给 URLLC + 提升 URLLC 调度权重至 90。', duration: 47 },
      { phase: 'Execute', phaseZh: '执行', detail: 'Push config to gNB-001 via NETCONF. Verify latency drop within 30s. Latency restored to 14ms after 22s.', detailZh: '通过 NETCONF 下发配置到 gNB-001。30 秒内验证时延下降。22 秒后时延恢复至 14ms。', duration: 22000 },
    ],
    outputTitle: 'SLA Restored in 22s',
    outputTitleZh: '22 秒内 SLA 恢复',
    outputSummary: 'Reallocated 30% PRB from eMBB to URLLC and raised URLLC scheduling weight. Latency: 47ms → 14ms (within SLA).',
    outputSummaryZh: '将 30% PRB 从 eMBB 重分配给 URLLC 并提升 URLLC 调度权重。时延：47ms → 14ms（满足 SLA）。',
    actions: [
      { en: 'Auto-applied: PRB reallocation on gNB-PD-001', zh: '已自动应用：gNB-PD-001 上的 PRB 重分配' },
      { en: 'Auto-applied: URLLC scheduling weight 70 → 90', zh: '已自动应用：URLLC 调度权重 70 → 90' },
      { en: 'Notify 14 enterprise customers of recovery', zh: '通知 14 个企业客户已恢复' },
    ],
    impact: [
      { label: 'Recovery Time', labelZh: '恢复时间', value: '22 seconds', color: '#22c55e' },
      { label: 'Penalty Avoided', labelZh: '避免违约金', value: '¥120K', color: '#06b6d4' },
      { label: 'eMBB Impact', labelZh: 'eMBB 影响', value: '<3% throughput', color: '#eab308' },
    ],
    runs: 542,
    successRate: 98.1,
    avgLatency: 138,
    productionDeployed: true,
  },

  /* ── 5. Complaint NLU & Intelligent Triage ── */
  {
    id: 'complaint-triage',
    name: 'Complaint Intelligent Triage',
    nameZh: '投诉智能分流',
    domain: 'User Experience',
    domainZh: '用户体验',
    icon: 'MessageSquare',
    color: '#ec4899',
    loraAdapter: 'User Experience LoRA',
    description: 'Parse free-text complaints, extract entities, classify intent, auto-route to teams',
    descriptionZh: '解析自由文本投诉，抽取实体，分类意图，自动路由到团队',
    problem: 'Customer complaint received via app: "我每天早上 8 点到 9 点在浦东软件园 B 座 18 楼开视频会议都卡顿，已经两周了，5G 信号显示满格但是卡。"',
    problemZh: '收到 APP 投诉：「我每天早上 8 点到 9 点在浦东软件园 B 座 18 楼开视频会议都卡顿，已经两周了，5G 信号显示满格但是卡。」',
    inputs: [
      { label: 'Channel', labelZh: '渠道', value: 'Mobile App' },
      { label: 'Language', labelZh: '语言', value: 'Chinese (Simplified)' },
      { label: 'Length', labelZh: '长度', value: '52 characters' },
      { label: 'User Tier', labelZh: '用户等级', value: 'Gold' },
    ],
    reasoning: [
      { phase: 'NER', phaseZh: '实体识别', detail: 'Extract: TIME(daily 8-9 AM) · LOCATION(浦东软件园 B 座 18 楼) · ISSUE(视频会议卡顿) · DURATION(2 weeks) · NETWORK(5G full bars).', detailZh: '抽取：时间(每日 8-9 点) · 地点(浦东软件园 B 座 18 楼) · 问题(视频会议卡顿) · 持续(2 周) · 网络(5G 满格).', duration: 24 },
      { phase: 'Classify', phaseZh: '分类', detail: 'Intent: Indoor Coverage Issue. Sub-category: Throughput Degradation (signal OK but speed poor). Confidence 96%.', detailZh: '意图：室内覆盖问题。子类：速率下降（信号正常但速度差）。置信度 96%。', duration: 18 },
      { phase: 'Diagnose', phaseZh: '诊断', detail: 'Cross-check cell load: gNB-PD-Tower-B@8AM has 89% PRB, indicates cell congestion during morning peak.', detailZh: '交叉检查小区负载：gNB-PD-Tower-B@8AM 时段 PRB 89%，表明早高峰小区拥塞。', duration: 31 },
      { phase: 'Route', phaseZh: '路由', detail: 'Route to: Indoor Optimization Team (East District). Priority: Major. SLA: 4 hours. Auto-create ticket #IDO-2026-0489.', detailZh: '路由至：室内优化组（东区）。优先级：重大。SLA：4 小时。自动创建工单 #IDO-2026-0489。', duration: 12 },
    ],
    outputTitle: 'Auto-Routed in 85ms',
    outputTitleZh: '85ms 内自动路由',
    outputSummary: 'Indoor congestion at Pudong Software Park Tower B 18F during 8-9 AM peak. Routed to Indoor Optimization Team with 4hr SLA.',
    outputSummaryZh: '浦东软件园 B 座 18 楼 8-9 点早高峰室内拥塞。已路由至室内优化组，4 小时 SLA。',
    actions: [
      { en: 'Created ticket #IDO-2026-0489 (Major)', zh: '已创建工单 #IDO-2026-0489（重大）' },
      { en: 'Assigned to Indoor Optimization Team (East)', zh: '已分配给室内优化组（东区）' },
      { en: 'Send acknowledgement SMS to user', zh: '向用户发送受理确认短信' },
    ],
    impact: [
      { label: 'Triage Time', labelZh: '分流耗时', value: '85ms vs 12min manual', color: '#22c55e' },
      { label: 'Routing Accuracy', labelZh: '路由准确率', value: '96.4%', color: '#06b6d4' },
      { label: 'Daily Throughput', labelZh: '日处理量', value: '12,400 complaints', color: '#8b5cf6' },
    ],
    runs: 38420,
    successRate: 96.4,
    avgLatency: 85,
    productionDeployed: true,
  },

  /* ── 6. Energy Saving Sleep Schedule ── */
  {
    id: 'energy-saving',
    name: 'Energy Saving Optimizer',
    nameZh: '节能优化',
    domain: 'Network Operations',
    domainZh: '运维管理',
    icon: 'Battery',
    color: '#22c55e',
    loraAdapter: 'Network Ops LoRA',
    description: 'Identify off-peak windows and generate cell sleep schedules with zero QoS impact',
    descriptionZh: '识别低谷时段并生成零 QoS 影响的小区休眠计划',
    problem: 'Operator wants to reduce RAN energy consumption by 15% without violating QoS SLAs. Generate citywide sleep schedule.',
    problemZh: '运营商希望在不违反 QoS SLA 的前提下降低 RAN 能耗 15%。生成全市休眠计划。',
    inputs: [
      { label: 'Cell Pool', labelZh: '小区池', value: '24,800 cells (citywide)' },
      { label: 'Traffic History', labelZh: '话务历史', value: '90 days hourly' },
      { label: 'QoS Constraint', labelZh: 'QoS 约束', value: 'PRB margin ≥ 30%' },
      { label: 'Target Saving', labelZh: '目标节能', value: '15% energy' },
    ],
    reasoning: [
      { phase: 'Analyze', phaseZh: '分析', detail: 'Cluster cells by traffic profile. Found 1,247 cells with stable 02:00-05:00 low utilization (<8%).', detailZh: '按话务模式聚类小区。发现 1,247 个小区在 02:00-05:00 持续低利用率（<8%）。', duration: 142 },
      { phase: 'Predict', phaseZh: '预测', detail: 'Forecast next 7 days traffic per cell. Validate sleep windows against forecast confidence interval.', detailZh: '预测每个小区未来 7 天话务量。基于预测置信区间验证休眠窗口。', duration: 218 },
      { phase: 'Optimize', phaseZh: '优化', detail: 'Generate per-cell sleep schedules. Constraint: ensure neighbor cell PRB margin ≥30% during sleep period.', detailZh: '生成每小区休眠计划。约束：休眠期间确保邻区 PRB 余量 ≥30%。', duration: 187 },
      { phase: 'Verify', phaseZh: '验证', detail: 'Run digital twin simulation. Result: 18.3% energy reduction, zero SLA violations across 1,247 cells.', detailZh: '运行数字孪生仿真。结果：节能 18.3%，1,247 个小区零 SLA 违规。', duration: 264 },
    ],
    outputTitle: '18.3% Energy Saving Achieved',
    outputTitleZh: '实现 18.3% 节能',
    outputSummary: '1,247 cells eligible for nightly sleep (02:00-05:00). Annual savings: 4.2 GWh, ¥3.8M, 2,940 tons CO2.',
    outputSummaryZh: '1,247 个小区符合夜间休眠（02:00-05:00）。年节省：4.2 GWh、380 万元、2,940 吨 CO2。',
    actions: [
      { en: 'Deploy sleep schedules to 1,247 cells (rolling 7 days)', zh: '将休眠计划下发到 1,247 个小区（7 天滚动）' },
      { en: 'Enable auto-wake on traffic spike (>20% PRB)', zh: '启用话务突增自动唤醒（>20% PRB）' },
      { en: 'Daily report to sustainability dashboard', zh: '每日上报至可持续发展仪表盘' },
    ],
    impact: [
      { label: 'Energy Saved', labelZh: '节省电量', value: '4.2 GWh / year', color: '#22c55e' },
      { label: 'Cost Saved', labelZh: '节省成本', value: '¥3.8M / year', color: '#06b6d4' },
      { label: 'CO2 Reduced', labelZh: 'CO2 减排', value: '2,940 tons / year', color: '#8b5cf6' },
    ],
    runs: 184,
    successRate: 99.5,
    avgLatency: 811,
    productionDeployed: true,
  },
];

/* ─── Lab production stats ─── */
export const labStats = {
  totalExperiments: labExperiments.length,
  totalRuns: labExperiments.reduce((sum, e) => sum + e.runs, 0),
  avgSuccessRate: Math.round(labExperiments.reduce((sum, e) => sum + e.successRate, 0) / labExperiments.length * 10) / 10,
  productionDeployed: labExperiments.filter(e => e.productionDeployed).length,
  todayRuns: 247,
};
