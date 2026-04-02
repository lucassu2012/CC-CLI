export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  thinkingSteps?: ThinkingStep[];
  suggestions?: Suggestion[];
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

export interface Suggestion {
  id: string;
  text: string;
  textZh: string;
  type: 'approve' | 'modify' | 'reject' | 'explore';
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
    domain: 'ops',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: '广州天河区多个用户反馈上网慢，请分析原因。',
        timestamp: '14:20:00',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '正在启动跨域故障诊断流程...\n\n经过多维度分析，定位到根因为传输链路 **GD-TN-005** 误码率升高（当前 BER: 3.2×10⁻⁴），导致天河区 12 个 5G 小区回传带宽受限，下行吞吐量从 850Mbps 降至 210Mbps，影响约 3,847 名用户。\n\n**建议修复方案：**\n1. 启用传输链路 GD-TN-005 备用光路\n2. 重置光模块参数\n3. 安排上站检查光缆物理状态\n\n已在数字孪生中完成仿真验证，方案风险等级：**低**。请确认是否执行修复？',
        timestamp: '14:20:45',
        toolCalls: [
          { id: 'tc-1', name: 'AlarmQueryTool', status: 'completed', input: '区域=天河, 时间=最近1小时', output: '3条活跃告警, 传输链路GD-TN-005误码率告警(严重)', duration: '1.2s' },
          { id: 'tc-2', name: 'NetworkQueryTool', status: 'completed', input: '天河区全部小区下行吞吐量', output: '12个小区异常: 平均210Mbps (基线850Mbps)', duration: '2.1s' },
          { id: 'tc-3', name: 'CrossDomainAnalysisTool', status: 'completed', input: 'RAN异常→回传链路→核心网关联', output: '根因: GD-TN-005, BER=3.2×10⁻⁴', duration: '3.5s' },
          { id: 'tc-4', name: 'DigitalTwinSimTool', status: 'completed', input: '仿真: 启用GD-TN-005备用光路', output: '仿真通过, 风险: 低, 恢复<30秒', duration: '4.2s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Multiple user complaints in Tianhe district suggest common upstream failure. Need to correlate alarms and trace topology.', contentZh: '天河区多用户反馈上网慢，怀疑存在上游共同故障点。需关联告警并追踪拓扑。', timestamp: '14:20:02' },
          { phase: 'Act', phaseZh: '执行', content: 'Querying active alarms in Tianhe district. Checking KPIs for all cells. Running cross-domain correlation.', contentZh: '查询天河区活跃告警。检查全部小区KPI。运行跨域关联分析。', timestamp: '14:20:05' },
          { phase: 'Observe', phaseZh: '观察', content: '12 cells with throughput anomaly. Transport link GD-TN-005 BER alarm confirmed. All 12 cells share this backhaul link.', contentZh: '12个小区吞吐量异常。传输链路GD-TN-005误码率告警确认。12个小区共用此回传链路。', timestamp: '14:20:20' },
          { phase: 'Reflect', phaseZh: '评估', content: 'Root cause confirmed with 0.96 confidence. Digital twin simulation validates backup path switch. Risk: LOW. Recommend immediate execution.', contentZh: '根因确认，置信度0.96。数字孪生仿真验证备用光路切换安全。风险：低。建议立即执行。', timestamp: '14:20:40' },
        ],
        suggestions: [
          { id: 's1', text: 'Approve: Execute repair plan', textZh: '批准：执行修复方案', type: 'approve' },
          { id: 's2', text: 'Modify: Only activate backup path, skip module reset', textZh: '调整：仅启用备用光路，跳过模块重置', type: 'modify' },
          { id: 's3', text: 'Explore: Show affected user list and SLA impact', textZh: '深入：显示受影响用户清单和SLA影响', type: 'explore' },
          { id: 's4', text: 'Reject: Escalate to manual review', textZh: '拒绝：升级至人工审核', type: 'reject' },
        ],
      },
      {
        id: 'msg-3',
        role: 'user',
        content: '批准执行修复方案。',
        timestamp: '14:21:00',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: '修复执行完成！\n\n**修复结果：**\n- ✅ 备用光路已激活（切换耗时0.28秒）\n- ✅ 光模块参数已重置\n- ✅ 误码率恢复至 2.1×10⁻⁹（正常范围）\n- ✅ 下行吞吐量恢复至 830Mbps\n- ✅ 3,847名受影响用户已全部恢复\n\n**自动更新：**\n- 知识库已新增条目 KB-089：传输链路高误码率故障处理\n- 维护工单 WO-2026-0331-045 已创建（上站检查光缆）\n- 故障报告 FR-2026-0331-001 已归档',
        timestamp: '14:21:30',
        toolCalls: [
          { id: 'tc-5', name: 'OSSCommandTool', status: 'completed', input: '传输设备切换备用光路', output: '执行成功, 切换0.28秒', duration: '2.8s' },
          { id: 'tc-6', name: 'ConfigWriteTool', status: 'completed', input: '重置光模块参数', output: '参数重置成功', duration: '1.5s' },
          { id: 'tc-7', name: 'KnowledgeBaseTool', status: 'completed', input: '新增KB-089', output: '知识条目创建成功', duration: '0.8s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'User approved L3 repair. Executing backup path activation and module reset.', contentZh: '用户批准L3级修复。执行备用光路激活和模块重置。', timestamp: '14:21:01' },
          { phase: 'Act', phaseZh: '执行', content: 'Sending OSS commands to activate backup optical path. Resetting optical module parameters.', contentZh: '发送OSS命令激活备用光路。重置光模块参数。', timestamp: '14:21:05' },
          { phase: 'Observe', phaseZh: '观察', content: 'BER recovered to 2.1×10⁻⁹. Throughput restored to 830Mbps. All affected users recovered.', contentZh: '误码率恢复至2.1×10⁻⁹。吞吐量恢复至830Mbps。全部受影响用户已恢复。', timestamp: '14:21:25' },
          { phase: 'Reflect', phaseZh: '评估', content: 'Repair successful. Auto-updating knowledge base, creating maintenance ticket, archiving fault report. Task closure complete.', contentZh: '修复成功。自动更新知识库、创建维护工单、归档故障报告。任务闭环完成。', timestamp: '14:21:29' },
        ],
        suggestions: [
          { id: 's5', text: 'Generate full fault analysis report', textZh: '生成完整故障分析报告', type: 'explore' },
          { id: 's6', text: 'Check for similar risks in other links', textZh: '排查其他链路类似风险', type: 'explore' },
          { id: 's7', text: 'Send proactive care SMS to affected users', textZh: '向受影响用户发送主动关怀短信', type: 'approve' },
        ],
      },
    ],
  },
  {
    id: 'conv-experience',
    title: 'VIP Experience Assurance',
    titleZh: 'VIP用户体验保障',
    domain: 'experience',
    messages: [
      {
        id: 'msg-e1',
        role: 'user',
        content: 'VIP用户张先生（138****5678）反馈视频通话卡顿，请处理。',
        timestamp: '16:10:00',
      },
      {
        id: 'msg-e2',
        role: 'assistant',
        content: '已完成VIP用户体验保障。\n\n**用户画像：** 钻石卡 · 5G至尊套餐 · Top 5%确定性体验\n**服务小区：** GD-GZ-018A（PRB利用率92%）\n\n**问题：** MOS 2.8（保障阈值4.0），下行仅15Mbps\n\n**已执行保障：**\n1. ✅ 核心网5QI优先级提升至最高\n2. ✅ 无线侧调度权重+200%\n3. ✅ 载波聚合 n78+n41 激活\n\n**效果：** DL 15→128Mbps，MOS 2.8→4.5 ✅\n\n已发送主动关怀短信。',
        timestamp: '16:11:20',
        toolCalls: [
          { id: 'tc-e1', name: 'NetworkQueryTool', status: 'completed', input: '用户138****5678实时体验', output: 'MOS=2.8, DL=15Mbps, PRB=92%', duration: '1.5s' },
          { id: 'tc-e2', name: 'OSSCommandTool', status: 'completed', input: '5QI优先级+调度权重调整', output: '执行成功', duration: '2.3s' },
          { id: 'tc-e3', name: 'ConfigWriteTool', status: 'completed', input: 'CA n78+n41激活', output: '配置成功', duration: '3.1s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Diamond-tier VIP user in Top 5% deterministic experience tier. Requires immediate response with network-follows-user guarantee.', contentZh: '钻石卡VIP，属于Top 5%确定性体验保障。需立即响应，网随人动保障。', timestamp: '16:10:03' },
          { phase: 'Act', phaseZh: '执行', content: 'Querying user profile, real-time experience metrics, and serving cell KPIs.', contentZh: '查询用户画像、实时体验指标和服务小区KPI。', timestamp: '16:10:05' },
          { phase: 'Observe', phaseZh: '观察', content: 'Serving cell PRB at 92%. User MOS 2.8, far below 4.0 guarantee. Joint core+RAN optimization needed.', contentZh: '服务小区PRB 92%。用户MOS 2.8，远低于4.0保障阈值。需核心网+无线侧联合优化。', timestamp: '16:10:10' },
          { phase: 'Reflect', phaseZh: '评估', content: 'After 5QI+scheduling+CA adjustments: MOS recovered to 4.5. Experience guarantee met. Sending proactive care.', contentZh: '5QI+调度+CA调整后：MOS恢复至4.5。体验保障达标。发送主动关怀。', timestamp: '16:11:15' },
        ],
        suggestions: [
          { id: 'se1', text: 'Show detailed user experience history', textZh: '查看用户详细体验历史', type: 'explore' },
          { id: 'se2', text: 'Monitor this user for next 24 hours', textZh: '持续监控该用户24小时', type: 'approve' },
        ],
      },
    ],
  },
  {
    id: 'conv-market',
    title: 'Precision Marketing Campaign',
    titleZh: '5G套餐精准营销',
    domain: 'marketing',
    messages: [
      {
        id: 'msg-m1',
        role: 'user',
        content: '推出新的5G畅享199套餐，请识别潜在用户并制定营销方案。',
        timestamp: '10:00:00',
      },
      {
        id: 'msg-m2',
        role: 'assistant',
        content: '潜客分析完成。\n\n**扫描范围：** 广东省 8,234,567 活跃用户\n**潜在用户：** 12,847 人\n\n**分层策略：**\n| 层级 | 人数 | 转化率 | 触达方式 |\n|------|------|--------|----------|\n| A级 | 2,156 | 32.5% | 使用高峰期精准推送 |\n| B级 | 5,423 | 18.3% | 月末流量不足时推送 |\n| C级 | 5,268 | 8.7% | 免费体验7天引导 |\n\n**预期收益：** 转化3,247人，月增收¥201K，ROI 4.2\n\n营销任务已提交CRM系统。',
        timestamp: '10:04:20',
        toolCalls: [
          { id: 'tc-m1', name: 'NetworkQueryTool', status: 'completed', input: '全省用户画像筛选', output: '12,847名潜客', duration: '15.3s' },
          { id: 'tc-m2', name: 'AnomalyDetectionTool', status: 'completed', input: '用户分层+转化预测', output: 'A/B/C三层策略', duration: '8.7s' },
          { id: 'tc-m3', name: 'ExternalAPITool', status: 'completed', input: '提交CRM营销任务', output: '创建成功', duration: '3.2s' },
        ],
        thinkingSteps: [
          { phase: 'Think', phaseZh: '思考', content: 'Need multi-dimensional user screening: data usage + 5G device + current 4G plan + high-value location.', contentZh: '需多维度筛选：数据使用量+5G终端+当前4G套餐+高价值区域。', timestamp: '10:00:05' },
          { phase: 'Act', phaseZh: '执行', content: 'Scanning 8.2M users with composite scoring model. Segmenting into A/B/C tiers.', contentZh: '用组合评分模型扫描820万用户。分为A/B/C三层。', timestamp: '10:00:10' },
          { phase: 'Observe', phaseZh: '观察', content: '12,847 prospects identified. A-tier 2,156 with 32.5% predicted conversion. Best ROI is A-tier moment-of-need push.', contentZh: '识别12,847名潜客。A级2,156人，预测转化率32.5%。最佳ROI为A级需求时刻推送。', timestamp: '10:02:30' },
          { phase: 'Reflect', phaseZh: '评估', content: 'Three-tier campaign covers all segments. Predicted ROI 4.2x exceeds threshold. Network capacity verified sufficient by Planning Agent.', contentZh: '三层营销覆盖所有用户群。预测ROI 4.2倍超过门槛。规划Agent已验证网络容量充足。', timestamp: '10:04:15' },
        ],
        suggestions: [
          { id: 'sm1', text: 'Approve and launch campaign immediately', textZh: '批准并立即启动营销', type: 'approve' },
          { id: 'sm2', text: 'View detailed user profiles for A-tier', textZh: '查看A级用户详细画像', type: 'explore' },
          { id: 'sm3', text: 'Adjust: Only target A-tier first as pilot', textZh: '调整：先只针对A级用户试点', type: 'modify' },
        ],
      },
    ],
  },
];
