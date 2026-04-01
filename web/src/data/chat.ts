export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  thinkingSteps?: ThinkingStep[];
}

export interface ToolCall {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
  duration?: string;
}

export interface ThinkingStep {
  phase: 'Think' | 'Act' | 'Observe' | 'Reflect';
  phaseZh: string;
  content: string;
  contentZh: string;
  timestamp: string;
}

export interface DemoConversation {
  id: string;
  title: string;
  titleZh: string;
  domain: string;
  messages: ChatMessage[];
}

export const demoConversations: DemoConversation[] = [
  {
    id: 'conv-network',
    title: 'Network Fault Investigation',
    titleZh: '网络故障排查',
    domain: 'Network',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'There are multiple alarm reports from the south district. Please analyze the root cause and provide a recovery plan.',
        timestamp: '10:23:15',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'I\'m analyzing the alarm cluster from the south district. Let me correlate the alarms and identify the root cause.\n\nAfter analyzing 47 related alarms across 12 cell sites in the south district, I\'ve identified the root cause:\n\n**Root Cause:** Fiber cut on trunk link FBR-892 between aggregation node AGG-South-03 and core router CR-02.\n\n**Impact Assessment:**\n- 12 cell sites affected (BTS-4701 through BTS-4712)\n- ~8,200 subscribers experiencing service degradation\n- 3 enterprise SLAs at risk (Acme Corp, TechFlow, DataBridge)\n\n**Recovery Plan:**\n1. **Immediate** (L3 Auto): Activate backup microwave links for critical sites\n2. **Short-term** (L4 Supervised): Reroute traffic via northern ring path\n3. **Long-term** (L5 Manual): Dispatch fiber repair team to coordinates 31.2304°N, 121.4737°E\n\nI\'ve already initiated step 1 with auto-healer agent. Steps 2-3 require your approval.',
        timestamp: '10:23:28',
        toolCalls: [
          { id: 'tc-1', name: 'alarm_correlator', status: 'completed', input: '{"region": "south", "timeWindow": "30m"}', output: '47 alarms correlated, 1 root cause identified', duration: '2.3s' },
          { id: 'tc-2', name: 'topology_analyzer', status: 'completed', input: '{"nodeId": "AGG-South-03", "depth": 3}', output: '12 downstream nodes affected', duration: '1.1s' },
          { id: 'tc-3', name: 'impact_calculator', status: 'completed', input: '{"affectedNodes": ["BTS-4701","BTS-4712"]}', output: '8,200 subscribers, 3 enterprise SLAs', duration: '0.8s' },
          { id: 'tc-4', name: 'auto_healer.activate_backup', status: 'completed', input: '{"sites": ["BTS-4701","BTS-4705","BTS-4709"], "mode": "microwave"}', output: 'Backup links activated for 3 critical sites', duration: '4.5s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Multiple alarms in south district suggest a common upstream failure. Need to correlate alarms and trace topology.', contentZh: '南区多个告警提示可能存在上游共同故障点。需要关联告警并追踪拓扑。', timestamp: '10:23:16' },
          { phase: 'Act', phaseZh: '行动', content: 'Running alarm correlation across south district with 30-minute window. Querying topology database for affected nodes.', contentZh: '在30分钟窗口内对南区进行告警关联。查询拓扑数据库获取受影响节点。', timestamp: '10:23:18' },
          { phase: 'Observe', phaseZh: '观察', content: '47 alarms correlated to single fiber cut on FBR-892. 12 BTS sites downstream. 8,200 subscribers impacted.', contentZh: '47个告警关联到FBR-892单一光纤中断。下游12个BTS站点。影响8,200用户。', timestamp: '10:23:23' },
          { phase: 'Reflect', phaseZh: '反思', content: 'Root cause confirmed with high confidence (0.96). Recovery plan generated with 3 phases matching escalation levels. Auto-healer can handle immediate mitigation.', contentZh: '根因确认置信度高(0.96)。生成3阶段恢复计划匹配升级级别。自动修复器可处理即时缓解。', timestamp: '10:23:27' },
        ],
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Approved. Please proceed with step 2 traffic rerouting.',
        timestamp: '10:24:05',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Initiating traffic rerouting via northern ring path.\n\n**Rerouting Progress:**\n- Traffic shifted to northern ring: 100%\n- Latency impact: +2.3ms (within SLA bounds)\n- All 12 sites restored to full service\n- Enterprise SLA compliance: MAINTAINED\n\nFiber repair team has been notified. ETA for physical repair: 4-6 hours. I\'ll continue monitoring and alert you of any issues.',
        timestamp: '10:24:18',
        toolCalls: [
          { id: 'tc-5', name: 'traffic_engineer.reroute', status: 'completed', input: '{"from": "south-ring", "to": "north-ring", "mode": "supervised"}', output: 'Rerouting complete, +2.3ms latency', duration: '8.2s' },
          { id: 'tc-6', name: 'sla_monitor.check', status: 'completed', input: '{"clients": ["Acme","TechFlow","DataBridge"]}', output: 'All SLAs within bounds', duration: '1.5s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'User approved L4 rerouting. Need to execute traffic engineering changes with supervision.', contentZh: '用户批准L4重路由。需要在监督下执行流量工程变更。', timestamp: '10:24:06' },
          { phase: 'Act', phaseZh: '行动', content: 'Executing supervised traffic reroute from south ring to north ring path.', contentZh: '执行从南环到北环路径的受监督流量重路由。', timestamp: '10:24:08' },
          { phase: 'Observe', phaseZh: '观察', content: 'Rerouting successful. Minor latency increase of 2.3ms. All services restored. SLA compliance maintained.', contentZh: '重路由成功。延迟轻微增加2.3ms。所有服务恢复。SLA合规维持。', timestamp: '10:24:16' },
          { phase: 'Reflect', phaseZh: '反思', content: 'Recovery successful. Physical repair still needed. Setting up continuous monitoring for the temporary path.', contentZh: '恢复成功。仍需物理修复。为临时路径设置持续监控。', timestamp: '10:24:17' },
        ],
      },
    ],
  },
  {
    id: 'conv-security',
    title: 'DDoS Attack Mitigation',
    titleZh: 'DDoS攻击缓解',
    domain: 'Security',
    messages: [
      {
        id: 'msg-s1',
        role: 'user',
        content: 'Security alert: unusual traffic spike detected on edge routers. Investigate immediately.',
        timestamp: '14:05:00',
      },
      {
        id: 'msg-s2',
        role: 'assistant',
        content: 'Initiating security investigation on the traffic anomaly.\n\n**Analysis Results:**\n\n**Threat Identified:** Volumetric DDoS attack targeting DNS infrastructure\n- Attack volume: 45 Gbps (and growing)\n- Source: Distributed botnet, ~12,000 unique IPs\n- Target: DNS resolvers DNS-01, DNS-02\n- Attack vector: DNS amplification + SYN flood\n\n**Mitigation Actions Taken (Auto - L3):**\n1. Activated upstream scrubbing center\n2. Deployed rate limiting on edge routers\n3. Enabled DNS response rate limiting\n4. Blackholed top 500 attacking IPs\n\n**Current Status:** Attack mitigated. Traffic normalized to baseline. No service impact detected.\n\nRecommendation: Review firewall rules and consider permanent blacklisting of identified botnet C2 servers.',
        timestamp: '14:05:22',
        toolCalls: [
          { id: 'tc-s1', name: 'traffic_analyzer.deep_inspect', status: 'completed', input: '{"interface": "edge-*", "duration": "5m"}', output: 'DDoS pattern detected: DNS amplification + SYN flood', duration: '3.2s' },
          { id: 'tc-s2', name: 'threat_intel.lookup', status: 'completed', input: '{"ips": "top_100_sources"}', output: '87 IPs match known botnet C2 infrastructure', duration: '1.8s' },
          { id: 'tc-s3', name: 'ddos_mitigator.activate', status: 'completed', input: '{"mode": "auto", "level": "high"}', output: 'Scrubbing center active, rate limits deployed', duration: '5.1s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Traffic spike on edge routers could be DDoS. Need deep packet inspection and threat intelligence correlation.', contentZh: '边缘路由器流量尖峰可能是DDoS。需要深度包检测和威胁情报关联。', timestamp: '14:05:01' },
          { phase: 'Act', phaseZh: '行动', content: 'Running deep traffic inspection on all edge interfaces. Cross-referencing source IPs with threat intelligence databases.', contentZh: '在所有边缘接口运行深度流量检测。将源IP与威胁情报数据库交叉引用。', timestamp: '14:05:05' },
          { phase: 'Observe', phaseZh: '观察', content: 'Confirmed DDoS attack: 45Gbps volumetric, DNS amplification + SYN flood. 12,000 unique source IPs, 87 match known botnets.', contentZh: '确认DDoS攻击: 45Gbps容量, DNS放大+SYN洪泛。12,000个唯一源IP, 87个匹配已知僵尸网络。', timestamp: '14:05:14' },
          { phase: 'Reflect', phaseZh: '反思', content: 'Attack mitigated successfully within L3 auto authority. No escalation needed. Recommend permanent firewall updates.', contentZh: '在L3自动权限内成功缓解攻击。无需升级。建议永久更新防火墙规则。', timestamp: '14:05:21' },
        ],
      },
    ],
  },
  {
    id: 'conv-market',
    title: 'Customer Churn Prevention',
    titleZh: '客户流失预防',
    domain: 'Market',
    messages: [
      {
        id: 'msg-m1',
        role: 'user',
        content: 'Run the monthly churn risk analysis and recommend retention actions for high-value customers.',
        timestamp: '09:00:00',
      },
      {
        id: 'msg-m2',
        role: 'assistant',
        content: 'Completed monthly churn risk analysis.\n\n**Executive Summary:**\n- Total customers analyzed: 2.4M\n- High churn risk identified: 18,450 (0.77%)\n- High-value at risk: 2,340 customers\n- Estimated revenue at risk: $4.2M/month\n\n**Top Churn Drivers:**\n1. Network quality issues in south district (34%)\n2. Competitive pricing pressure (28%)\n3. Billing disputes unresolved >30 days (22%)\n4. Poor customer service experience (16%)\n\n**Recommended Retention Campaigns:**\n\n| Campaign | Target | Action | Est. Save Rate |\n|----------|--------|--------|----------------|\n| Network Fix Bundle | 892 customers | Offer 20% discount + priority support | 65% |\n| Price Match Plus | 1,120 customers | Match competitor price + bonus data | 45% |\n| Resolution Express | 328 customers | Escalate billing issues + credit | 78% |\n\nShall I activate these campaigns?',
        timestamp: '09:01:15',
        toolCalls: [
          { id: 'tc-m1', name: 'churn_predictor.analyze', status: 'completed', input: '{"scope": "all", "period": "monthly"}', output: '18,450 high-risk customers identified', duration: '45.2s' },
          { id: 'tc-m2', name: 'customer_segmenter.filter', status: 'completed', input: '{"riskLevel": "high", "value": "high"}', output: '2,340 high-value at-risk customers', duration: '3.1s' },
          { id: 'tc-m3', name: 'campaign_designer.generate', status: 'completed', input: '{"segments": 3, "budget": "optimal"}', output: '3 campaigns designed with ROI projections', duration: '8.7s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Monthly churn analysis requires running prediction model on full customer base, then segmenting high-value at-risk customers.', contentZh: '月度流失分析需要在全部客户群上运行预测模型，然后分群高价值风险客户。', timestamp: '09:00:01' },
          { phase: 'Act', phaseZh: '行动', content: 'Executing churn prediction model on 2.4M customers. Filtering high-value segment. Designing targeted retention campaigns.', contentZh: '对240万客户执行流失预测模型。筛选高价值分群。设计定向留存营销。', timestamp: '09:00:05' },
          { phase: 'Observe', phaseZh: '观察', content: '18,450 at risk, 2,340 high-value. Main drivers: network quality (34%), pricing (28%), billing (22%), service (16%).', contentZh: '18,450有风险, 2,340高价值。主要驱动因素: 网络质量(34%), 价格(28%), 账单(22%), 服务(16%)。', timestamp: '09:01:00' },
          { phase: 'Reflect', phaseZh: '反思', content: 'Three targeted campaigns designed with different approaches. Network Fix Bundle has highest save rate potential due to addressable root cause.', contentZh: '设计了三个针对性营销方案。网络修复套餐由于可解决根因，具有最高挽留率潜力。', timestamp: '09:01:14' },
        ],
      },
    ],
  },
];
