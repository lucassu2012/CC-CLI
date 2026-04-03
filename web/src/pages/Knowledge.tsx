import { useState, useEffect } from 'react';
import { Search, Book, AlertCircle, Lightbulb, FileText, Tag, X, Zap, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { useText } from '../hooks/useText';
import { knowledgeEntries, generatedSkills, type KnowledgeEntry, type Skill } from '../data/knowledge';

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

const agentDots: Record<string, string> = {
  OpsAgent: '#ef4444', OptimizationAgent: '#3b82f6', ExperienceAgent: '#8b5cf6',
  PlanningAgent: '#f59e0b', MarketAgent: '#10b981', NetworkAgent: '#06b6d4', InfraAgent: '#f97316',
};

/* ─── Skill Card ─── */
function SkillCard({ skill, selected, onClick }: { skill: Skill; selected: boolean; onClick: () => void }) {
  const { t } = useText();
  return (
    <button onClick={onClick}
      className={`min-w-[220px] text-left bg-bg-card rounded-xl border p-4 transition-all cursor-pointer shrink-0 ${selected ? 'border-accent-cyan shadow-lg shadow-accent-cyan/10' : 'border-border hover:border-accent-cyan/30'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-accent-cyan" />
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[skill.status]}`}>{skill.status}</span>
      </div>
      <h4 className="text-sm font-medium text-text-primary mb-1">{t(skill.name, skill.nameZh)}</h4>
      <p className="text-xs text-text-muted line-clamp-2 mb-2">{t(skill.description, skill.descriptionZh)}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {skill.applicableAgents.map(a => (
            <div key={a} className="w-2 h-2 rounded-full" style={{ backgroundColor: agentDots[a] || '#6b7280' }} title={a} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>{skill.sourceKnowledgeIds.length} {t('sources', '来源')}</span>
          <span>{skill.usageCount} {t('uses', '次使用')}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Skill Detail ─── */
function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const { t, isZh } = useText();
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
  id: 'SK-009',
  name: 'DDoS Rapid Containment',
  nameZh: 'DDoS快速封堵',
  description: 'Auto-generated skill combining DDoS mitigation playbook patterns with firmware rollback safeguards to contain volumetric attacks while protecting device stability.',
  descriptionZh: '自动生成的技能，结合DDoS缓解手册模式与固件回滚保障措施，在保护设备稳定性的同时快速封堵容量型攻击。',
  sourceKnowledgeIds: ['KB-002', 'KB-008'],
  triggerConditions: [
    'Inbound traffic volume exceeds 10x baseline on edge interfaces',
    'DNS query rate > 500k/s from a single source subnet',
    'BGP next-hop reachability alarm triggered simultaneously',
  ],
  triggerConditionsZh: [
    '边缘接口入向流量超过基线10倍',
    '单一源子网DNS查询速率超过50万/秒',
    'BGP下一跳可达性告警同时触发',
  ],
  actions: [
    'Activate upstream traffic scrubbing centre within 60 seconds',
    'Apply rate-limiting ACLs on all edge router interfaces',
    'Enable DNS Response Rate Limiting (RRL) cluster-wide',
    'Blackhole top-10 attacking source subnets',
    'Notify upstream transit providers via NOC hotline',
    'Verify no firmware update is in-flight; defer if active',
  ],
  actionsZh: [
    '60秒内激活上游流量清洗中心',
    '在所有边缘路由器接口应用速率限制ACL',
    '全集群启用DNS响应速率限制（RRL）',
    '黑洞化Top-10攻击源子网',
    '通过NOC热线通知上游过境供应商',
    '确认无固件升级正在进行，若有则延迟',
  ],
  applicableAgents: ['NetworkAgent', 'NOCAgent', 'AutomationAgent'],
  confidence: 0.82,
  usageCount: 0,
  lastUsed: '—',
  status: 'draft',
};

/* ─── Generate Skill Animation ─── */
function GenerateSkill({ onDone }: { onDone: (skill: Skill) => void }) {
  const { t } = useText();
  const [step, setStep] = useState(0);
  const STEPS = [
    { label: t('Scanning knowledge entries (KB-002, KB-008)...', '扫描知识条目 (KB-002, KB-008)...'), dur: 1200 },
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
        {t('Analysing: KB-002 (DDoS Mitigation Playbook) + KB-008 (Firmware Rollback Procedure)', '分析: KB-002 (DDoS缓解手册) + KB-008 (固件回滚流程)')}
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
            {t('New skill "DDoS Rapid Containment" (SK-009) created as draft', '新Skill "DDoS快速封堵"（SK-009）已创建为草稿')}
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

/* ─── Main Component ─── */
export default function Knowledge() {
  const { t } = useText();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [skills, setSkills] = useState<Skill[]>(generatedSkills);

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

      {/* ── SECTION 1: Skill Gallery ── */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-cyan" />
          {t('Skill Gallery', 'Skill库')}
          <span className="text-xs bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded-full">{skills.length}</span>
          <span className="text-xs text-text-muted font-normal">— {t('reusable skills auto-derived from knowledge', '从知识自动提炼的可复用技能')}</span>
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {skills.map(skill => (
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
