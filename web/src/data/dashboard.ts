export interface KpiMetric {
  id: string;
  name: string;
  nameZh: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  target: number;
  history: number[];
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  title: string;
  titleZh: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  detail: string;
  detailZh: string;
  affectedScope: string;
  affectedScopeZh: string;
}

export interface TaskItem {
  id: string;
  title: string;
  titleZh: string;
  agent: string;
  collaborators?: string[];
  status: 'completed' | 'running' | 'failed' | 'queued';
  timestamp: string;
  duration: string;
  detail: string;
  detailZh: string;
  result: string;
  resultZh: string;
}

export const kpiMetrics: KpiMetric[] = [
  {
    id: 'network-avail',
    name: 'Network Availability',
    nameZh: '网络可用率',
    value: 99.97,
    unit: '%',
    trend: 'up',
    change: 0.02,
    target: 99.95,
    history: [99.91, 99.93, 99.94, 99.95, 99.96, 99.95, 99.97, 99.96, 99.97, 99.98, 99.97, 99.97],
  },
  {
    id: 'alarm-count',
    name: 'Active Alarms',
    nameZh: '活跃告警',
    value: 23,
    unit: '',
    trend: 'down',
    change: -12,
    target: 0,
    history: [45, 38, 42, 35, 30, 28, 23, 25, 22, 24, 21, 23],
  },
  {
    id: 'mttr',
    name: 'MTTR',
    nameZh: '平均修复时间',
    value: 4.2,
    unit: 'min',
    trend: 'down',
    change: -1.3,
    target: 5.0,
    history: [7.8, 6.5, 5.8, 5.5, 5.1, 4.8, 4.2, 4.5, 4.1, 4.3, 4.0, 4.2],
  },
  {
    id: 'ux-score',
    name: 'User Experience',
    nameZh: '用户体验评分',
    value: 92.4,
    unit: '/100',
    trend: 'up',
    change: 3.1,
    target: 90.0,
    history: [85.2, 86.8, 88.1, 89.3, 90.5, 91.2, 92.4, 91.8, 92.1, 92.5, 92.3, 92.4],
  },
  {
    id: 'throughput',
    name: 'Avg Throughput',
    nameZh: '平均吞吐量',
    value: 847,
    unit: 'Mbps',
    trend: 'up',
    change: 23,
    target: 800,
    history: [780, 795, 810, 820, 835, 840, 847, 843, 850, 845, 848, 847],
  },
  {
    id: 'task-success',
    name: 'Task Success Rate',
    nameZh: '任务成功率',
    value: 97.3,
    unit: '%',
    trend: 'stable',
    change: 0.1,
    target: 95.0,
    history: [96.8, 97.1, 96.9, 97.2, 97.0, 97.2, 97.3, 97.1, 97.4, 97.2, 97.3, 97.3],
  },
];

export const activeAlerts: AlertItem[] = [
  {
    id: 'ALM-001', severity: 'critical',
    title: 'Cell GD-GZ-018A PRB utilization >92%', titleZh: '小区GD-GZ-018A PRB利用率>92%',
    source: '运维监控Agent', timestamp: '2分钟前', acknowledged: false,
    detail: 'PRB utilization sustained above 92% for 15 minutes. 3,200 users affected with degraded throughput. Auto-optimization triggered.',
    detailZh: 'PRB利用率持续超过92%已达15分钟。3,200名用户受影响，吞吐量下降。已触发自动优化。',
    affectedScope: 'GD-GZ-018A/B/C (Tianhe District)', affectedScopeZh: '天河区 GD-GZ-018A/B/C 3个扇区',
  },
  {
    id: 'ALM-002', severity: 'critical',
    title: 'Transport link GD-TN-005 BER anomaly', titleZh: '传输链路GD-TN-005误码率异常',
    source: '故障分析Agent', timestamp: '5分钟前', acknowledged: true,
    detail: 'Bit Error Rate reached 3.2×10⁻⁴ (threshold: 1×10⁻⁶). 12 downstream cells affected. Backup optical path activation in progress.',
    detailZh: '误码率达到3.2×10⁻⁴（阈值1×10⁻⁶），影响下游12个小区。正在启用备用光路。',
    affectedScope: '12 cells in Tianhe district', affectedScopeZh: '天河区12个小区',
  },
  {
    id: 'ALM-003', severity: 'major',
    title: 'VIP user experience below SLA threshold', titleZh: 'VIP用户体验低于SLA阈值',
    source: '体验保障Agent', timestamp: '8分钟前', acknowledged: false,
    detail: 'Diamond-tier user 138****5678 video call MOS dropped to 2.8 (guarantee: 4.0). 5QI priority adjustment initiated.',
    detailZh: '钻石卡用户138****5678视频通话MOS降至2.8（保障阈值4.0）。已发起5QI优先级调整。',
    affectedScope: 'Single VIP user', affectedScopeZh: '单个VIP用户',
  },
  {
    id: 'ALM-004', severity: 'major',
    title: 'Handover success rate drop in GZ-North grid', titleZh: '广州北部网格切换成功率下降',
    source: '实时优化Agent', timestamp: '15分钟前', acknowledged: true,
    detail: 'Handover success rate dropped from 99.2% to 96.1% in GZ-North grid. Likely caused by new site GD-GZ-078 parameter mismatch.',
    detailZh: '广州北部网格切换成功率从99.2%降至96.1%。可能原因：新站GD-GZ-078参数配置不匹配。',
    affectedScope: 'GZ-North grid, 8 cells', affectedScopeZh: '广州北部网格，8个小区',
  },
  {
    id: 'ALM-005', severity: 'warning',
    title: 'Predicted traffic surge: Tianhe Stadium event', titleZh: '预测话务激增：天河体育场活动',
    source: '事件保障Agent', timestamp: '25分钟前', acknowledged: false,
    detail: 'Music festival tomorrow at Tianhe Sports Center. Predicted 3.2x traffic surge affecting 5 sectors. Pre-deployment plan generated.',
    detailZh: '明日天河体育中心音乐节。预测话务激增3.2倍，影响5个扇区。已生成预部署方案。',
    affectedScope: '5 sectors around Tianhe Stadium', affectedScopeZh: '天河体育场周边5个扇区',
  },
  {
    id: 'ALM-006', severity: 'warning',
    title: 'Core network UPF session capacity at 78%', titleZh: '核心网UPF会话容量达78%',
    source: '运维监控Agent', timestamp: '1小时前', acknowledged: false,
    detail: 'UPF session utilization approaching threshold. Current: 93,600/120,000 sessions. Capacity expansion recommended before peak hours.',
    detailZh: 'UPF会话利用率接近阈值。当前：93,600/120,000会话。建议在高峰期前扩容。',
    affectedScope: 'Core Network UPF cluster', affectedScopeZh: '核心网UPF集群',
  },
  {
    id: 'ALM-007', severity: 'minor',
    title: 'Churn risk detected: 156 high-value users', titleZh: '检测到离网风险：156名高价值用户',
    source: '离网维挽Agent', timestamp: '2小时前', acknowledged: true,
    detail: 'Monthly churn prediction identified 156 high-value users with >60% churn probability. Personalized retention campaigns recommended.',
    detailZh: '月度流失预测识别出156名高价值用户离网概率>60%。建议发起个性化维挽营销。',
    affectedScope: '156 high-value subscribers', affectedScopeZh: '156名高价值用户',
  },
];

export const recentTasks: TaskItem[] = [
  {
    id: 'TSK-1001',
    title: 'Cross-domain fault diagnosis: GD-TN-005', titleZh: '跨域故障诊断：GD-TN-005',
    agent: '故障分析Agent', collaborators: ['运维监控Agent', '实时优化Agent'],
    status: 'running', timestamp: '2分钟前', duration: '1m 45s',
    detail: 'Analyzing transport link GD-TN-005 BER anomaly. Correlating RAN/Transport/Core domain data to identify root cause.',
    detailZh: '分析传输链路GD-TN-005误码率异常。关联RAN/传输/核心网三域数据，定位根因。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-1002',
    title: 'VIP experience assurance: user 138****5678', titleZh: 'VIP体验保障：用户138****5678',
    agent: '确定性体验Agent', collaborators: ['实时优化Agent', '投诉预处理Agent'],
    status: 'running', timestamp: '5分钟前', duration: '4m 12s',
    detail: 'Adjusting 5QI parameters and scheduling priority for diamond-tier user experiencing video call degradation.',
    detailZh: '为视频通话质量下降的钻石卡用户调整5QI参数和调度优先级。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-1003',
    title: 'Full-network parameter optimization: Guangdong', titleZh: '全网参数优化：广东省',
    agent: '实时优化Agent', collaborators: ['工程优化Agent', '运维监控Agent'],
    status: 'completed', timestamp: '15分钟前', duration: '5m 30s',
    detail: 'Optimized 847 quality-poor cells across Guangdong province. Three-dimensional Pareto optimization for coverage/capacity/interference.',
    detailZh: '优化广东省847个质差小区。覆盖/容量/干扰三维Pareto优化。',
    result: 'Coverage +3.2%, Capacity +24%, 73 conflicts resolved', resultZh: '覆盖率+3.2%，容量+24%，73组参数冲突已解决',
  },
  {
    id: 'TSK-1004',
    title: 'Event assurance pre-deployment: Stadium concert', titleZh: '事件保障预部署：体育场音乐节',
    agent: '事件保障Agent', collaborators: ['实时优化Agent', '运维监控Agent', '确定性体验Agent'],
    status: 'completed', timestamp: '20分钟前', duration: '3m 45s',
    detail: 'Generated capacity expansion plan for Tianhe Stadium music festival. CA+MIMO+load balancing parameters pre-deployed to 5 sectors.',
    detailZh: '为天河体育场音乐节生成容量扩充方案。CA+MIMO+负荷均衡参数已预部署至5个扇区。',
    result: 'Capacity: 18K→55K users, Ready for event', resultZh: '容量：18K→55K用户，活动就绪',
  },
  {
    id: 'TSK-1005',
    title: '5G package prospect identification', titleZh: '5G套餐潜客识别',
    agent: '潜客识别Agent', collaborators: ['市场收益预测Agent'],
    status: 'completed', timestamp: '35分钟前', duration: '4m 20s',
    detail: 'Scanned 8.2M active users in Guangdong. Identified 12,847 potential users for new 5G package based on usage patterns and device type.',
    detailZh: '扫描广东省820万活跃用户。基于使用模式和终端类型，识别出12,847名新5G套餐潜在用户。',
    result: 'A-tier: 2,156 (32.5% conversion), B-tier: 5,423, C-tier: 5,268', resultZh: 'A级2,156人（转化率32.5%），B级5,423人，C级5,268人',
  },
  {
    id: 'TSK-1006',
    title: 'Daily network health inspection', titleZh: '每日全网健康巡检',
    agent: '运维监控Agent', collaborators: ['故障分析Agent', '实时优化Agent'],
    status: 'completed', timestamp: '1小时前', duration: '18m 45s',
    detail: 'Automated daily health check across 23,456 cells in 3 regions. Scanned KPIs, configuration, hardware status.',
    detailZh: '3个区域23,456个小区自动化日常健康巡检。扫描KPI、配置、硬件状态。',
    result: '47 issues found: 23 auto-fixed, 24 tickets created', resultZh: '发现47个隐患：23个已自动修复，24个已创建工单',
  },
  {
    id: 'TSK-1007',
    title: 'New site optimization: GD-SZ-078', titleZh: '新站优化：GD-SZ-078',
    agent: '工程优化Agent', collaborators: ['网络仿真Agent', '实时优化Agent'],
    status: 'completed', timestamp: '1.5小时前', duration: '12m 30s',
    detail: 'Optimized newly activated 5G site GD-SZ-078. Adjusted power, tilt, handover parameters for neighbor coordination.',
    detailZh: '优化新开通5G站点GD-SZ-078。调整功率、倾角、切换参数，与周边小区协同。',
    result: 'Coverage target met, neighbor handover 99.4%', resultZh: '覆盖目标达成，邻区切换成功率99.4%',
  },
  {
    id: 'TSK-1008',
    title: 'Churn prevention campaign design', titleZh: '离网维挽方案设计',
    agent: '离网维挽Agent', collaborators: ['潜客识别Agent', '市场收益预测Agent'],
    status: 'completed', timestamp: '2小时前', duration: '6m 10s',
    detail: 'Designed personalized retention campaigns for 156 high-value users at churn risk. Three-tier strategy with differentiated offers.',
    detailZh: '为156名高价值离网风险用户设计个性化维挽方案。三层差异化策略。',
    result: 'Est. retention rate: 72%, Revenue saved: ¥248K/month', resultZh: '预计挽留率72%，月挽回收入¥248K',
  },
];

/* Extra task pool for dynamic rotation */
export const extraTasks: TaskItem[] = [
  {
    id: 'TSK-2001',
    title: 'Interference mitigation: Baiyun district', titleZh: '干扰抑制：白云区',
    agent: '实时优化Agent', collaborators: ['运维监控Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 30s',
    detail: 'Detected inter-cell interference between GD-BY-041 and GD-BY-042. Adjusting power and tilt parameters.',
    detailZh: '检测到GD-BY-041与GD-BY-042小区间干扰。正在调整功率和倾角参数。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2002',
    title: 'Abnormal signaling storm detection', titleZh: '异常信令风暴检测',
    agent: '运维监控Agent', collaborators: ['故障分析Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 15s',
    detail: 'Detected unusual signaling surge on AMF node GD-CORE-03. Analyzing source pattern.',
    detailZh: '检测到AMF节点GD-CORE-03异常信令激增。正在分析来源模式。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2003',
    title: 'Coverage hole repair: Nansha port area', titleZh: '覆盖空洞修复：南沙港区',
    agent: '工程优化Agent', collaborators: ['网络仿真Agent', '价值洞察Agent'],
    status: 'running', timestamp: '刚刚', duration: '1m 05s',
    detail: 'Detected coverage gap in Nansha port logistics area. Adjusting SSB beam and MIMO parameters for surrounding cells.',
    detailZh: '检测到南沙港口物流区覆盖空洞。调整周边小区SSB波束和MIMO参数。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2004',
    title: 'High-speed rail handover optimization', titleZh: '高铁切换优化',
    agent: '实时优化Agent', collaborators: ['确定性体验Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 45s',
    detail: 'Guangzhou-Shenzhen high-speed rail corridor handover success rate below threshold. Optimizing A3 event parameters.',
    detailZh: '广深高铁走廊切换成功率低于阈值。优化A3事件参数。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2005',
    title: 'Enterprise SLA compliance check', titleZh: '企业SLA合规检查',
    agent: '确定性体验Agent', collaborators: ['运维监控Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 20s',
    detail: 'Verifying SLA commitments for 23 enterprise customers on dedicated slices.',
    detailZh: '验证23个企业客户专用切片的SLA承诺达成情况。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2006',
    title: 'Predictive maintenance: RRU health scan', titleZh: '预测性维护：RRU健康扫描',
    agent: '运维监控Agent', collaborators: ['故障分析Agent', '工程优化Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 55s',
    detail: 'Scanning RRU hardware health indicators across 1,200 sites. Predicting failure probability using ML model.',
    detailZh: '扫描1,200个站点RRU硬件健康指标。使用ML模型预测故障概率。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2007',
    title: 'Weekend traffic forecast: Panyu', titleZh: '周末话务预测：番禺区',
    agent: '事件保障Agent', collaborators: ['价值洞察Agent', '实时优化Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 35s',
    detail: 'Generating weekend traffic forecast for Panyu commercial zones. Pre-allocating resources.',
    detailZh: '生成番禺商业区周末话务预测。预分配资源。',
    result: 'In progress...', resultZh: '进行中...',
  },
  {
    id: 'TSK-2008',
    title: 'Retention offer delivery: batch #47', titleZh: '维挽方案投放：批次#47',
    agent: '离网维挽Agent', collaborators: ['潜客识别Agent'],
    status: 'running', timestamp: '刚刚', duration: '0m 10s',
    detail: 'Delivering personalized retention offers to 82 at-risk users via CRM push.',
    detailZh: '通过CRM推送向82名风险用户投放个性化维挽方案。',
    result: 'In progress...', resultZh: '进行中...',
  },
];

/* Extra alert pool for dynamic rotation */
export const extraAlerts: AlertItem[] = [
  {
    id: 'ALM-101', severity: 'critical',
    title: 'S1 link flap detected on eNB GD-FS-031', titleZh: 'eNB GD-FS-031 S1链路抖动',
    source: '故障分析Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'S1 interface flapping detected. 5 occurrences in last 2 minutes. Potential transport issue.',
    detailZh: 'S1接口抖动检测到5次/2分钟。可能为传输问题。',
    affectedScope: 'GD-FS-031 and 3 downstream cells', affectedScopeZh: 'GD-FS-031及下游3个小区',
  },
  {
    id: 'ALM-102', severity: 'major',
    title: 'DL throughput degradation in Haizhu grid', titleZh: '海珠网格下行吞吐量下降',
    source: '实时优化Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'Average DL throughput dropped 35% in Haizhu grid over last 10 minutes. Investigating root cause.',
    detailZh: '海珠网格过去10分钟平均下行吞吐量下降35%。正在排查原因。',
    affectedScope: 'Haizhu grid, 15 cells', affectedScopeZh: '海珠网格，15个小区',
  },
  {
    id: 'ALM-103', severity: 'warning',
    title: 'UE attach failure rate spike: Luogang', titleZh: '萝岗区UE附着失败率飙升',
    source: '运维监控Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'UE attach failure rate reached 4.2% in Luogang area (normal: <0.5%). MME signaling load high.',
    detailZh: '萝岗区UE附着失败率达4.2%（正常<0.5%）。MME信令负荷过高。',
    affectedScope: 'Luogang district, 8 cells', affectedScopeZh: '萝岗区8个小区',
  },
  {
    id: 'ALM-104', severity: 'critical',
    title: 'Power supply alarm: BTS-GD-076', titleZh: '电源告警：BTS-GD-076',
    source: '运维监控Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'Battery backup activated at BTS-GD-076. Mains power supply interrupted. Estimated runtime: 4 hours.',
    detailZh: 'BTS-GD-076启用电池备份。市电中断。预计续航4小时。',
    affectedScope: 'BTS-GD-076 single site', affectedScopeZh: 'BTS-GD-076单站',
  },
  {
    id: 'ALM-105', severity: 'minor',
    title: 'Clock sync drift on 3 cells', titleZh: '3个小区时钟同步偏移',
    source: '运维监控Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'GPS clock synchronization drift detected on 3 cells in Panyu area. May affect handover timing.',
    detailZh: '番禺区3个小区GPS时钟同步偏移。可能影响切换时序。',
    affectedScope: 'Panyu area, 3 cells', affectedScopeZh: '番禺区3个小区',
  },
  {
    id: 'ALM-106', severity: 'major',
    title: 'Slice SLA breach: Enterprise customer #E-0045', titleZh: '切片SLA违约：企业客户 #E-0045',
    source: '确定性体验Agent', timestamp: '刚刚', acknowledged: false,
    detail: 'Dedicated slice for enterprise customer E-0045 dropped below committed latency SLA (10ms → 23ms).',
    detailZh: '企业客户E-0045专用切片时延超SLA承诺（10ms→23ms）。',
    affectedScope: 'Enterprise customer E-0045', affectedScopeZh: '企业客户 E-0045',
  },
];
