export interface SupervisorAgent {
  id: 'ioe-supervisor';
  name: string;
  nameZh: string;
  status: 'active' | 'idle' | 'emergency';
  mode: 'routine' | 'emergency';
  activePlan: string;
  activePlanZh: string;
  tasksCoordinated: number;
  conflictsResolved: number;
  contextSyncs: number;
  uptime: string;
}

export const defaultSupervisor: SupervisorAgent = {
  id: 'ioe-supervisor',
  name: 'IOE-Supervisor',
  nameZh: 'IOE-Supervisor',
  status: 'active',
  mode: 'routine',
  activePlan: 'Daily optimization cycle #1247 — coordinate network-wide parameter tuning across 5 domain agents',
  activePlanZh: '日常优化周期 #1247 — 协调5个领域Agent完成全网参数调优',
  tasksCoordinated: 12847,
  conflictsResolved: 342,
  contextSyncs: 8923,
  uptime: '99.97%',
};

export interface SubAgent {
  id: string;
  name: string;
  nameZh: string;
  status: 'active' | 'idle' | 'error' | 'warning';
  currentTask: string;
  currentTaskZh: string;
  toolCalls: number;
  successRate: number;
  permissionLevel: number;
}

export interface DomainAgent {
  id: string;
  name: string;
  nameZh: string;
  domain: string;
  domainZh: string;
  status: 'active' | 'warning' | 'error' | 'idle';
  description: string;
  descriptionZh: string;
  taskCount: number;
  successRate: number;
  subAgents: SubAgent[];
}

export const domainAgents: DomainAgent[] = [
  {
    id: 'planning',
    name: 'Planning Agent',
    nameZh: '规划智能体',
    domain: 'Planning',
    domainZh: '规划',
    status: 'active',
    description: 'Network planning driven by market synergy — combines business insights, network simulation, market revenue forecasting, and ROI analysis for optimal investment decisions',
    descriptionZh: '商网协同的网络规划，综合商业洞察、网络仿真、市场收益预测和投资回报分析，给出最优规划方案',
    taskCount: 892,
    successRate: 97.6,
    subAgents: [
      { id: 'value-insight', name: 'Value Insight Agent', nameZh: '价值洞察子Agent', status: 'active', currentTask: 'Analyzing 5G user distribution in Tianhe district', currentTaskZh: '分析天河区5G价值用户分布', toolCalls: 12450, successRate: 98.2, permissionLevel: 2 },
      { id: 'network-sim', name: 'Network Simulation Agent', nameZh: '网络仿真子Agent', status: 'active', currentTask: 'Running coverage & capacity simulation for new sites', currentTaskZh: '新站覆盖容量仿真中，支持差异化体验仿真', toolCalls: 8934, successRate: 96.8, permissionLevel: 3 },
      { id: 'market-revenue', name: 'Market Revenue Forecast Agent', nameZh: '市场收益预测子Agent', status: 'active', currentTask: 'Predicting 5G package subscribers post-deployment', currentTaskZh: '预测建设后5G套餐发展用户数及体验加速套餐收益', toolCalls: 6723, successRate: 97.1, permissionLevel: 2 },
      { id: 'roi-estimate', name: 'ROI Estimation Agent', nameZh: '收益预估子Agent', status: 'idle', currentTask: 'Generating multi-scenario ROI report', currentTaskZh: '生成多方案投资收益ROI报告及组合建议', toolCalls: 4567, successRate: 98.5, permissionLevel: 3 },
    ],
  },
  {
    id: 'optimization',
    name: 'Network Optimization Agent',
    nameZh: '网络优化智能体',
    domain: 'Optimization',
    domainZh: '优化',
    status: 'active',
    description: 'Full-network automatic optimization at cell/grid/network level — resolves parameter conflicts across coverage, rate, and complaint tasks for globally optimal KPIs',
    descriptionZh: '面向全网全量自动优化，小区级/网格级/整网级综合优化，解决优化任务参数冲突，实现整体KPI最优',
    taskCount: 1563,
    successRate: 98.1,
    subAgents: [
      { id: 'realtime-opt', name: 'Real-time Optimization Agent', nameZh: '实时优化子Agent', status: 'active', currentTask: 'Adjusting coverage/power/load/handover parameters', currentTaskZh: '实时调整覆盖、功率、负荷、切换参数，整体KPI最优', toolCalls: 18923, successRate: 98.5, permissionLevel: 3 },
      { id: 'engineering-opt', name: 'Engineering Optimization Agent', nameZh: '工程优化子Agent', status: 'active', currentTask: 'Tuning newly activated cells for max synergy', currentTaskZh: '新开通站点参数调优，与周边小区协同发挥最大性能', toolCalls: 9876, successRate: 97.3, permissionLevel: 3 },
      { id: 'event-assure', name: 'Event Assurance Agent', nameZh: '事件保障子Agent', status: 'idle', currentTask: 'Standby for surge traffic events', currentTaskZh: '待命，随时应对突发话务（音乐节/体育赛事等）', toolCalls: 3421, successRate: 96.8, permissionLevel: 4 },
    ],
  },
  {
    id: 'experience',
    name: 'Experience Assurance Agent',
    nameZh: '体验保障智能体',
    domain: 'Experience',
    domainZh: '体验',
    status: 'active',
    description: 'Proactive user experience management — early detection of degradation trends, differentiated QoS by subscription tier, and deterministic experience guarantee for top-priority users',
    descriptionZh: '主动用户体验管理，提前发现体验下降趋势，按订阅套餐差异化保障，为最高优先级用户实现确定性体验',
    taskCount: 1128,
    successRate: 97.8,
    subAgents: [
      { id: 'complaint-early', name: 'Complaint Early-Warning Agent', nameZh: '投诉预警子Agent', status: 'active', currentTask: 'Monitoring 12,580 users for experience anomaly', currentTaskZh: '主动监控12,580用户综合体验，关注敏感投诉点', toolCalls: 14567, successRate: 98.1, permissionLevel: 2 },
      { id: 'diff-experience', name: 'Differentiated Experience Agent', nameZh: '差异化体验子Agent', status: 'active', currentTask: 'Coordinating 5QI adjustment for accelerated users', currentTaskZh: '协同核心网调整5QI参数及无线侧调度优先级', toolCalls: 8945, successRate: 97.2, permissionLevel: 3 },
      { id: 'deterministic-exp', name: 'Deterministic Experience Agent', nameZh: '确定性体验子Agent', status: 'active', currentTask: 'Ensuring 95%+ SLA for top 5% priority users', currentTaskZh: '为5%最高优先级用户实现网随人动，95%+确定性体验', toolCalls: 6234, successRate: 99.1, permissionLevel: 4 },
    ],
  },
  {
    id: 'ops',
    name: 'Network O&M Agent',
    nameZh: '网络运维智能体',
    domain: 'O&M',
    domainZh: '运维',
    status: 'active',
    description: 'Proactive network stability maintenance — predictive fault detection, automated FO monitoring & dispatch, intelligent BO analysis, efficient FLM on-site repair, reducing O&M costs',
    descriptionZh: '主动网络稳定性维护，预测潜在风险提前解决，FO自动化监控派单，BO智能化分析，FLM高效上站处理，降低运维成本',
    taskCount: 1847,
    successRate: 98.3,
    subAgents: [
      { id: 'ops-monitor', name: 'O&M Monitoring Agent', nameZh: '运维监控子Agent', status: 'active', currentTask: 'Real-time monitoring 2,847 nodes, 3 hidden risks found', currentTaskZh: '实时监控2,847节点，发现3个潜在隐患已提前处理', toolCalls: 21345, successRate: 99.2, permissionLevel: 2 },
      { id: 'fault-analysis', name: 'Fault Analysis Agent', nameZh: '故障分析子Agent', status: 'active', currentTask: 'Cross-domain root cause analysis for BTS-GD-005', currentTaskZh: '跨域故障根因分析BTS-GD-005，给出远程修复建议', toolCalls: 11234, successRate: 97.5, permissionLevel: 3 },
      { id: 'onsite-maintain', name: 'On-site Maintenance Agent', nameZh: '上站维护子Agent', status: 'idle', currentTask: 'Guiding field engineer at BTS-ZJ-012', currentTaskZh: '指导维护工程师快速修复BTS-ZJ-012问题', toolCalls: 4567, successRate: 96.8, permissionLevel: 3 },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Support Agent',
    nameZh: '运营支撑智能体',
    domain: 'Marketing',
    domainZh: '运营',
    status: 'active',
    description: 'Hyper-personalized marketing — precision lead identification, real-time contextual offers, and proactive churn prevention with tailored retention strategies',
    descriptionZh: '超级个性化营销，精准潜客识别，在用户需要时实时推送灵活定制产品，提前预测离网并精准维挽',
    taskCount: 756,
    successRate: 95.4,
    subAgents: [
      { id: 'lead-identify', name: 'Lead Identification Agent', nameZh: '潜客识别子Agent', status: 'active', currentTask: 'Identifying leads for 5G experience boost package', currentTaskZh: '为体验加速套餐精准识别潜在客户清单', toolCalls: 9876, successRate: 96.2, permissionLevel: 2 },
      { id: 'realtime-market', name: 'Real-time Marketing Agent', nameZh: '实时营销子Agent', status: 'active', currentTask: 'Pushing game boost offer to lagging users', currentTaskZh: '向游戏卡顿用户实时推送游戏加速套餐', toolCalls: 7654, successRate: 94.1, permissionLevel: 3 },
      { id: 'churn-prevent', name: 'Churn Prevention Agent', nameZh: '离网维挽子Agent', status: 'active', currentTask: 'Predicting churn risk for 238 high-value users', currentTaskZh: '预测238位高价值用户离网概率及原因，制定维挽策略', toolCalls: 5432, successRate: 95.8, permissionLevel: 3 },
    ],
  },
];
