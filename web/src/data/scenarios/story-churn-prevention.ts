import type { ScenarioData } from '../scenario-types';

export const storyChurnPrevention: ScenarioData = {
  meta: {
    id: 'churn-prevention',
    name: 'High-Value User Churn Prevention & Precision Marketing',
    nameZh: '高价值用户离网预警与精准营销',
    description: 'IOE detects 2,847 high-value users (ARPU >¥300) showing churn risk signals — competitor promotions, repeated complaints, declining usage. Multi-agent collaboration delivers personalized retention with 78% success rate, protecting ¥4.2M monthly revenue.',
    descriptionZh: 'IOE检测到2847位高价值用户（ARPU>300元）出现流失风险信号——竞对促销、重复投诉、用量下降。多Agent协同执行个性化挽留，成功率78%，保护月收入420万元。',
    version: '1.0.0',
    author: 'IOE Team',
    createdAt: '2026-04-05',
    tags: ['churn-prevention', 'precision-marketing', 'high-value-users', 'retention'],
  },
  dashboard: {
    kpis: [
      { id: 'churn-rate', name: 'Churn Risk Rate', nameZh: '流失风险率', value: 3.8, unit: '%', trend: 'up' as const, change: 1.2, target: 2.0, history: [2.1, 2.0, 2.2, 2.3, 2.5, 2.8, 3.0, 3.2, 3.5, 3.6, 3.7, 3.8] },
      { id: 'avg-arpu', name: 'High-Value ARPU', nameZh: '高价值用户ARPU', value: 358, unit: '¥', trend: 'down' as const, change: -22, target: 380, history: [385, 382, 380, 378, 375, 372, 370, 368, 365, 362, 360, 358] },
      { id: 'retention-rate', name: 'Retention Success', nameZh: '挽留成功率', value: 78.5, unit: '%', trend: 'up' as const, change: 12.3, target: 75, history: [62.0, 63.5, 65.0, 66.2, 68.0, 70.5, 72.0, 74.0, 75.5, 76.8, 77.5, 78.5] },
      { id: 'nps', name: 'NPS Score', nameZh: 'NPS评分', value: 42, unit: '', trend: 'down' as const, change: -8, target: 50, history: [52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 42] },
      { id: 'complaint-rate', name: 'Complaint Rate', nameZh: '投诉率', value: 5.2, unit: '%', trend: 'up' as const, change: 2.1, target: 3.0, history: [2.8, 3.0, 3.2, 3.4, 3.6, 3.9, 4.1, 4.4, 4.7, 4.9, 5.1, 5.2] },
      { id: 'campaign-roi', name: 'Campaign ROI', nameZh: '营销活动ROI', value: 4.2, unit: 'x', trend: 'up' as const, change: 1.8, target: 3.0, history: [2.0, 2.2, 2.4, 2.5, 2.8, 3.0, 3.2, 3.5, 3.7, 3.9, 4.0, 4.2] },
    ],
    alerts: [
      { id: 'ALM-C1', severity: 'critical' as const, title: 'Churn Risk Spike — 2,847 High-Value Users Flagged', titleZh: '流失风险激增 — 2847位高价值用户预警', source: 'Churn Prediction Engine', timestamp: '刚刚', acknowledged: false, detail: 'ML model detected 42% increase in churn signals among ARPU>¥300 segment. Primary drivers: competitor 5G promotions and QoE degradation.', detailZh: 'ML模型检测到ARPU>300元群体流失信号增加42%。主因：竞对5G促销活动和QoE劣化。', affectedScope: '2,847 users, ¥4.2M/month revenue', affectedScopeZh: '2847用户，月收入420万元' },
      { id: 'ALM-C2', severity: 'major' as const, title: 'Competitor Promotion Alert — China Unicom 5G Package ¥99', titleZh: '竞对促销预警 — 联通5G套餐99元', source: 'Market Intelligence', timestamp: '2小时前', acknowledged: true, detail: 'China Unicom launched aggressive 5G package at ¥99/month with 100GB data, targeting our high-value users via SMS campaigns.', detailZh: '中国联通推出99元/月激进5G套餐含100GB流量，通过短信营销定向我方高价值用户。', affectedScope: 'All high-value users', affectedScopeZh: '全部高价值用户' },
      { id: 'ALM-C3', severity: 'major' as const, title: 'Repeated Complaint Cluster — 156 Users 3+ Calls in 30 Days', titleZh: '重复投诉聚集 — 156用户30天内3+次来电', source: 'CRM Analytics', timestamp: '1小时前', acknowledged: true, detail: '156 Diamond-tier users made 3+ complaint calls in 30 days. Top issues: billing disputes (45%), network quality (32%), service response (23%).', detailZh: '156位钻石卡用户30天内投诉来电3+次。主要问题：资费争议(45%)、网络质量(32%)、服务响应(23%)。', affectedScope: '156 Diamond users', affectedScopeZh: '156位钻石卡用户' },
      { id: 'ALM-C4', severity: 'warning' as const, title: 'Data Usage Decline — 892 Users Dropped >30% MoM', titleZh: '流量使用下降 — 892用户环比降幅>30%', source: 'Usage Analytics', timestamp: '3小时前', acknowledged: true, detail: '892 high-value users show >30% month-over-month data usage decline, indicating potential switch to secondary SIM or competitor.', detailZh: '892位高价值用户月流量环比下降>30%，表明可能切换至副卡或竞对。', affectedScope: '892 users', affectedScopeZh: '892位用户' },
      { id: 'ALM-C5', severity: 'warning' as const, title: 'QoE Degradation in Futian District — Avg Score 3.2', titleZh: '福田区QoE劣化 — 平均评分3.2', source: 'SmartCare CEM', timestamp: '4小时前', acknowledged: true, detail: 'Average QoE score dropped to 3.2 in Futian CBD area. 340 high-value users affected. Root cause: congestion during peak hours.', detailZh: '福田CBD区域平均QoE评分降至3.2。340位高价值用户受影响。原因：高峰时段拥塞。', affectedScope: 'Futian district, 340 users', affectedScopeZh: '福田区，340位用户' },
      { id: 'ALM-C6', severity: 'minor' as const, title: 'Retention Campaign A/B Test — Variant B Outperforming +15%', titleZh: '挽留营销A/B测试 — B方案领先15%', source: 'Campaign Engine', timestamp: '6小时前', acknowledged: true, detail: 'Personalized video message variant (B) showing 15% higher acceptance rate than standard SMS variant (A).', detailZh: '个性化视频消息方案(B)接受率比标准短信方案(A)高15%。', affectedScope: 'Test group 500 users', affectedScopeZh: '测试组500用户' },
    ],
    tasks: [
      { id: 'TSK-C1', title: 'Churn risk scoring for 2,847 high-value users', titleZh: '2847位高价值用户流失风险评分', agent: 'Marketing Agent', collaborators: ['Churn Prevention Agent'], status: 'completed' as const, timestamp: '刚刚', duration: '2min', detail: 'Multi-dimensional churn scoring using 47 behavioral features', detailZh: '基于47个行为特征的多维流失评分', result: '2,847 users scored, 1,234 high-risk', resultZh: '2847用户已评分，1234高风险' },
      { id: 'TSK-C2', title: 'User micro-segmentation & persona profiling', titleZh: '用户微细分与画像建模', agent: 'Value Insight Agent', status: 'completed' as const, timestamp: '30分钟前', duration: '5min', detail: 'Clustered at-risk users into 8 behavioral segments for targeted campaigns', detailZh: '将风险用户聚类为8个行为细分群体用于定向营销', result: '8 segments identified', resultZh: '识别8个细分群' },
      { id: 'TSK-C3', title: 'Personalized retention offer generation', titleZh: '个性化挽留方案生成', agent: 'Precision Marketing Agent', collaborators: ['Marketing Agent'], status: 'completed' as const, timestamp: '20分钟前', duration: '3min', detail: 'AI-generated personalized offers based on user value, usage pattern, and churn driver', detailZh: '基于用户价值、使用模式和流失驱动因素AI生成个性化方案', result: '6 offer templates, 2,847 personalized variants', resultZh: '6套方案模板，2847个个性化变体' },
      { id: 'TSK-C4', title: 'QoE improvement for Futian high-value users', titleZh: '福田区高价值用户QoE提升', agent: 'Experience Agent', collaborators: ['Deterministic Exp Agent'], status: 'running' as const, timestamp: '15分钟前', duration: '10min+', detail: 'Activating priority QoS bearers and MLB optimization for 340 affected users', detailZh: '为340位受影响用户激活优先QoS承载和MLB优化', result: 'QoE improved to 3.8 (target 4.0)', resultZh: 'QoE提升至3.8（目标4.0）' },
      { id: 'TSK-C5', title: 'Multi-channel campaign execution', titleZh: '多渠道营销活动执行', agent: 'Channel Opt Agent', collaborators: ['Marketing Agent'], status: 'running' as const, timestamp: '10分钟前', duration: '15min+', detail: 'Executing retention campaigns via APP push, SMS, outbound call, and WeChat mini-program', detailZh: '通过APP推送、短信、外呼、微信小程序执行挽留营销', result: '1,890 contacted, 892 responded', resultZh: '已触达1890位，892位响应' },
      { id: 'TSK-C6', title: 'Real-time campaign effectiveness monitoring', titleZh: '实时营销效果监测', agent: 'Marketing Agent', status: 'running' as const, timestamp: '5分钟前', duration: '20min+', detail: 'Monitoring acceptance rate, offer redemption, and user sentiment in real-time', detailZh: '实时监测接受率、方案兑换和用户情绪', result: '78.5% retention rate so far', resultZh: '当前挽留率78.5%' },
      { id: 'TSK-C7', title: 'Network quality proactive optimization', titleZh: '网络质量主动优化', agent: 'Optimization Agent', collaborators: ['Experience Opt Agent'], status: 'completed' as const, timestamp: '1小时前', duration: '8min', detail: 'Proactive parameter optimization in areas with high-value user concentration', detailZh: '在高价值用户集中区域主动优化参数', result: 'Avg throughput +25% in target areas', resultZh: '目标区域平均吞吐量+25%' },
      { id: 'TSK-C8', title: 'Compensation package for repeated complainants', titleZh: '重复投诉用户补偿方案', agent: 'Proactive Care Agent', status: 'queued' as const, timestamp: '刚刚', duration: '—', detail: 'Preparing personalized compensation for 156 users with 3+ complaints', detailZh: '为156位3+次投诉用户准备个性化补偿', result: 'Pending approval', resultZh: '等待审批' },
    ],
    extraTasks: [
      { id: 'TSK-CE1', title: 'Competitor package comparison analysis', titleZh: '竞对套餐对比分析', agent: 'Market Intelligence Agent', status: 'completed' as const, timestamp: '2小时前', duration: '3min', detail: 'Analyzed China Unicom ¥99 package vs our offerings', detailZh: '分析联通99元套餐与我方产品对比', result: 'Gap analysis report generated', resultZh: '差距分析报告已生成' },
      { id: 'TSK-CE2', title: 'Revenue impact simulation', titleZh: '收入影响模拟', agent: 'Planning Agent', status: 'completed' as const, timestamp: '1小时前', duration: '2min', detail: 'Monte Carlo simulation of revenue impact under different retention scenarios', detailZh: '不同挽留场景下的收入影响蒙特卡洛模拟', result: '¥4.2M/month at risk', resultZh: '月风险收入420万元' },
    ],
    extraAlerts: [
      { id: 'ALM-CE1', severity: 'minor' as const, title: 'WeChat campaign delivery rate 98.5%', titleZh: '微信营销送达率98.5%', source: 'Campaign Engine', timestamp: '刚刚', acknowledged: true, detail: 'WeChat mini-program push campaign achieving high delivery rate', detailZh: '微信小程序推送营销实现高送达率', affectedScope: 'Campaign batch 1', affectedScopeZh: '营销批次1' },
      { id: 'ALM-CE2', severity: 'warning' as const, title: 'Port-out request surge — 23 users today', titleZh: '携号转网请求激增 — 今日23人', source: 'CRM', timestamp: '30分钟前', acknowledged: false, detail: '23 port-out requests today vs 5/day average. 18 are from at-risk list.', detailZh: '今日23个携号转网请求，日均5个。其中18个来自风险名单。', affectedScope: '23 users', affectedScopeZh: '23位用户' },
    ],
  },
  agents: [
    {
      id: 'marketing', name: 'Marketing Agent', nameZh: '营销Agent',
      domain: 'Marketing Operations', domainZh: '市场运营',
      status: 'active' as const, description: 'Leading churn prevention campaign and precision marketing', descriptionZh: '主导流失预防营销活动和精准营销',
      taskCount: 312, successRate: 94.5,
      subAgents: [
        { id: 'churn-prevention', name: 'Churn Prevention Agent', nameZh: '离网维挽Agent', status: 'active' as const, currentTask: 'Monitoring real-time retention metrics', currentTaskZh: '实时监控挽留指标', toolCalls: 189, successRate: 95.2, permissionLevel: 3 },
        { id: 'precision-marketing', name: 'Precision Marketing Agent', nameZh: '精准营销Agent', status: 'active' as const, currentTask: 'Generating personalized offers', currentTaskZh: '生成个性化方案', toolCalls: 145, successRate: 93.8, permissionLevel: 3 },
        { id: 'channel-optimization', name: 'Channel Opt Agent', nameZh: '渠道优化Agent', status: 'active' as const, currentTask: 'Multi-channel campaign orchestration', currentTaskZh: '多渠道营销编排', toolCalls: 78, successRate: 92.5, permissionLevel: 2 },
      ],
    },
    {
      id: 'experience', name: 'Experience Agent', nameZh: '体验Agent',
      domain: 'Customer Experience', domainZh: '客户体验',
      status: 'active' as const, description: 'Analyzing QoE for at-risk users and activating protection', descriptionZh: '分析风险用户QoE并激活保护',
      taskCount: 156, successRate: 96.0,
      subAgents: [
        { id: 'deterministic-exp', name: 'Deterministic Exp Agent', nameZh: '确定性体验Agent', status: 'active' as const, currentTask: 'QoS bearer optimization for VIP users', currentTaskZh: 'VIP用户QoS承载优化', toolCalls: 67, successRate: 97.0, permissionLevel: 3 },
        { id: 'value-insight', name: 'Value Insight Agent', nameZh: '价值洞察Agent', status: 'active' as const, currentTask: 'User behavior micro-segmentation', currentTaskZh: '用户行为微细分', toolCalls: 89, successRate: 95.5, permissionLevel: 2 },
        { id: 'proactive-care', name: 'Proactive Care Agent', nameZh: '主动关怀Agent', status: 'active' as const, currentTask: 'Preparing compensation packages', currentTaskZh: '准备补偿方案', toolCalls: 45, successRate: 94.0, permissionLevel: 2 },
      ],
    },
    {
      id: 'optimization', name: 'Optimization Agent', nameZh: '优化Agent',
      domain: 'Network Optimization', domainZh: '网络优化',
      status: 'active' as const, description: 'Proactive network optimization in high-value user areas', descriptionZh: '高价值用户区域主动网络优化',
      taskCount: 89, successRate: 97.2,
      subAgents: [
        { id: 'experience-opt', name: 'Experience Opt Agent', nameZh: '体验优化Agent', status: 'active' as const, currentTask: 'Futian CBD throughput optimization', currentTaskZh: '福田CBD吞吐量优化', toolCalls: 56, successRate: 96.8, permissionLevel: 3 },
        { id: 'realtime-opt', name: 'Real-time Opt Agent', nameZh: '实时优化Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 23, successRate: 97.5, permissionLevel: 4 },
        { id: 'engineering-opt', name: 'Engineering Opt Agent', nameZh: '工程优化Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 10, successRate: 96.0, permissionLevel: 3 },
      ],
    },
    {
      id: 'planning', name: 'Planning Agent', nameZh: '规划Agent',
      domain: 'Network Planning', domainZh: '网络规划',
      status: 'active' as const, description: 'Revenue impact analysis and capacity planning for retention areas', descriptionZh: '收入影响分析和挽留区域容量规划',
      taskCount: 45, successRate: 96.8,
      subAgents: [
        { id: 'capacity-planning', name: 'Capacity Planning Agent', nameZh: '容量规划Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 12, successRate: 97.0, permissionLevel: 2 },
        { id: 'coverage-planning', name: 'Coverage Planning Agent', nameZh: '覆盖规划Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 8, successRate: 95.5, permissionLevel: 2 },
        { id: 'value-planning', name: 'Value Planning Agent', nameZh: '价值规划Agent', status: 'active' as const, currentTask: 'Revenue impact Monte Carlo simulation', currentTaskZh: '收入影响蒙特卡洛模拟', toolCalls: 25, successRate: 97.2, permissionLevel: 2 },
      ],
    },
    {
      id: 'ops', name: 'O&M Agent', nameZh: '运维Agent',
      domain: 'Operations & Maintenance', domainZh: '运维管理',
      status: 'idle' as const, description: 'Monitoring network quality in high-value user concentration areas', descriptionZh: '监控高价值用户集中区域网络质量',
      taskCount: 34, successRate: 98.0,
      subAgents: [
        { id: 'fault-analysis', name: 'Fault Analysis Agent', nameZh: '故障分析Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 15, successRate: 99.0, permissionLevel: 3 },
        { id: 'om-monitor', name: 'O&M Monitor Agent', nameZh: '运维监控Agent', status: 'active' as const, currentTask: 'Monitoring Futian area network KPIs', currentTaskZh: '监控福田区域网络KPI', toolCalls: 19, successRate: 98.5, permissionLevel: 2 },
        { id: 'event-assurance', name: 'Event Assurance Agent', nameZh: '事件保障Agent', status: 'idle' as const, currentTask: 'Standby', currentTaskZh: '待命', toolCalls: 0, successRate: 98.0, permissionLevel: 4 },
      ],
    },
  ],
  conversations: [
    {
      id: 'conv-churn-analysis', title: 'High-Value Churn Prevention Campaign', titleZh: '高价值用户流失预防活动', domain: 'marketing',
      messages: [
        { id: 'msg-1', role: 'system' as const, content: '⚠️ CHURN RISK ALERT: 2,847 high-value users (ARPU>¥300) flagged with elevated churn probability. Auto-analysis initiated.', timestamp: '09:00:00' },
        { id: 'msg-2', role: 'user' as const, content: 'Analyze the churn risk situation and recommend retention strategies.', timestamp: '09:00:30' },
        { id: 'msg-3', role: 'assistant' as const, content: '## Churn Risk Analysis Report\n\nI\'ve completed a comprehensive analysis of **2,847 high-value users** showing churn risk signals.\n\n### Churn Drivers (Ranked by Impact):\n1. **Competitor Promotion** (38%): China Unicom ¥99 5G package with 100GB — aggressive SMS targeting our users\n2. **QoE Degradation** (28%): Avg QoE score dropped to 3.2 in Futian CBD; 340 VIP users affected by peak-hour congestion\n3. **Repeated Complaints** (22%): 156 Diamond users with 3+ calls in 30 days (billing 45%, network 32%, service 23%)\n4. **Usage Decline** (12%): 892 users with >30% MoM data usage drop — likely dual-SIM switching\n\n### User Micro-Segments:\n| Segment | Count | Primary Driver | Recommended Action |\n|---------|-------|---------------|--------------------|\n| Price-Sensitive Switchers | 892 | Competitor pricing | Matched value offer + loyalty bonus |\n| Experience Frustrated | 340 | QoE degradation | Network optimization + premium QoS |\n| Service Dissatisfied | 156 | Complaint history | Dedicated service + compensation |\n| Silent Churners | 1,459 | Usage decline | Proactive engagement + personalized content |\n\n### Retention Strategy (Multi-Agent Collaboration):\n- 📊 **Marketing Agent**: 6 personalized offer templates with 2,847 variants\n- 📶 **Optimization Agent**: Priority network optimization in Futian area (+25% throughput)\n- 💎 **Experience Agent**: VIP QoS bearer activation for 340 degraded users\n- 📞 **Proactive Care Agent**: Compensation packages for 156 repeat complainants\n\n### Projected Impact:\n- **Retention Rate**: 78.5% (vs 66.2% baseline)\n- **Revenue Protected**: ¥4.2M/month\n- **Campaign ROI**: 4.2x',
          timestamp: '09:01:15',
          toolCalls: [
            { id: 'tc-1', name: 'crm_get_churn_scores', status: 'completed', input: '{ "segment": "high-value", "arpu_min": 300, "risk_threshold": 0.6 }', output: '2,847 users flagged, avg churn probability 0.72', duration: '3.2s' },
            { id: 'tc-2', name: 'cem_get_qoe_scores', status: 'completed', input: '{ "user_segment": "at-risk-high-value", "area": "all" }', output: 'Avg QoE 3.8, Futian area 3.2, 340 users below threshold', duration: '2.1s' },
            { id: 'tc-3', name: 'crm_get_complaint_history', status: 'completed', input: '{ "min_calls": 3, "days": 30, "segment": "diamond" }', output: '156 users, top issues: billing 45%, network 32%, service 23%', duration: '1.8s' },
            { id: 'tc-4', name: 'marketing_generate_offers', status: 'completed', input: '{ "segments": 8, "personalization": true, "budget_cap": 500000 }', output: '6 templates, 2847 variants generated, est. ROI 4.2x', duration: '5.5s' },
          ],
          thinkingSteps: [
            { phase: 'Think', phaseZh: '思考', content: 'Detecting multi-dimensional churn signals: competitor promotion (Unicom ¥99), QoE degradation in Futian, complaint clustering, and usage decline patterns. Need to cross-reference CRM, CEM, and usage analytics data.', contentZh: '检测多维流失信号：竞对促销（联通99元）、福田区QoE劣化、投诉聚集、用量下降。需交叉分析CRM、CEM和使用分析数据。', timestamp: '09:00:32' },
            { phase: 'Act', phaseZh: '行动', content: 'Querying CRM churn prediction model, CEM QoE scores, complaint history, and usage trends. Running micro-segmentation clustering on 47 behavioral features.', contentZh: '查询CRM流失预测模型、CEM QoE评分、投诉历史和使用趋势。对47个行为特征运行微细分聚类。', timestamp: '09:00:40' },
            { phase: 'Observe', phaseZh: '观察', content: 'Identified 4 distinct churn driver clusters. Competitor pricing is #1 driver (38%), but QoE issues affect the most valuable users. Multi-pronged retention strategy needed — price matching alone won\'t work.', contentZh: '识别4个不同的流失驱动聚类。竞对价格是第一驱动因素(38%)，但QoE问题影响最高价值用户。需要多管齐下的挽留策略——仅价格匹配无效。', timestamp: '09:00:55' },
          ],
          suggestions: [
            { id: 'sug-1', text: 'Launch retention campaign now', textZh: '立即启动挽留营销', type: 'approve' },
            { id: 'sug-2', text: 'Review compensation packages first', textZh: '先审核补偿方案', type: 'explore' },
            { id: 'sug-3', text: 'Escalate QoE issue to network team', textZh: '将QoE问题上报网络团队', type: 'explore' },
          ],
        },
      ],
    },
  ],
  workflows: [
    { id: 'wf-c1', workflowName: 'Churn Risk Scoring & Segmentation', workflowNameZh: '流失风险评分与细分', status: 'completed' as const, startTime: '09:00:00', duration: '2min', nodesExecuted: 6, totalNodes: 6, trigger: 'Auto — churn signal threshold', triggerZh: '自动 — 流失信号阈值', result: '2,847 users scored, 8 segments identified', resultZh: '2847用户已评分，8个细分群已识别', agentsInvolved: ['Marketing Agent', 'Value Insight Agent'] },
    { id: 'wf-c2', workflowName: 'Personalized Offer Generation & Campaign', workflowNameZh: '个性化方案生成与营销', status: 'running' as const, startTime: '09:05:00', duration: '25min+', nodesExecuted: 5, totalNodes: 8, trigger: 'Auto — post-segmentation', triggerZh: '自动 — 细分后', result: '1,890 contacted, 78.5% retention so far', resultZh: '已触达1890位，当前挽留率78.5%', agentsInvolved: ['Precision Marketing Agent', 'Channel Opt Agent'] },
    { id: 'wf-c3', workflowName: 'QoE Proactive Optimization', workflowNameZh: 'QoE主动优化', status: 'running' as const, startTime: '09:10:00', duration: '20min+', nodesExecuted: 4, totalNodes: 6, trigger: 'Auto — QoE degradation detected', triggerZh: '自动 — 检测到QoE劣化', result: 'QoE improved from 3.2 to 3.8 in Futian', resultZh: '福田QoE从3.2提升至3.8', agentsInvolved: ['Experience Agent', 'Optimization Agent'] },
    { id: 'wf-c4', workflowName: 'Revenue Impact Assessment & Reporting', workflowNameZh: '收入影响评估与报告', status: 'completed' as const, startTime: '08:30:00', duration: '5min', nodesExecuted: 4, totalNodes: 4, trigger: 'Scheduled — daily', triggerZh: '定时 — 每日', result: '¥4.2M monthly revenue at risk, retention ROI 4.2x', resultZh: '月风险收入420万元，挽留ROI 4.2倍', agentsInvolved: ['Planning Agent', 'Value Planning Agent'] },
  ],
};
