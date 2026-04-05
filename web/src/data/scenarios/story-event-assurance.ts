import type { ScenarioData } from '../scenario-types';

export const storyEventAssurance: ScenarioData = {
  meta: {
    id: 'event-assurance',
    name: 'Major Event Network Assurance — Stadium Concert 80K',
    nameZh: '重大活动网络保障 — 8万人体育场演唱会',
    description: 'IOE orchestrates end-to-end network assurance for an 80,000-attendee stadium concert. Pre-event capacity modeling, temporary cell deployment, real-time load balancing, and VIP area QoS — achieving 99.2% availability and 4.5 QoE score with zero critical incidents.',
    descriptionZh: 'IOE编排8万人体育场演唱会端到端网络保障。赛前容量建模、临时站点部署、实时负载均衡和VIP区域QoS — 实现99.2%可用性和4.5 QoE评分，零重大事故。',
    version: '1.0.0',
    author: 'IOE Team',
    createdAt: '2026-04-05',
    tags: ['event-assurance', 'stadium', 'concert', 'capacity-planning', 'temporary-cells'],
  },
  dashboard: {
    kpis: [
      { id: 'venue-avail', name: 'Venue Availability', nameZh: '场馆网络可用性', value: 99.2, unit: '%', trend: 'stable' as const, change: 0.1, target: 99.0, history: [98.5, 98.8, 99.0, 99.1, 99.2, 99.2, 99.3, 99.2, 99.1, 99.2, 99.2, 99.2] },
      { id: 'concurrent-users', name: 'Concurrent Users', nameZh: '并发用户数', value: 72500, unit: '', trend: 'up' as const, change: 8500, target: 80000, history: [0, 5000, 15000, 28000, 42000, 55000, 64000, 68000, 70000, 71500, 72000, 72500] },
      { id: 'avg-throughput', name: 'Avg Throughput', nameZh: '平均吞吐量', value: 850, unit: 'Mbps', trend: 'stable' as const, change: 50, target: 800, history: [200, 350, 520, 680, 780, 820, 840, 850, 855, 850, 848, 850] },
      { id: 'qoe-score', name: 'QoE Score', nameZh: 'QoE评分', value: 4.5, unit: '/5', trend: 'stable' as const, change: 0.0, target: 4.0, history: [4.8, 4.7, 4.6, 4.5, 4.5, 4.5, 4.5, 4.5, 4.4, 4.5, 4.5, 4.5] },
      { id: 'video-success', name: 'Video Streaming Success', nameZh: '视频流成功率', value: 96.8, unit: '%', trend: 'stable' as const, change: -0.2, target: 95.0, history: [99.0, 98.5, 98.0, 97.5, 97.2, 97.0, 96.8, 96.8, 96.7, 96.8, 96.8, 96.8] },
      { id: 'social-upload', name: 'Social Media Upload', nameZh: '社交媒体上传速度', value: 12.5, unit: 'Mbps', trend: 'stable' as const, change: 0.5, target: 10.0, history: [25.0, 20.0, 18.0, 15.0, 14.0, 13.0, 12.5, 12.5, 12.3, 12.5, 12.5, 12.5] },
    ],
    alerts: [
      { id: 'ALM-E1', severity: 'minor' as const, title: 'Peak Concurrent Users — 72,500 (90.6% Capacity)', titleZh: '并发用户峰值 — 72500人（容量90.6%）', source: 'Capacity Monitor', timestamp: '刚刚', acknowledged: true, detail: 'Concert main act started 20 minutes ago. User count stabilized at 72,500. All temporary cells operational.', detailZh: '主演出开始20分钟。用户数稳定在72500。所有临时站点运行正常。', affectedScope: 'Entire venue', affectedScopeZh: '全场馆' },
      { id: 'ALM-E2', severity: 'warning' as const, title: 'Section C Uplink Congestion — Social Upload Spike', titleZh: 'C区上行拥塞 — 社交上传激增', source: 'Real-time Opt Agent', timestamp: '5分钟前', acknowledged: true, detail: 'Section C (VIP standing area) experiencing uplink congestion due to mass live-streaming. Auto MLB activated, redirecting to temporary cell TC-05.', detailZh: 'C区（VIP站立区）因大规模直播出现上行拥塞。自动MLB已激活，重定向至临时站TC-05。', affectedScope: 'Section C, 8,000 users', affectedScopeZh: 'C区，8000用户' },
      { id: 'ALM-E3', severity: 'minor' as const, title: 'Temporary Cell TC-03 Power Supply — Battery at 65%', titleZh: '临时站TC-03电源 — 电池65%', source: 'O&M Monitor', timestamp: '15分钟前', acknowledged: true, detail: 'Mobile generator backup has been activated. Estimated 4+ hours remaining.', detailZh: '移动发电机备份已激活。预计剩余4+小时。', affectedScope: 'TC-03 coverage area', affectedScopeZh: 'TC-03覆盖区域' },
      { id: 'ALM-E4', severity: 'minor' as const, title: 'CDN Cache Hit Rate Optimal — 94.2%', titleZh: 'CDN缓存命中率最优 — 94.2%', source: 'CDN Monitor', timestamp: '10分钟前', acknowledged: true, detail: 'Pre-cached concert-related content (artist pages, ticket info, venue maps) achieving 94.2% hit rate.', detailZh: '预缓存演唱会相关内容（艺人页面、票务信息、场馆地图）命中率94.2%。', affectedScope: 'All CDN nodes', affectedScopeZh: '全部CDN节点' },
      { id: 'ALM-E5', severity: 'warning' as const, title: 'Parking Lot Exit — Predicted 15K User Surge in 40min', titleZh: '停车场出口 — 预测40分钟后1.5万用户涌出', source: 'Planning Agent', timestamp: '刚刚', acknowledged: false, detail: 'Concert ending in ~40 minutes. Predictive model expects 15,000 users transitioning from venue cells to macro cells. Pre-positioning handover parameters.', detailZh: '演唱会约40分钟后结束。预测模型预计15000用户从场馆小站切换至宏站。预调整切换参数。', affectedScope: 'Venue exit + surrounding macro cells', affectedScopeZh: '场馆出口+周围宏站' },
    ],
    tasks: [
      { id: 'TSK-E1', title: 'Pre-event capacity modeling & simulation', titleZh: '赛前容量建模与仿真', agent: 'Planning Agent', collaborators: ['Capacity Planning Agent'], status: 'completed' as const, timestamp: '2天前', duration: '45min', detail: 'Monte Carlo simulation of 80K concurrent users across 12 sectors with 8 temporary cells', detailZh: '8万并发用户12个扇区8个临时站的蒙特卡洛仿真', result: '99.5% confidence: 8 temp cells sufficient', resultZh: '99.5%置信度：8个临时站足够' },
      { id: 'TSK-E2', title: 'Temporary cell deployment & testing', titleZh: '临时站点部署与测试', agent: 'Ops Agent', collaborators: ['O&M Monitor Agent'], status: 'completed' as const, timestamp: '1天前', duration: '4h', detail: 'Deployed 8 temporary cells (TC-01 to TC-08) with microwave backhaul, tested capacity and handover', detailZh: '部署8个临时站（TC-01至TC-08）含微波回传，测试容量和切换', result: 'All 8 cells operational, 10Gbps total capacity', resultZh: '全部8个站运行正常，总容量10Gbps' },
      { id: 'TSK-E3', title: 'Real-time load prediction & balancing', titleZh: '实时负载预测与均衡', agent: 'Optimization Agent', collaborators: ['Real-time Opt Agent'], status: 'running' as const, timestamp: '2小时前', duration: '2h+', detail: 'ML-based load prediction with 15-min look-ahead, automatic MLB between temp and macro cells', detailZh: 'ML负载预测15分钟前瞻，临时站与宏站间自动MLB', result: 'Load balanced, max sector at 88%', resultZh: '负载已均衡，最高扇区88%' },
      { id: 'TSK-E4', title: 'VIP area dedicated QoS activation', titleZh: 'VIP区域专属QoS激活', agent: 'Experience Agent', collaborators: ['Deterministic Exp Agent'], status: 'completed' as const, timestamp: '3小时前', duration: '5min', detail: 'Dedicated QoS bearers for VVIP box (500 users) and VIP standing (8,000 users)', detailZh: 'VVIP包厢（500用户）和VIP站区（8000用户）专属QoS承载', result: 'VIP QoE 4.8, VVIP QoE 4.9', resultZh: 'VIP QoE 4.8，VVIP QoE 4.9' },
      { id: 'TSK-E5', title: 'Social media upload optimization', titleZh: '社交媒体上传优化', agent: 'Optimization Agent', collaborators: ['Experience Opt Agent'], status: 'running' as const, timestamp: '30分钟前', duration: '30min+', detail: 'Uplink scheduling optimization for video upload bursts during key moments (song transitions)', detailZh: '关键时刻（歌曲转场）视频上传突发的上行调度优化', result: 'Avg upload 12.5Mbps, 96.8% video success', resultZh: '平均上传12.5Mbps，视频成功率96.8%' },
      { id: 'TSK-E6', title: 'CDN pre-caching for event content', titleZh: '活动内容CDN预缓存', agent: 'Planning Agent', status: 'completed' as const, timestamp: '6小时前', duration: '15min', detail: 'Pre-cached artist pages, event app assets, venue maps to edge CDN nodes', detailZh: '将艺人页面、活动APP资源、场馆地图预缓存至边缘CDN节点', result: 'Cache hit rate 94.2%', resultZh: '缓存命中率94.2%' },
      { id: 'TSK-E7', title: 'Post-event crowd dispersal planning', titleZh: '散场人群疏散规划', agent: 'Planning Agent', collaborators: ['Capacity Planning Agent'], status: 'running' as const, timestamp: '刚刚', duration: '5min+', detail: 'Pre-configuring handover params for 15K users transitioning venue→macro cells', detailZh: '预配置15000用户从场馆站→宏站切换参数', result: 'Handover params pre-staged', resultZh: '切换参数已预部署' },
      { id: 'TSK-E8', title: 'Enterprise sponsor network SLA monitoring', titleZh: '企业赞助商网络SLA监控', agent: 'Marketing Agent', collaborators: ['Proactive Care Agent'], status: 'running' as const, timestamp: '2小时前', duration: '2h+', detail: 'Dedicated SLA monitoring for 5 sponsor brands requiring guaranteed connectivity for payment terminals and digital activations', detailZh: '5个赞助品牌的专属SLA监控，确保支付终端和数字互动的连接保障', result: 'All 5 sponsors at SLA target', resultZh: '全部5个赞助商达SLA目标' },
    ],
    extraTasks: [
      { id: 'TSK-EE1', title: 'Emergency microwave backup link standby', titleZh: '应急微波备份链路待命', agent: 'Ops Agent', status: 'completed' as const, timestamp: '4小时前', duration: '10min', detail: 'Configured 2 emergency microwave links as hot standby', detailZh: '配置2条应急微波链路热备', result: '2 backup links ready', resultZh: '2条备份链路就绪' },
      { id: 'TSK-EE2', title: 'Real-time dashboard for event command center', titleZh: '活动指挥中心实时大屏', agent: 'Ops Agent', status: 'running' as const, timestamp: '3小时前', duration: '3h+', detail: 'Live KPI dashboard streaming to event command center displays', detailZh: '实时KPI大屏推送至活动指挥中心显示屏', result: 'Dashboard live, 5s refresh', resultZh: '大屏在线，5秒刷新' },
    ],
    extraAlerts: [
      { id: 'ALM-EE1', severity: 'minor' as const, title: 'TC-07 handover success rate 99.8% — excellent', titleZh: 'TC-07切换成功率99.8% — 优秀', source: 'Optimization Agent', timestamp: '刚刚', acknowledged: true, detail: 'Temporary cell TC-07 (main stage coverage) performing above expectations', detailZh: '临时站TC-07（主舞台覆盖）表现超预期', affectedScope: 'Main stage area', affectedScopeZh: '主舞台区域' },
      { id: 'ALM-EE2', severity: 'minor' as const, title: 'Payment terminal connectivity — 100% uptime', titleZh: '支付终端连接 — 100%可用', source: 'SLA Monitor', timestamp: '10分钟前', acknowledged: true, detail: 'All 120 payment terminals maintaining connectivity. Average transaction time 1.2s.', detailZh: '全部120个支付终端保持连接。平均交易时间1.2秒。', affectedScope: '120 payment terminals', affectedScopeZh: '120个支付终端' },
    ],
  },
  agents: [
    {
      id: 'planning', name: 'Planning Agent', nameZh: '规划Agent',
      domain: 'Network Planning', domainZh: '网络规划',
      status: 'active' as const, description: 'Pre-event capacity modeling and crowd dispersal planning', descriptionZh: '赛前容量建模和散场疏散规划',
      taskCount: 89, successRate: 98.5,
      subAgents: [
        { id: 'capacity-planning', name: 'Capacity Planning Agent', nameZh: '容量规划Agent', status: 'active' as const, currentTask: 'Post-event dispersal handover planning', currentTaskZh: '散场切换规划', toolCalls: 67, successRate: 98.8, permissionLevel: 3 },
        { id: 'coverage-planning', name: 'Coverage Planning Agent', nameZh: '覆盖规划Agent', status: 'active' as const, currentTask: 'Monitoring temp cell coverage overlap', currentTaskZh: '监控临时站覆盖重叠', toolCalls: 45, successRate: 97.5, permissionLevel: 2 },
        { id: 'value-planning', name: 'Value Planning Agent', nameZh: '价值规划Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 12, successRate: 96.0, permissionLevel: 2 },
      ],
    },
    {
      id: 'optimization', name: 'Optimization Agent', nameZh: '优化Agent',
      domain: 'Network Optimization', domainZh: '网络优化',
      status: 'active' as const, description: 'Real-time load balancing and uplink optimization during concert', descriptionZh: '演唱会期间实时负载均衡和上行优化',
      taskCount: 234, successRate: 97.8,
      subAgents: [
        { id: 'realtime-opt', name: 'Real-time Opt Agent', nameZh: '实时优化Agent', status: 'active' as const, currentTask: 'MLB between TC-05 and macro cells', currentTaskZh: 'TC-05与宏站间MLB', toolCalls: 156, successRate: 98.2, permissionLevel: 4 },
        { id: 'experience-opt', name: 'Experience Opt Agent', nameZh: '体验优化Agent', status: 'active' as const, currentTask: 'Uplink scheduling for video uploads', currentTaskZh: '视频上传上行调度', toolCalls: 89, successRate: 97.0, permissionLevel: 3 },
        { id: 'engineering-opt', name: 'Engineering Opt Agent', nameZh: '工程优化Agent', status: 'active' as const, currentTask: 'Antenna tilt optimization for temp cells', currentTaskZh: '临时站天线倾角优化', toolCalls: 45, successRate: 96.5, permissionLevel: 3 },
      ],
    },
    {
      id: 'experience', name: 'Experience Agent', nameZh: '体验Agent',
      domain: 'Customer Experience', domainZh: '客户体验',
      status: 'active' as const, description: 'Monitoring attendee QoE and managing VIP area service quality', descriptionZh: '监控观众QoE和管理VIP区域服务质量',
      taskCount: 145, successRate: 96.5,
      subAgents: [
        { id: 'deterministic-exp', name: 'Deterministic Exp Agent', nameZh: '确定性体验Agent', status: 'active' as const, currentTask: 'VVIP box QoS bearer management', currentTaskZh: 'VVIP包厢QoS承载管理', toolCalls: 78, successRate: 97.5, permissionLevel: 3 },
        { id: 'value-insight', name: 'Value Insight Agent', nameZh: '价值洞察Agent', status: 'active' as const, currentTask: 'Real-time QoE heatmap generation', currentTaskZh: '实时QoE热力图生成', toolCalls: 56, successRate: 95.8, permissionLevel: 2 },
        { id: 'proactive-care', name: 'Proactive Care Agent', nameZh: '主动关怀Agent', status: 'active' as const, currentTask: 'Sponsor SLA monitoring', currentTaskZh: '赞助商SLA监控', toolCalls: 34, successRate: 94.5, permissionLevel: 2 },
      ],
    },
    {
      id: 'ops', name: 'O&M Agent', nameZh: '运维Agent',
      domain: 'Operations & Maintenance', domainZh: '运维管理',
      status: 'active' as const, description: 'Temporary cell operations and event command center coordination', descriptionZh: '临时站运维和活动指挥中心协调',
      taskCount: 178, successRate: 99.0,
      subAgents: [
        { id: 'om-monitor', name: 'O&M Monitor Agent', nameZh: '运维监控Agent', status: 'active' as const, currentTask: 'Monitoring all 8 temp cells health', currentTaskZh: '监控全部8个临时站健康状态', toolCalls: 234, successRate: 99.5, permissionLevel: 2 },
        { id: 'fault-analysis', name: 'Fault Analysis Agent', nameZh: '故障分析Agent', status: 'idle' as const, currentTask: 'Standby — zero faults detected', currentTaskZh: '待命 — 零故障', toolCalls: 5, successRate: 100.0, permissionLevel: 3 },
        { id: 'event-assurance', name: 'Event Assurance Agent', nameZh: '事件保障Agent', status: 'active' as const, currentTask: 'Event command center dashboard feed', currentTaskZh: '活动指挥中心大屏推送', toolCalls: 89, successRate: 99.0, permissionLevel: 4 },
      ],
    },
    {
      id: 'marketing', name: 'Marketing Agent', nameZh: '营销Agent',
      domain: 'Marketing Operations', domainZh: '市场运营',
      status: 'active' as const, description: 'Sponsor SLA management and event-based promotions', descriptionZh: '赞助商SLA管理和活动营销',
      taskCount: 56, successRate: 95.0,
      subAgents: [
        { id: 'precision-marketing', name: 'Precision Marketing Agent', nameZh: '精准营销Agent', status: 'active' as const, currentTask: 'Event-based data package promotion', currentTaskZh: '活动数据包推广', toolCalls: 34, successRate: 94.0, permissionLevel: 2 },
        { id: 'churn-prevention', name: 'Churn Prevention Agent', nameZh: '离网维挽Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 5, successRate: 93.0, permissionLevel: 2 },
        { id: 'channel-optimization', name: 'Channel Opt Agent', nameZh: '渠道优化Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 3, successRate: 92.0, permissionLevel: 1 },
      ],
    },
  ],
  conversations: [
    {
      id: 'conv-event-capacity', title: 'Concert Peak Capacity Management', titleZh: '演唱会峰值容量管理', domain: 'optimization',
      messages: [
        { id: 'msg-1', role: 'system' as const, content: '📡 EVENT ASSURANCE ACTIVE: 80K stadium concert — main act starting. Current users: 72,500. All 8 temporary cells operational.', timestamp: '20:00:00' },
        { id: 'msg-2', role: 'user' as const, content: 'Section C is showing uplink congestion — fans are live-streaming the opening number. What can we do?', timestamp: '20:05:00' },
        { id: 'msg-3', role: 'assistant' as const, content: '## Section C Uplink Congestion Resolution\n\nI\'ve identified the issue and already initiated automated response:\n\n### Root Cause:\n- **8,000 users** in Section C (VIP standing) simultaneously uploading video\n- Uplink utilization spiked to **94%** on cells covering Section C\n- Avg upload speed dropped from 15Mbps to 6Mbps\n\n### Automatic Actions Taken:\n1. ✅ **MLB Activation**: Redirecting 2,400 users from overloaded cells to temporary cell TC-05 (had 45% spare capacity)\n2. ✅ **Uplink Scheduling**: Prioritized video upload packets with QoS class adjustment\n3. ✅ **Antenna Tilt**: Adjusted TC-03 and TC-05 tilt by 2° to optimize Section C coverage overlap\n4. ✅ **Carrier Aggregation**: Enabled 4CC uplink CA on TC-05 for additional bandwidth\n\n### Current Status:\n- Section C uplink utilization: **94% → 72%** ✅\n- Avg upload speed: **6Mbps → 12.5Mbps** ✅\n- Video streaming success rate: **96.8%** (above 95% target)\n- No impact on VIP/VVIP QoE (maintained at 4.8/4.9)\n\n### Predictive Alert:\n⚠️ Concert ends in ~40 minutes. Preparing for **15,000 user crowd dispersal** — pre-configuring macro cell handover parameters now.',
          timestamp: '20:05:45',
          toolCalls: [
            { id: 'tc-1', name: 'ran_get_cell_kpis', status: 'completed', input: '{ "cells": ["TC-03", "TC-04", "TC-05"], "metrics": ["ul_prb_util", "ul_throughput", "user_count"] }', output: 'TC-03: UL 94%, TC-04: UL 87%, TC-05: UL 45%', duration: '1.2s' },
            { id: 'tc-2', name: 'ran_activate_mlb', status: 'completed', input: '{ "source": "TC-03", "target": "TC-05", "threshold": 80, "users_to_redirect": 2400 }', output: 'MLB activated, 2,400 users redirected in 15s', duration: '15.3s' },
            { id: 'tc-3', name: 'ran_adjust_antenna', status: 'completed', input: '{ "cells": ["TC-03", "TC-05"], "tilt_delta": -2, "azimuth_delta": 0 }', output: 'Tilt adjusted, coverage overlap optimized', duration: '3.5s' },
          ],
          thinkingSteps: [
            { phase: 'Think', phaseZh: '思考', content: 'Section C uplink congestion during live-streaming burst. TC-05 has spare capacity (45% UL utilization). Can redistribute load via MLB and optimize uplink scheduling.', contentZh: 'C区直播突发期间上行拥塞。TC-05有剩余容量（上行利用率45%）。可通过MLB重分配负载并优化上行调度。', timestamp: '20:05:02' },
            { phase: 'Act', phaseZh: '行动', content: 'Activating MLB from TC-03→TC-05 for 2,400 users. Adjusting antenna tilt on TC-03 and TC-05 to optimize coverage overlap in Section C. Enabling 4CC uplink carrier aggregation on TC-05.', contentZh: '激活TC-03→TC-05 MLB迁移2400用户。调整TC-03和TC-05天线倾角优化C区覆盖重叠。TC-05启用4CC上行载波聚合。', timestamp: '20:05:10' },
            { phase: 'Observe', phaseZh: '观察', content: 'Congestion resolved in 15 seconds. UL utilization dropped from 94% to 72%. Upload speed recovered from 6Mbps to 12.5Mbps. No impact on VIP areas. Proactively preparing for post-concert dispersal.', contentZh: '拥塞15秒内解决。上行利用率从94%降至72%。上传速度从6Mbps恢复至12.5Mbps。VIP区域无影响。主动准备散场。', timestamp: '20:05:40' },
          ],
          suggestions: [
            { id: 'sug-1', text: 'Pre-stage dispersal handover parameters', textZh: '预部署散场切换参数', type: 'approve' },
            { id: 'sug-2', text: 'Enable additional carrier for encore', textZh: '为安可曲启用额外载波', type: 'explore' },
          ],
        },
      ],
    },
  ],
  workflows: [
    { id: 'wf-e1', workflowName: 'Pre-Event Capacity Planning & Simulation', workflowNameZh: '赛前容量规划与仿真', status: 'completed' as const, startTime: '2 days ago', duration: '45min', nodesExecuted: 8, totalNodes: 8, trigger: 'Manual — event T-48h', triggerZh: '手动 — 活动T-48小时', result: '8 temp cells planned, 10Gbps total capacity, 99.5% confidence', resultZh: '规划8个临时站，总容量10Gbps，99.5%置信度', agentsInvolved: ['Planning Agent', 'Capacity Planning Agent'] },
    { id: 'wf-e2', workflowName: 'Temporary Cell Deployment & Commissioning', workflowNameZh: '临时站部署与开通', status: 'completed' as const, startTime: 'Yesterday', duration: '4h', nodesExecuted: 10, totalNodes: 10, trigger: 'Manual — event T-24h', triggerZh: '手动 — 活动T-24小时', result: 'All 8 cells deployed, tested, integrated', resultZh: '全部8个站已部署、测试、集成', agentsInvolved: ['Ops Agent', 'O&M Monitor Agent', 'Optimization Agent'] },
    { id: 'wf-e3', workflowName: 'Real-Time Event Load Balancing', workflowNameZh: '实时活动负载均衡', status: 'running' as const, startTime: '18:00', duration: '2h+', nodesExecuted: 12, totalNodes: 15, trigger: 'Auto — event start', triggerZh: '自动 — 活动开始', result: 'Max sector utilization 88%, 0 critical incidents', resultZh: '最高扇区利用率88%，0重大事故', agentsInvolved: ['Optimization Agent', 'Real-time Opt Agent', 'Experience Opt Agent'] },
    { id: 'wf-e4', workflowName: 'Post-Event Crowd Dispersal & Teardown', workflowNameZh: '散场疏散与拆除', status: 'cancelled' as const, startTime: '—', duration: '—', nodesExecuted: 0, totalNodes: 8, trigger: 'Auto — event end', triggerZh: '自动 — 活动结束', result: 'Scheduled for concert end (~40 min)', resultZh: '预定演唱会结束时执行（约40分钟后）', agentsInvolved: ['Planning Agent', 'Ops Agent', 'Optimization Agent'] },
  ],
};
