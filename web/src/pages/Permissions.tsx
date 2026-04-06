import { useState, useEffect } from 'react';
import { Shield, Eye, Settings, CheckCircle2, XCircle, Clock, Activity, Unlock, X, AlertTriangle, ChevronRight, Edit3, Save } from 'lucide-react';
import { useText } from '../hooks/useText';
import { useScenario } from '../context/ScenarioContext';

type LevelData = {
  level: number; color: string;
  nameEn: string; nameZh: string;
  descEn: string; descZh: string;
  icon: typeof Eye; approvalEn: string; approvalZh: string; agentCount: number;
  opsEn: string[]; opsZh: string[];
  escalationEn: string; escalationZh: string;
  rulesEn: string[]; rulesZh: string[];
};

const INIT_LEVELS: LevelData[] = [
  {
    level: 1, color: '#22c55e', icon: Eye,
    nameEn: 'Read-Only Monitoring', nameZh: '只读监控',
    descEn: 'View KPIs, dashboards, alarms. No write operations.', descZh: '查看KPI、仪表盘、告警。不允许写操作。',
    approvalEn: 'None', approvalZh: '无需审批', agentCount: 2,
    opsEn: ['View real-time KPIs', 'Access dashboards', 'Read alarm history', 'Export reports'],
    opsZh: ['查看实时KPI', '访问仪表盘', '读取告警历史', '导出报告'],
    escalationEn: 'Auto-escalate to L2 if unresolved >15min',
    escalationZh: '未解决>15分钟自动升级到L2',
    rulesEn: ['No system modification allowed', 'Read-only access to all monitoring interfaces', 'Alert notifications only (no acknowledgement)'],
    rulesZh: ['不允许系统修改', '所有监控接口只读访问', '仅接收告警通知（不可确认）'],
  },
  {
    level: 2, color: '#06b6d4', icon: Activity,
    nameEn: 'Analysis & Recommendations', nameZh: '分析与建议',
    descEn: 'Run analytics, generate reports, suggest changes.', descZh: '运行分析、生成报告、建议参数变更。',
    approvalEn: 'None', approvalZh: '无需审批', agentCount: 5,
    opsEn: ['Run analytical queries', 'Generate optimization suggestions', 'Create simulation scenarios', 'Produce trend reports'],
    opsZh: ['运行分析查询', '生成优化建议', '创建仿真场景', '产出趋势报告'],
    escalationEn: 'Auto-escalate to L3 if impact >100 users',
    escalationZh: '影响>100用户自动升级到L3',
    rulesEn: ['Can execute read queries on all systems', 'Recommendations require human review before action', 'Simulation results are sandboxed'],
    rulesZh: ['可对所有系统执行读取查询', '建议需人工审核后再执行', '仿真结果在沙箱中运行'],
  },
  {
    level: 3, color: '#eab308', icon: Settings,
    nameEn: 'Supervised Execution', nameZh: '监督执行',
    descEn: 'Execute parameter changes with human approval workflow.', descZh: '在人工审批流程下执行参数变更。',
    approvalEn: 'NOC Engineer', approvalZh: 'NOC工程师审批', agentCount: 9,
    opsEn: ['Execute approved changes', 'Deploy configurations', 'Create work orders', 'Trigger optimization cycles'],
    opsZh: ['执行已审批变更', '部署配置', '创建工单', '触发优化周期'],
    escalationEn: 'Manual approval required, NOC director for L4',
    escalationZh: '需人工审批，NOC主管批准升级到L4',
    rulesEn: ['All changes require pre-execution approval', 'Rollback plan mandatory before deployment', 'Maximum 50 cells per batch operation'],
    rulesZh: ['所有变更需执行前审批', '部署前必须有回滚方案', '每批操作最多50个小区'],
  },
  {
    level: 4, color: '#f97316', icon: Unlock,
    nameEn: 'Autonomous Execution', nameZh: '自主执行',
    descEn: 'Auto-fix within defined boundaries. Post-audit required.', descZh: '在定义边界内自动修复。需事后审计。',
    approvalEn: 'Post-audit', approvalZh: '事后审计', agentCount: 5,
    opsEn: ['Autonomous parameter tuning', 'Auto-repair within boundaries', 'Self-healing network fixes', 'Batch optimization deployment'],
    opsZh: ['自主参数调优', '边界内自动修复', '自愈网络修复', '批量优化部署'],
    escalationEn: 'Emergency only → L5, requires VP approval',
    escalationZh: '仅限紧急情况 → L5，需VP审批',
    rulesEn: ['Operations must stay within safety boundaries', 'All actions logged for post-audit', 'Auto-rollback if KPI degradation >5%', 'No core network element restart'],
    rulesZh: ['操作必须在安全边界内', '所有操作记录用于事后审计', 'KPI劣化>5%自动回滚', '不允许重启核心网元'],
  },
  {
    level: 5, color: '#ef4444', icon: Shield,
    nameEn: 'Full Autonomy', nameZh: '完全自主',
    descEn: 'Emergency response, cross-domain orchestration. Human override only.', descZh: '紧急响应、跨域编排。仅支持人工覆盖。',
    approvalEn: 'VP + Emergency', approvalZh: 'VP+紧急授权', agentCount: 1,
    opsEn: ['Emergency cross-domain response', 'Full network orchestration', 'Override safety boundaries', 'Autonomous escalation'],
    opsZh: ['紧急跨域响应', '全网编排', '覆盖安全边界', '自主升级'],
    escalationEn: 'Highest level — human override as last resort',
    escalationZh: '最高等级 — 人工覆盖作为最后手段',
    rulesEn: ['Only activated during declared emergencies', 'Continuous real-time monitoring required', 'All actions require post-incident review', 'VP sign-off within 30 minutes'],
    rulesZh: ['仅在宣布紧急状态时激活', '需持续实时监控', '所有操作需事后复盘', 'VP须在30分钟内签字确认'],
  },
];

const INIT_MATRIX = [
  { en: 'View metrics', zh: '查看指标', levels: [true, true, true, true, true], highRisk: false },
  { en: 'Run analysis', zh: '运行分析', levels: [false, true, true, true, true], highRisk: false },
  { en: 'Suggest changes', zh: '建议变更', levels: [false, true, true, true, true], highRisk: false },
  { en: 'Execute changes', zh: '执行变更', levels: [false, false, 'approval' as const, true, true], highRisk: true },
  { en: 'Auto-fix', zh: '自动修复', levels: [false, false, false, true, true], highRisk: true },
  { en: 'Cross-domain ops', zh: '跨域操作', levels: [false, false, false, false, true], highRisk: true },
  { en: 'Emergency override', zh: '紧急覆盖', levels: [false, false, false, false, true], highRisk: true },
  { en: 'Create work orders', zh: '创建工单', levels: [false, false, true, true, true], highRisk: false },
  { en: 'Batch deployment', zh: '批量部署', levels: [false, false, false, true, true], highRisk: true },
];

const AUDIT_LOG = [
  { id: 'AUD-001', time: '14:23:05', level: 3, agentEn: 'Engineering Opt Agent', agentZh: '工程优化Agent', actEn: 'Parameter change on GD-TN-005 (approved)', actZh: '参数变更 GD-TN-005（已审批）', status: 'approved', highRisk: false,
    detailEn: 'Modified antenna tilt angle from 6° to 4° on site GD-TN-005 to improve coverage in adjacent area. Change was pre-validated via simulation showing +2.3dB RSRP improvement. Approved by NOC Engineer Zhang Wei.',
    detailZh: '将站点GD-TN-005天线下倾角从6°修改为4°以改善邻区覆盖。变更经仿真预验证显示RSRP改善+2.3dB。由NOC工程师张伟审批通过。',
    impactEn: '~800 users affected, +2.3dB RSRP', impactZh: '~800用户受影响，RSRP+2.3dB' },
  { id: 'AUD-002', time: '14:21:42', level: 4, agentEn: 'Real-time Opt Agent', agentZh: '实时优化Agent', actEn: 'Interference mitigation Baiyun cells (auto)', actZh: '白云区干扰抑制（自动执行）', status: 'executed', highRisk: true,
    detailEn: 'Detected PCI conflict between cells BY-042 and BY-043 causing 12% SINR degradation. Auto-adjusted PCI assignment and reduced Tx power by 1dB on BY-043. KPI recovered within 3 minutes.',
    detailZh: '检测到小区BY-042和BY-043之间PCI冲突导致SINR劣化12%。自动调整PCI分配并将BY-043发射功率降低1dB。KPI在3分钟内恢复。',
    impactEn: '2 cells, ~1200 users, auto-rollback ready', impactZh: '2个小区，~1200用户，已准备自动回滚' },
  { id: 'AUD-003', time: '14:19:18', level: 2, agentEn: 'Value Insight Agent', agentZh: '价值洞察Agent', actEn: 'Generated coverage analysis report', actZh: '生成覆盖分析报告', status: 'completed', highRisk: false,
    detailEn: 'Completed comprehensive coverage gap analysis for Tianhe district. Identified 3 weak coverage zones with potential for new site deployment. Report includes ROI estimation.',
    detailZh: '完成天河区综合覆盖空洞分析。识别出3个弱覆盖区域具有新建站点潜力。报告包含ROI估算。',
    impactEn: 'Analysis only, no network impact', impactZh: '仅分析，无网络影响' },
  { id: 'AUD-004', time: '14:17:55', level: 3, agentEn: 'Fault Analysis Agent', agentZh: '故障分析Agent', actEn: 'Root cause fix BTS-GD-012 (pending approval)', actZh: '根因修复 BTS-GD-012（待审批）', status: 'pending', highRisk: true,
    detailEn: 'RCA identified faulty BBU board causing intermittent S1 link drops on BTS-GD-012. Proposed fix: switch to redundant BBU path and schedule hardware replacement. Awaiting NOC approval.',
    detailZh: 'RCA识别出故障BBU板卡导致BTS-GD-012间歇性S1链路中断。建议方案：切换至冗余BBU路径并安排硬件更换。等待NOC审批。',
    impactEn: '~3000 users at risk, requires human decision', impactZh: '~3000用户受影响，需人工决策' },
  { id: 'AUD-005', time: '14:15:30', level: 1, agentEn: 'O&M Monitor Agent', agentZh: '运维监控Agent', actEn: 'KPI threshold alert - Haizhu throughput drop', actZh: 'KPI阈值告警 - 海珠区吞吐量下降', status: 'info', highRisk: false,
    detailEn: 'Detected DL throughput drop below threshold (current: 420Mbps, threshold: 500Mbps) in Haizhu district cluster HZ-C03. Monitoring continues, auto-escalation in 15min if no recovery.',
    detailZh: '检测到海珠区集群HZ-C03下行吞吐量低于阈值（当前420Mbps，阈值500Mbps）。持续监控中，15分钟无恢复将自动升级。',
    impactEn: 'Monitoring only', impactZh: '仅监控' },
  { id: 'AUD-006', time: '14:12:08', level: 4, agentEn: 'Deterministic Exp Agent', agentZh: '确定性体验Agent', actEn: 'QoS priority adjust for VIP user (auto)', actZh: 'VIP用户QoS优先级调整（自动）', status: 'executed', highRisk: false,
    detailEn: 'Diamond-tier VIP user (ID: VIP-88001) experienced QoE score drop to 3.2/5.0. Auto-activated dedicated QoS bearer with guaranteed 100Mbps DL. QoE recovered to 4.6/5.0 within 90 seconds.',
    detailZh: '钻石卡VIP用户（ID: VIP-88001）QoE评分降至3.2/5.0。自动激活专用QoS承载保障100Mbps下行速率。QoE在90秒内恢复至4.6/5.0。',
    impactEn: '1 VIP user, dedicated bearer activated', impactZh: '1位VIP用户，已激活专用承载' },
  { id: 'AUD-007', time: '14:08:44', level: 3, agentEn: 'Churn Prevention Agent', agentZh: '离网维挽Agent', actEn: 'Retention offer deployment (approved)', actZh: '维挽方案投放（已审批）', status: 'approved', highRisk: false,
    detailEn: 'Deployed personalized retention offer to 156 high-value users identified as churn-risk (probability >0.7). Offer includes 20% discount + bonus data for 3 months. Approved by Marketing Director.',
    detailZh: '向156名识别为高流失风险（概率>0.7）的高价值用户投放个性化维挽方案。方案包含8折优惠+3个月赠送流量。已获市场总监审批。',
    impactEn: '156 users, revenue protection ~¥280K/mo', impactZh: '156用户，收入保护~28万/月' },
  { id: 'AUD-008', time: '14:05:20', level: 5, agentEn: 'Event Assurance Agent', agentZh: '事件保障Agent', actEn: 'Emergency capacity expansion - Stadium', actZh: '紧急扩容 - 体育场', status: 'emergency', highRisk: true,
    detailEn: 'CRITICAL: Stadium event with 60K attendees causing network congestion. Auto-activated emergency capacity: +4 temporary cells, load balancing across 12 sectors, MLB enabled. VP Li approved within 5 minutes. HUMAN OVERSIGHT REQUIRED for duration.',
    detailZh: '严重：体育场6万人活动导致网络拥塞。自动激活紧急扩容：+4个临时小区，12扇区负载均衡，MLB已启用。VP李总5分钟内审批通过。活动期间需人工持续监控。',
    impactEn: '60K users, 16 cells affected — HUMAN INTERVENTION MANDATORY', impactZh: '6万用户，16小区受影响 — 必须人工干预' },
];

export default function Permissions() {
  const { t } = useText();
  const { scenario } = useScenario();
  const scenarioAudit = scenario?.auditLog ?? AUDIT_LOG;
  const scenarioKey = scenario?.meta.id ?? 'default';

  // Editable levels
  const [levels, setLevels] = useState(INIT_LEVELS);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LevelData | null>(null);
  // Editable matrix
  const [matrix, setMatrix] = useState(INIT_MATRIX);

  // Audit trail
  const [auditTick, setAuditTick] = useState(0);
  const [auditDetail, setAuditDetail] = useState<typeof AUDIT_LOG[0] | null>(null);
  useEffect(() => { const iv = setInterval(() => setAuditTick(p => p + 1), 1500); return () => clearInterval(iv); }, []);
  // Reset on scenario change
  useEffect(() => { setAuditTick(0); setAuditDetail(null); }, [scenarioKey]);

  const openEditLevel = (lv: LevelData) => {
    setEditingLevel(lv.level);
    setEditForm({ ...lv, opsEn: [...lv.opsEn], opsZh: [...lv.opsZh], rulesEn: [...lv.rulesEn], rulesZh: [...lv.rulesZh] });
  };
  const saveLevel = () => {
    if (!editForm) return;
    setLevels(prev => prev.map(l => l.level === editForm.level ? editForm : l));
    setEditingLevel(null);
    setEditForm(null);
  };

  const toggleMatrix = (opIdx: number, lvIdx: number) => {
    setMatrix(prev => prev.map((op, i) => {
      if (i !== opIdx) return op;
      const newLevels = [...op.levels];
      const cur = newLevels[lvIdx];
      // cycle: false -> true -> approval -> false
      newLevels[lvIdx] = cur === false ? true : cur === true ? 'approval' : false;
      return { ...op, levels: newLevels };
    }));
  };

  return (
    <div className="p-5 overflow-auto h-full space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-cyan" />
          {t('Permission Control', '权限控制')}
        </h1>
        <p className="text-xs text-text-muted mt-0.5">{t('Layered L1-L5 permission model — click any level to configure', '分层L1-L5权限模型 — 点击任意等级进行配置')}</p>
      </div>

      {/* ① Permission Levels with inline escalation */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Permission Levels & Escalation', '权限等级与升级策略')}</h2>
        <div className="grid grid-cols-5 gap-3">
          {levels.map((lv, lvIdx) => {
            const Icon = lv.icon;
            return (
              <div key={lv.level} className="bg-bg-card rounded-xl border border-border hover:border-accent-cyan/30 transition-all">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: lv.color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: lv.color }} />
                    </div>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{lv.level}</span>
                    <button onClick={() => openEditLevel(lv)} className="ml-auto text-text-muted hover:text-accent-cyan transition-colors cursor-pointer">
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">{t(lv.nameEn, lv.nameZh)}</h3>
                  <p className="text-[10px] text-text-muted mb-3 leading-relaxed">{t(lv.descEn, lv.descZh)}</p>
                  <div className="space-y-1.5 text-[10px]">
                    {(t('_', '中') === '_' ? lv.opsEn : lv.opsZh).slice(0, 3).map((op, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-text-secondary">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: lv.color }} /><span>{op}</span>
                      </div>
                    ))}
                    {lv.opsEn.length > 3 && <span className="text-text-muted">+{lv.opsEn.length - 3} {t('more', '更多')}</span>}
                  </div>
                  {/* Escalation inline */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1">
                      <ChevronRight className="w-3 h-3" style={{ color: lv.color }} />
                      <span className="font-medium">{t('Escalation', '升级')}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">{t(lv.escalationEn, lv.escalationZh)}</p>
                    {lvIdx < levels.length - 1 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{lv.level}</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: lv.color + '40' }} />
                        <ChevronRight className="w-3 h-3" style={{ color: levels[lvIdx + 1].color }} />
                        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded" style={{ backgroundColor: levels[lvIdx + 1].color + '20', color: levels[lvIdx + 1].color }}>L{levels[lvIdx + 1].level}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-text-muted">{t('Approval', '审批')}</span><span className="text-text-secondary">{t(lv.approvalEn, lv.approvalZh)}</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">{t('Agents', 'Agent数')}</span><span className="text-text-secondary">{lv.agentCount}</span></div>
                  </div>
                  {/* Rules — always visible */}
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">{t('Rules', '规则')}</p>
                    <div className="space-y-1">
                      {(t('_', '中') === '_' ? lv.rulesEn : lv.rulesZh).map((rule, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-text-secondary">
                          <Shield className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: lv.color }} />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-5">
        {/* ② Permission Matrix — editable */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            {t('Permission Matrix', '权限矩阵')}
            <span className="text-[10px] text-text-muted font-normal">({t('click cells to toggle', '点击单元格切换')})</span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-text-muted font-medium">{t('Operation', '操作')}</th>
                  {levels.map(lv => (
                    <th key={lv.level} className="px-3 py-2.5 text-center">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{lv.level}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.map((op, i) => (
                  <tr key={i} className="transition-colors hover:bg-bg-hover/30">
                    <td className="px-4 py-2 text-text-secondary flex items-center gap-1.5">
                      <span>{t(op.en, op.zh)}</span>
                      {op.highRisk && <span className="text-[8px] text-text-muted bg-bg-tertiary px-1 py-0.5 rounded ml-1 shrink-0">{t('HIGH RISK', '高风险')}</span>}
                    </td>
                    {op.levels.map((allowed, j) => (
                      <td key={j} className="px-3 py-2 text-center">
                        <button onClick={() => toggleMatrix(i, j)} className="cursor-pointer p-0.5 rounded hover:bg-bg-hover/50 transition-colors">
                          {allowed === true ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green mx-auto" />
                            : allowed === 'approval' ? <Clock className="w-3.5 h-3.5 text-status-yellow mx-auto" />
                            : <XCircle className="w-3.5 h-3.5 text-text-muted/30 mx-auto" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-status-green" /> {t('Allowed', '允许')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-status-yellow" /> {t('Approval Required', '需审批')}</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-text-muted/30" /> {t('Denied', '禁止')}</span>
            </div>
          </div>
        </section>

        {/* ③ Audit Trail — faster refresh + drill-down */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            {t('Audit Trail', '审计日志')}
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            <span className="text-xs text-text-muted font-normal">{t('Live · 1.5s refresh', '实时 · 1.5s刷新')}</span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {scenarioAudit.map((entry, i) => {
                const lv = levels[entry.level - 1];
                const sc = entry.status === 'approved' ? 'text-status-green bg-status-green/10'
                  : entry.status === 'executed' ? 'text-accent-cyan bg-accent-cyan/10'
                  : entry.status === 'pending' ? 'text-status-yellow bg-status-yellow/10'
                  : entry.status === 'emergency' ? 'text-status-red bg-status-red/10'
                  : entry.status === 'completed' ? 'text-status-green bg-status-green/10'
                  : 'text-text-muted bg-bg-tertiary';
                const active = (auditTick + i) % scenarioAudit.length === 0;
                return (
                  <div key={i}
                    onClick={() => setAuditDetail(entry)}
                    className={`px-4 py-2.5 flex items-center gap-3 transition-all duration-500 cursor-pointer hover:bg-bg-hover/30 ${active ? 'bg-accent-cyan/5' : ''} ${entry.highRisk ? 'border-l-2 border-l-status-red' : ''}`}>
                    <span className="text-[10px] text-text-muted font-mono w-14 shrink-0">{entry.time}</span>
                    <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{entry.level}</span>
                    {entry.highRisk && <AlertTriangle className="w-3 h-3 text-status-red shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${entry.highRisk ? 'text-status-red font-medium' : 'text-text-primary'}`}>{t(entry.actEn, entry.actZh)}</p>
                      <p className="text-[10px] text-text-muted">{t(entry.agentEn, entry.agentZh)}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${sc}`}>
                      {entry.status === 'approved' ? t('Approved', '已批准')
                        : entry.status === 'executed' ? t('Auto', '自动')
                        : entry.status === 'pending' ? t('Pending', '待审批')
                        : entry.status === 'emergency' ? t('Emergency', '紧急')
                        : entry.status === 'completed' ? t('Done', '完成')
                        : t('Info', '信息')}
                    </span>
                    <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Level Edit Modal */}
      {editingLevel !== null && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditingLevel(null); setEditForm(null); }}>
          <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2 py-1 rounded text-sm" style={{ backgroundColor: editForm.color + '20', color: editForm.color }}>L{editForm.level}</span>
                <h3 className="text-sm font-semibold text-text-primary">{t('Edit Permission Level', '编辑权限等级')}</h3>
              </div>
              <button onClick={() => { setEditingLevel(null); setEditForm(null); }} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Name (EN)', '名称（英文）')}</label>
                  <input className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none" value={editForm.nameEn} onChange={e => setEditForm({ ...editForm, nameEn: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Name (ZH)', '名称（中文）')}</label>
                  <input className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none" value={editForm.nameZh} onChange={e => setEditForm({ ...editForm, nameZh: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Description (EN)', '描述（英文）')}</label>
                  <textarea rows={2} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none resize-none" value={editForm.descEn} onChange={e => setEditForm({ ...editForm, descEn: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Description (ZH)', '描述（中文）')}</label>
                  <textarea rows={2} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none resize-none" value={editForm.descZh} onChange={e => setEditForm({ ...editForm, descZh: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Approval (EN)', '审批（英文）')}</label>
                  <input className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none" value={editForm.approvalEn} onChange={e => setEditForm({ ...editForm, approvalEn: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Agent Count', 'Agent数量')}</label>
                  <input type="number" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none" value={editForm.agentCount} onChange={e => setEditForm({ ...editForm, agentCount: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Escalation Rule (EN)', '升级规则（英文）')}</label>
                <input className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan focus:outline-none" value={editForm.escalationEn} onChange={e => setEditForm({ ...editForm, escalationEn: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Allowed Operations (EN, one per line)', '允许操作（英文，每行一个）')}</label>
                <textarea rows={4} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:border-accent-cyan focus:outline-none resize-none" value={editForm.opsEn.join('\n')} onChange={e => setEditForm({ ...editForm, opsEn: e.target.value.split('\n') })} />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{t('Rules & Constraints (EN, one per line)', '规则与约束（英文，每行一个）')}</label>
                <textarea rows={4} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:border-accent-cyan focus:outline-none resize-none" value={editForm.rulesEn.join('\n')} onChange={e => setEditForm({ ...editForm, rulesEn: e.target.value.split('\n') })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setEditingLevel(null); setEditForm(null); }}
                  className="px-4 py-2 text-xs text-text-muted border border-border rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">{t('Cancel', '取消')}</button>
                <button onClick={saveLevel}
                  className="px-4 py-2 text-xs text-white bg-accent-cyan rounded-lg hover:bg-accent-cyan/80 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Save className="w-3 h-3" />{t('Save', '保存')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {auditDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAuditDetail(null)}>
          <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${auditDetail.highRisk ? 'border-status-red/30 bg-status-red/5' : 'border-border'}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2 py-1 rounded text-xs" style={{ backgroundColor: levels[auditDetail.level - 1].color + '20', color: levels[auditDetail.level - 1].color }}>L{auditDetail.level}</span>
                {auditDetail.highRisk && <AlertTriangle className="w-4 h-4 text-status-red" />}
                <h3 className="text-sm font-semibold text-text-primary">{t('Audit Detail', '审计详情')}</h3>
                <span className="text-[10px] text-text-muted font-mono">{auditDetail.id}</span>
              </div>
              <button onClick={() => setAuditDetail(null)} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-primary rounded-lg border border-border p-3">
                  <p className="text-[10px] text-text-muted mb-1">{t('Time', '时间')}</p>
                  <p className="text-xs font-mono text-text-primary">{auditDetail.time}</p>
                </div>
                <div className="bg-bg-primary rounded-lg border border-border p-3">
                  <p className="text-[10px] text-text-muted mb-1">{t('Agent', '智能体')}</p>
                  <p className="text-xs text-text-primary">{t(auditDetail.agentEn, auditDetail.agentZh)}</p>
                </div>
                <div className="bg-bg-primary rounded-lg border border-border p-3">
                  <p className="text-[10px] text-text-muted mb-1">{t('Status', '状态')}</p>
                  <p className="text-xs font-medium" style={{ color: levels[auditDetail.level - 1].color }}>
                    {auditDetail.status === 'approved' ? t('Approved', '已批准')
                      : auditDetail.status === 'executed' ? t('Auto-executed', '自动执行')
                      : auditDetail.status === 'pending' ? t('Pending Approval', '待审批')
                      : auditDetail.status === 'emergency' ? t('Emergency', '紧急')
                      : auditDetail.status === 'completed' ? t('Completed', '已完成')
                      : t('Info', '信息')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('Action', '操作')}</p>
                <p className={`text-sm ${auditDetail.highRisk ? 'text-status-red font-medium' : 'text-text-primary'}`}>{t(auditDetail.actEn, auditDetail.actZh)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('Detail', '详情')}</p>
                <div className={`bg-bg-primary rounded-lg border p-3 text-xs text-text-secondary leading-relaxed ${auditDetail.highRisk ? 'border-status-red/30' : 'border-border'}`}>
                  {t(auditDetail.detailEn, auditDetail.detailZh)}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('Impact Assessment', '影响评估')}</p>
                <div className={`rounded-lg border p-3 text-xs font-medium ${auditDetail.highRisk ? 'bg-status-red/10 border-status-red/30 text-status-red' : 'bg-bg-primary border-border text-text-primary'}`}>
                  {t(auditDetail.impactEn, auditDetail.impactZh)}
                </div>
              </div>
              {auditDetail.highRisk && (
                <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-status-red shrink-0" />
                  <p className="text-xs text-status-red font-medium">{t('This operation is classified as HIGH RISK — human intervention and decision-making is mandatory before, during, or after execution.', '此操作被归类为高风险 — 执行前、执行中或执行后必须有人工干预与决策。')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
