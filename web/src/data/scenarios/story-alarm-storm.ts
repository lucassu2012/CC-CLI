import type { ScenarioData } from '../scenario-types';

export const storyAlarmStorm: ScenarioData = {
  meta: {
    id: 'alarm-storm-rca',
    name: '5G Alarm Storm & Intelligent RCA',
    nameZh: '5G告警风暴与智能根因分析',
    description: 'A fiber cut on backbone link GD-TRUNK-07 causes 847 cascading alarms across 200+ base stations. IOE auto-correlates alarms, identifies root cause in 45 seconds, and orchestrates traffic rerouting and field repair.',
    descriptionZh: '骨干链路GD-TRUNK-07光缆中断导致200+基站847条级联告警。IOE在45秒内自动关联告警、定位根因，并编排流量迂回与现场修复。',
    version: '1.0.0',
    author: 'IOE Team',
    createdAt: '2026-04-05',
    tags: ['alarm-storm', 'rca', 'fiber-cut', 'auto-healing', 'network-ops'],
  },
  dashboard: {
    kpis: [
      { id: 'network-avail', name: 'Network Availability', nameZh: '网络可用性', value: 97.2, unit: '%', trend: 'down', change: -2.75, target: 99.95, history: [99.95, 99.95, 99.94, 99.93, 99.90, 98.50, 97.80, 97.20, 97.20, 97.35, 97.80, 98.10] },
      { id: 'alarm-count', name: 'Active Alarms', nameZh: '活动告警', value: 847, unit: '', trend: 'up', change: 815, target: 30, history: [28, 30, 32, 29, 35, 120, 450, 847, 847, 820, 650, 500] },
      { id: 'mttr', name: 'MTTR', nameZh: '平均修复时长', value: 12.5, unit: 'min', trend: 'down', change: -17.5, target: 30, history: [28, 30, 25, 32, 30, 15, 12, 12.5, 12.5, 13, 14, 15] },
      { id: 'call-drop', name: 'Call Drop Rate', nameZh: '掉话率', value: 2.8, unit: '%', trend: 'up', change: 2.5, target: 0.3, history: [0.25, 0.28, 0.30, 0.27, 0.32, 1.50, 2.20, 2.80, 2.80, 2.40, 1.80, 1.20] },
      { id: 'throughput', name: 'Avg Throughput', nameZh: '平均吞吐量', value: 380, unit: 'Mbps', trend: 'down', change: -120, target: 500, history: [510, 505, 498, 502, 495, 420, 390, 380, 380, 395, 420, 450] },
      { id: 'affected-users', name: 'Affected Users', nameZh: '受影响用户', value: 45200, unit: '', trend: 'up', change: 45200, target: 0, history: [0, 0, 0, 0, 200, 15000, 32000, 45200, 45200, 38000, 25000, 12000] },
    ],
    alerts: [
      { id: 'ALM-S1', severity: 'critical', title: 'Fiber Cut Detected — GD-TRUNK-07 at KM12.3', titleZh: '光缆中断 — GD-TRUNK-07 第12.3公里处', source: 'OSS FM', timestamp: '刚刚', acknowledged: false, detail: 'OTDR test confirms complete fiber break. Backbone link serving Tianhe & Baiyun districts.', detailZh: 'OTDR测试确认光纤完全断裂。骨干链路服务天河区和白云区。', affectedScope: '200+ BTS, 45K users', affectedScopeZh: '200+基站，4.5万用户' },
      { id: 'ALM-S2', severity: 'critical', title: '23 BTS Lost S1 Connectivity Simultaneously', titleZh: '23个基站同时丢失S1连接', source: 'OSS FM', timestamp: '2分钟前', acknowledged: false, detail: 'All BTS on GD-TRUNK-07 ring lost S1-MME and S1-U connectivity. Users experiencing total service outage in affected cells.', detailZh: 'GD-TRUNK-07环上所有基站丢失S1-MME和S1-U连接。受影响小区用户全部服务中断。', affectedScope: '23 BTS, Tianhe district', affectedScopeZh: '23个基站，天河区' },
      { id: 'ALM-S3', severity: 'major', title: 'Alarm Storm — 847 Alarms in 3 Minutes', titleZh: '告警风暴 — 3分钟内847条告警', source: 'IOE Correlator', timestamp: '5分钟前', acknowledged: true, detail: 'IOE alarm correlator identified cascading alarm pattern. 847 alarms compressed to 1 root cause group.', detailZh: 'IOE告警关联器识别级联告警模式。847条告警压缩为1个根因组。', affectedScope: 'All domains', affectedScopeZh: '所有域' },
      { id: 'ALM-S4', severity: 'major', title: 'Traffic Rerouting in Progress — Capacity at 89%', titleZh: '流量迂回中 — 容量利用率89%', source: 'Optimization Agent', timestamp: '5分钟前', acknowledged: true, detail: 'Automatic traffic rerouting via backup ring GD-TRUNK-08. Current load at 89% capacity.', detailZh: '通过备用环路GD-TRUNK-08自动迂回流量。当前负载89%。', affectedScope: 'GD-TRUNK-08 backup', affectedScopeZh: 'GD-TRUNK-08备用环路' },
      { id: 'ALM-S5', severity: 'warning', title: 'Backup Microwave Link Activated (Limited BW)', titleZh: '备用微波链路已激活（带宽有限）', source: 'OSS CM', timestamp: '5分钟前', acknowledged: true, detail: 'Emergency microwave links providing 200Mbps backup for 5 critical BTS sites.', detailZh: '应急微波链路为5个关键基站提供200Mbps备份。', affectedScope: '5 BTS sites', affectedScopeZh: '5个基站' },
      { id: 'ALM-S6', severity: 'critical', title: 'VIP Users in Tianhe Experiencing Degradation', titleZh: '天河区VIP用户体验劣化', source: 'SmartCare CEM', timestamp: '5分钟前', acknowledged: true, detail: '156 Diamond-tier VIP users in affected area with QoE score <3.0. QoS protection activated.', detailZh: '受影响区域156位钻石卡VIP用户QoE评分<3.0。QoS保护已激活。', affectedScope: '156 VIP users', affectedScopeZh: '156位VIP用户' },
      { id: 'ALM-S7', severity: 'warning', title: 'IOE RCA: Root Cause Identified — Fiber Cut KM12.3', titleZh: 'IOE根因分析：根因已定位 — 光缆断裂KM12.3', source: 'RCA Engine', timestamp: '5分钟前', acknowledged: true, detail: 'Root cause analysis completed in 45 seconds. Construction activity at KM12.3 damaged fiber conduit.', detailZh: '根因分析在45秒内完成。KM12.3处施工活动损坏光缆管道。', affectedScope: 'Confirmed root cause', affectedScopeZh: '根因已确认' },
    ],
    tasks: [
      { id: 'TSK-S1', title: 'Alarm Correlation: 847 alarms → 1 root cause', titleZh: '告警关联：847条告警 → 1个根因', agent: 'Ops Agent', collaborators: ['Fault Analysis Agent'], status: 'completed', timestamp: '刚刚', duration: '45s', detail: 'Correlated 847 alarms using topology-aware algorithm', detailZh: '使用拓扑感知算法关联847条告警', result: '1 root cause group identified', resultZh: '识别出1个根因组' },
      { id: 'TSK-S2', title: 'Root cause: Fiber cut GD-TRUNK-07 KM12.3', titleZh: '根因定位：光缆中断 GD-TRUNK-07 KM12.3', agent: 'Fault Analysis Agent', status: 'completed', timestamp: '2分钟前', duration: '45s', detail: 'OTDR + topology + alarm pattern analysis', detailZh: 'OTDR+拓扑+告警模式分析', result: 'Construction damage confirmed', resultZh: '施工损坏已确认' },
      { id: 'TSK-S3', title: 'Automatic traffic rerouting via backup paths', titleZh: '通过备用路径自动迂回流量', agent: 'Optimization Agent', collaborators: ['Real-time Opt Agent'], status: 'running', timestamp: '5分钟前', duration: '3min+', detail: 'Rerouting 45K users through GD-TRUNK-08 ring', detailZh: '将4.5万用户通过GD-TRUNK-08环路迂回', result: '78% users restored', resultZh: '78%用户已恢复' },
      { id: 'TSK-S4', title: 'Field team dispatched to fiber cut location', titleZh: '外线团队已派往光缆断裂位置', agent: 'Ops Agent', collaborators: ['O&M Monitor Agent'], status: 'running', timestamp: '5分钟前', duration: '5min+', detail: 'GPS coordinates sent to nearest field team (ETA 25min)', detailZh: 'GPS坐标已发送至最近外线团队（预计25分钟到达）', result: 'Team en route', resultZh: '团队在途' },
      { id: 'TSK-S5', title: 'VIP user QoS protection activated', titleZh: 'VIP用户QoS保护已激活', agent: 'Experience Agent', collaborators: ['Deterministic Exp Agent'], status: 'completed', timestamp: '5分钟前', duration: '12s', detail: 'Dedicated QoS bearers for 156 Diamond-tier users', detailZh: '为156位钻石卡用户激活专用QoS承载', result: 'VIP QoE restored to 4.2', resultZh: 'VIP QoE恢复至4.2' },
      { id: 'TSK-S6', title: 'Post-recovery KPI validation', titleZh: '恢复后KPI验证', agent: 'Optimization Agent', status: 'queued', timestamp: '15分钟前', duration: '—', detail: 'Will validate all KPIs after fiber repair', detailZh: '光缆修复后验证所有KPI', result: 'Pending', resultZh: '等待中' },
      { id: 'TSK-S7', title: 'Enterprise customer notification sent', titleZh: '企业客户通知已发送', agent: 'Marketing Agent', collaborators: ['Churn Prevention Agent'], status: 'completed', timestamp: '5分钟前', duration: '8s', detail: 'SMS + email to 23 enterprise accounts in affected area', detailZh: '向受影响区域23个企业账户发送短信+邮件', result: '23 customers notified', resultZh: '23个客户已通知' },
      { id: 'TSK-S8', title: 'Backup link capacity monitoring', titleZh: '备用链路容量监控', agent: 'Planning Agent', collaborators: ['Capacity Planning Agent'], status: 'running', timestamp: '5分钟前', duration: '5min+', detail: 'Monitoring GD-TRUNK-08 utilization to prevent overload', detailZh: '监控GD-TRUNK-08利用率防止过载', result: 'Currently at 89%', resultZh: '当前89%' },
    ],
    extraTasks: [
      { id: 'TSK-SE1', title: 'Neighbor cell load balancing for affected BTS', titleZh: '受影响基站邻区负载均衡', agent: 'Optimization Agent', status: 'running', timestamp: '刚刚', duration: '2min', detail: 'MLB adjusting handover thresholds', detailZh: 'MLB调整切换阈值', result: 'In progress', resultZh: '进行中' },
      { id: 'TSK-SE2', title: 'Generating incident report for management', titleZh: '生成管理层事件报告', agent: 'Ops Agent', status: 'running', timestamp: '刚刚', duration: '1min', detail: 'Auto-generating executive summary with timeline', detailZh: '自动生成带时间线的管理摘要', result: 'Drafting', resultZh: '起草中' },
    ],
    extraAlerts: [
      { id: 'ALM-SE1', severity: 'warning', title: 'Backup ring utilization trending up', titleZh: '备用环路利用率上升趋势', source: 'Planning Agent', timestamp: '刚刚', acknowledged: false, detail: 'GD-TRUNK-08 at 89%, projected 95% in 30min', detailZh: 'GD-TRUNK-08利用率89%，预计30分钟后达95%', affectedScope: 'Backup ring', affectedScopeZh: '备用环路' },
      { id: 'ALM-SE2', severity: 'minor', title: 'Field team GPS update — 15min ETA', titleZh: '外线团队GPS更新 — 预计15分钟到达', source: 'ITSM', timestamp: '刚刚', acknowledged: true, detail: 'Repair crew approaching KM12.3 location', detailZh: '修复团队接近KM12.3位置', affectedScope: 'Repair', affectedScopeZh: '修复' },
    ],
  },
  agents: [
    {
      id: 'ops', name: 'O&M Agent', nameZh: '运维Agent',
      domain: 'Operations & Maintenance', domainZh: '运维管理',
      status: 'active' as const, description: 'Leading alarm storm response and field coordination', descriptionZh: '主导告警风暴响应和现场协调',
      taskCount: 234, successRate: 98.5,
      subAgents: [
        { id: 'fault-analysis', name: 'Fault Analysis Agent', nameZh: '故障分析Agent', status: 'active' as const, currentTask: 'Monitoring post-RCA recovery', currentTaskZh: '监控RCA后恢复', toolCalls: 89, successRate: 99.1, permissionLevel: 3 },
        { id: 'om-monitor', name: 'O&M Monitor Agent', nameZh: '运维监控Agent', status: 'active' as const, currentTask: 'Tracking alarm storm resolution', currentTaskZh: '跟踪告警风暴解决', toolCalls: 156, successRate: 99.5, permissionLevel: 2 },
        { id: 'event-assurance', name: 'Event Assurance Agent', nameZh: '事件保障Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 12, successRate: 98.0, permissionLevel: 4 },
      ],
    },
    {
      id: 'optimization', name: 'Optimization Agent', nameZh: '优化Agent',
      domain: 'Network Optimization', domainZh: '网络优化',
      status: 'active' as const, description: 'Traffic rerouting and load balancing during fiber cut', descriptionZh: '光缆中断期间流量迂回和负载均衡',
      taskCount: 178, successRate: 97.8,
      subAgents: [
        { id: 'realtime-opt', name: 'Real-time Opt Agent', nameZh: '实时优化Agent', status: 'active' as const, currentTask: 'Traffic rerouting via GD-TRUNK-08', currentTaskZh: '通过GD-TRUNK-08迂回流量', toolCalls: 67, successRate: 98.2, permissionLevel: 4 },
        { id: 'engineering-opt', name: 'Engineering Opt Agent', nameZh: '工程优化Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 45, successRate: 97.5, permissionLevel: 3 },
        { id: 'experience-opt', name: 'Experience Opt Agent', nameZh: '体验优化Agent', status: 'active' as const, currentTask: 'Neighbor cell parameter adjustment', currentTaskZh: '邻区参数调整', toolCalls: 34, successRate: 96.8, permissionLevel: 3 },
      ],
    },
    {
      id: 'experience', name: 'Experience Agent', nameZh: '体验Agent',
      domain: 'Customer Experience', domainZh: '客户体验',
      status: 'active' as const, description: 'Protecting VIP user experience during outage', descriptionZh: '中断期间保护VIP用户体验',
      taskCount: 89, successRate: 96.5,
      subAgents: [
        { id: 'deterministic-exp', name: 'Deterministic Exp Agent', nameZh: '确定性体验Agent', status: 'active' as const, currentTask: 'VIP QoS bearer management', currentTaskZh: 'VIP QoS承载管理', toolCalls: 45, successRate: 97.0, permissionLevel: 3 },
        { id: 'value-insight', name: 'Value Insight Agent', nameZh: '价值洞察Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 23, successRate: 95.5, permissionLevel: 2 },
        { id: 'proactive-care', name: 'Proactive Care Agent', nameZh: '主动关怀Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 18, successRate: 94.0, permissionLevel: 2 },
      ],
    },
    {
      id: 'planning', name: 'Planning Agent', nameZh: '规划Agent',
      domain: 'Network Planning', domainZh: '网络规划',
      status: 'active' as const, description: 'Monitoring backup capacity and post-incident planning', descriptionZh: '监控备用容量和事后规划',
      taskCount: 56, successRate: 97.2,
      subAgents: [
        { id: 'capacity-planning', name: 'Capacity Planning Agent', nameZh: '容量规划Agent', status: 'active' as const, currentTask: 'Backup link capacity monitoring', currentTaskZh: '备用链路容量监控', toolCalls: 34, successRate: 97.5, permissionLevel: 2 },
        { id: 'coverage-planning', name: 'Coverage Planning Agent', nameZh: '覆盖规划Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 12, successRate: 96.0, permissionLevel: 2 },
        { id: 'value-planning', name: 'Value Planning Agent', nameZh: '价值规划Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 8, successRate: 95.0, permissionLevel: 2 },
      ],
    },
    {
      id: 'marketing', name: 'Marketing Agent', nameZh: '营销Agent',
      domain: 'Marketing Operations', domainZh: '市场运营',
      status: 'active' as const, description: 'Customer communication during service disruption', descriptionZh: '服务中断期间客户沟通',
      taskCount: 34, successRate: 95.0,
      subAgents: [
        { id: 'churn-prevention', name: 'Churn Prevention Agent', nameZh: '离网维挽Agent', status: 'active' as const, currentTask: 'Monitoring churn risk for affected users', currentTaskZh: '监控受影响用户流失风险', toolCalls: 15, successRate: 94.0, permissionLevel: 2 },
        { id: 'precision-marketing', name: 'Precision Marketing Agent', nameZh: '精准营销Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 8, successRate: 93.0, permissionLevel: 2 },
        { id: 'channel-optimization', name: 'Channel Opt Agent', nameZh: '渠道优化Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 5, successRate: 92.0, permissionLevel: 1 },
      ],
    },
  ],
  conversations: [
    {
      id: 'conv-alarm-rca', title: 'Alarm Storm Auto-Diagnosis', titleZh: '告警风暴自动诊断', domain: 'ops',
      messages: [
        { id: 'msg-1', role: 'system', content: '⚠️ ALARM STORM DETECTED: 847 alarms received in 3 minutes. Auto-correlation initiated.', timestamp: '14:23:00' },
        { id: 'msg-2', role: 'user', content: 'What is happening? Massive alarms flooding in from Guangdong region.', timestamp: '14:23:15' },
        { id: 'msg-3', role: 'assistant', content: '## Alarm Storm Analysis\n\nI\'ve detected **847 alarms** in 3 minutes, primarily from the Guangdong Tianhe & Baiyun districts. Let me run root cause analysis.\n\n### Findings:\n- **Root Cause**: Fiber cut on backbone link **GD-TRUNK-07** at **KM12.3**\n- **Impact**: 23 BTS lost S1 connectivity, affecting ~45,200 users\n- **Correlation**: 847 alarms compressed to **1 root cause group** (99.8% confidence)\n\n### Automatic Actions Taken:\n1. ✅ Traffic rerouting via backup ring GD-TRUNK-08\n2. ✅ VIP QoS protection activated for 156 Diamond users\n3. ✅ Field team dispatched (ETA 25 min)\n4. ✅ Enterprise customer notifications sent\n\n### Current Status:\n- 78% of affected users restored via rerouting\n- Backup link at 89% capacity\n- Estimated full recovery: 45 min (pending fiber repair)',
          timestamp: '14:23:45',
          toolCalls: [
            { id: 'tc-1', name: 'oss_get_alarms', status: 'completed', input: '{ "severity": "critical", "timeRange": "3min", "region": "GD" }', output: '847 alarms, 23 BTS affected', duration: '2.3s' },
            { id: 'tc-2', name: 'adn_trigger_rca', status: 'completed', input: '{ "alarmGroup": "GD-TRUNK-07-cascade", "method": "topology-aware" }', output: 'Root cause: fiber cut at KM12.3, confidence 99.8%', duration: '8.1s' },
            { id: 'tc-3', name: 'oss_get_topology', status: 'completed', input: '{ "linkId": "GD-TRUNK-07", "includeBackup": true }', output: 'Backup ring GD-TRUNK-08 available, capacity 2Gbps', duration: '1.5s' },
          ],
          thinkingSteps: [
            { phase: 'Think', phaseZh: '思考', content: 'Detecting alarm pattern: 847 alarms in 3min, geographically clustered in Tianhe+Baiyun. This pattern suggests a common upstream failure, likely transport/backbone.', contentZh: '检测告警模式：3分钟内847条告警，地理集中在天河+白云区。此模式表明上游公共故障，可能是传输/骨干层。', timestamp: '14:23:16' },
            { phase: 'Act', phaseZh: '行动', content: 'Running topology-aware RCA correlating alarm timestamps, affected NE locations, and physical fiber paths. Cross-referencing with OTDR data.', contentZh: '运行拓扑感知RCA，关联告警时间戳、受影响网元位置和物理光缆路径。交叉参考OTDR数据。', timestamp: '14:23:20' },
            { phase: 'Observe', phaseZh: '观察', content: 'RCA result: 99.8% confidence — fiber cut at GD-TRUNK-07 KM12.3. All 23 affected BTS are on this ring. Backup ring GD-TRUNK-08 is available with 2Gbps capacity.', contentZh: 'RCA结果：99.8%置信度 — GD-TRUNK-07 KM12.3光缆断裂。所有23个受影响基站在此环上。备用环GD-TRUNK-08可用，2Gbps容量。', timestamp: '14:23:35' },
          ],
          suggestions: [
            { id: 'sug-1', text: 'Approve traffic rerouting plan', textZh: '批准流量迂回方案', type: 'approve' },
            { id: 'sug-2', text: 'Dispatch additional field team', textZh: '调派额外外线团队', type: 'explore' },
          ],
        },
      ],
    },
  ],
  workflows: [
    { id: 'wf-s1', workflowName: 'Alarm Storm Correlation & RCA', workflowNameZh: '告警风暴关联与根因分析', status: 'completed', startTime: '14:23:00', duration: '45s', nodesExecuted: 8, totalNodes: 8, trigger: 'Auto — alarm rate >100/min', triggerZh: '自动 — 告警速率>100/min', result: 'Root cause identified: fiber cut GD-TRUNK-07 KM12.3', resultZh: '根因已定位：光缆断裂GD-TRUNK-07 KM12.3', agentsInvolved: ['Ops Agent', 'Fault Analysis Agent'] },
    { id: 'wf-s2', workflowName: 'Traffic Rerouting & Recovery', workflowNameZh: '流量迂回与恢复', status: 'running', startTime: '14:24:00', duration: '5min+', nodesExecuted: 5, totalNodes: 7, trigger: 'Auto — backbone failure', triggerZh: '自动 — 骨干故障', result: '78% users restored via backup ring', resultZh: '78%用户通过备用环路恢复', agentsInvolved: ['Optimization Agent', 'Real-time Opt Agent'] },
    { id: 'wf-s3', workflowName: 'Field Dispatch & Fiber Repair', workflowNameZh: '外线派遣与光缆修复', status: 'running', startTime: '14:25:00', duration: '10min+', nodesExecuted: 3, totalNodes: 6, trigger: 'Auto — physical damage', triggerZh: '自动 — 物理损坏', result: 'Team en route, ETA 15min', resultZh: '团队在途，预计15分钟到达', agentsInvolved: ['Ops Agent', 'O&M Monitor Agent'] },
    { id: 'wf-s4', workflowName: 'Post-Recovery KPI Validation', workflowNameZh: '恢复后KPI验证', status: 'cancelled', startTime: '—', duration: '—', nodesExecuted: 0, totalNodes: 5, trigger: 'Manual — after repair', triggerZh: '手动 — 修复后', result: 'Pending fiber repair completion', resultZh: '等待光缆修复完成', agentsInvolved: ['Optimization Agent', 'Experience Agent'] },
  ],
};
