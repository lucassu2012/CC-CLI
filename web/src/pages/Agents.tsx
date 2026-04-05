import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ChevronRight, Wrench, Save, Settings, Brain, BookOpen, GitBranch, Cpu, Layers, Check, ArrowLeft, Activity, Share2, AlertTriangle, Crown, Radio, ArrowRightLeft } from 'lucide-react';
import { useText } from '../hooks/useText';
import { domainAgents as defaultAgents, defaultSupervisor, type DomainAgent, type SubAgent } from '../data/agents';
import { defaultCollaborationEvents, defaultSharedContext, defaultConflictResolutions } from '../data/a2a-protocol';
import { generatedSkills as defaultSkills } from '../data/knowledge';
import { useScenario } from '../context/ScenarioContext';
import StatusBadge from '../components/StatusBadge';

/* ─── Agent config data ─── */

const MODELS = [
  { id: 'gts-llm', name: 'GTS-LLM', desc: '电信专用大模型 · 718B参数 · 全能力', descEn: 'Telecom LLM · 718B params · Full capability' },
  { id: 'pangu-72b', name: 'PanGu-Telecom-72B', desc: '盘古电信 · 72B参数 · 推理增强', descEn: 'PanGu Telecom · 72B · Reasoning-enhanced' },
  { id: 'pangu-7b', name: 'PanGu-Telecom-7B', desc: '盘古电信 · 7B参数 · 轻量快速', descEn: 'PanGu Telecom · 7B · Lightweight fast' },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', desc: '通用大模型 · MoE架构 · 开源', descEn: 'General LLM · MoE · Open-source' },
  { id: 'qwen-72b', name: 'Qwen-72B', desc: '通义千问 · 72B · 多语言', descEn: 'Qwen · 72B · Multilingual' },
];

const DIGITAL_TWINS: Record<string, { name: string; nameEn: string; desc: string; descEn: string }[]> = {
  planning: [
    { name: '覆盖孪生', nameEn: 'Coverage Twin', desc: '覆盖仿真·信号预测·盲区识别', descEn: 'Coverage simulation · signal prediction · blind spot detection' },
    { name: '容量孪生', nameEn: 'Capacity Twin', desc: '容量规划·用户密度·频谱效率', descEn: 'Capacity planning · user density · spectrum efficiency' },
    { name: '价值孪生', nameEn: 'Value Twin', desc: '价值用户分布·收益预测', descEn: 'Value user distribution · revenue forecast' },
  ],
  optimization: [
    { name: '无线孪生', nameEn: 'Radio Twin', desc: '无线参数仿真·KPI预测', descEn: 'Radio parameter simulation · KPI prediction' },
    { name: '干扰孪生', nameEn: 'Interference Twin', desc: '干扰分析·频率规划', descEn: 'Interference analysis · frequency planning' },
    { name: '负荷孪生', nameEn: 'Load Twin', desc: '负荷均衡·流量预测', descEn: 'Load balancing · traffic prediction' },
  ],
  experience: [
    { name: '用户孪生', nameEn: 'User Twin', desc: 'LUM模型·行为预测·体验画像', descEn: 'LUM model · behavior prediction · experience profiling' },
    { name: '业务孪生', nameEn: 'Service Twin', desc: '业务质量建模·端到端体验', descEn: 'Service quality modeling · end-to-end experience' },
  ],
  ops: [
    { name: '设备孪生', nameEn: 'Equipment Twin', desc: '网元健康·寿命预测·告警关联', descEn: 'NE health · lifespan prediction · alarm correlation' },
    { name: '传输孪生', nameEn: 'Transport Twin', desc: '光路仿真·链路冗余', descEn: 'Optical path simulation · link redundancy' },
    { name: '站点孪生', nameEn: 'Site Twin', desc: '站点3D建模·上站辅助', descEn: 'Site 3D modeling · on-site assistance' },
  ],
  marketing: [
    { name: '用户画像孪生', nameEn: 'Profile Twin', desc: '360°画像·消费行为·偏好', descEn: '360° profiling · consumption behavior · preferences' },
    { name: '市场孪生', nameEn: 'Market Twin', desc: '竞争分析·套餐收益仿真', descEn: 'Competition analysis · plan revenue simulation' },
  ],
};

const MEMORY_LAYERS = [
  { key: 'system', label: '系统记忆', labelEn: 'System Memory', icon: '🏛️', desc: '全局规则/安全边界/操作规范', descEn: 'Global rules, safety boundaries, operational standards', color: 'text-accent-cyan' },
  { key: 'domain', label: '领域记忆', labelEn: 'Domain Memory', icon: '🧠', desc: '领域知识/专业经验/最佳实践', descEn: 'Domain knowledge, expertise, best practices', color: 'text-accent-cyan' },
  { key: 'session', label: '会话记忆', labelEn: 'Session Memory', icon: '💬', desc: '当前任务上下文/操作历史', descEn: 'Current task context, action history', color: 'text-accent-cyan' },
  { key: 'episode', label: '情景记忆', labelEn: 'Episode Memory', icon: '📖', desc: '历史案例/故障经验/成功模式', descEn: 'Historical cases, fault experiences, success patterns', color: 'text-accent-cyan' },
];

const SOP_TEMPLATES: Record<string, { name: string; nameEn: string; steps: string[]; stepsEn: string[] }[]> = {
  planning: [
    { name: '新站规划SOP', nameEn: 'New Site Planning SOP', steps: ['需求分析→价值评估', '覆盖仿真→容量仿真', '投资收益预估', '方案评审→输出规划'], stepsEn: ['Demand Analysis → Value Assessment', 'Coverage Sim → Capacity Sim', 'Investment ROI Estimation', 'Review → Output Plan'] },
    { name: '扩容评估SOP', nameEn: 'Capacity Expansion SOP', steps: ['容量预警触发', '话务增长预测', '扩容方案生成', 'ROI对比→决策'], stepsEn: ['Capacity Alert Triggered', 'Traffic Growth Forecast', 'Expansion Plan Generation', 'ROI Comparison → Decision'] },
  ],
  optimization: [
    { name: '全网优化SOP', nameEn: 'Network-wide Optimization SOP', steps: ['KPI采集→基线对比', '问题小区识别', '参数优化→仿真验证', '批量下发→效果跟踪'], stepsEn: ['KPI Collection → Baseline Compare', 'Problem Cell Identification', 'Parameter Optimization → Sim Verify', 'Batch Deploy → Track Results'] },
    { name: '新站优化SOP', nameEn: 'New Site Optimization SOP', steps: ['开通验证→覆盖测试', '邻区/切换优化', '参数精调→性能达标', '转入日常优化'], stepsEn: ['Activation Verify → Coverage Test', 'Neighbor/Handover Optimization', 'Parameter Tuning → KPI Target', 'Transfer to Routine Optimization'] },
  ],
  experience: [
    { name: '投诉处理SOP', nameEn: 'Complaint Handling SOP', steps: ['投诉接收→用户画像', '体验指标分析', '问题定位→协同修复', '用户回访→闭环'], stepsEn: ['Complaint Receive → User Profile', 'Experience KPI Analysis', 'Root Cause → Collaborative Fix', 'User Follow-up → Close Loop'] },
    { name: '确定性体验SOP', nameEn: 'Deterministic Experience SOP', steps: ['用户等级判定', '资源预留→QoS配置', '实时监控→动态调整', '体验达标验证'], stepsEn: ['User Tier Classification', 'Resource Reserve → QoS Config', 'Real-time Monitor → Dynamic Adjust', 'Experience Target Verification'] },
  ],
  ops: [
    { name: '故障处理SOP', nameEn: 'Fault Handling SOP', steps: ['告警接收→分类分级', '根因分析→影响评估', '修复执行→安全验证', '工单闭环→知识沉淀'], stepsEn: ['Alarm Receive → Classify & Grade', 'Root Cause → Impact Assessment', 'Repair Execute → Safety Verify', 'Ticket Close → Knowledge Archive'] },
    { name: '巡检SOP', nameEn: 'Inspection SOP', steps: ['定时触发→分区巡检', '健康评分→风险识别', '预防性维护→汇总报告'], stepsEn: ['Scheduled Trigger → Zone Inspect', 'Health Score → Risk Identification', 'Preventive Maintenance → Summary Report'] },
  ],
  marketing: [
    { name: '精准营销SOP', nameEn: 'Precision Marketing SOP', steps: ['目标市场分析', '潜客筛选→分层', '个性化方案→触达', '效果监控→策略迭代'], stepsEn: ['Target Market Analysis', 'Lead Filtering → Tiering', 'Personalized Plan → Reach Out', 'Performance Monitor → Strategy Iterate'] },
    { name: '离网维挽SOP', nameEn: 'Churn Prevention SOP', steps: ['流失预警→原因分析', '挽留策略制定', '触达执行→效果跟踪', '成功/失败归档'], stepsEn: ['Churn Alert → Root Cause', 'Retention Strategy Design', 'Outreach Execute → Track Results', 'Success/Failure Archive'] },
  ],
};

/* ─── Agent Editor (Full-page drill-down) ─── */

const EDITOR_TABS = [
  { key: 'memory', label: 'Memory', labelZh: '记忆', icon: Brain },
  { key: 'skills', label: 'Skills', labelZh: 'Skill能力', icon: BookOpen },
  { key: 'sop', label: 'SOP', labelZh: 'SOP流程', icon: GitBranch },
  { key: 'model', label: 'Model', labelZh: '模型', icon: Cpu },
  { key: 'twin', label: 'Digital Twin', labelZh: '数字孪生', icon: Layers },
] as const;

type EditorTab = typeof EDITOR_TABS[number]['key'];

/* ─── Per-agent/sub-agent memory content generator ─── */
function generateMemory(agent: DomainAgent, sub: SubAgent | undefined, t: (en: string, zh: string) => string): Record<string, string> {
  const name = sub ? t(sub.name, sub.nameZh) : t(agent.name, agent.nameZh);
  const count = sub ? sub.toolCalls : agent.taskCount;
  const rate = sub ? sub.successRate : agent.successRate;
  const succCount = Math.floor(count * rate / 100);
  const failCount = Math.floor(count * (100 - rate) / 100);
  const pLevel = sub ? sub.permissionLevel : 3;

  // Per-domain system memory
  const systemEn: Record<string, string> = {
    planning: `# Safety Boundaries\n- Investment decisions >$1M require human approval\n- Site planning must pass coverage simulation verification\n- ROI projections must include sensitivity analysis\n- L${pLevel}+ operations require approval chain\n\n# Operational Standards\n- All plans validated via Digital Twin before submission\n- Revenue forecasts must use latest 90-day data`,
    optimization: `# Safety Boundaries\n- No core network restart during peak hours (9:00-22:00)\n- Parameter adjustment range within baseline ±30%\n- L${pLevel}+ operations require human approval\n- Batch changes limited to 50 cells per cycle\n\n# Operational Standards\n- All parameter changes require Digital Twin pre-verification\n- Auto-verify KPI recovery after each optimization cycle`,
    experience: `# Safety Boundaries\n- VIP user SLA modifications require L4 approval\n- QoS parameter changes must not degrade other users >5%\n- Complaint escalation within 15min for critical cases\n- L${pLevel}+ operations require approval\n\n# Operational Standards\n- Experience baselines updated hourly from SmartCare\n- User profiling must comply with privacy regulations`,
    ops: `# Safety Boundaries\n- No core network restart during peak hours (9:00-22:00)\n- Maintenance window: 02:00-06:00 only for critical NEs\n- L${pLevel}+ operations require human approval\n- Emergency patches need dual-approval\n\n# Operational Standards\n- All repairs require Digital Twin pre-verification\n- Post-repair KPI verification mandatory within 30min`,
    marketing: `# Safety Boundaries\n- Campaign targeting must comply with privacy regulations\n- Maximum push frequency: 2 messages/user/week\n- Retention offers capped at ¥200/user/month\n- L${pLevel}+ operations require approval\n\n# Operational Standards\n- A/B testing required for campaigns >1000 users\n- Revenue impact validated before full rollout`,
  };
  const systemZh: Record<string, string> = {
    planning: `# 安全边界\n- 投资决策>100万需人工审批\n- 站点规划必须通过覆盖仿真验证\n- ROI预测必须包含敏感性分析\n- L${pLevel}+操作需审批链\n\n# 操作规范\n- 所有方案提交前需数字孪生验证\n- 收益预测必须使用最近90天数据`,
    optimization: `# 安全边界\n- 禁止高峰期（9:00-22:00）执行核心网重启\n- 参数调整范围不超过基线±30%\n- L${pLevel}+操作需人工审批\n- 批量变更每轮限50小区\n\n# 操作规范\n- 所有参数变更需数字孪生预验证\n- 每轮优化后自动验证KPI恢复`,
    experience: `# 安全边界\n- VIP用户SLA修改需L4审批\n- QoS参数变更不得降低其他用户体验>5%\n- 重要投诉15分钟内升级\n- L${pLevel}+操作需审批\n\n# 操作规范\n- 体验基线每小时从SmartCare更新\n- 用户画像必须遵守隐私法规`,
    ops: `# 安全边界\n- 禁止高峰期（9:00-22:00）执行核心网重启\n- 关键网元维护窗口：仅02:00-06:00\n- L${pLevel}+操作需人工审批\n- 紧急补丁需双人审批\n\n# 操作规范\n- 所有修复需数字孪生预验证\n- 修复后30分钟内完成KPI验证`,
    marketing: `# 安全边界\n- 营销活动须遵守隐私法规\n- 最大推送频率：每用户每周2条\n- 维挽优惠上限：¥200/用户/月\n- L${pLevel}+操作需审批\n\n# 操作规范\n- 超过1000用户的活动需A/B测试\n- 全量推广前须验证收入影响`,
  };

  // Per-domain/sub-agent domain memory
  const domainEn: Record<string, string> = {
    planning: `# ${name} Domain Knowledge\n- Coverage/capacity planning methodologies\n- 3GPP TS 28.xxx site planning standards\n- Historical planning case library (${count}+ entries)\n- Market-network synergy best practices\n- ROI calculation frameworks`,
    optimization: `# ${name} Domain Knowledge\n- Huawei equipment MML command set\n- 3GPP TS 32.xxx optimization standards\n- Historical optimization cases (${count}+ entries)\n- Pareto multi-objective optimization theory\n- Interference/coverage/capacity trade-off models`,
    experience: `# ${name} Domain Knowledge\n- LUM user experience models\n- SmartCare CEM integration APIs\n- Complaint pattern recognition library (${count}+ cases)\n- 5QI/QoS parameter mapping tables\n- SLA definition & monitoring frameworks`,
    ops: `# ${name} Domain Knowledge\n- Huawei equipment MML command set\n- 3GPP TS 28.xxx/TS 32.xxx standards\n- Historical fault case library (${count}+ entries)\n- AUTIN autonomous network integration\n- Predictive maintenance ML models`,
    marketing: `# ${name} Domain Knowledge\n- Customer segmentation models\n- CRM/BSS integration APIs\n- Campaign effectiveness library (${count}+ cases)\n- Churn prediction ML models\n- Revenue optimization strategies`,
  };
  const domainZh: Record<string, string> = {
    planning: `# ${name} 领域知识\n- 覆盖/容量规划方法论\n- 3GPP TS 28.xxx站点规划标准\n- 历史规划案例库（${count}+条）\n- 商网协同最佳实践\n- ROI计算框架`,
    optimization: `# ${name} 领域知识\n- 华为设备MML命令集\n- 3GPP TS 32.xxx优化标准\n- 历史优化案例（${count}+条）\n- Pareto多目标优化理论\n- 干扰/覆盖/容量权衡模型`,
    experience: `# ${name} 领域知识\n- LUM用户体验模型\n- SmartCare CEM集成接口\n- 投诉模式识别库（${count}+条）\n- 5QI/QoS参数映射表\n- SLA定义与监控框架`,
    ops: `# ${name} 领域知识\n- 华为设备MML命令集\n- 3GPP TS 28.xxx/TS 32.xxx标准\n- 历史故障案例库（${count}+条）\n- AUTIN自治网络集成\n- 预测性维护ML模型`,
    marketing: `# ${name} 领域知识\n- 客户细分模型\n- CRM/BSS集成接口\n- 营销效果库（${count}+条）\n- 离网预测ML模型\n- 收入优化策略`,
  };

  // Per-sub-agent session memory
  const sessionEn = sub
    ? `# Current Session — ${t(sub.name, sub.nameZh)}\n- Active task: ${t(sub.currentTask, sub.currentTaskZh)}\n- Permission level: L${sub.permissionLevel}\n- Tool calls this session: ${sub.toolCalls.toLocaleString()}\n- Success rate: ${sub.successRate}%`
    : `# Current Session Context\n(Auto-populated at runtime)\n- Current task chain\n- Operation history\n- Intermediate result cache`;
  const sessionZh = sub
    ? `# 当前会话 — ${t(sub.name, sub.nameZh)}\n- 当前任务：${t(sub.currentTask, sub.currentTaskZh)}\n- 权限级别：L${sub.permissionLevel}\n- 本次工具调用：${sub.toolCalls.toLocaleString()}\n- 成功率：${sub.successRate}%`
    : `# 当前会话上下文\n（运行时自动填充）\n- 当前任务链\n- 操作历史\n- 中间结果缓存`;

  return {
    system: t(systemEn[agent.id] || systemEn.ops, systemZh[agent.id] || systemZh.ops),
    domain: t(domainEn[agent.id] || domainEn.ops, domainZh[agent.id] || domainZh.ops),
    session: t(sessionEn, sessionZh),
    episode: t(
      `# Historical Episodes\n- Successful cases: ${succCount}\n- Failed cases: ${failCount}\n- Last updated: ${new Date().toLocaleDateString()}\n- Auto-synced from knowledge base`,
      `# 历史情景\n- 成功案例：${succCount}条\n- 失败案例：${failCount}条\n- 最近更新：${new Date().toLocaleDateString()}\n- 自动从知识库同步更新`,
    ),
  };
}

function AgentEditor({ agent, subAgent, onClose }: { agent: DomainAgent; subAgent?: SubAgent; onClose: () => void }) {
  const { t } = useText();
  const { scenario: editorScenario } = useScenario();
  const generatedSkills = editorScenario?.skills ?? defaultSkills;
  const [tab, setTab] = useState<EditorTab>('memory');
  const [selectedModel, setSelectedModel] = useState('gts-llm');
  const [saved, setSaved] = useState(false);
  const [editingSubAgent, setEditingSubAgent] = useState<SubAgent | undefined>(subAgent);

  // The entity being edited — sub-agent or domain agent
  const editName = editingSubAgent ? t(editingSubAgent.name, editingSubAgent.nameZh) : t(agent.name, agent.nameZh);
  const editDesc = editingSubAgent
    ? t(editingSubAgent.currentTask, editingSubAgent.currentTaskZh)
    : t(agent.description, agent.descriptionZh);

  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(() => {
    const domainSkills = generatedSkills.filter(s => s.domain === agent.id);
    return new Set(domainSkills.map(s => s.id));
  });
  const [enabledTwins, setEnabledTwins] = useState<Set<string>>(() => new Set((DIGITAL_TWINS[agent.id] || []).map(t => t.name)));
  const [memoryEdits, setMemoryEdits] = useState<Record<string, string>>(() => generateMemory(agent, editingSubAgent, t));

  // Update memory when switching sub-agents
  const switchSubAgent = (sub: SubAgent | undefined) => {
    setEditingSubAgent(sub);
    setMemoryEdits(generateMemory(agent, sub, t));
    setTab('memory');
  };

  const domainSkills = generatedSkills.filter(s => s.domain === agent.id);
  const otherSkills = generatedSkills.filter(s => s.domain !== agent.id);
  const domainTwins = DIGITAL_TWINS[agent.id] || [];
  const domainSops = SOP_TEMPLATES[agent.id] || [];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const toggleSkill = (id: string) => {
    setEnabledSkills(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTwin = (name: string) => {
    setEnabledTwins(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-bg-card shrink-0">
        <button onClick={() => { if (editingSubAgent) { switchSubAgent(undefined); } else { onClose(); } }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-border text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> {t('Back', '返回')}
        </button>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingSubAgent ? 'bg-purple-500/10' : 'bg-accent-cyan/10'}`}>
          {editingSubAgent ? <Wrench className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-accent-cyan" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary truncate">{editName}</h2>
            {editingSubAgent && (
              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded shrink-0">{t('Sub-Agent', '子Agent')}</span>
            )}
          </div>
          <p className="text-xs text-text-muted truncate">{editDesc}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <StatusBadge status={editingSubAgent ? editingSubAgent.status : agent.status} />
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-medium hover:bg-accent-cyan/80 cursor-pointer">
            {saved ? <><Check className="w-3.5 h-3.5" /> {t('Saved', '已保存')}</> : <><Save className="w-3.5 h-3.5" /> {t('Save', '保存')}</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left tabs */}
        <div className="w-44 border-r border-border bg-bg-secondary p-2 shrink-0">
          {EDITOR_TABS.map(tb => {
            const Icon = tb.icon;
            const active = tab === tb.key;
            return (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 cursor-pointer transition-all ${active ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t(tb.label, tb.labelZh)}</span>
              </button>
            );
          })}
          <div className="border-t border-border mt-3 pt-3">
            <div className="px-3 text-[10px] text-text-muted uppercase tracking-wider mb-2">{t('Sub-Agents', '子Agent')}</div>
            {agent.subAgents.map(sub => {
              const isActive = editingSubAgent?.id === sub.id;
              return (
                <button key={sub.id} onClick={() => switchSubAgent(sub)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg mb-0.5 cursor-pointer transition-all ${isActive ? 'bg-purple-500/15 text-purple-400' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}>
                  <StatusBadge status={sub.status} size="sm" />
                  <span className="truncate flex-1 text-left">{t(sub.name, sub.nameZh)}</span>
                  {isActive && <Settings className="w-3 h-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {/* Memory Tab */}
          {tab === 'memory' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">{t('Multi-Layer Memory', '多层记忆体系')}</h3>
                <span className="text-xs text-text-muted ml-2">{t('Harness-style hierarchical memory for Agent context', '类Harness分层记忆，管理Agent上下文')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {MEMORY_LAYERS.map(layer => (
                  <div key={layer.key} className="bg-bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{layer.icon}</span>
                      <div>
                        <h4 className={`text-sm font-medium ${layer.color}`}>{t(layer.labelEn, layer.label)}</h4>
                        <p className="text-[10px] text-text-muted">{t(layer.descEn, layer.desc)}</p>
                      </div>
                    </div>
                    <textarea value={memoryEdits[layer.key] || ''}
                      onChange={e => setMemoryEdits(prev => ({ ...prev, [layer.key]: e.target.value }))}
                      rows={5}
                      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-accent-cyan/50 resize-none leading-relaxed" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {tab === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">{t('Skill Capability', 'Skill能力配置')}</h3>
                <span className="text-xs text-text-muted ml-2">{enabledSkills.size} {t('enabled', '已启用')}</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t(agent.domain + ' Domain Skills', agent.domainZh + '领域Skill')}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {domainSkills.map(skill => {
                    const on = enabledSkills.has(skill.id);
                    return (
                      <div key={skill.id} onClick={() => toggleSkill(skill.id)}
                        className={`bg-bg-card rounded-lg border p-3 cursor-pointer transition-all ${on ? 'border-accent-cyan/40 bg-accent-cyan/5' : 'border-border opacity-60 hover:opacity-100'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${on ? 'bg-accent-cyan border-accent-cyan text-bg-primary' : 'border-border'}`}>
                            {on && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-medium text-text-primary">{t(skill.name, skill.nameZh)}</span>
                        </div>
                        <p className="text-[10px] text-text-muted line-clamp-2 ml-6">{t(skill.description, skill.descriptionZh)}</p>
                        <div className="flex items-center gap-2 ml-6 mt-1">
                          <span className="text-[10px] text-text-muted">{t('Used', '使用')} {skill.usageCount}x</span>
                          <span className="text-[10px] text-status-green">{Math.round(skill.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {otherSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('Cross-Domain Skills', '跨域Skill（可选启用）')}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {otherSkills.map(skill => {
                      const on = enabledSkills.has(skill.id);
                      return (
                        <div key={skill.id} onClick={() => toggleSkill(skill.id)}
                          className={`bg-bg-card rounded-lg border p-2.5 cursor-pointer transition-all ${on ? 'border-accent-cyan/40 bg-accent-cyan/5' : 'border-border opacity-40 hover:opacity-70'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] shrink-0 ${on ? 'bg-accent-cyan border-accent-cyan text-bg-primary' : 'border-border'}`}>
                              {on && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-[10px] font-medium text-text-primary truncate">{t(skill.name, skill.nameZh)}</span>
                          </div>
                          <p className="text-[10px] text-text-muted truncate mt-1 ml-6">{skill.domain}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Tab */}
          {tab === 'sop' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">{t('SOP Processes', 'SOP标准流程')}</h3>
                <span className="text-xs text-text-muted ml-2">{t('Standard operating procedures for this agent', '该Agent的标准操作流程')}</span>
              </div>
              {domainSops.map((sop, i) => (
                <div key={i} className="bg-bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                      <GitBranch className="w-3.5 h-3.5 text-accent-cyan" />
                    </div>
                    <h4 className="text-sm font-medium text-text-primary">{t(sop.nameEn, sop.name)}</h4>
                    <span className="text-[10px] text-status-green bg-status-green/10 px-2 py-0.5 rounded-full ml-auto">{t('Active', '启用中')}</span>
                  </div>
                  <div className="flex items-start gap-0">
                    {(t(sop.stepsEn[0], sop.steps[0]) === sop.stepsEn[0] ? sop.stepsEn : sop.steps).map((step, j) => (
                      <div key={j} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-[10px] font-bold text-accent-cyan shrink-0">{j + 1}</div>
                          <p className="text-[10px] text-text-secondary mt-1.5 text-center w-28 leading-tight">{step}</p>
                        </div>
                        {j < sop.steps.length - 1 && (
                          <div className="w-8 h-px bg-accent-cyan/30 mt-3.5 -mx-1 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border border-dashed border-border rounded-xl text-xs text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors cursor-pointer">
                + {t('Add Custom SOP', '添加自定义SOP')}
              </button>
            </div>
          )}

          {/* Model Tab */}
          {tab === 'model' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">{t('Model Configuration', '模型配置')}</h3>
                <span className="text-xs text-text-muted ml-2">{t('Select the LLM backbone for this agent', '选择该Agent的大模型底座')}</span>
              </div>
              <div className="space-y-2">
                {MODELS.map(model => {
                  const active = selectedModel === model.id;
                  return (
                    <div key={model.id} onClick={() => setSelectedModel(model.id)}
                      className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-all flex items-center gap-4 ${active ? 'border-accent-cyan bg-accent-cyan/5 ring-1 ring-accent-cyan/20' : 'border-border hover:border-accent-cyan/30'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-accent-cyan' : 'border-border'}`}>
                        {active && <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{model.name}</span>
                          {model.id === 'gts-llm' && <span className="text-[10px] bg-status-green/20 text-status-green px-1.5 py-0.5 rounded">{t('Default', '默认')}</span>}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{t(model.descEn, model.desc)}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-accent-cyan shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <div className="bg-bg-card rounded-xl border border-border p-4 mt-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('Inference Parameters', '推理参数')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Temperature', value: '0.3', desc: '低温度保证输出稳定', descEn: 'Low temperature for stable output' },
                    { label: 'Max Tokens', value: '8192', desc: '最大输出长度', descEn: 'Maximum output length' },
                    { label: 'Top-P', value: '0.9', desc: '核采样概率', descEn: 'Nucleus sampling probability' },
                  ].map(param => (
                    <div key={param.label}>
                      <label className="text-[10px] text-text-muted block mb-1">{param.label}</label>
                      <input defaultValue={param.value}
                        className="w-full bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-mono outline-none focus:border-accent-cyan/50" />
                      <p className="text-[10px] text-text-muted mt-0.5">{t(param.descEn, param.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Digital Twin Tab */}
          {tab === 'twin' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">{t('Digital Twin Binding', '数字孪生绑定')}</h3>
                <span className="text-xs text-text-muted ml-2">{t('Domain-specific twin models for simulation & verification', '领域专属孪生模型，用于仿真验证')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {domainTwins.map(twin => {
                  const on = enabledTwins.has(twin.name);
                  return (
                    <div key={twin.name} onClick={() => toggleTwin(twin.name)}
                      className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-all ${on ? 'border-accent-cyan/40 bg-accent-cyan/5' : 'border-border opacity-60 hover:opacity-100'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${on ? 'bg-accent-cyan/20' : 'bg-bg-primary'}`}>
                          <Layers className={`w-5 h-5 ${on ? 'text-accent-cyan' : 'text-text-muted'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{t(twin.nameEn, twin.name)}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-accent-cyan border-accent-cyan text-bg-primary' : 'border-border'}`}>
                              {on && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-text-muted">{t(twin.nameEn, twin.name) === twin.nameEn ? twin.name : twin.nameEn}</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">{t(twin.descEn, twin.desc)}</p>
                      {on && (
                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-status-green" />
                          <span className="text-status-green">{t('Bound & Active', '已绑定·运行中')}</span>
                          <span className="text-text-muted ml-auto">{t('Sync', '同步')}: 2s</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-bg-card rounded-xl border border-border p-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('Twin Usage Statistics', '孪生使用统计')}</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-text-primary">{Math.floor(agent.taskCount * 0.7)}</p>
                    <p className="text-[10px] text-text-muted">{t('Simulations Run', '仿真次数')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-status-green">{agent.successRate}%</p>
                    <p className="text-[10px] text-text-muted">{t('Prediction Accuracy', '预测准确率')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-accent-cyan">{enabledTwins.size}</p>
                    <p className="text-[10px] text-text-muted">{t('Active Twins', '活跃孪生')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Agent domain colors ─── */
const AGENT_COLORS: Record<string, string> = {
  planning: '#f59e0b', optimization: '#3b82f6', experience: '#8b5cf6', ops: '#ef4444', marketing: '#10b981',
};
const AGENT_ICONS: Record<string, string> = {
  planning: '📐', optimization: '⚡', experience: '👤', ops: '🔧', marketing: '📊',
};

/* ─── Agent Topology SVG — Dual Mode (n8n-style) ─── */
type TopoMode = 'direct' | 'hierarchical';

/* n8n-style node sizes */
const NODE_S = 48;   /* square icon node */
const NODE_R = 10;   /* border radius */

/* Shared SVG defs — n8n style */
function TopoDefs() {
  return (
    <defs>
      <filter id="n-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      <filter id="n-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.35" /></filter>
      <linearGradient id="card-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e293b" stopOpacity="0.7" /><stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" /></linearGradient>
    </defs>
  );
}

/* n8n-style square icon node */
function N8nNode({ x, y, icon, label, color = '#64748b', onClick, active }: {
  x: number; y: number; icon: string; label: string; color?: string;
  onClick?: () => void; active?: boolean;
}) {
  const cx = x + NODE_S / 2, cy = y + NODE_S / 2;
  return (
    <g className={onClick ? 'cursor-pointer' : ''} onClick={onClick}>
      <rect x={x} y={y} width={NODE_S} height={NODE_S} rx={NODE_R} fill="#0f172a" stroke={color} strokeWidth={1.5} filter="url(#n-shadow)" />
      {active && <rect x={x} y={y} width={NODE_S} height={NODE_S} rx={NODE_R} fill="none" stroke={color} strokeWidth={2} filter="url(#n-glow)" />}
      <text x={cx} y={cy + 1} fill={color} fontSize="20" textAnchor="middle" dominantBaseline="middle" className="pointer-events-none">{icon}</text>
      <text x={cx} y={y + NODE_S + 14} fill="#94a3b8" fontSize="9" fontWeight={500} textAnchor="middle" className="pointer-events-none">{label}</text>
    </g>
  );
}

/* n8n-style group container — translucent rounded box with title */
function N8nGroup({ x, y, w, h, title, color = '#475569' }: {
  x: number; y: number; w: number; h: number; title: string; color?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="url(#card-bg)" stroke={color} strokeWidth={1} opacity={0.8} />
      <text x={x + 14} y={y + 18} fill="#cbd5e1" fontSize="10" fontWeight={600} className="pointer-events-none">{title}</text>
    </g>
  );
}

/* Connector line with small dots at endpoints */
function N8nLine({ x1, y1, x2, y2, color = '#475569', dashed }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean;
}) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? '4 3' : 'none'} />
      <circle cx={x1} cy={y1} r={3} fill={color} />
      <circle cx={x2} cy={y2} r={3} fill={color} />
    </g>
  );
}

/* Curved connector with dots */
function N8nCurve({ path, color = '#475569', dashed, dots }: {
  path: string; color?: string; dashed?: boolean; dots?: [number, number][];
}) {
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? '4 3' : 'none'} />
      {dots?.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={3} fill={color} />)}
    </g>
  );
}

/* ─── Mode 1: Direct Routing (Classifier-Based) ─── */
function DirectRoutingTopology({ agents, onSelectAgent, onClickConvHistory, onClickMemory, t }: {
  agents: DomainAgent[]; onSelectAgent: (agent: DomainAgent) => void;
  onClickConvHistory: () => void; onClickMemory: () => void;
  t: (en: string, zh: string) => string;
}) {
  const W = 860, H = 420;
  const midY = 150;
  const S = NODE_S;
  /* Agent row across top */
  const agentGap = 16;
  const totalAW = agents.length * S + (agents.length - 1) * agentGap;
  const agentStartX = (W - totalAW) / 2;
  const agentY = 32;
  /* Group around agents */
  const gPad = 20;
  const gX = agentStartX - gPad, gY = agentY - gPad;
  const gW = totalAW + gPad * 2, gH = S + 24 + gPad * 2;
  /* Process nodes */
  const inputX = 60, classX = 220, selX = 380, procX = 540, outX = 700;
  /* Bottom row */
  const botY = 300;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ minHeight: 320 }}>
      <TopoDefs />

      {/* Agent group container */}
      <N8nGroup x={gX} y={gY} w={gW} h={gH} title={t('Domain Agents', '领域Agent')} color="#8b5cf6" />

      {/* Agent nodes */}
      {agents.map((a, i) => {
        const x = agentStartX + i * (S + agentGap);
        return <N8nNode key={a.id} x={x} y={agentY} icon={AGENT_ICONS[a.id] || '🤖'} label={t(a.domain, a.domainZh)} color={AGENT_COLORS[a.id] || '#8b5cf6'} onClick={() => onSelectAgent(a)} />;
      })}

      {/* Main processing flow: Input → Classifier → Select → Process → Output */}
      <N8nNode x={inputX} y={midY} icon="💬" label={t('User Input', '用户输入')} color="#64748b" />
      <N8nNode x={classX} y={midY} icon="🔀" label={t('Classifier', '分类器')} color="#10b981" active />
      <N8nNode x={selX} y={midY} icon="☑️" label={t('Select Agent', '选择Agent')} color="#8b5cf6" />
      <N8nNode x={procX} y={midY} icon="⚙️" label={t('Agent Processing', 'Agent处理')} color="#06b6d4" active />
      <N8nNode x={outX} y={midY} icon="📤" label={t('Response', '响应')} color="#64748b" />

      {/* Flow connectors (horizontal) */}
      <N8nLine x1={inputX + S} y1={midY + S / 2} x2={classX} y2={midY + S / 2} color="#475569" />
      <N8nLine x1={classX + S} y1={midY + S / 2} x2={selX} y2={midY + S / 2} color="#10b981" />
      <N8nLine x1={selX + S} y1={midY + S / 2} x2={procX} y2={midY + S / 2} color="#8b5cf6" />
      <N8nLine x1={procX + S} y1={midY + S / 2} x2={outX} y2={midY + S / 2} color="#06b6d4" />

      {/* Classifier → agent group (curved up) */}
      <N8nCurve
        path={`M ${classX + S / 2} ${midY} Q ${classX + S / 2} ${gY + gH + 10}, ${gX + 30} ${gY + gH}`}
        color="#10b981" dashed
        dots={[[classX + S / 2, midY], [gX + 30, gY + gH]]}
      />
      <text x={gX + 36} y={gY + gH + 14} fill="#64748b" fontSize="8">{t('Fetch characteristics', '获取特征')}</text>

      {/* Select Agent ↔ agent group (vertical) */}
      <N8nLine x1={selX + S / 2} y1={midY} x2={selX + S / 2} y2={gY + gH} color="#8b5cf6" dashed />

      {/* Agent Processing ↔ agent group */}
      <N8nCurve
        path={`M ${procX + S / 2} ${midY} Q ${procX + S / 2} ${gY + gH + 10}, ${gX + gW - 30} ${gY + gH}`}
        color="#06b6d4" dashed
        dots={[[procX + S / 2, midY], [gX + gW - 30, gY + gH]]}
      />

      {/* Bottom: Conversation History & Memory */}
      <N8nGroup x={classX - 30} y={botY - 16} w={220} h={78} title={t('Conversation History', '会话历史')} color="#8b5cf6" />
      <g className="cursor-pointer" onClick={onClickConvHistory}>
        <N8nNode x={classX + 20} y={botY + 6} icon="💬" label={t('View Context', '查看上下文')} color="#8b5cf6" />
      </g>
      <g className="cursor-pointer" onClick={onClickConvHistory}>
        <N8nNode x={classX + 100} y={botY + 6} icon="📋" label={t('History Log', '历史记录')} color="#8b5cf6" />
      </g>

      {/* Classifier → Conversation History */}
      <N8nLine x1={classX + S / 2} y1={midY + S} x2={classX + S / 2} y2={botY - 16} color="#475569" dashed />
      {/* Agent Processing → Conversation History */}
      <N8nCurve
        path={`M ${procX + S / 2} ${midY + S} Q ${procX + S / 2} ${botY + 20}, ${classX + 190} ${botY + 20}`}
        color="#475569" dashed
        dots={[[procX + S / 2, midY + S], [classX + 190, botY + 20]]}
      />

      {/* Memory */}
      <N8nGroup x={procX + 20} y={botY - 16} w={160} h={78} title={t('Memory', '记忆库')} color="#f59e0b" />
      <g className="cursor-pointer" onClick={onClickMemory}>
        <N8nNode x={procX + 60} y={botY + 6} icon="🧠" label={t('Knowledge Base', '知识库')} color="#f59e0b" />
      </g>

      {/* Agent Processing → Memory */}
      <N8nLine x1={procX + S} y1={midY + S} x2={procX + 80} y2={botY - 16} color="#f59e0b" dashed />
    </svg>
  );
}

/* ─── Mode 2: Hierarchical Teams (Supervisor) ─── */
function HierarchicalTopology({ agents, onSelectAgent, onClickMemory, t }: {
  agents: DomainAgent[]; onSelectAgent: (agent: DomainAgent) => void;
  onClickMemory: () => void; t: (en: string, zh: string) => string;
}) {
  const W = 860, H = 420;
  const S = NODE_S;
  /* Supervisor group (left) */
  const supGX = 40, supGY = 30, supGW = 200, supGH = 240;
  const supX = supGX + 76, supY = supGY + 50;
  /* Input/Output */
  const inputY = supGY + 130, outputY = supGY + 190;
  /* Team groups (right side — 3 rows of sub-agent groups) */
  const teamBaseX = 310;
  /* Each agent gets a group container with the agent node + tool nodes */
  const agGroupW = 240, agGroupH = 90, agGroupGap = 10;
  /* Two columns of agent groups */
  const col1X = teamBaseX, col2X = teamBaseX + agGroupW + agGroupGap;
  const row1Y = 18, row2Y = row1Y + agGroupH + agGroupGap, row3Y = row2Y + agGroupH + agGroupGap;
  const agentGroupPos = [
    { x: col1X, y: row1Y },
    { x: col2X, y: row1Y },
    { x: col1X, y: row2Y },
    { x: col2X, y: row2Y },
    { x: col1X, y: row3Y },
  ];
  /* Tool icons per agent */
  const AGENT_TOOLS: Record<string, string[]> = {
    planning: ['📡', '📊', '🗺️'],
    optimization: ['⚡', '📈', '🔧'],
    experience: ['👤', '📱', '💡'],
    ops: ['🔧', '🚨', '📋'],
    marketing: ['📊', '🎯', '💰'],
  };
  /* Memory row */
  const memY = 350;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ minHeight: 340 }}>
      <TopoDefs />

      {/* Supervisor group */}
      <N8nGroup x={supGX} y={supGY} w={supGW} h={supGH} title="IOE-Supervisor" color="#06b6d4" />
      <N8nNode x={supX} y={supY} icon="👑" label="Supervisor" color="#06b6d4" active />
      <N8nNode x={supGX + 20} y={inputY} icon="💬" label={t('Input', '输入')} color="#64748b" />
      <N8nNode x={supGX + 132} y={outputY} icon="📤" label={t('Output', '输出')} color="#64748b" />

      {/* Input → Supervisor → Output flow */}
      <N8nLine x1={supGX + 20 + S / 2} y1={inputY} x2={supX + S / 2} y2={supY + S} color="#475569" />
      <N8nLine x1={supX + S / 2} y1={supY + S} x2={supGX + 132 + S / 2} y2={outputY} color="#475569" />

      {/* Agent sub-groups */}
      {agents.map((a, i) => {
        const pos = agentGroupPos[i];
        if (!pos) return null;
        const tools = AGENT_TOOLS[a.id] || ['🔧', '📊', '💡'];
        const agNodeX = pos.x + 14, agNodeY = pos.y + 28;
        return (
          <g key={a.id}>
            {/* Group container */}
            <N8nGroup x={pos.x} y={pos.y} w={agGroupW} h={agGroupH} title={t(a.domain, a.domainZh) + ' Agent'} color={AGENT_COLORS[a.id] || '#8b5cf6'} />
            {/* Main agent node */}
            <N8nNode x={agNodeX} y={agNodeY} icon={AGENT_ICONS[a.id] || '🤖'} label={t(a.domain, a.domainZh)} color={AGENT_COLORS[a.id] || '#8b5cf6'} onClick={() => onSelectAgent(a)} />
            {/* Tool nodes */}
            {tools.map((tool, ti) => {
              const toolX = agNodeX + 70 + ti * 46;
              return (
                <g key={ti}>
                  <N8nNode x={toolX} y={agNodeY} icon={tool} label="" color="#475569" />
                  <N8nLine x1={toolX > agNodeX + 70 ? toolX : agNodeX + S} y1={agNodeY + S / 2} x2={toolX > agNodeX + 70 ? toolX : toolX + S} y2={agNodeY + S / 2} color="#334155" />
                </g>
              );
            })}
            {/* Connect first tool to agent node */}
            <N8nLine x1={agNodeX + S} y1={agNodeY + S / 2} x2={agNodeX + 70} y2={agNodeY + S / 2} color={AGENT_COLORS[a.id] || '#8b5cf6'} />
          </g>
        );
      })}

      {/* Supervisor → each agent group (fan-out lines) */}
      {agents.map((a, i) => {
        const pos = agentGroupPos[i];
        if (!pos) return null;
        const fromX = supGX + supGW, fromY = supY + S / 2;
        const toX = pos.x, toY = pos.y + agGroupH / 2;
        return (
          <N8nCurve key={`s-${a.id}`}
            path={`M ${fromX} ${fromY} C ${fromX + 40} ${fromY}, ${toX - 40} ${toY}, ${toX} ${toY}`}
            color="#06b6d4" dashed
            dots={[[fromX, fromY], [toX, toY]]}
          />
        );
      })}

      {/* Memory section */}
      <N8nGroup x={supGX} y={memY} w={180} h={60} title={t('Memory', '记忆库')} color="#f59e0b" />
      <g className="cursor-pointer" onClick={onClickMemory}>
        <N8nNode x={supGX + 20} y={memY + 10} icon="🧠" label={t('Short-term', '短期记忆')} color="#f59e0b" />
      </g>
      <g className="cursor-pointer" onClick={onClickMemory}>
        <N8nNode x={supGX + 100} y={memY + 10} icon="🗄️" label={t('Long-term', '长期记忆')} color="#f59e0b" />
      </g>
      <N8nLine x1={supGX + 20 + S / 2} y1={memY + 10} x2={supGX + 20 + S / 2} y2={supGY + supGH} color="#f59e0b" dashed />
      <N8nLine x1={supGX + 100 + S / 2} y1={memY + 10} x2={supGX + supGW / 2 + 30} y2={supGY + supGH} color="#f59e0b" dashed />

      <N8nGroup x={teamBaseX} y={memY} w={200} h={60} title={t('Shared Context', '共享上下文')} color="#8b5cf6" />
      <g className="cursor-pointer" onClick={onClickMemory}>
        <N8nNode x={teamBaseX + 30} y={memY + 10} icon="🔗" label={t('Context Pool', '上下文池')} color="#8b5cf6" />
      </g>
      <g className="cursor-pointer" onClick={onClickMemory}>
        <N8nNode x={teamBaseX + 110} y={memY + 10} icon="📚" label={t('Knowledge', '知识库')} color="#8b5cf6" />
      </g>
      <N8nLine x1={teamBaseX + 30 + S / 2} y1={memY + 10} x2={col1X + agGroupW / 2} y2={row3Y + agGroupH} color="#8b5cf6" dashed />
    </svg>
  );
}

/* ─── Team panel tabs ─── */
const TEAM_TABS = [
  { key: 'activity' as const, label: 'Agent Activity', labelZh: 'Agent活动', icon: Activity },
  { key: 'context' as const, label: 'Context Pool', labelZh: '上下文池', icon: Share2 },
  { key: 'conflicts' as const, label: 'Conflicts', labelZh: '冲突协调', icon: AlertTriangle },
] as const;
type TeamTab = typeof TEAM_TABS[number]['key'];

const EVENT_ICONS: Record<string, string> = {
  delegation: '📋', 'context-sync': '🔄', conflict: '⚠️', resolution: '✅', completion: '🎯', escalation: '🚨',
};
const EVENT_COLORS: Record<string, string> = {
  delegation: 'border-accent-cyan/40', 'context-sync': 'border-purple-500/40', conflict: 'border-status-yellow/40',
  resolution: 'border-status-green/40', completion: 'border-status-green/40', escalation: 'border-status-red/40',
};

const DECISION_LABELS: Record<string, { en: string; zh: string; color: string }> = {
  'priority-override': { en: 'Priority Override', zh: '优先级覆盖', color: 'bg-status-orange/20 text-status-orange' },
  'parameter-merge': { en: 'Parameter Merge', zh: '参数融合', color: 'bg-accent-cyan/20 text-accent-cyan' },
  'sequential-execution': { en: 'Sequential Exec', zh: '顺序执行', color: 'bg-purple-500/20 text-purple-400' },
  'rollback': { en: 'Rollback', zh: '回滚', color: 'bg-status-red/20 text-status-red' },
};

function AgentBadge({ agentId, agents, t }: { agentId: string; agents: DomainAgent[]; t: (en: string, zh: string) => string }) {
  if (agentId === 'ioe-supervisor') return <span className="text-[9px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded">Supervisor</span>;
  const a = agents.find(x => x.id === agentId);
  const color = AGENT_COLORS[agentId] || '#06b6d4';
  return <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>{a ? t(a.domain, a.domainZh) : agentId}</span>;
}

/* ─── Main export ─── */
export default function Agents() {
  const { t } = useText();
  const navigate = useNavigate();
  const { scenario } = useScenario();
  const domainAgents = scenario?.agents ?? defaultAgents;
  const supervisor = scenario?.supervisor ?? defaultSupervisor;
  const collaborationEvents = scenario?.collaborationEvents ?? defaultCollaborationEvents;
  const sharedContext = scenario?.sharedContext ?? defaultSharedContext;
  const conflictResolutions = scenario?.conflictResolutions ?? defaultConflictResolutions;

  const [editingAgent, setEditingAgent] = useState<DomainAgent | null>(null);
  const [editingSubAgent, setEditingSubAgent] = useState<SubAgent | undefined>(undefined);
  const [teamTab, setTeamTab] = useState<TeamTab>('activity');
  const [eventTick, setEventTick] = useState(0);
  const [topoMode, setTopoMode] = useState<TopoMode>('hierarchical');

  // Animate event feed
  useEffect(() => {
    const iv = setInterval(() => setEventTick(p => p + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const totalSubAgents = domainAgents.reduce((sum, a) => sum + a.subAgents.length, 0);
  const visibleEvents = collaborationEvents.slice(0, Math.min(collaborationEvents.length, 3 + (eventTick % (collaborationEvents.length - 2))));

  // Full-page drill-down editor
  if (editingAgent) {
    return <AgentEditor agent={editingAgent} subAgent={editingSubAgent} onClose={() => { setEditingAgent(null); setEditingSubAgent(undefined); }} />;
  }

  return (
    <div className="p-4 overflow-auto h-full space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Multi-Agent Team', '多智能体团队')}</h1>
          <p className="text-xs text-text-muted mt-0.5">1 Supervisor · {domainAgents.length} {t('domain agents', '领域Agent')} · {totalSubAgents} {t('sub-agents', '子Agent')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-muted">{t('Protocol', '协议')}: <span className="text-accent-cyan font-mono">A2A-T v2.1</span></span>
          <span className="text-text-muted">{t('Uptime', '在线率')}: <span className="text-status-green">{supervisor.uptime}</span></span>
        </div>
      </div>

      {/* ─── Supervisor Strip ─── */}
      <div className="bg-bg-card rounded-xl border border-accent-cyan/20 p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-accent-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">{supervisor.name}</h2>
              <StatusBadge status={supervisor.status === 'emergency' ? 'error' : 'active'} />
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${supervisor.mode === 'emergency' ? 'bg-status-red/20 text-status-red' : 'bg-status-green/20 text-status-green'}`}>
                {supervisor.mode === 'emergency' ? t('EMERGENCY MODE', '紧急模式') : t('ROUTINE MODE', '日常模式')}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 truncate">{t(supervisor.activePlan, supervisor.activePlanZh)}</p>
          </div>
          <div className="flex items-center gap-6 text-center text-xs shrink-0">
            <div><p className="text-base font-semibold text-text-primary tabular-nums">{supervisor.tasksCoordinated.toLocaleString()}</p><p className="text-text-muted">{t('Tasks Coord.', '协调任务')}</p></div>
            <div><p className="text-base font-semibold text-accent-cyan tabular-nums">{supervisor.contextSyncs.toLocaleString()}</p><p className="text-text-muted">{t('Context Syncs', '上下文同步')}</p></div>
            <div><p className="text-base font-semibold text-status-yellow tabular-nums">{supervisor.conflictsResolved}</p><p className="text-text-muted">{t('Conflicts', '冲突解决')}</p></div>
          </div>
        </div>
      </div>

      {/* ─── Main: Agent Topology + Team Panel ─── */}
      <div className="flex gap-4" style={{ minHeight: 420 }}>
        {/* Left: SVG topology */}
        <div className="flex-1 bg-bg-card rounded-xl border border-border overflow-hidden relative min-w-0">
          {/* Mode toggle header */}
          <div className="absolute top-3 left-4 right-4 z-10 flex items-center gap-3">
            <Radio className="w-4 h-4 text-accent-cyan shrink-0" />
            <span className="text-xs font-medium text-text-secondary">{t('Agent Topology', 'Agent拓扑')}</span>
            <div className="ml-auto flex items-center bg-bg-primary rounded-lg border border-border overflow-hidden">
              <button onClick={() => setTopoMode('direct')}
                className={`px-3 py-1.5 text-[10px] font-medium cursor-pointer transition-all ${topoMode === 'direct' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}>
                {t('Direct Routing', '直接路由')}
              </button>
              <button onClick={() => setTopoMode('hierarchical')}
                className={`px-3 py-1.5 text-[10px] font-medium cursor-pointer transition-all ${topoMode === 'hierarchical' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}>
                {t('Hierarchical Teams', '层级团队')}
              </button>
            </div>
          </div>
          <div className="pt-8">
            {topoMode === 'direct'
              ? <DirectRoutingTopology agents={domainAgents} onSelectAgent={(a) => { setEditingAgent(a); setEditingSubAgent(undefined); }} onClickConvHistory={() => setTeamTab('context')} onClickMemory={() => navigate('/knowledge')} t={t} />
              : <HierarchicalTopology agents={domainAgents} onSelectAgent={(a) => { setEditingAgent(a); setEditingSubAgent(undefined); }} onClickMemory={() => navigate('/knowledge')} t={t} />
            }
          </div>
          {/* Legend */}
          <div className="absolute bottom-3 left-4 flex items-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-accent-cyan inline-block" /> {t('A2A-T Link', 'A2A-T链路')}</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-purple-500/40 inline-block" style={{ borderTop: '1px dashed' }} /> {t('Peer Collab', '对等协作')}</span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-status-green inline-block dot-pulse" /> {t('Active', '活跃')}
            </span>
          </div>
        </div>

        {/* Right: Team panel */}
        <div className="w-[380px] bg-bg-card rounded-xl border border-border flex flex-col overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {TEAM_TABS.map(tb => {
              const Icon = tb.icon;
              return (
                <button key={tb.key} onClick={() => setTeamTab(tb.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs cursor-pointer transition-all ${teamTab === tb.key ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}>
                  <Icon className="w-3.5 h-3.5" />{t(tb.label, tb.labelZh)}
                </button>
              );
            })}
          </div>

          <div className="p-3" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {/* Activity Feed */}
            {teamTab === 'activity' && (
              <div className="space-y-2">
                {visibleEvents.map(evt => (
                  <div key={evt.id} className={`bg-bg-primary rounded-lg border-l-2 ${EVENT_COLORS[evt.type] || 'border-border'} p-2.5`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{EVENT_ICONS[evt.type]}</span>
                      <span className="text-[10px] text-text-muted font-mono">{evt.timestamp}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {evt.agents.slice(0, 3).map(aid => <AgentBadge key={aid} agentId={aid} agents={domainAgents} t={t} />)}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{t(evt.description, evt.descriptionZh)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Context Pool */}
            {teamTab === 'context' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-4 h-4 text-accent-cyan" />
                  <span className="text-xs font-medium text-text-secondary">{t('Shared Context Pool', '共享上下文池')}</span>
                  <span className="text-[10px] text-text-muted ml-auto">{sharedContext.length} {t('entries', '条目')}</span>
                </div>
                {sharedContext.map(sc => (
                  <div key={sc.id} className="bg-bg-primary rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-text-primary">{t(sc.key, sc.keyZh)}</span>
                      <span className="text-[10px] text-text-muted ml-auto font-mono">{sc.updatedAt}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mb-1.5">{t(sc.value, sc.valueZh)}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] text-text-muted">{t('Source', '来源')}:</span>
                      <AgentBadge agentId={sc.source} agents={domainAgents} t={t} />
                      <span className="text-[9px] text-text-muted ml-1">→</span>
                      {sc.consumers.map(c => <AgentBadge key={c} agentId={c} agents={domainAgents} t={t} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Conflict Resolution */}
            {teamTab === 'conflicts' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-status-yellow" />
                  <span className="text-xs font-medium text-text-secondary">{t('Supervisor Conflict Resolution', 'Supervisor冲突协调')}</span>
                </div>
                {conflictResolutions.map(cr => {
                  const dec = DECISION_LABELS[cr.decision];
                  return (
                    <div key={cr.id} className="bg-bg-primary rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-text-muted font-mono">{cr.timestamp}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${dec?.color || ''}`}>{dec ? t(dec.en, dec.zh) : cr.decision}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5">
                        {cr.conflictingAgents.map(aid => <AgentBadge key={aid} agentId={aid} agents={domainAgents} t={t} />)}
                        <ArrowRightLeft className="w-3 h-3 text-status-yellow mx-1" />
                        <span className="text-[10px] text-status-yellow">{t('Conflict', '冲突')}</span>
                      </div>
                      <p className="text-xs text-text-muted mb-1.5">{t(cr.issue, cr.issueZh)}</p>
                      <div className="bg-status-green/5 border border-status-green/20 rounded p-2">
                        <p className="text-xs text-status-green"><span className="font-medium">{t('Resolution', '决策')}:</span> {t(cr.resolution, cr.resolutionZh)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Domain Agent Grid ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">{t('Domain Agents', '领域Agent')}</span>
          <span className="text-xs text-text-muted">— {t('click to configure', '点击配置')}</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {domainAgents.map(agent => {
            const color = AGENT_COLORS[agent.id] || '#06b6d4';
            const activeSubCount = agent.subAgents.filter(s => s.status === 'active').length;
            return (
              <div key={agent.id} onClick={() => { setEditingAgent(agent); setEditingSubAgent(undefined); }}
                className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/40 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}>
                    <span className="text-sm">{AGENT_ICONS[agent.id]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-text-primary truncate">{t(agent.name, agent.nameZh)}</h3>
                    </div>
                    <StatusBadge status={agent.status} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] mb-2">
                  <div className="flex justify-between"><span className="text-text-muted">{t('Tasks', '任务')}</span><span className="text-text-secondary tabular-nums">{agent.taskCount}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Success', '成功')}</span><span className="text-status-green tabular-nums">{agent.successRate}%</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Subs', '子Agent')}</span><span className="text-text-secondary">{activeSubCount}/{agent.subAgents.length}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Perm', '权限')}</span><span className="text-text-secondary">L{Math.max(...agent.subAgents.map(s => s.permissionLevel))}</span></div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-3 h-3" /> {t('Configure', '配置')} <ChevronRight className="w-3 h-3 ml-auto" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
