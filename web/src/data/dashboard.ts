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
}

export interface TaskItem {
  id: string;
  title: string;
  titleZh: string;
  agent: string;
  status: 'completed' | 'running' | 'failed' | 'queued';
  timestamp: string;
  duration: string;
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
    history: [99.91, 99.93, 99.94, 99.95, 99.96, 99.95, 99.97],
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
    history: [45, 38, 42, 35, 30, 28, 23],
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
    history: [7.8, 6.5, 5.8, 5.5, 5.1, 4.8, 4.2],
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
    history: [85.2, 86.8, 88.1, 89.3, 90.5, 91.2, 92.4],
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
    history: [780, 795, 810, 820, 835, 840, 847],
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
    history: [96.8, 97.1, 96.9, 97.2, 97.0, 97.2, 97.3],
  },
];

export const activeAlerts: AlertItem[] = [
  { id: 'ALM-001', severity: 'critical', title: 'Cell site BTS-4721 power failure', titleZh: '基站BTS-4721电源故障', source: 'Infrastructure Agent', timestamp: '2 min ago', acknowledged: false },
  { id: 'ALM-002', severity: 'critical', title: 'Core router CPU utilization >95%', titleZh: '核心路由器CPU使用率>95%', source: 'Network Agent', timestamp: '5 min ago', acknowledged: true },
  { id: 'ALM-003', severity: 'major', title: 'SLA breach risk - Enterprise client Acme Corp', titleZh: 'SLA违约风险 - 企业客户Acme公司', source: 'Service Assurance', timestamp: '12 min ago', acknowledged: false },
  { id: 'ALM-004', severity: 'major', title: 'Unusual traffic pattern detected - DDoS suspected', titleZh: '检测到异常流量模式 - 疑似DDoS', source: 'Security Agent', timestamp: '18 min ago', acknowledged: true },
  { id: 'ALM-005', severity: 'warning', title: 'Fiber link degradation on trunk FBR-892', titleZh: '干线FBR-892光纤链路退化', source: 'Network Agent', timestamp: '25 min ago', acknowledged: false },
  { id: 'ALM-006', severity: 'minor', title: 'Backup power generator maintenance due', titleZh: '备用电源发电机需维护', source: 'Infrastructure Agent', timestamp: '1 hr ago', acknowledged: false },
  { id: 'ALM-007', severity: 'warning', title: 'License expiry approaching - OSS module', titleZh: 'OSS模块许可证即将过期', source: 'Infrastructure Agent', timestamp: '2 hr ago', acknowledged: true },
];

export const recentTasks: TaskItem[] = [
  { id: 'TSK-1001', title: 'Auto-remediation: BTS-4721 failover', titleZh: '自动修复: BTS-4721故障切换', agent: 'Infrastructure Agent', status: 'running', timestamp: '2 min ago', duration: '1m 45s' },
  { id: 'TSK-1002', title: 'Root cause analysis: Core router anomaly', titleZh: '根因分析: 核心路由器异常', agent: 'Network Agent', status: 'running', timestamp: '5 min ago', duration: '4m 12s' },
  { id: 'TSK-1003', title: 'SLA impact assessment for Acme Corp', titleZh: 'Acme公司SLA影响评估', agent: 'Service Assurance', status: 'completed', timestamp: '15 min ago', duration: '2m 30s' },
  { id: 'TSK-1004', title: 'DDoS mitigation playbook execution', titleZh: 'DDoS缓解策略执行', agent: 'Security Agent', status: 'completed', timestamp: '20 min ago', duration: '8m 15s' },
  { id: 'TSK-1005', title: 'Churn prediction model update', titleZh: '流失预测模型更新', agent: 'Market Ops', status: 'completed', timestamp: '35 min ago', duration: '12m 00s' },
  { id: 'TSK-1006', title: 'Capacity forecast report generation', titleZh: '容量预测报告生成', agent: 'Infrastructure Agent', status: 'completed', timestamp: '1 hr ago', duration: '5m 45s' },
  { id: 'TSK-1007', title: 'Firmware update validation - batch 12', titleZh: '固件更新验证 - 批次12', agent: 'Network Agent', status: 'failed', timestamp: '1.5 hr ago', duration: '15m 30s' },
  { id: 'TSK-1008', title: 'Customer segmentation analysis', titleZh: '客户分群分析', agent: 'Market Ops', status: 'completed', timestamp: '2 hr ago', duration: '18m 00s' },
];
