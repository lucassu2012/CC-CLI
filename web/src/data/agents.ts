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
    id: 'net-ops',
    name: 'Network Operations Agent',
    nameZh: '网络运维智能体',
    domain: 'Network',
    domainZh: '网络',
    status: 'active',
    description: 'Manages network infrastructure monitoring, fault detection, and automated remediation',
    descriptionZh: '管理网络基础设施监控、故障检测和自动修复',
    taskCount: 1247,
    successRate: 98.5,
    subAgents: [
      { id: 'net-monitor', name: 'Network Monitor', nameZh: '网络监控', status: 'active', currentTask: 'Monitoring 2,847 nodes', currentTaskZh: '监控2,847个节点', toolCalls: 15234, successRate: 99.1, permissionLevel: 2 },
      { id: 'fault-detect', name: 'Fault Detector', nameZh: '故障检测', status: 'active', currentTask: 'Analyzing alarm correlation', currentTaskZh: '分析告警关联', toolCalls: 8921, successRate: 97.8, permissionLevel: 3 },
      { id: 'auto-heal', name: 'Auto Healer', nameZh: '自动修复', status: 'idle', currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 3456, successRate: 95.2, permissionLevel: 4 },
    ],
  },
  {
    id: 'service-assure',
    name: 'Service Assurance Agent',
    nameZh: '服务保障智能体',
    domain: 'Service',
    domainZh: '服务',
    status: 'active',
    description: 'Ensures service quality, SLA compliance, and customer experience optimization',
    descriptionZh: '确保服务质量、SLA合规和客户体验优化',
    taskCount: 892,
    successRate: 97.2,
    subAgents: [
      { id: 'sla-monitor', name: 'SLA Monitor', nameZh: 'SLA监控', status: 'active', currentTask: 'Tracking 156 SLA contracts', currentTaskZh: '跟踪156个SLA合同', toolCalls: 12890, successRate: 98.5, permissionLevel: 2 },
      { id: 'qos-optimizer', name: 'QoS Optimizer', nameZh: 'QoS优化', status: 'active', currentTask: 'Optimizing bandwidth allocation', currentTaskZh: '优化带宽分配', toolCalls: 6734, successRate: 96.3, permissionLevel: 3 },
      { id: 'cx-analyzer', name: 'CX Analyzer', nameZh: '客户体验分析', status: 'active', currentTask: 'Processing NPS survey data', currentTaskZh: '处理NPS调查数据', toolCalls: 4521, successRate: 97.1, permissionLevel: 2 },
    ],
  },
  {
    id: 'security',
    name: 'Security Operations Agent',
    nameZh: '安全运营智能体',
    domain: 'Security',
    domainZh: '安全',
    status: 'warning',
    description: 'Threat detection, vulnerability management, and security incident response',
    descriptionZh: '威胁检测、漏洞管理和安全事件响应',
    taskCount: 456,
    successRate: 99.1,
    subAgents: [
      { id: 'threat-detect', name: 'Threat Detector', nameZh: '威胁检测', status: 'active', currentTask: 'Scanning for anomalies', currentTaskZh: '扫描异常', toolCalls: 23456, successRate: 99.5, permissionLevel: 3 },
      { id: 'vuln-scanner', name: 'Vulnerability Scanner', nameZh: '漏洞扫描', status: 'warning', currentTask: 'CVE-2026-1234 assessment', currentTaskZh: 'CVE-2026-1234评估', toolCalls: 7890, successRate: 98.2, permissionLevel: 4 },
      { id: 'incident-resp', name: 'Incident Responder', nameZh: '事件响应', status: 'idle', currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 1234, successRate: 99.8, permissionLevel: 5 },
      { id: 'compliance', name: 'Compliance Checker', nameZh: '合规检查', status: 'active', currentTask: 'Auditing access policies', currentTaskZh: '审计访问策略', toolCalls: 5678, successRate: 99.0, permissionLevel: 3 },
    ],
  },
  {
    id: 'market-ops',
    name: 'Market Operations Agent',
    nameZh: '市场运营智能体',
    domain: 'Market',
    domainZh: '市场',
    status: 'active',
    description: 'Customer analytics, campaign management, and revenue optimization',
    descriptionZh: '客户分析、营销管理和收入优化',
    taskCount: 634,
    successRate: 94.8,
    subAgents: [
      { id: 'customer-insight', name: 'Customer Insight', nameZh: '客户洞察', status: 'active', currentTask: 'Analyzing churn patterns', currentTaskZh: '分析流失模式', toolCalls: 9876, successRate: 95.4, permissionLevel: 2 },
      { id: 'campaign-mgr', name: 'Campaign Manager', nameZh: '营销管理', status: 'active', currentTask: 'Running A/B test batch 7', currentTaskZh: '运行A/B测试批次7', toolCalls: 5432, successRate: 93.2, permissionLevel: 3 },
      { id: 'revenue-opt', name: 'Revenue Optimizer', nameZh: '收入优化', status: 'active', currentTask: 'Pricing model simulation', currentTaskZh: '定价模型模拟', toolCalls: 3210, successRate: 96.1, permissionLevel: 3 },
    ],
  },
  {
    id: 'infra-ops',
    name: 'Infrastructure Agent',
    nameZh: '基础设施智能体',
    domain: 'Infrastructure',
    domainZh: '基础设施',
    status: 'error',
    description: 'Physical infrastructure management, capacity planning, and energy optimization',
    descriptionZh: '物理基础设施管理、容量规划和能源优化',
    taskCount: 378,
    successRate: 96.3,
    subAgents: [
      { id: 'capacity-plan', name: 'Capacity Planner', nameZh: '容量规划', status: 'active', currentTask: 'Forecasting Q3 capacity', currentTaskZh: '预测Q3容量', toolCalls: 4567, successRate: 97.2, permissionLevel: 3 },
      { id: 'energy-opt', name: 'Energy Optimizer', nameZh: '能源优化', status: 'error', currentTask: 'ERROR: Sensor data timeout', currentTaskZh: '错误: 传感器数据超时', toolCalls: 2345, successRate: 94.1, permissionLevel: 3 },
      { id: 'asset-mgr', name: 'Asset Manager', nameZh: '资产管理', status: 'active', currentTask: 'Inventory reconciliation', currentTaskZh: '库存核对', toolCalls: 6789, successRate: 98.0, permissionLevel: 2 },
    ],
  },
];
