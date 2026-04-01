export interface SimulationResult {
  id: string;
  type: 'coverage' | 'capacity' | 'performance' | 'experience' | 'config_change';
  scenario: string;
  status: 'completed' | 'running' | 'failed';
  timestamp: string;
  input: Record<string, any>;
  result: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  duration: string;
}

export const digitalTwinSimulations: SimulationResult[] = [
  {
    id: 'SIM-001',
    type: 'coverage',
    scenario: '新增5G站点覆盖仿真',
    status: 'completed',
    timestamp: '2026-03-31 08:15:00',
    input: { newSites: ['GD-GZ-045', 'GD-GZ-046'], band: 'n78', power: 200, antennaHeight: 35 },
    result: { coverageImprovement: 12.3, capacityGain: 18.5, interferenceImpact: -2.1, newUsersCovered: 8450 },
    riskLevel: 'low',
    recommendation: '建议执行，预期覆盖率提升12.3%，新增覆盖8,450名用户，无显著干扰影响',
    duration: '2m 15s',
  },
  {
    id: 'SIM-002',
    type: 'capacity',
    scenario: '音乐节场景容量扩容仿真',
    status: 'completed',
    timestamp: '2026-03-31 18:02:00',
    input: { targetArea: '天河体育中心', expectedUsers: 50000, peakMultiplier: 3.2, duration: '6h' },
    result: { maxConcurrentUsers: 55000, avgThroughput: 52, callSuccessRate: 99.5, prb利用率Peak: 78 },
    riskLevel: 'low',
    recommendation: '方案可行，CA+MIMO+负荷均衡组合可满足5万人需求，峰值PRB利用率78%在安全范围内',
    duration: '28.5s',
  },
  {
    id: 'SIM-003',
    type: 'config_change',
    scenario: '传输链路切换备用光路影响评估',
    status: 'completed',
    timestamp: '2026-03-31 14:20:30',
    input: { link: 'GD-TN-005', action: '切换备用光路', affectedCells: 12 },
    result: { switchTime: 0.3, packetLoss: 0.01, serviceImpact: 'none', rollbackTime: 0.5 },
    riskLevel: 'low',
    recommendation: '切换安全，预计中断<0.3秒，丢包率<0.01%，可立即执行',
    duration: '4.2s',
  },
  {
    id: 'SIM-004',
    type: 'performance',
    scenario: '全网参数优化方案仿真验证',
    status: 'completed',
    timestamp: '2026-03-31 09:01:35',
    input: { scope: '广东省全网', cells: 847, dimensions: ['覆盖', '容量', '干扰'], algorithm: 'Pareto多目标优化' },
    result: { rsrpImprovement: 3.2, capacityGain: 24.0, interferenceReduction: 8.5, conflictsResolved: 73 },
    riskLevel: 'low',
    recommendation: '方案通过验证，73组参数冲突已解决，三维度均有提升，建议分批执行',
    duration: '45.2s',
  },
  {
    id: 'SIM-005',
    type: 'config_change',
    scenario: '核心网UPF扩容影响仿真',
    status: 'completed',
    timestamp: '2026-03-31 17:45:00',
    input: { action: 'UPF会话容量翻倍', currentSessions: 120000, targetSessions: 240000 },
    result: { migrationTime: 0, serviceImpact: 'none', memoryUsage: 72, cpuUsage: 45 },
    riskLevel: 'medium',
    recommendation: '扩容可行，资源充足。建议在低峰期执行，并监控内存使用率',
    duration: '8.7s',
  },
  {
    id: 'SIM-006',
    type: 'experience',
    scenario: 'VIP用户5QI调整体验仿真',
    status: 'completed',
    timestamp: '2026-03-31 16:10:15',
    input: { user: '138****5678', currentQFI: 9, targetQFI: 5, schedulingBoost: 200 },
    result: { dlThroughput: { before: 15, after: 128 }, mos: { before: 2.8, after: 4.5 }, latency: { before: 45, after: 12 } },
    riskLevel: 'low',
    recommendation: '调整安全，不影响周边用户体验（其他用户速率下降<2%），建议执行',
    duration: '1.8s',
  },
  {
    id: 'SIM-007',
    type: 'coverage',
    scenario: '高铁沿线覆盖增强方案仿真',
    status: 'completed',
    timestamp: '2026-03-30 14:00:00',
    input: { route: '广深高铁', segments: 12, strategy: '窄波束跟踪+切换优化', speed: 350 },
    result: { coverageRate: { before: 91.2, after: 98.7 }, handoverSuccess: { before: 96.5, after: 99.1 }, avgThroughput: 85 },
    riskLevel: 'medium',
    recommendation: '方案有效，覆盖率提升7.5%。部分路段需新增RRU，建议分段实施',
    duration: '3m 42s',
  },
  {
    id: 'SIM-008',
    type: 'capacity',
    scenario: '春节返乡话务高峰预测仿真',
    status: 'completed',
    timestamp: '2026-03-28 10:00:00',
    input: { period: '2026春节', regions: ['广州', '深圳', '东莞'], peakFactor: 2.8 },
    result: { bottleneckCells: 234, requiredExpansion: 156, estimatedCost: 2800000, userImpactWithout: 45000 },
    riskLevel: 'high',
    recommendation: '若不扩容，预计4.5万用户受影响。建议对234个瓶颈小区中的156个进行临时扩容',
    duration: '5m 10s',
  },
];
