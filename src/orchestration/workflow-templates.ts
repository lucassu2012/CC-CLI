/**
 * IOE Pre-built Workflow Templates
 *
 * Six production-ready workflow templates for common telecom operations,
 * each fully configured with nodes, edges, positions, and default parameters.
 */

import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowTrigger } from './workflow-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function node(
  id: string,
  type: WorkflowNode['type'],
  name: string,
  x: number,
  y: number,
  config: Record<string, any> = {},
  extra: Partial<WorkflowNode> = {},
): WorkflowNode {
  return {
    id,
    type,
    name,
    config,
    position: { x, y },
    inputs: [],
    outputs: [],
    ...extra,
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
  condition?: string,
): WorkflowEdge {
  return { id, source, target, label, condition };
}

function wireIO(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  for (const n of nodes) {
    n.inputs = edges.filter((e) => e.target === n.id).map((e) => e.source);
    n.outputs = edges.filter((e) => e.source === n.id).map((e) => e.target);
  }
}

function makeWorkflow(
  id: string,
  name: string,
  description: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  triggers: WorkflowTrigger[],
  variables: Record<string, any> = {},
): Workflow {
  wireIO(nodes, edges);
  return {
    id,
    name,
    description,
    nodes,
    edges,
    triggers,
    variables,
    status: 'draft',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Template 1: Network Fault Auto-Diagnosis & Fix
// ---------------------------------------------------------------------------

export function createNetworkFaultDiagnosisWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '告警接收', 80, 40, {
      triggerKind: 'alarm',
      description: 'Receive network alarm from NMS',
      defaultData: { alarmId: '', severity: 'high', source: '', description: '' },
    }, { triggerKind: 'alarm' }),

    node('a1', 'agent', '告警分类', 80, 160, {
      action: 'classify_alarm',
      description: 'Ops Agent classifies the alarm type and severity',
      params: { classifyMethod: 'ml_model', correlationWindow: '5m' },
    }, { agentType: 'ops' }),

    node('c1', 'condition', '严重程度判断', 80, 280, {
      expression: 'input.findings.0.severity === "high"',
      description: 'Check if alarm severity is high',
    }),

    // High severity branch
    node('a2', 'agent', '跨域关联分析', -200, 400, {
      action: 'cross_domain_analysis',
      description: 'Ops Agent performs cross-domain root cause analysis',
      params: { domains: ['ran', 'transport', 'core'], timeWindow: '15m' },
    }, { agentType: 'ops' }),

    node('a3', 'agent', '数字孪生仿真', -200, 520, {
      action: 'simulate_fix',
      description: 'Digital Twin simulates proposed fix before applying',
      params: { simulationMode: 'full', safetyCheck: true },
    }, { agentType: 'optimization' }),

    node('c2', 'condition', '修复安全性检查', -200, 640, {
      expression: 'input.success === true',
      description: 'Check if simulated fix is safe to apply',
    }),

    node('a4', 'action', '执行修复', -400, 760, {
      actionType: 'oss_command',
      command: 'apply_fix',
      description: 'Execute the corrective action on the network',
    }),

    node('a5', 'action', '验证修复结果', -400, 880, {
      actionType: 'api_call',
      url: '/api/v1/network/verify',
      method: 'POST',
      description: 'Verify the fix was applied successfully',
    }),

    node('a6', 'action', '人工审核上报', 0, 760, {
      actionType: 'notification',
      channel: 'work_order',
      description: 'Escalate to manual review if fix is not safe',
      message: 'Automated fix deemed unsafe - manual review required',
    }),

    // Low severity branch
    node('a7', 'agent', '自动修复', 300, 400, {
      action: 'auto_fix',
      description: 'Ops Agent applies automatic fix for low severity alarm',
      params: { autoFixPolicy: 'standard', timeout: 300 },
    }, { agentType: 'ops' }),

    node('a8', 'action', '关闭工单', 300, 520, {
      actionType: 'ticket',
      ticketAction: 'close',
      description: 'Close the alarm ticket after successful auto-fix',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 'a1'),
    edge('e2', 'a1', 'c1'),
    edge('e3', 'c1', 'a2', 'high', 'severity === "high"'),
    edge('e4', 'c1', 'a7', 'low', 'severity !== "high"'),
    edge('e5', 'a2', 'a3'),
    edge('e6', 'a3', 'c2'),
    edge('e7', 'c2', 'a4', 'true', 'safe === true'),
    edge('e8', 'c2', 'a6', 'false', 'safe !== true'),
    edge('e9', 'a4', 'a5'),
    edge('e10', 'a7', 'a8'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'alarm', config: { alarmTypes: ['critical', 'major'], sources: ['ran', 'transport', 'core'] }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-network-fault-diagnosis',
    '网络故障自动诊断与修复',
    '接收网络告警后自动分类、诊断根因，通过数字孪生仿真验证修复方案，并执行自动或人工修复流程',
    nodes,
    edges,
    triggers,
    { maxAutoFixRetries: 3, escalationTimeout: '30m' },
  );
}

// ---------------------------------------------------------------------------
// Template 2: User Complaint Resolution Loop
// ---------------------------------------------------------------------------

export function createUserComplaintResolutionWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '投诉接收', 80, 40, {
      triggerKind: 'api',
      description: 'Receive user complaint from CRM system',
      defaultData: { complaintId: '', userId: '', type: '', description: '' },
    }, { triggerKind: 'api' }),

    node('a1', 'agent', '用户体验分析', 80, 160, {
      action: 'analyze_experience',
      description: 'Experience Agent analyzes user experience metrics',
      params: { lookbackHours: 24, metrics: ['throughput', 'latency', 'drops'] },
    }, { agentType: 'experience' }),

    node('a2', 'agent', '网络质量检查', 80, 280, {
      action: 'check_network',
      description: 'Ops Agent checks network quality around user location',
      params: { radius: '500m', checkTypes: ['coverage', 'capacity', 'interference'] },
    }, { agentType: 'ops' }),

    node('c1', 'condition', '网络问题判断', 80, 400, {
      expression: 'input.findings.0.type === "alarm_analysis"',
      description: 'Determine if complaint is caused by network issue',
    }),

    // Network issue branch
    node('a3', 'agent', '网络参数优化', -200, 520, {
      action: 'optimize_parameters',
      description: 'Optimization Agent optimizes network parameters',
      params: { target: 'user_experience', constraints: ['interference', 'capacity'] },
    }, { agentType: 'optimization' }),

    node('a4', 'agent', '优化效果验证', -200, 640, {
      action: 'verify_improvement',
      description: 'Experience Agent verifies improvement after optimization',
      params: { waitMinutes: 30, targetImprovement: 20 },
    }, { agentType: 'experience' }),

    node('a5', 'action', '通知用户-已修复', -200, 760, {
      actionType: 'notification',
      channel: 'sms',
      message: '尊敬的用户，您反馈的网络问题已修复，感谢您的耐心等待。',
      description: 'Notify user that the issue has been resolved',
    }),

    // Non-network issue branch
    node('a6', 'agent', '套餐适配检查', 300, 520, {
      action: 'check_package',
      description: 'Marketing Agent checks if user package is suitable',
      params: { analyzeUsagePattern: true, compareAlternatives: true },
    }, { agentType: 'marketing' }),

    node('c2', 'condition', '是否需要升级', 300, 640, {
      expression: 'input.recommendations.length > 0',
      description: 'Check if a package upgrade is recommended',
    }),

    node('a7', 'action', '推荐套餐升级', 150, 760, {
      actionType: 'notification',
      channel: 'app_push',
      message: '根据您的使用习惯，我们为您推荐了更合适的套餐方案。',
      description: 'Offer package upgrade to user',
    }),

    node('a8', 'action', '通知用户-已处理', 450, 760, {
      actionType: 'notification',
      channel: 'sms',
      message: '尊敬的用户，您的投诉已处理完毕，如有问题请随时联系我们。',
      description: 'Notify user that complaint has been handled',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 'a1'),
    edge('e2', 'a1', 'a2'),
    edge('e3', 'a2', 'c1'),
    edge('e4', 'c1', 'a3', 'yes'),
    edge('e5', 'c1', 'a6', 'no'),
    edge('e6', 'a3', 'a4'),
    edge('e7', 'a4', 'a5'),
    edge('e8', 'a6', 'c2'),
    edge('e9', 'c2', 'a7', 'true'),
    edge('e10', 'c2', 'a8', 'false'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'api', config: { endpoint: '/api/v1/complaints', method: 'POST' }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-user-complaint-resolution',
    '用户投诉闭环处理',
    '接收用户投诉后自动分析体验、检查网络、优化参数或推荐套餐升级，实现投诉闭环处理',
    nodes,
    edges,
    triggers,
    { slaHours: 4, autoCloseAfterHours: 72 },
  );
}

// ---------------------------------------------------------------------------
// Template 3: New Site Activation Optimization
// ---------------------------------------------------------------------------

export function createNewSiteActivationWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '新站开通', 80, 40, {
      triggerKind: 'event',
      description: 'New site activation event from OSS',
      defaultData: { siteId: '', siteName: '', location: {}, type: '5G' },
    }, { triggerKind: 'event' }),

    node('a1', 'agent', '覆盖规划验证', 80, 160, {
      action: 'verify_coverage_plan',
      description: 'Planning Agent verifies coverage against original plan',
      params: { comparePlan: true, checkOverlap: true, checkGaps: true },
    }, { agentType: 'planning' }),

    node('a2', 'agent', '工程参数优化', 80, 280, {
      action: 'engineering_optimization',
      description: 'Optimization Agent optimizes RF parameters for new site',
      params: {
        optimizeTargets: ['coverage', 'capacity', 'interference'],
        neighborConfig: true,
        antennaTilt: true,
        power: true,
      },
    }, { agentType: 'optimization' }),

    node('a3', 'agent', '用户体验监控', 80, 400, {
      action: 'monitor_experience',
      description: 'Experience Agent monitors user experience after activation',
      params: { monitorDurationHours: 24, kpis: ['throughput', 'latency', 'handover_success'] },
    }, { agentType: 'experience' }),

    node('c1', 'condition', 'KPI达标判断', 80, 520, {
      expression: 'input.findings.0.score >= 80',
      description: 'Check if KPIs meet the target thresholds',
    }),

    // KPI met
    node('a4', 'action', '标记完成', -150, 640, {
      actionType: 'ticket',
      ticketAction: 'close',
      description: 'Mark the site activation as complete',
    }),

    // KPI not met - re-optimize
    node('a5', 'agent', '二次优化', 300, 640, {
      action: 're_optimize',
      description: 'Optimization Agent re-optimizes parameters based on live data',
      params: { useRealTrafficData: true, iterativeMode: true, maxIterations: 3 },
    }, { agentType: 'optimization' }),

    node('a6', 'agent', '二次体验验证', 300, 760, {
      action: 'verify_experience',
      description: 'Experience Agent re-verifies user experience after re-optimization',
      params: { monitorDurationHours: 12 },
    }, { agentType: 'experience' }),

    node('a7', 'action', '生成优化报告', 300, 880, {
      actionType: 'report',
      format: 'pdf',
      title: '新站开通优化报告',
      description: 'Generate optimization report for the new site',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 'a1'),
    edge('e2', 'a1', 'a2'),
    edge('e3', 'a2', 'a3'),
    edge('e4', 'a3', 'c1'),
    edge('e5', 'c1', 'a4', 'true'),
    edge('e6', 'c1', 'a5', 'false'),
    edge('e7', 'a5', 'a6'),
    edge('e8', 'a6', 'a7'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'event', config: { eventType: 'site_activation', siteTypes: ['4G', '5G'] }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-new-site-activation',
    '新站开通优化',
    '新站开通后自动执行覆盖验证、参数优化、体验监控，未达标则二次优化并生成报告',
    nodes,
    edges,
    triggers,
    { kpiThreshold: 80, maxOptimizationRounds: 3 },
  );
}

// ---------------------------------------------------------------------------
// Template 4: Emergency Event Assurance
// ---------------------------------------------------------------------------

export function createEmergencyEventAssuranceWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '事件检测', 250, 40, {
      triggerKind: 'event',
      description: 'Detect large-scale event (concert, sports match, festival)',
      defaultData: { eventId: '', eventType: 'concert', location: {}, expectedCrowd: 50000 },
    }, { triggerKind: 'event' }),

    node('s1', 'split', '并行保障启动', 250, 160, {
      description: 'Fan out to all assurance agents in parallel',
    }),

    // Parallel branch 1: Optimization
    node('a1', 'agent', '容量保障优化', 0, 300, {
      action: 'event_assurance',
      description: 'Optimization Agent adjusts capacity for event area',
      params: {
        boostCapacity: true,
        loadBalancing: true,
        carrierAggregation: true,
        targetArea: 'event_zone',
      },
    }, { agentType: 'optimization' }),

    // Parallel branch 2: Experience monitoring
    node('a2', 'agent', '用户体验监控', 250, 300, {
      action: 'monitor_experience',
      description: 'Experience Agent monitors real-time user experience',
      params: {
        realTimeMode: true,
        samplingInterval: '1m',
        kpis: ['throughput', 'latency', 'video_mos', 'connection_success'],
      },
    }, { agentType: 'experience' }),

    // Parallel branch 3: Ops stability
    node('a3', 'agent', '网络稳定性监控', 500, 300, {
      action: 'monitor_stability',
      description: 'Ops Agent monitors network stability and alarms',
      params: {
        alarmThreshold: 'heightened',
        autoHealEnabled: true,
        monitorDomains: ['ran', 'transport', 'core'],
      },
    }, { agentType: 'ops' }),

    node('m1', 'merge', '汇总保障报告', 250, 440, {
      description: 'Merge reports from all three agents',
    }),

    node('c1', 'condition', '问题判断', 250, 560, {
      expression: 'input.data.a1.success === true',
      description: 'Check if any issues were detected during the event',
    }),

    // Issues detected
    node('a4', 'action', '问题上报处理', 50, 680, {
      actionType: 'notification',
      channel: 'work_order',
      message: '突发事件保障期间检测到网络异常，请立即处理',
      description: 'Escalate detected issues to operations team',
    }),

    // No issues
    node('a5', 'action', '生成保障报告', 450, 680, {
      actionType: 'report',
      format: 'pdf',
      title: '突发事件保障报告',
      description: 'Generate final event assurance report',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 's1'),
    edge('e2', 's1', 'a1'),
    edge('e3', 's1', 'a2'),
    edge('e4', 's1', 'a3'),
    edge('e5', 'a1', 'm1'),
    edge('e6', 'a2', 'm1'),
    edge('e7', 'a3', 'm1'),
    edge('e8', 'm1', 'c1'),
    edge('e9', 'c1', 'a5', 'true'),
    edge('e10', 'c1', 'a4', 'false'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'event', config: { eventTypes: ['concert', 'sports', 'festival', 'conference'], minExpectedCrowd: 10000 }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-emergency-event-assurance',
    '突发事件保障',
    '检测到大型活动时并行启动容量优化、体验监控和稳定性监控，汇总结果后自动上报或生成报告',
    nodes,
    edges,
    triggers,
    { eventDurationHours: 4, preEventLeadMinutes: 60 },
  );
}

// ---------------------------------------------------------------------------
// Template 5: Precision Marketing Campaign
// ---------------------------------------------------------------------------

export function createPrecisionMarketingWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '营销活动创建', 80, 40, {
      triggerKind: 'manual',
      description: 'Marketing campaign creation trigger',
      defaultData: { campaignId: '', name: '', targetSegment: '', budget: 0 },
    }, { triggerKind: 'manual' }),

    node('a1', 'agent', '目标用户识别', 80, 160, {
      action: 'identify_prospects',
      description: 'Marketing Agent identifies target user segments',
      params: {
        segmentation: ['high_value', 'upgrade_ready', 'churn_risk'],
        maxTargetCount: 50000,
        scoreThreshold: 0.7,
      },
    }, { agentType: 'marketing' }),

    node('a2', 'agent', '网络容量检查', 80, 280, {
      action: 'check_capacity',
      description: 'Planning Agent checks if network can handle campaign load',
      params: { capacityMargin: 0.2, checkAreas: 'target_user_locations' },
    }, { agentType: 'planning' }),

    node('c1', 'condition', '容量是否充足', 80, 400, {
      expression: 'input.findings.0.gapPercentage < 10',
      description: 'Check if network capacity is sufficient for campaign',
    }),

    // Capacity sufficient
    node('a3', 'agent', '执行营销活动', -150, 520, {
      action: 'execute_campaign',
      description: 'Marketing Agent executes the marketing campaign',
      params: {
        channels: ['sms', 'app_push', 'call_center'],
        abTestEnabled: true,
        abTestSplit: 0.1,
      },
    }, { agentType: 'marketing' }),

    node('a4', 'agent', '营销效果监控', -150, 640, {
      action: 'monitor_impact',
      description: 'Experience Agent monitors campaign impact on user experience',
      params: { monitorDays: 7, metrics: ['conversion', 'arpu_change', 'satisfaction'] },
    }, { agentType: 'experience' }),

    node('a5', 'action', '生成营销报告', -150, 760, {
      actionType: 'report',
      format: 'pdf',
      title: '精准营销活动报告',
      description: 'Generate campaign results report',
    }),

    // Capacity insufficient
    node('a6', 'agent', '容量扩展建议', 300, 520, {
      action: 'expansion_planning',
      description: 'Planning Agent suggests capacity expansion before campaign',
      params: { planHorizon: '3_months', budgetConstraint: true },
    }, { agentType: 'planning' }),

    node('a7', 'action', '通知容量不足', 300, 640, {
      actionType: 'notification',
      channel: 'email',
      recipient: 'campaign_manager',
      message: '营销活动目标区域网络容量不足，请先完成容量扩展或缩小活动范围',
      description: 'Notify campaign manager about capacity issues',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 'a1'),
    edge('e2', 'a1', 'a2'),
    edge('e3', 'a2', 'c1'),
    edge('e4', 'c1', 'a3', 'true'),
    edge('e5', 'c1', 'a6', 'false'),
    edge('e6', 'a3', 'a4'),
    edge('e7', 'a4', 'a5'),
    edge('e8', 'a6', 'a7'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'manual', config: { requiredFields: ['campaignId', 'name', 'targetSegment'] }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-precision-marketing',
    '精准营销活动',
    '创建营销活动后自动识别目标用户、检查网络容量、执行活动并监控效果，容量不足时提供扩展建议',
    nodes,
    edges,
    triggers,
    { defaultCampaignDurationDays: 30, maxTargetUsers: 100000 },
  );
}

// ---------------------------------------------------------------------------
// Template 6: Network-Wide Health Inspection
// ---------------------------------------------------------------------------

export function createNetworkHealthInspectionWorkflow(): Workflow {
  const nodes: WorkflowNode[] = [
    node('t1', 'trigger', '定时巡检触发', 250, 40, {
      triggerKind: 'schedule',
      description: 'Daily scheduled network health inspection',
      defaultData: { scheduleTime: '02:00', regions: ['north', 'south', 'east', 'west', 'central'] },
    }, { triggerKind: 'schedule' }),

    node('s1', 'split', '区域拆分', 250, 160, {
      splitKey: 'regions',
      description: 'Split inspection into per-region parallel tasks',
    }),

    // Region health checks (parallel)
    node('a1', 'agent', '北区健康检查', -50, 300, {
      action: 'health_check',
      description: 'Ops Agent: North region health check',
      params: { region: 'north', checkItems: ['alarms', 'kpis', 'capacity', 'hardware'] },
    }, { agentType: 'ops' }),

    node('a2', 'agent', '南区健康检查', 125, 300, {
      action: 'health_check',
      description: 'Ops Agent: South region health check',
      params: { region: 'south', checkItems: ['alarms', 'kpis', 'capacity', 'hardware'] },
    }, { agentType: 'ops' }),

    node('a3', 'agent', '东区健康检查', 300, 300, {
      action: 'health_check',
      description: 'Ops Agent: East region health check',
      params: { region: 'east', checkItems: ['alarms', 'kpis', 'capacity', 'hardware'] },
    }, { agentType: 'ops' }),

    node('a4', 'agent', '西区健康检查', 475, 300, {
      action: 'health_check',
      description: 'Ops Agent: West region health check',
      params: { region: 'west', checkItems: ['alarms', 'kpis', 'capacity', 'hardware'] },
    }, { agentType: 'ops' }),

    node('a5', 'agent', '中区健康检查', 625, 300, {
      action: 'health_check',
      description: 'Ops Agent: Central region health check',
      params: { region: 'central', checkItems: ['alarms', 'kpis', 'capacity', 'hardware'] },
    }, { agentType: 'ops' }),

    node('m1', 'merge', '汇总检查结果', 250, 440, {
      description: 'Collect all region health check results',
    }),

    node('c1', 'condition', '是否发现问题', 250, 560, {
      expression: 'input.sources.length > 0',
      description: 'Check if any issues were found across all regions',
    }),

    // Issues found
    node('a6', 'agent', '创建工单', 50, 680, {
      action: 'create_tickets',
      description: 'Ops Agent creates tickets for discovered issues',
      params: { autoAssign: true, priorityMapping: true },
    }, { agentType: 'ops' }),

    node('a7', 'action', '生成巡检报告', 250, 800, {
      actionType: 'report',
      format: 'pdf',
      title: '全网健康巡检日报',
      description: 'Generate daily health inspection report',
    }),

    // No issues - just report
    node('a8', 'action', '生成健康报告', 450, 680, {
      actionType: 'report',
      format: 'pdf',
      title: '全网健康巡检日报 - 全部正常',
      description: 'Generate clean health report',
    }),
  ];

  const edges: WorkflowEdge[] = [
    edge('e1', 't1', 's1'),
    edge('e2', 's1', 'a1'),
    edge('e3', 's1', 'a2'),
    edge('e4', 's1', 'a3'),
    edge('e5', 's1', 'a4'),
    edge('e6', 's1', 'a5'),
    edge('e7', 'a1', 'm1'),
    edge('e8', 'a2', 'm1'),
    edge('e9', 'a3', 'm1'),
    edge('e10', 'a4', 'm1'),
    edge('e11', 'a5', 'm1'),
    edge('e12', 'm1', 'c1'),
    edge('e13', 'c1', 'a6', 'true'),
    edge('e14', 'c1', 'a8', 'false'),
    edge('e15', 'a6', 'a7'),
  ];

  const triggers: WorkflowTrigger[] = [
    { id: 'trg1', type: 'schedule', config: { cron: '0 2 * * *', timezone: 'Asia/Shanghai' }, nodeId: 't1' },
  ];

  return makeWorkflow(
    'wf-network-health-inspection',
    '全网健康巡检',
    '每日定时触发全网健康巡检，按区域并行检查，汇总结果后自动创建工单并生成巡检报告',
    nodes,
    edges,
    triggers,
    { inspectionTime: '02:00', reportRecipients: ['ops_manager', 'noc_team'] },
  );
}

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

export interface WorkflowTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: string;
  icon: string;
  create: () => Workflow;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'network-fault-diagnosis',
    name: '网络故障自动诊断与修复',
    nameEn: 'Network Fault Auto-Diagnosis & Fix',
    description: '接收网络告警后自动分类、诊断根因，通过数字孪生仿真验证修复方案',
    category: 'operations',
    icon: 'AlertTriangle',
    create: createNetworkFaultDiagnosisWorkflow,
  },
  {
    id: 'user-complaint-resolution',
    name: '用户投诉闭环处理',
    nameEn: 'User Complaint Resolution Loop',
    description: '自动分析用户体验、检查网络、优化参数或推荐套餐升级',
    category: 'experience',
    icon: 'UserCheck',
    create: createUserComplaintResolutionWorkflow,
  },
  {
    id: 'new-site-activation',
    name: '新站开通优化',
    nameEn: 'New Site Activation Optimization',
    description: '新站开通后自动执行覆盖验证、参数优化、体验监控',
    category: 'planning',
    icon: 'Radio',
    create: createNewSiteActivationWorkflow,
  },
  {
    id: 'emergency-event-assurance',
    name: '突发事件保障',
    nameEn: 'Emergency Event Assurance',
    description: '大型活动时并行启动容量优化、体验监控和稳定性监控',
    category: 'operations',
    icon: 'Shield',
    create: createEmergencyEventAssuranceWorkflow,
  },
  {
    id: 'precision-marketing',
    name: '精准营销活动',
    nameEn: 'Precision Marketing Campaign',
    description: '自动识别目标用户、检查网络容量、执行活动并监控效果',
    category: 'marketing',
    icon: 'Target',
    create: createPrecisionMarketingWorkflow,
  },
  {
    id: 'network-health-inspection',
    name: '全网健康巡检',
    nameEn: 'Network-Wide Health Inspection',
    description: '每日定时全网健康巡检，按区域并行检查并生成报告',
    category: 'operations',
    icon: 'Activity',
    create: createNetworkHealthInspectionWorkflow,
  },
];

export function getWorkflowTemplate(
  templateId: string,
): WorkflowTemplate | undefined {
  return workflowTemplates.find((t) => t.id === templateId);
}

export function createWorkflowFromTemplate(
  templateId: string,
): Workflow | undefined {
  const template = getWorkflowTemplate(templateId);
  return template?.create();
}

export function getAllTemplates(): WorkflowTemplate[] {
  return workflowTemplates;
}

export default workflowTemplates;
