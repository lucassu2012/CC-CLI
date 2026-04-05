import { useState, useEffect } from 'react';
import { Search, Book, AlertCircle, Lightbulb, FileText, Tag, X, Zap, CheckCircle2, Loader2, ChevronRight, Shield, ChevronDown, Globe, Clock, Server, Edit3, Save } from 'lucide-react';
import { useText } from '../hooks/useText';
import { knowledgeEntries as defaultKnowledgeEntries, generatedSkills as defaultGeneratedSkills, type KnowledgeEntry, type Skill } from '../data/knowledge';
import { useScenario } from '../context/ScenarioContext';

const categoryConfig: Record<string, { icon: typeof Book; color: string; label: string; labelZh: string }> = {
  incident: { icon: AlertCircle, color: 'text-status-red bg-status-red/10 border-status-red/30', label: 'Incident', labelZh: '事件' },
  procedure: { icon: FileText, color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30', label: 'Procedure', labelZh: '流程' },
  lesson: { icon: Lightbulb, color: 'text-status-yellow bg-status-yellow/10 border-status-yellow/30', label: 'Lesson Learned', labelZh: '经验教训' },
};

const statusColors: Record<string, string> = {
  active: 'bg-status-green/20 text-status-green border-status-green/30',
  draft: 'bg-status-yellow/20 text-status-yellow border-status-yellow/30',
  deprecated: 'bg-bg-tertiary text-text-muted border-border',
};


const SKILL_DOMAINS = [
  { key: 'all' as const, label: 'All', labelZh: '全部', color: 'text-accent-cyan' },
  { key: 'planning' as const, label: 'Planning', labelZh: '规划', color: 'text-[#f59e0b]' },
  { key: 'optimization' as const, label: 'Optimization', labelZh: '优化', color: 'text-[#3b82f6]' },
  { key: 'experience' as const, label: 'Experience', labelZh: '体验', color: 'text-[#8b5cf6]' },
  { key: 'ops' as const, label: 'O&M', labelZh: '运维', color: 'text-[#ef4444]' },
  { key: 'marketing' as const, label: 'Marketing', labelZh: '运营', color: 'text-[#10b981]' },
];

const DOMAIN_COLORS: Record<string, string> = {
  planning: '#f59e0b', optimization: '#3b82f6', experience: '#8b5cf6', ops: '#ef4444', marketing: '#10b981',
};

/* ─── Compact Skill Card (grid layout) ─── */
function SkillCard({ skill, selected, onClick }: { skill: Skill; selected: boolean; onClick: () => void }) {
  const { t } = useText();
  const domainColor = DOMAIN_COLORS[skill.domain] || '#06b6d4';
  return (
    <button onClick={onClick}
      className={`text-left bg-bg-card rounded-lg border p-3 transition-all cursor-pointer ${selected ? 'border-accent-cyan shadow-lg shadow-accent-cyan/10' : 'border-border hover:border-accent-cyan/30'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: domainColor }} />
        <h4 className="text-xs font-medium text-text-primary truncate">{t(skill.name, skill.nameZh)}</h4>
        <span className={`text-[9px] px-1 py-0 rounded border ml-auto shrink-0 ${statusColors[skill.status]}`}>{skill.status}</span>
      </div>
      <p className="text-[10px] text-text-muted line-clamp-1 mb-1.5">{t(skill.description, skill.descriptionZh)}</p>
      <div className="flex items-center gap-2 text-[9px] text-text-muted">
        <span>{skill.usageCount}{t(' uses', '次')}</span>
        <span className="font-mono">{(skill.confidence * 100).toFixed(0)}%</span>
      </div>
    </button>
  );
}

/* ─── Skill Detail ─── */
function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const { t, isZh } = useText();
  const { scenario: detailScenario } = useScenario();
  const knowledgeEntries = detailScenario?.knowledgeEntries ?? defaultKnowledgeEntries;
  const sources = knowledgeEntries.filter(e => skill.sourceKnowledgeIds.includes(e.id));
  return (
    <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center"><Zap className="w-5 h-5 text-accent-cyan" /></div>
          <div>
            <h3 className="text-base font-medium text-text-primary">{t(skill.name, skill.nameZh)}</h3>
            <p className="text-xs text-text-muted">{t(skill.description, skill.descriptionZh)}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-bg-primary rounded-lg p-2.5 text-center">
          <p className="text-lg font-semibold text-text-primary">{(skill.confidence * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-text-muted">{t('Confidence', '置信度')}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5 text-center">
          <p className="text-lg font-semibold text-text-primary">{skill.usageCount}</p>
          <p className="text-[10px] text-text-muted">{t('Usage', '使用次数')}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5 text-center">
          <p className="text-lg font-semibold text-text-primary">{skill.sourceKnowledgeIds.length}</p>
          <p className="text-[10px] text-text-muted">{t('Sources', '知识来源')}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5 text-center">
          <p className="text-lg font-semibold text-accent-cyan">{skill.applicableAgents.length}</p>
          <p className="text-[10px] text-text-muted">{t('Agents', '适用Agent')}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Trigger Conditions', '触发条件')}</h4>
          <div className="space-y-1">{(isZh ? skill.triggerConditionsZh : skill.triggerConditions).map((c, i) => (
            <div key={i} className="text-xs text-text-primary bg-bg-primary rounded px-2.5 py-1.5 flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-accent-cyan shrink-0" />{c}</div>
          ))}</div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Actions', '执行动作')}</h4>
          <div className="space-y-1">{(isZh ? skill.actionsZh : skill.actions).map((a, i) => (
            <div key={i} className="text-xs text-text-primary bg-bg-primary rounded px-2.5 py-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-status-green shrink-0" />{a}</div>
          ))}</div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Source Knowledge', '来源知识')}</h4>
          <div className="space-y-1">{sources.map(s => (
            <div key={s.id} className="text-xs bg-bg-primary rounded px-2.5 py-1.5 flex items-center gap-2">
              <span className="text-accent-cyan font-mono">{s.id}</span>
              <span className="text-text-primary">{t(s.title, s.titleZh)}</span>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

const NEW_GENERATED_SKILL: Skill = {
  id: 'SK-011',
  name: 'Cross-Domain Experience-Driven Optimization',
  nameZh: '跨域体验驱动优化',
  domain: 'optimization',
  description: 'Auto-generated skill that combines proactive complaint monitoring with real-time parameter optimization, preemptively optimizing cells where user experience trends downward.',
  descriptionZh: '自动生成的技能，结合投诉主动监控与实时参数优化，在用户体验下降趋势区域预先优化小区参数。',
  sourceKnowledgeIds: ['KB-004', 'KB-008'],
  triggerConditions: [
    'User experience score declining trend detected across 5+ cells',
    'Parameter conflict alert between optimization tasks',
    'Complaint rate rising in specific geographic cluster',
  ],
  triggerConditionsZh: [
    '检测到5+小区用户体验评分下降趋势',
    '优化任务间参数冲突告警',
    '特定地理集群投诉率上升',
  ],
  actions: [
    'Correlate experience scores with network parameter changes',
    'Identify conflicting optimization task parameters',
    'Apply unified multi-objective optimization',
    'Trigger proactive user care for impacted users',
    'Monitor post-optimization stability for 24 hours',
  ],
  actionsZh: [
    '关联体验评分与网络参数变更',
    '识别冲突的优化任务参数',
    '应用统一多目标优化',
    '对受影响用户触发主动关怀',
    '监控优化后24小时稳定性',
  ],
  applicableAgents: ['OptimizationAgent', 'ExperienceAgent'],
  confidence: 0.85,
  usageCount: 0,
  lastUsed: '—',
  status: 'draft',
};

/* ─── Generate Skill Animation ─── */
function GenerateSkill({ onDone }: { onDone: (skill: Skill) => void }) {
  const { t } = useText();
  const [step, setStep] = useState(0);
  const STEPS = [
    { label: t('Scanning knowledge entries (KB-004, KB-008)...', '扫描知识条目 (KB-004, KB-008)...'), dur: 1200 },
    { label: t('Analyzing patterns & correlations...', '分析模式与关联关系...'), dur: 1500 },
    { label: t('Extracting trigger conditions...', '提取触发条件...'), dur: 1000 },
    { label: t('Generating action sequence...', '生成动作序列...'), dur: 1200 },
    { label: t('Skill generated successfully!', 'Skill生成成功！'), dur: 800 },
  ];
  useEffect(() => {
    if (step < STEPS.length - 1) {
      const timer = setTimeout(() => setStep(s => s + 1), STEPS[step].dur);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onDone(NEW_GENERATED_SKILL), 1000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-accent-cyan animate-pulse" />
        <h3 className="text-sm font-semibold text-text-primary">{t('Auto-Generating Skill from Knowledge Base', '从知识库自动生成Skill')}</h3>
      </div>
      <p className="text-xs text-text-muted mb-3">
        {t('Analysing: KB-004 (Parameter Conflict Resolution) + KB-008 (Complaint Prevention)', '分析: KB-004 (参数冲突消解) + KB-008 (投诉主动预防)')}
      </p>
      <div className="space-y-2">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
            {i < step ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" /> :
              i === step ? <Loader2 className="w-3.5 h-3.5 text-accent-cyan animate-spin shrink-0" /> :
              <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
            <span className={i <= step ? 'text-text-primary' : 'text-text-muted'}>{s.label}</span>
          </div>
        ))}
      </div>
      {step === STEPS.length - 1 && (
        <div className="mt-3 p-3 bg-status-green/10 border border-status-green/30 rounded-lg">
          <p className="text-xs text-status-green font-medium">
            {t('New skill "Cross-Domain Experience-Driven Optimization" (SK-011) created as draft', '新Skill "跨域体验驱动优化"（SK-011）已创建为草稿')}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── KB Detail Panel ─── */
function DetailPanel({ entry, skills, onClose }: { entry: KnowledgeEntry; skills: Skill[]; onClose: () => void }) {
  const { t } = useText();
  const cat = categoryConfig[entry.category];
  const CatIcon = cat.icon;
  const relatedSkills = skills.filter(s => s.sourceKnowledgeIds.includes(entry.id));

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${cat.color}`}><CatIcon className="w-3 h-3 inline mr-1" />{t(cat.label, cat.labelZh)}</span>
            <span className="text-xs text-text-muted">{entry.id}</span>
          </div>
          <h2 className="text-base font-medium text-text-primary">{t(entry.title, entry.titleZh)}</h2>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-xs text-text-muted mb-1">{t('Confidence', '置信度')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden"><div className="h-full bg-accent-cyan rounded-full" style={{ width: `${entry.confidence * 100}%` }} /></div>
            <span className="text-xs font-medium text-text-primary">{(entry.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-xs text-text-muted mb-1">{t('Occurrences', '发生次数')}</p>
          <p className="text-sm font-medium text-text-primary">{entry.occurrences}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-xs text-text-muted mb-1">{t('Last Seen', '上次发生')}</p>
          <p className="text-sm font-medium text-text-primary">{entry.lastSeen}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Root Cause', '根本原因')}</h3>
          <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3 leading-relaxed">{t(entry.rootCause, entry.rootCauseZh)}</p>
        </div>
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Resolution', '解决方案')}</h3>
          <div className="text-sm text-text-primary bg-bg-primary rounded-lg p-3 leading-relaxed whitespace-pre-line">{t(entry.resolution, entry.resolutionZh)}</div>
        </div>
        {relatedSkills.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Generated Skills', '关联Skill')}</h3>
            <div className="space-y-1">{relatedSkills.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg px-3 py-2">
                <Zap className="w-3 h-3 text-accent-cyan" />
                <span className="text-accent-cyan font-mono">{s.id}</span>
                <span className="text-text-primary">{t(s.name, s.nameZh)}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border ${statusColors[s.status]}`}>{s.status}</span>
              </div>
            ))}</div>
          </div>
        )}
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Tags', '标签')}</h3>
          <div className="flex flex-wrap gap-1.5">{entry.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded"><Tag className="w-2.5 h-2.5 inline mr-1" />{tag}</span>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Network.md Section ─── */
const NETWORK_MD_SECTIONS = [
  {
    key: 'topology', icon: Globe,
    titleEn: 'Network Topology & Domain Boundaries', titleZh: '网络拓扑与域边界',
    contentEn: '# Network Topology\n\nRAN Domain: 23,456 cells (4G/5G), 5 regions\nTransport: IP/MPLS backbone, 48 core routers\nCore Network: 3 AMF/SMF clusters, 2 UPF pools\nDomain boundary: RAN↔Transport at S1/N2, Transport↔Core at N4\n\n## Cross-domain handoff rules\n- Fault correlation across domains requires ≥3 KPI anomalies\n- Cross-domain parameter changes need L4 approval',
    contentZh: '# 网络拓扑\n\nRAN域：23,456小区（4G/5G），5个区域\n传输：IP/MPLS骨干网，48台核心路由器\n核心网：3套AMF/SMF集群，2个UPF池\n域边界：RAN↔传输在S1/N2，传输↔核心网在N4\n\n## 跨域交接规则\n- 跨域故障关联需≥3个KPI异常\n- 跨域参数变更需L4审批',
  },
  {
    key: 'sla', icon: Shield,
    titleEn: 'SLA Requirements & KPI Thresholds', titleZh: 'SLA要求与KPI阈值',
    contentEn: '# SLA & KPI Thresholds\n\nNetwork Availability: ≥99.95%\nCall Drop Rate: <0.3%\nHandover Success: >99.2%\nDL Throughput (5G): ≥500Mbps (urban)\nLatency (5G URLLC): <10ms\nMTTR: <30min (critical), <4h (major)\n\n## VIP SLA Tiers\n- Diamond: 99.99% availability, dedicated slice\n- Gold: 99.95%, priority QoS\n- Silver: 99.9%, best-effort enhanced',
    contentZh: '# SLA与KPI阈值\n\n网络可用性：≥99.95%\n掉话率：<0.3%\n切换成功率：>99.2%\n下行吞吐量（5G）：≥500Mbps（城区）\n时延（5G URLLC）：<10ms\nMTTR：<30min（严重），<4h（重大）\n\n## VIP SLA分级\n- 钻石卡：99.99%可用性，专用切片\n- 金卡：99.95%，优先QoS\n- 银卡：99.9%，增强型尽力而为',
  },
  {
    key: 'escalation', icon: AlertCircle,
    titleEn: 'Escalation Policies & Paths', titleZh: '升级策略与路径',
    contentEn: '# Escalation Policies\n\nL1 → L2: Auto-escalate if unresolved >15min\nL2 → L3: Auto-escalate if impact >100 users\nL3 → L4: Manual approval, NOC director\nL4 → L5: Emergency only, VP approval\n\n## Priority Matrix\n- P1 (Critical): Core outage, >10K users → immediate L4\n- P2 (Major): Regional degradation → L3 within 5min\n- P3 (Minor): Single cell issue → L2 auto-handle\n- P4 (Info): Threshold approaching → L1 monitor',
    contentZh: '# 升级策略\n\nL1 → L2：未解决>15分钟自动升级\nL2 → L3：影响>100用户自动升级\nL3 → L4：需人工审批，NOC主管\nL4 → L5：仅限紧急情况，VP审批\n\n## 优先级矩阵\n- P1（严重）：核心网故障，>1万用户 → 立即L4\n- P2（重大）：区域性劣化 → 5分钟内L3\n- P3（一般）：单小区问题 → L2自动处理\n- P4（信息）：阈值逼近 → L1监控',
  },
  {
    key: 'forbidden', icon: Shield,
    titleEn: 'Forbidden Operations', titleZh: '禁止操作',
    contentEn: '# Forbidden Operations\n\n## NEVER execute:\n- Core NE restart during peak hours (9:00-22:00)\n- Batch parameter changes >200 cells without simulation\n- Delete/modify subscriber profiles without dual approval\n- Disable alarm monitoring on any production NE\n- Override VIP SLA protections\n\n## Conditional restrictions:\n- Firmware upgrades: maintenance window only (02:00-06:00)\n- Cross-region failover: requires L5 + VP approval\n- New feature activation: staged rollout mandatory',
    contentZh: '# 禁止操作\n\n## 绝对禁止：\n- 高峰期（9:00-22:00）重启核心网元\n- 未经仿真批量变更>200小区参数\n- 未经双人审批删除/修改用户档案\n- 关闭任何生产网元的告警监控\n- 覆盖VIP SLA保护策略\n\n## 条件限制：\n- 固件升级：仅限维护窗口（02:00-06:00）\n- 跨区域倒换：需L5+VP审批\n- 新功能激活：必须灰度发布',
  },
  {
    key: 'maintenance', icon: Clock,
    titleEn: 'Maintenance Windows & Change Freezes', titleZh: '维护窗口与变更冻结期',
    contentEn: '# Maintenance Windows\n\nDaily: 02:00-06:00 (routine maintenance)\nWeekly: Sunday 01:00-05:00 (major changes)\nMonthly: Last Sunday 00:00-08:00 (firmware/upgrades)\n\n## Change Freeze Periods\n- National holidays: 7 days before + during\n- Major events (concerts, sports): 24h before + during\n- Quarter-end billing: Last 3 days of quarter\n- Year-end: Dec 20 - Jan 5\n\n## Emergency override: L5 approval + post-audit',
    contentZh: '# 维护窗口\n\n每日：02:00-06:00（常规维护）\n每周：周日01:00-05:00（重大变更）\n每月：最后一个周日00:00-08:00（固件/升级）\n\n## 变更冻结期\n- 国家法定假日：前7天+期间\n- 重大活动（演唱会、体育赛事）：前24小时+期间\n- 季末计费：每季度最后3天\n- 年终：12月20日-1月5日\n\n## 紧急覆盖：需L5审批+事后审计',
  },
  {
    key: 'vendor', icon: Server,
    titleEn: 'Vendor-specific Notes & Compliance', titleZh: '厂商注意事项与合规',
    contentEn: '# Vendor-specific Notes\n\n## Huawei\n- MML command validation required before execution\n- U2020/iManager compatibility check for batch ops\n- AUTIN integration: use Intent API v3.2+\n\n## Multi-vendor\n- Parameter naming differs across vendors\n- Cross-vendor handover: extra validation needed\n\n# Regulatory Compliance\n- MIIT annual inspection: Q4 preparation\n- User data: comply with Personal Information Protection Law\n- Spectrum usage: report to radio management bureau quarterly\n- Emergency comms: priority channel reservation per regulations',
    contentZh: '# 厂商注意事项\n\n## 华为\n- MML命令执行前须验证\n- U2020/iManager批量操作兼容性检查\n- AUTIN集成：使用Intent API v3.2+\n\n## 多厂商\n- 不同厂商参数命名不同\n- 跨厂商切换：需额外验证\n\n# 监管合规\n- 工信部年检：Q4准备\n- 用户数据：遵守《个人信息保护法》\n- 频谱使用：每季度向无线电管理局报告\n- 应急通信：按规定预留优先通道',
  },
];

function NetworkMdSection() {
  const { t } = useText();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editContents, setEditContents] = useState<Record<string, { en: string; zh: string }>>(() => {
    const init: Record<string, { en: string; zh: string }> = {};
    NETWORK_MD_SECTIONS.forEach(s => { init[s.key] = { en: s.contentEn, zh: s.contentZh }; });
    return init;
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    setEditMode(false);
  };

  return (
    <div className="mb-5">
      <div className="bg-bg-card rounded-xl border border-accent-cyan/30 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-accent-cyan/5">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-accent-cyan">Network.md</h2>
              <span className="text-[10px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded">{t('Declarative Knowledge File', '声明式知识文件')}</span>
            </div>
            <p className="text-xs text-text-muted">{t('Telecom CLAUDE.md — engineer-editable knowledge defining network rules, SLA, forbidden ops, and compliance', '电信版CLAUDE.md — 工程师可编辑的知识文件，定义网络规则、SLA、禁止操作与合规要求')}</p>
          </div>
          {editMode ? (
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-accent-cyan rounded-lg hover:bg-accent-cyan/80 transition-colors cursor-pointer">
              <Save className="w-3 h-3" />{t('Save', '保存')}
            </button>
          ) : (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-colors cursor-pointer" title={t('Edit Network.md', '编辑 Network.md')}>
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="divide-y divide-border">
          {NETWORK_MD_SECTIONS.map(sec => {
            const Icon = sec.icon;
            const expanded = expandedSections.has(sec.key);
            return (
              <div key={sec.key}>
                <button onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-hover/50 transition-colors cursor-pointer text-left">
                  <Icon className="w-4 h-4 text-accent-cyan shrink-0" />
                  <span className="text-sm font-medium text-text-primary flex-1">{t(sec.titleEn, sec.titleZh)}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="px-5 pb-4">
                    {editMode ? (
                      <textarea
                        className="w-full bg-bg-primary border border-accent-cyan/30 rounded-lg px-4 py-3 text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed min-h-[200px] max-h-80 resize-y focus:border-accent-cyan focus:outline-none"
                        value={t(editContents[sec.key]?.en ?? sec.contentEn, editContents[sec.key]?.zh ?? sec.contentZh)}
                        onChange={e => {
                          const isEn = t('_', '中') === '_';
                          setEditContents(prev => ({
                            ...prev,
                            [sec.key]: { ...prev[sec.key], [isEn ? 'en' : 'zh']: e.target.value },
                          }));
                        }}
                      />
                    ) : (
                      <pre className="bg-bg-primary border border-border rounded-lg px-4 py-3 text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
                        {t(editContents[sec.key]?.en ?? sec.contentEn, editContents[sec.key]?.zh ?? sec.contentZh)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Knowledge() {
  const { t } = useText();
  const { scenario } = useScenario();
  const knowledgeEntries = scenario?.knowledgeEntries ?? defaultKnowledgeEntries;
  const generatedSkills = scenario?.skills ?? defaultGeneratedSkills;
  const scenarioKey = scenario?.meta.id ?? 'default';
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [skills, setSkills] = useState<Skill[]>(generatedSkills);
  const [skillDomain, setSkillDomain] = useState<string>('all');

  // Reset skills when scenario changes
  useEffect(() => {
    setSkills(generatedSkills);
    setSelected(null);
    setSelectedSkill(null);
    setSearch('');
    setFilterCategory('all');
  }, [scenarioKey]);

  const filteredSkills = skillDomain === 'all' ? skills : skills.filter(s => s.domain === skillDomain);

  const filtered = knowledgeEntries.filter(e => {
    const matchSearch = search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.titleZh.includes(search) || e.tags.some(tag => tag.includes(search.toLowerCase()));
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCategory;
  });

  function handleGenerateDone(newSkill: Skill) {
    setSkills(prev => prev.some(s => s.id === newSkill.id) ? prev : [...prev, newSkill]);
    setGenerating(false);
  }

  return (
    <div className="p-5 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Knowledge Base & Skills', '知识库与Skill')}</h1>
          <p className="text-xs text-text-muted mt-0.5">{knowledgeEntries.length} {t('entries', '条目')} · {skills.length} {t('skills', '个Skill')}</p>
        </div>
      </div>

      {/* ── SECTION 0: Network.md ── */}
      <NetworkMdSection />

      {/* ── SECTION 1: Skill Gallery ── */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-semibold text-text-primary">{t('Skill Gallery', 'Skill库')}</h2>
          <span className="text-xs bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded-full">{skills.length}</span>
          <div className="flex items-center gap-1 ml-auto">
            {SKILL_DOMAINS.map(d => (
              <button key={d.key} onClick={() => setSkillDomain(d.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${skillDomain === d.key ? `bg-bg-card border border-border ${d.color} font-medium` : 'text-text-muted hover:text-text-secondary'}`}>
                {t(d.label, d.labelZh)}
                {d.key !== 'all' && <span className="ml-1 text-[9px] opacity-60">{skills.filter(s => s.domain === d.key).length}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} selected={selectedSkill?.id === skill.id}
              onClick={() => { setSelectedSkill(prev => prev?.id === skill.id ? null : skill); setSelected(null); setGenerating(false); }} />
          ))}
        </div>
        {/* Skill Detail inline below gallery */}
        {selectedSkill && !generating && (
          <div className="mt-3">
            <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
          </div>
        )}
      </div>

      {/* ── SECTION 2: Auto-Generate ── */}
      <div className="mb-5">
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('Auto-Generate Skill from Knowledge Base', '从知识库自动生成Skill')}
                </h2>
                <p className="text-xs text-text-muted">
                  {t('Analyse patterns across entries and synthesise reusable skills for agents', '分析知识条目中的模式，合成可供Agent使用的可复用Skill')}
                </p>
              </div>
            </div>
            <button
              onClick={() => { if (!generating) { setGenerating(true); setSelectedSkill(null); setSelected(null); } }}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 text-accent-cyan rounded-lg border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? t('Generating…', '生成中…') : t('Generate Skill', '生成Skill')}
            </button>
          </div>

          {/* Animation panel */}
          {generating && (
            <div className="mt-4">
              <GenerateSkill onDone={handleGenerateDone} />
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: Knowledge Entries ── */}
      <div className="flex items-center gap-2 mb-3">
        <Book className="w-4 h-4 text-text-muted" />
        <h2 className="text-sm font-semibold text-text-primary">{t('Knowledge Entries', '知识条目')}</h2>
        <span className="text-xs bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded-full">{knowledgeEntries.length}</span>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-bg-card rounded-lg border border-border px-3 py-2 focus-within:border-accent-cyan/60 transition-colors">
          <Search className="w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search knowledge base...', '搜索知识库...')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none" />
        </div>
        <div className="flex items-center gap-1">
          {['all', 'incident', 'procedure', 'lesson'].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${filterCategory === cat ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-secondary hover:bg-bg-hover'}`}>
              {cat === 'all' ? t('All', '全部') : t(categoryConfig[cat].label, categoryConfig[cat].labelZh)}
            </button>
          ))}
        </div>
      </div>

      {/* KB Entries Grid */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          {filtered.map(entry => {
            const cat = categoryConfig[entry.category];
            const CatIcon = cat.icon;
            const skillCount = skills.filter(s => s.sourceKnowledgeIds.includes(entry.id)).length;
            return (
              <button key={entry.id} onClick={() => { setSelected(entry); setSelectedSkill(null); setGenerating(false); }}
                className={`w-full text-left bg-bg-card rounded-xl border p-4 transition-all cursor-pointer ${selected?.id === entry.id ? 'border-accent-cyan' : 'border-border hover:border-accent-cyan/30'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}><CatIcon className="w-2.5 h-2.5 inline mr-0.5" />{t(cat.label, cat.labelZh)}</span>
                  <span className="text-[10px] text-text-muted">{entry.id}</span>
                  {skillCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />{skillCount} Skill
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted ml-auto">{entry.domain}</span>
                </div>
                <h3 className="text-sm font-medium text-text-primary">{t(entry.title, entry.titleZh)}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span>{t('Confidence:', '置信度:')} {(entry.confidence * 100).toFixed(0)}%</span>
                  <span>{entry.occurrences} {t('occurrences', '次')}</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12"><Book className="w-8 h-8 text-text-muted mx-auto mb-2" /><p className="text-sm text-text-muted">{t('No entries found', '未找到条目')}</p></div>
          )}
        </div>
        <div>
          {selected ? (
            <DetailPanel entry={selected} skills={skills} onClose={() => setSelected(null)} />
          ) : (
            <div className="bg-bg-card rounded-xl border border-border flex items-center justify-center h-96">
              <div className="text-center"><Book className="w-8 h-8 text-text-muted mx-auto mb-2" /><p className="text-sm text-text-muted">{t('Select an entry to view details', '选择条目查看详情')}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
