export interface AgentThinkingStep {
  phase: 'think' | 'act' | 'observe';
  content: string;
  timestamp: string;
  tools?: string[];
}

export interface ToolCallRecord {
  tool: string;
  input: string;
  output: string;
  duration: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentThinking?: AgentThinkingStep[];
  toolCalls?: ToolCallRecord[];
  agentCollaboration?: { agent: string; action: string; result: string }[];
}

export interface DemoConversation {
  id: string;
  title: string;
  domain: string;
  icon: string;
  messages: ChatMessage[];
}

export const demoConversations: DemoConversation[] = [
  {
    id: 'conv-fault',
    title: '网络故障智能诊断',
    domain: 'ops',
    icon: '🔧',
    messages: [
      {
        id: 'f1',
        role: 'user',
        content: '广州天河区多个用户反馈上网慢，请分析原因并处理。',
        timestamp: '2026-03-31 14:20:00',
      },
      {
        id: 'f2',
        role: 'assistant',
        content:
          '收到，正在启动跨域故障诊断流程。\n\n**诊断结果：**\n\n经过多维度分析，定位到根因为传输链路 **GD-TN-005** 误码率升高（当前 BER: 3.2×10⁻⁴，阈值 1×10⁻⁶），导致天河区 12 个 5G 小区回传带宽受限，下行吞吐量从平均 850Mbps 降至 210Mbps，影响约 3,847 名用户。\n\n**已执行修复：**\n1. ✅ 数字孪生仿真验证修复方案安全（风险等级：低）\n2. ✅ 启用传输链路 GD-TN-005 备用光路\n3. ✅ 重置光模块参数\n4. ✅ 验证修复效果：误码率恢复至 2.1×10⁻⁹，吞吐量恢复至 830Mbps\n\n**影响范围：** 天河区 12 个小区已全部恢复正常，受影响用户体验已恢复。建议安排上站检查光缆物理状态。',
        timestamp: '2026-03-31 14:20:45',
        agentThinking: [
          { phase: 'think', content: '多用户反馈上网慢，需要先确认影响范围和告警情况', timestamp: '14:20:02', tools: [] },
          { phase: 'act', content: '查询天河区活跃告警和KPI异常', timestamp: '14:20:05', tools: ['NetworkQueryTool', 'AlarmQueryTool'] },
          { phase: 'observe', content: '发现12个小区下行吞吐量异常下降，同时传输链路GD-TN-005存在高误码率告警', timestamp: '14:20:12' },
          { phase: 'think', content: '吞吐量下降和传输告警时间高度吻合，怀疑是传输问题导致RAN侧性能下降', timestamp: '14:20:15' },
          { phase: 'act', content: '跨域关联分析：RAN→传输→核心网', timestamp: '14:20:18', tools: ['CrossDomainAnalysisTool', 'TopologyQueryTool'] },
          { phase: 'observe', content: '确认根因：传输链路GD-TN-005误码率3.2×10⁻⁴，12个小区共用此回传链路', timestamp: '14:20:25' },
          { phase: 'think', content: '需要在数字孪生中验证修复方案的安全性', timestamp: '14:20:28' },
          { phase: 'act', content: '在数字孪生中仿真启用备用光路的影响', timestamp: '14:20:30', tools: ['DigitalTwinSimTool'] },
          { phase: 'observe', content: '仿真结果：风险低，切换备用光路预计恢复正常', timestamp: '14:20:35' },
          { phase: 'act', content: '执行修复：启用备用光路+重置光模块参数', timestamp: '14:20:37', tools: ['OSSCommandTool', 'ConfigWriteTool'] },
          { phase: 'observe', content: '修复完成，误码率恢复正常，吞吐量回升至830Mbps', timestamp: '14:20:43' },
        ],
        toolCalls: [
          { tool: 'AlarmQueryTool', input: '区域=天河, 时间=最近1小时', output: '发现3条活跃告警，传输链路GD-TN-005误码率告警（严重）', duration: '1.2s' },
          { tool: 'NetworkQueryTool', input: '小区KPI: 天河区全部小区, 指标=下行吞吐量', output: '12个小区吞吐量异常：平均210Mbps（基线850Mbps）', duration: '2.1s' },
          { tool: 'CrossDomainAnalysisTool', input: '关联分析: RAN异常小区→回传链路→核心网', output: '根因定位：传输链路GD-TN-005, BER=3.2×10⁻⁴', duration: '3.5s' },
          { tool: 'DigitalTwinSimTool', input: '仿真方案：启用GD-TN-005备用光路', output: '仿真通过，风险等级：低，预计恢复时间<30秒', duration: '4.2s' },
          { tool: 'OSSCommandTool', input: '执行：传输设备切换备用光路', output: '执行成功，链路状态：正常', duration: '2.8s' },
        ],
        agentCollaboration: [
          { agent: '运维监控Agent', action: '告警查询与初步分析', result: '识别传输告警与RAN异常的关联' },
          { agent: '故障分析Agent', action: '跨域根因分析', result: '定位传输链路GD-TN-005误码率异常' },
          { agent: '数字孪生引擎', action: '修复方案仿真验证', result: '方案安全，风险等级低' },
        ],
      },
      {
        id: 'f3',
        role: 'user',
        content: '很好，请生成这次故障的分析报告并更新知识库。',
        timestamp: '2026-03-31 14:22:00',
      },
      {
        id: 'f4',
        role: 'assistant',
        content:
          '已完成：\n\n1. **故障分析报告** 已生成并归档（报告编号：FR-2026-0331-001）\n   - 故障时长：23分钟\n   - 影响范围：12个小区，3,847名用户\n   - MTTR：2分42秒（从诊断到修复）\n   - 根因：传输链路光模块老化导致误码率升高\n\n2. **知识库已更新**（KB-089）\n   - 标题：传输链路高误码率导致批量小区吞吐量下降\n   - 置信度：0.97\n   - 标签：传输故障、误码率、光模块、批量小区影响\n\n3. **工单已创建**（WO-2026-0331-045）\n   - 类型：预防性维护\n   - 内容：安排上站检查GD-TN-005光缆及光模块物理状态\n   - 优先级：中',
        timestamp: '2026-03-31 14:22:30',
        toolCalls: [
          { tool: 'KnowledgeBaseTool', input: '新增知识条目：传输高误码率故障', output: '知识条目KB-089创建成功', duration: '0.8s' },
          { tool: 'TicketingTool', input: '创建预防性维护工单', output: '工单WO-2026-0331-045创建成功', duration: '1.1s' },
        ],
      },
    ],
  },
  {
    id: 'conv-optimization',
    title: '全网参数自动优化',
    domain: 'optimization',
    icon: '⚡',
    messages: [
      {
        id: 'o1',
        role: 'user',
        content: '对广东省全网进行覆盖和容量综合优化，要求避免乒乓优化问题。',
        timestamp: '2026-03-31 09:00:00',
      },
      {
        id: 'o2',
        role: 'assistant',
        content:
          '已完成广东省全网综合优化分析与执行。\n\n**优化概要：**\n- 分析范围：广东省 23,456 个小区\n- 识别质差小区：847 个（覆盖类 312 个，容量类 289 个，干扰类 246 个）\n- 参数冲突检测：发现 73 组潜在乒乓优化参数（已综合处理）\n\n**优化结果：**\n| 指标 | 优化前 | 优化后 | 提升 |\n|------|--------|--------|------|\n| RSRP覆盖率 | 94.2% | 97.4% | +3.2% |\n| PRB利用率均值 | 76.3% | 62.1% | -14.2% |\n| 下行吞吐量 | 312Mbps | 387Mbps | +24.0% |\n| 切换成功率 | 98.7% | 99.4% | +0.7% |\n\n**防乒乓策略：**\n- 73组冲突参数已通过全局联合优化算法统一求解\n- 覆盖-容量-干扰三维度Pareto最优解\n- 所有参数变更已通过数字孪生仿真验证\n\n参数已分批下发至网管系统，建议观察24小时后评估效果。',
        timestamp: '2026-03-31 09:05:30',
        agentThinking: [
          { phase: 'think', content: '全网优化需要同时考虑覆盖、容量、干扰三个维度，避免单维度优化导致的乒乓问题', timestamp: '09:00:05' },
          { phase: 'act', content: '拉取广东省全网KPI数据', timestamp: '09:00:10', tools: ['NetworkQueryTool'] },
          { phase: 'observe', content: '23,456个小区数据已获取，识别847个质差小区', timestamp: '09:00:45' },
          { phase: 'think', content: '需要检测参数冲突：不同优化任务可能对同一参数有相反的调整方向', timestamp: '09:00:50' },
          { phase: 'act', content: '运行参数冲突检测算法', timestamp: '09:00:55', tools: ['AnomalyDetectionTool'] },
          { phase: 'observe', content: '发现73组潜在冲突参数，涉及功率、天线倾角、切换门限', timestamp: '09:01:30' },
          { phase: 'act', content: '运行全局联合优化算法（三维Pareto求解）', timestamp: '09:01:35', tools: ['DigitalTwinSimTool'] },
          { phase: 'observe', content: '优化方案生成，预期覆盖率+3.2%，容量+24%，无冲突', timestamp: '09:03:00' },
          { phase: 'act', content: '分批下发参数至网管', timestamp: '09:03:05', tools: ['ConfigWriteTool', 'OSSCommandTool'] },
          { phase: 'observe', content: '参数下发完成，847个小区参数已更新', timestamp: '09:05:20' },
        ],
        toolCalls: [
          { tool: 'NetworkQueryTool', input: '全省小区KPI: RSRP/SINR/PRB/吞吐量/切换成功率', output: '23,456个小区数据，847个质差', duration: '8.3s' },
          { tool: 'AnomalyDetectionTool', input: '参数冲突检测：覆盖vs容量vs干扰优化', output: '73组冲突参数已识别', duration: '12.1s' },
          { tool: 'DigitalTwinSimTool', input: '全局联合优化仿真', output: '最优方案生成，覆盖+3.2%，容量+24%', duration: '45.2s' },
          { tool: 'ConfigWriteTool', input: '批量参数下发：847个小区', output: '下发成功', duration: '32.5s' },
        ],
      },
    ],
  },
  {
    id: 'conv-experience',
    title: 'VIP用户体验保障',
    domain: 'experience',
    icon: '👤',
    messages: [
      {
        id: 'e1',
        role: 'user',
        content: 'VIP用户张先生（手机号138****5678）反馈视频通话卡顿，请立即处理。',
        timestamp: '2026-03-31 16:10:00',
      },
      {
        id: 'e2',
        role: 'assistant',
        content:
          '已完成VIP用户张先生的体验保障处理。\n\n**用户画像：**\n- 套餐：5G至尊套餐（钻石卡用户）\n- 体验等级：确定性体验保障（Top 5%）\n- 当前位置：天河区天汇广场\n- 服务小区：GD-GZ-018A\n\n**问题分析：**\n- 服务小区 GD-GZ-018A PRB利用率高达 92%\n- 用户下行速率仅 15Mbps（保障阈值 50Mbps）\n- 视频通话MOS分 2.8（保障阈值 4.0）\n\n**已执行保障措施：**\n1. ✅ 协同核心网调整5QI参数：QFI=5（视频通话）优先级提升至最高\n2. ✅ 无线侧调度权重调整：该用户调度优先级提升200%\n3. ✅ 启用载波聚合：聚合n78+n41双载波\n\n**保障效果：**\n- 下行速率：15Mbps → 128Mbps ✅\n- 视频通话MOS：2.8 → 4.5 ✅\n- 体验保障达标（95%概率确定性体验）\n\n已发送主动关怀短信给张先生。',
        timestamp: '2026-03-31 16:11:20',
        agentThinking: [
          { phase: 'think', content: '钻石卡VIP用户，属于Top 5%确定性体验保障范围，需立即响应', timestamp: '16:10:03' },
          { phase: 'act', content: '查询用户画像和实时体验数据', timestamp: '16:10:05', tools: ['NetworkQueryTool'] },
          { phase: 'observe', content: '用户当前MOS 2.8，服务小区PRB 92%，体验严重不达标', timestamp: '16:10:10' },
          { phase: 'think', content: '高PRB利用率导致调度资源不足，需要同时从核心网和无线侧提升保障', timestamp: '16:10:12' },
          { phase: 'act', content: '协同核心网+无线侧执行差异化体验保障', timestamp: '16:10:15', tools: ['OSSCommandTool', 'ConfigWriteTool'] },
          { phase: 'observe', content: '参数调整生效，用户速率恢复至128Mbps，MOS提升至4.5', timestamp: '16:11:10' },
        ],
        toolCalls: [
          { tool: 'NetworkQueryTool', input: '用户138****5678实时体验数据', output: 'MOS=2.8, DL=15Mbps, 小区PRB=92%', duration: '1.5s' },
          { tool: 'OSSCommandTool', input: '核心网5QI调整：用户QFI=5优先级最高', output: '执行成功', duration: '2.3s' },
          { tool: 'ConfigWriteTool', input: '无线侧调度权重+载波聚合配置', output: '配置成功，n78+n41 CA激活', duration: '3.1s' },
        ],
        agentCollaboration: [
          { agent: '确定性体验Agent', action: '用户级体验分析与保障策略制定', result: '确定核心网+无线侧联合保障方案' },
          { agent: '差异化体验Agent', action: '5QI参数和调度优先级调整', result: '用户体验恢复达标' },
        ],
      },
    ],
  },
  {
    id: 'conv-event',
    title: '音乐节突发话务保障',
    domain: 'optimization',
    icon: '🎵',
    messages: [
      {
        id: 'ev1',
        role: 'user',
        content: '明天广州天河体育中心有5万人音乐节，请提前做好网络保障方案。',
        timestamp: '2026-03-31 18:00:00',
      },
      {
        id: 'ev2',
        role: 'assistant',
        content:
          '已完成音乐节网络保障方案制定与预部署。\n\n**话务预测：**\n- 预计人流：50,000人\n- 话务峰值：正常的 3.2 倍（基于历史同类事件）\n- 高峰时段：20:00-22:00\n- 主要业务：短视频直播（45%）、社交媒体（30%）、即时通讯（25%）\n\n**覆盖分析：**\n- 影响小区：GD-GZ-021A/B/C、GD-GZ-022A/B（5个扇区）\n- 当前容量：可支撑约 18,000 并发用户\n- 缺口：约 32,000 用户容量需扩充\n\n**保障方案（已预部署）：**\n1. ✅ 载波聚合全开：n78+n41+n28 三载波聚合\n2. ✅ 8T8R MIMO升级至 Massive MIMO 64T64R 波束赋形\n3. ✅ 负荷均衡参数优化：跨频段负荷均衡门限从70%调至50%\n4. ✅ 切换参数优化：A3偏置从3dB调至5dB，减少乒乓切换\n5. ✅ 核心网扩容：UPF会话容量翻倍\n\n**仿真结果：**\n- 优化后容量：可支撑约 55,000 并发用户 ✅\n- 预计用户感知速率：≥50Mbps（4K直播流畅）\n- 预计通话接通率：≥99.5%\n\n**监控计划：** 已配置事件保障Agent在明天18:00-24:00期间实时监控，异常自动干预。',
        timestamp: '2026-03-31 18:03:45',
        agentThinking: [
          { phase: 'think', content: '大型活动保障，需预测话务、评估容量缺口、制定参数优化方案', timestamp: '18:00:05' },
          { phase: 'act', content: '查询历史同类事件话务数据和当前网络容量', timestamp: '18:00:10', tools: ['NetworkQueryTool'] },
          { phase: 'observe', content: '历史音乐节话务3.2倍增长，当前容量仅支撑18K用户', timestamp: '18:00:30' },
          { phase: 'think', content: '容量缺口大，需要多维度扩容：载波聚合+MIMO+负荷均衡+核心网', timestamp: '18:00:35' },
          { phase: 'act', content: '在数字孪生中仿真综合保障方案', timestamp: '18:00:40', tools: ['DigitalTwinSimTool'] },
          { phase: 'observe', content: '仿真通过：优化后可支撑55K用户，满足需求', timestamp: '18:02:00' },
          { phase: 'act', content: '预部署参数并配置实时监控', timestamp: '18:02:05', tools: ['ConfigWriteTool', 'OSSCommandTool'] },
          { phase: 'observe', content: '参数预部署完成，监控任务已配置', timestamp: '18:03:40' },
        ],
        toolCalls: [
          { tool: 'NetworkQueryTool', input: '天河体育中心周边小区容量和历史事件数据', output: '5个扇区，当前容量18K用户，历史峰值3.2x', duration: '3.2s' },
          { tool: 'DigitalTwinSimTool', input: '综合扩容方案仿真：CA+MIMO+负荷均衡', output: '容量55K，速率≥50Mbps，接通率≥99.5%', duration: '28.5s' },
          { tool: 'ConfigWriteTool', input: '批量参数预部署：5个扇区', output: '部署成功', duration: '5.8s' },
        ],
      },
    ],
  },
  {
    id: 'conv-marketing',
    title: '5G套餐精准营销',
    domain: 'marketing',
    icon: '📊',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: '公司推出新的"5G畅享199套餐"，请识别潜在用户并制定精准营销方案。',
        timestamp: '2026-04-01 10:00:00',
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          '已完成潜在用户识别和精准营销方案制定。\n\n**潜客分析：**\n- 扫描用户总量：8,234,567（广东省活跃用户）\n- 识别潜在用户：12,847 人\n- 识别维度：数据使用量>20GB/月 + 5G终端 + 当前4G套餐 + 高价值区域\n\n**用户分层：**\n| 层级 | 人数 | 特征 | 转化概率 |\n|------|------|------|----------|\n| A级（高意向） | 2,156 | 月均流量>40GB，频繁触达5G | 32.5% |\n| B级（中意向） | 5,423 | 月均流量20-40GB，偶尔5G | 18.3% |\n| C级（低意向） | 5,268 | 月均流量15-20GB，5G终端未激活 | 8.7% |\n\n**个性化营销策略：**\n- **A级用户：** 在用户使用短视频/游戏高峰期推送"限时体验加速"→引导升级\n- **B级用户：** 在月末流量不足时推送"5G不限量套餐首月半价"\n- **C级用户：** 推送"免费体验7天5G极速网络"激活5G功能\n\n**预期收益：**\n- 预计转化用户：3,247人\n- 月增ARPU：¥62/用户\n- 月增收入：¥201,314\n- ROI：4.2（营销成本¥47,800）\n\n营销任务已提交至CRM系统，实时营销Agent将在最佳时机自动触发推送。',
        timestamp: '2026-04-01 10:04:20',
        agentThinking: [
          { phase: 'think', content: '需要从全量用户中精准筛选5G套餐潜客，考虑多维度特征', timestamp: '10:00:05' },
          { phase: 'act', content: '查询用户行为数据和终端信息', timestamp: '10:00:10', tools: ['NetworkQueryTool'] },
          { phase: 'observe', content: '从823万用户中筛选出12,847名潜在用户', timestamp: '10:01:00' },
          { phase: 'think', content: '需要分层并制定差异化营销策略，每层用户的触达时机和话术不同', timestamp: '10:01:05' },
          { phase: 'act', content: '用户分层分析和转化概率预测', timestamp: '10:01:10', tools: ['AnomalyDetectionTool'] },
          { phase: 'observe', content: '三层用户已分类，A级2156人转化率32.5%', timestamp: '10:02:30' },
          { phase: 'act', content: '生成个性化营销方案并提交CRM', timestamp: '10:02:35', tools: ['ExternalAPITool'] },
          { phase: 'observe', content: '营销任务已提交，实时触发规则已配置', timestamp: '10:04:15' },
        ],
        toolCalls: [
          { tool: 'NetworkQueryTool', input: '全省用户画像：流量/终端/套餐/位置', output: '12,847名潜在用户识别', duration: '15.3s' },
          { tool: 'AnomalyDetectionTool', input: '用户分层与转化概率预测', output: 'A级2156/B级5423/C级5268', duration: '8.7s' },
          { tool: 'ExternalAPITool', input: '提交营销任务至CRM系统', output: '任务创建成功，3个分层触发规则已配置', duration: '3.2s' },
        ],
        agentCollaboration: [
          { agent: '潜客识别Agent', action: '多维度用户筛选', result: '12,847名潜在用户' },
          { agent: '实时营销Agent', action: '配置最佳时机触发规则', result: '3种场景化推送策略' },
          { agent: '规划Agent', action: '网络容量评估', result: '确认5G容量可支撑新增用户' },
        ],
      },
    ],
  },
];
