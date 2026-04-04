import { useState } from 'react';
import { Bot, ChevronDown, ChevronRight, Shield, Wrench, BarChart3, Save, Settings, Brain, BookOpen, GitBranch, Cpu, Layers, Check, ArrowLeft, Eye } from 'lucide-react';
import { useText } from '../hooks/useText';
import { domainAgents, type DomainAgent } from '../data/agents';
import { generatedSkills } from '../data/knowledge';
import StatusBadge from '../components/StatusBadge';

/* ─── Agent config data ─── */

const MODELS = [
  { id: 'gts-llm', name: 'GTS-LLM', desc: '电信专用大模型 · 718B参数 · 全能力', descEn: 'Telecom LLM · 718B params · Full capability' },
  { id: 'pangu-72b', name: 'PanGu-Telecom-72B', desc: '盘古电信 · 72B参数 · 推理增强', descEn: 'PanGu Telecom · 72B · Reasoning-enhanced' },
  { id: 'pangu-7b', name: 'PanGu-Telecom-7B', desc: '盘古电信 · 7B参数 · 轻量快速', descEn: 'PanGu Telecom · 7B · Lightweight fast' },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', desc: '通用大模型 · MoE架构 · 开源', descEn: 'General LLM · MoE · Open-source' },
  { id: 'qwen-72b', name: 'Qwen-72B', desc: '通义千问 · 72B · 多语言', descEn: 'Qwen · 72B · Multilingual' },
];

const DIGITAL_TWINS: Record<string, { name: string; nameEn: string; desc: string }[]> = {
  planning: [
    { name: '覆盖孪生', nameEn: 'Coverage Twin', desc: '覆盖仿真·信号预测·盲区识别' },
    { name: '容量孪生', nameEn: 'Capacity Twin', desc: '容量规划·用户密度·频谱效率' },
    { name: '价值孪生', nameEn: 'Value Twin', desc: '价值用户分布·收益预测' },
  ],
  optimization: [
    { name: '无线孪生', nameEn: 'Radio Twin', desc: '无线参数仿真·KPI预测' },
    { name: '干扰孪生', nameEn: 'Interference Twin', desc: '干扰分析·频率规划' },
    { name: '负荷孪生', nameEn: 'Load Twin', desc: '负荷均衡·流量预测' },
  ],
  experience: [
    { name: '用户孪生', nameEn: 'User Twin', desc: 'LUM模型·行为预测·体验画像' },
    { name: '业务孪生', nameEn: 'Service Twin', desc: '业务质量建模·端到端体验' },
  ],
  ops: [
    { name: '设备孪生', nameEn: 'Equipment Twin', desc: '网元健康·寿命预测·告警关联' },
    { name: '传输孪生', nameEn: 'Transport Twin', desc: '光路仿真·链路冗余' },
    { name: '站点孪生', nameEn: 'Site Twin', desc: '站点3D建模·上站辅助' },
  ],
  marketing: [
    { name: '用户画像孪生', nameEn: 'Profile Twin', desc: '360°画像·消费行为·偏好' },
    { name: '市场孪生', nameEn: 'Market Twin', desc: '竞争分析·套餐收益仿真' },
  ],
};

const MEMORY_LAYERS = [
  { key: 'system', label: '系统记忆', labelEn: 'System Memory', icon: '🏛️', desc: '全局规则/安全边界/操作规范', descEn: 'Global rules, safety boundaries, operational standards', color: 'text-status-red' },
  { key: 'domain', label: '领域记忆', labelEn: 'Domain Memory', icon: '🧠', desc: '领域知识/专业经验/最佳实践', descEn: 'Domain knowledge, expertise, best practices', color: 'text-accent-cyan' },
  { key: 'session', label: '会话记忆', labelEn: 'Session Memory', icon: '💬', desc: '当前任务上下文/操作历史', descEn: 'Current task context, action history', color: 'text-status-green' },
  { key: 'episode', label: '情景记忆', labelEn: 'Episode Memory', icon: '📖', desc: '历史案例/故障经验/成功模式', descEn: 'Historical cases, fault experiences, success patterns', color: 'text-status-yellow' },
];

const SOP_TEMPLATES: Record<string, { name: string; steps: string[] }[]> = {
  planning: [
    { name: '新站规划SOP', steps: ['需求分析→价值评估', '覆盖仿真→容量仿真', '投资收益预估', '方案评审→输出规划'] },
    { name: '扩容评估SOP', steps: ['容量预警触发', '话务增长预测', '扩容方案生成', 'ROI对比→决策'] },
  ],
  optimization: [
    { name: '全网优化SOP', steps: ['KPI采集→基线对比', '问题小区识别', '参数优化→仿真验证', '批量下发→效果跟踪'] },
    { name: '新站优化SOP', steps: ['开通验证→覆盖测试', '邻区/切换优化', '参数精调→性能达标', '转入日常优化'] },
  ],
  experience: [
    { name: '投诉处理SOP', steps: ['投诉接收→用户画像', '体验指标分析', '问题定位→协同修复', '用户回访→闭环'] },
    { name: '确定性体验SOP', steps: ['用户等级判定', '资源预留→QoS配置', '实时监控→动态调整', '体验达标验证'] },
  ],
  ops: [
    { name: '故障处理SOP', steps: ['告警接收→分类分级', '根因分析→影响评估', '修复执行→安全验证', '工单闭环→知识沉淀'] },
    { name: '巡检SOP', steps: ['定时触发→分区巡检', '健康评分→风险识别', '预防性维护→汇总报告'] },
  ],
  marketing: [
    { name: '精准营销SOP', steps: ['目标市场分析', '潜客筛选→分层', '个性化方案→触达', '效果监控→策略迭代'] },
    { name: '离网维挽SOP', steps: ['流失预警→原因分析', '挽留策略制定', '触达执行→效果跟踪', '成功/失败归档'] },
  ],
};

function PermissionBadge({ level }: { level: number }) {
  const colors = ['', 'bg-status-green/20 text-status-green border-status-green/30', 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30', 'bg-status-yellow/20 text-status-yellow border-status-yellow/30', 'bg-status-orange/20 text-status-orange border-status-orange/30', 'bg-status-red/20 text-status-red border-status-red/30'];
  return <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors[level]}`}>L{level}</span>;
}

/* ─── Agent Editor (Full-page drill-down) ─── */

const EDITOR_TABS = [
  { key: 'memory', label: 'Memory', labelZh: '记忆', icon: Brain },
  { key: 'skills', label: 'Skills', labelZh: 'Skill能力', icon: BookOpen },
  { key: 'sop', label: 'SOP', labelZh: 'SOP流程', icon: GitBranch },
  { key: 'model', label: 'Model', labelZh: '模型', icon: Cpu },
  { key: 'twin', label: 'Digital Twin', labelZh: '数字孪生', icon: Layers },
] as const;

type EditorTab = typeof EDITOR_TABS[number]['key'];

function AgentEditor({ agent, onClose }: { agent: DomainAgent; onClose: () => void }) {
  const { t } = useText();
  const [tab, setTab] = useState<EditorTab>('memory');
  const [selectedModel, setSelectedModel] = useState('gts-llm');
  const [saved, setSaved] = useState(false);
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(() => {
    const domainSkills = generatedSkills.filter(s => s.domain === agent.id);
    return new Set(domainSkills.map(s => s.id));
  });
  const [enabledTwins, setEnabledTwins] = useState<Set<string>>(() => new Set((DIGITAL_TWINS[agent.id] || []).map(t => t.name)));
  const [memoryEdits, setMemoryEdits] = useState<Record<string, string>>({
    system: '# 安全边界\n- 禁止高峰期（9:00-22:00）执行核心网重启\n- 参数调整范围不超过基线±30%\n- L4+操作需人工审批\n\n# 操作规范\n- 所有操作需数字孪生预验证\n- 修复后自动验证KPI恢复',
    domain: `# ${t(agent.name, agent.nameZh)} 领域知识\n- 华为设备MML命令集\n- 3GPP TS 28.xxx/TS 32.xxx标准\n- 历史故障案例库（${agent.taskCount}+条）\n- ${t(agent.domain, agent.domainZh)}最佳实践文档`,
    session: '# 当前会话上下文\n（运行时自动填充）\n- 当前任务链\n- 操作历史\n- 中间结果缓存',
    episode: `# 历史情景\n- 成功案例：${Math.floor(agent.taskCount * agent.successRate / 100)}条\n- 失败案例：${Math.floor(agent.taskCount * (100 - agent.successRate) / 100)}条\n- 自动从知识库同步更新`,
  });

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
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-border text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> {t('Back', '返回')}
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center"><Bot className="w-4 h-4 text-accent-cyan" /></div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{t(agent.name, agent.nameZh)}</h2>
          <p className="text-xs text-text-muted">{t(agent.description, agent.descriptionZh)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={agent.status} />
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
            {agent.subAgents.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary">
                <StatusBadge status={sub.status} size="sm" />
                <span className="truncate">{t(sub.name, sub.nameZh)}</span>
              </div>
            ))}
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
                    <h4 className="text-sm font-medium text-text-primary">{sop.name}</h4>
                    <span className="text-[10px] text-status-green bg-status-green/10 px-2 py-0.5 rounded-full ml-auto">{t('Active', '启用中')}</span>
                  </div>
                  <div className="flex items-start gap-0">
                    {sop.steps.map((step, j) => (
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
                    { label: 'Temperature', value: '0.3', desc: '低温度保证输出稳定' },
                    { label: 'Max Tokens', value: '8192', desc: '最大输出长度' },
                    { label: 'Top-P', value: '0.9', desc: '核采样概率' },
                  ].map(param => (
                    <div key={param.label}>
                      <label className="text-[10px] text-text-muted block mb-1">{param.label}</label>
                      <input defaultValue={param.value}
                        className="w-full bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-mono outline-none focus:border-accent-cyan/50" />
                      <p className="text-[10px] text-text-muted mt-0.5">{param.desc}</p>
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
                            <span className="text-sm font-medium text-text-primary">{twin.name}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-accent-cyan border-accent-cyan text-bg-primary' : 'border-border'}`}>
                              {on && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-text-muted">{twin.nameEn}</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">{twin.desc}</p>
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

function AgentCard({ agent, onEdit }: { agent: DomainAgent; onEdit: (agent: DomainAgent) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useText();

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden hover:border-accent-cyan/30 transition-all">
      <div className="flex items-center">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left px-5 py-4 flex items-center gap-4 cursor-pointer min-w-0">
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0"><Bot className="w-5 h-5 text-accent-cyan" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary truncate">{t(agent.name, agent.nameZh)}</h3>
              <StatusBadge status={agent.status} />
            </div>
            <p className="text-xs text-text-muted mt-0.5 truncate">{t(agent.description, agent.descriptionZh)}</p>
          </div>
        </button>
        <div className="flex items-center gap-5 text-xs text-text-secondary shrink-0 pr-2">
          <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.taskCount}</p><p className="text-text-muted">{t('Tasks', '任务')}</p></div>
          <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.successRate}%</p><p className="text-text-muted">{t('Success', '成功率')}</p></div>
          <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.subAgents.length}</p><p className="text-text-muted">{t('Sub-agents', '子Agent')}</p></div>
          <button onClick={() => setExpanded(!expanded)} className="cursor-pointer text-text-muted hover:text-text-primary">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
            className="px-2 py-2 text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-colors cursor-pointer" title={t('Edit Agent', '编辑Agent')}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {agent.subAgents.map(sub => (
            <div key={sub.id} className="px-5 py-3 flex items-center gap-4 hover:bg-bg-hover/50 transition-colors group">
              <div className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center"><Wrench className="w-3.5 h-3.5 text-text-muted" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary">{t(sub.name, sub.nameZh)}</span>
                  <StatusBadge status={sub.status} />
                  <PermissionBadge level={sub.permissionLevel} />
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{t(sub.currentTask, sub.currentTaskZh)}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                <div className="flex items-center gap-1"><Wrench className="w-3 h-3" /><span>{sub.toolCalls.toLocaleString()}</span></div>
                <div className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /><span>{sub.successRate}%</span></div>
                <div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>L{sub.permissionLevel}</span></div>
              </div>
            </div>
          ))}
          {/* Quick-edit button at bottom of expanded panel */}
          <div className="px-5 py-2.5 flex justify-center">
            <button onClick={() => onEdit(agent)}
              className="flex items-center gap-1.5 text-xs text-accent-cyan hover:text-accent-cyan/80 cursor-pointer">
              <Eye className="w-3.5 h-3.5" /> {t('Open Editor — Memory / Skills / SOP / Model / Twin', '打开编辑器 — 记忆 / Skill / SOP / 模型 / 孪生')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const { t } = useText();
  const [editingAgent, setEditingAgent] = useState<DomainAgent | null>(null);
  const totalAgents = domainAgents.length;
  const totalSubAgents = domainAgents.reduce((sum, a) => sum + a.subAgents.length, 0);

  // Full-page drill-down editor
  if (editingAgent) {
    return <AgentEditor agent={editingAgent} onClose={() => setEditingAgent(null)} />;
  }

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Agent Management', '智能体管理')}</h1>
          <p className="text-xs text-text-muted mt-0.5">{totalAgents} {t('domain agents', '领域Agent')} · {totalSubAgents} {t('sub-agents', '子Agent')}</p>
        </div>
        <div className="flex items-center gap-3">
          {['active', 'warning', 'error', 'idle'].map(status => {
            const count = domainAgents.filter(a => a.status === status).length;
            if (count === 0) return null;
            return (<div key={status} className="flex items-center gap-1.5 text-xs text-text-secondary"><StatusBadge status={status as 'active'} /><span>{count} {status}</span></div>);
          })}
        </div>
      </div>
      <div className="space-y-3">
        {domainAgents.map(agent => <AgentCard key={agent.id} agent={agent} onEdit={setEditingAgent} />)}
      </div>
    </div>
  );
}
