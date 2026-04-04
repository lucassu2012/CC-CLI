import { useState, useEffect } from 'react';
import { Shield, Eye, Settings, CheckCircle2, XCircle, ArrowUp, Clock, Activity, Unlock } from 'lucide-react';
import { useText } from '../hooks/useText';

const LEVELS = [
  {
    level: 1, color: '#22c55e',
    nameEn: 'Read-Only Monitoring', nameZh: '只读监控',
    descEn: 'View KPIs, dashboards, alarms. No write operations.', descZh: '查看KPI、仪表盘、告警。不允许写操作。',
    icon: Eye, approvalEn: 'None', approvalZh: '无需审批', agentCount: 2,
    opsEn: ['View real-time KPIs', 'Access dashboards', 'Read alarm history', 'Export reports'],
    opsZh: ['查看实时KPI', '访问仪表盘', '读取告警历史', '导出报告'],
  },
  {
    level: 2, color: '#06b6d4',
    nameEn: 'Analysis & Recommendations', nameZh: '分析与建议',
    descEn: 'Run analytics, generate reports, suggest changes.', descZh: '运行分析、生成报告、建议参数变更。',
    icon: Activity, approvalEn: 'None', approvalZh: '无需审批', agentCount: 5,
    opsEn: ['Run analytical queries', 'Generate optimization suggestions', 'Create simulation scenarios', 'Produce trend reports'],
    opsZh: ['运行分析查询', '生成优化建议', '创建仿真场景', '产出趋势报告'],
  },
  {
    level: 3, color: '#eab308',
    nameEn: 'Supervised Execution', nameZh: '监督执行',
    descEn: 'Execute parameter changes with human approval workflow.', descZh: '在人工审批流程下执行参数变更。',
    icon: Settings, approvalEn: 'NOC Engineer', approvalZh: 'NOC工程师审批', agentCount: 9,
    opsEn: ['Execute approved changes', 'Deploy configurations', 'Create work orders', 'Trigger optimization cycles'],
    opsZh: ['执行已审批变更', '部署配置', '创建工单', '触发优化周期'],
  },
  {
    level: 4, color: '#f97316',
    nameEn: 'Autonomous Execution', nameZh: '自主执行',
    descEn: 'Auto-fix within defined boundaries. Post-audit required.', descZh: '在定义边界内自动修复。需事后审计。',
    icon: Unlock, approvalEn: 'Post-audit', approvalZh: '事后审计', agentCount: 5,
    opsEn: ['Autonomous parameter tuning', 'Auto-repair within boundaries', 'Self-healing fixes', 'Batch optimization deployment'],
    opsZh: ['自主参数调优', '边界内自动修复', '自愈网络修复', '批量优化部署'],
  },
  {
    level: 5, color: '#ef4444',
    nameEn: 'Full Autonomy', nameZh: '完全自主',
    descEn: 'Emergency response, cross-domain orchestration. Human override only.', descZh: '紧急响应、跨域编排。仅支持人工覆盖。',
    icon: Shield, approvalEn: 'VP + Emergency', approvalZh: 'VP+紧急授权', agentCount: 1,
    opsEn: ['Emergency cross-domain response', 'Full network orchestration', 'Override safety boundaries', 'Autonomous escalation'],
    opsZh: ['紧急跨域响应', '全网编排', '覆盖安全边界', '自主升级'],
  },
];

const MATRIX_OPS = [
  { en: 'View metrics', zh: '查看指标', levels: [true, true, true, true, true] },
  { en: 'Run analysis', zh: '运行分析', levels: [false, true, true, true, true] },
  { en: 'Suggest changes', zh: '建议变更', levels: [false, true, true, true, true] },
  { en: 'Execute changes', zh: '执行变更', levels: [false, false, 'approval', true, true] },
  { en: 'Auto-fix', zh: '自动修复', levels: [false, false, false, true, true] },
  { en: 'Cross-domain ops', zh: '跨域操作', levels: [false, false, false, false, true] },
  { en: 'Emergency override', zh: '紧急覆盖', levels: [false, false, false, false, true] },
  { en: 'Create work orders', zh: '创建工单', levels: [false, false, true, true, true] },
  { en: 'Batch deployment', zh: '批量部署', levels: [false, false, false, true, true] },
];

const AUDIT_LOG = [
  { time: '14:23:05', level: 3, agentEn: 'Engineering Opt Agent', agentZh: '工程优化Agent', actEn: 'Parameter change on GD-TN-005 (approved)', actZh: '参数变更 GD-TN-005（已审批）', status: 'approved' },
  { time: '14:21:42', level: 4, agentEn: 'Real-time Opt Agent', agentZh: '实时优化Agent', actEn: 'Interference mitigation Baiyun cells (auto)', actZh: '白云区干扰抑制（自动执行）', status: 'executed' },
  { time: '14:19:18', level: 2, agentEn: 'Value Insight Agent', agentZh: '价值洞察Agent', actEn: 'Generated coverage analysis report', actZh: '生成覆盖分析报告', status: 'completed' },
  { time: '14:17:55', level: 3, agentEn: 'Fault Analysis Agent', agentZh: '故障分析Agent', actEn: 'Root cause fix BTS-GD-012 (pending)', actZh: '根因修复 BTS-GD-012（待审批）', status: 'pending' },
  { time: '14:15:30', level: 1, agentEn: 'O&M Monitor Agent', agentZh: '运维监控Agent', actEn: 'KPI threshold alert - Haizhu throughput', actZh: 'KPI阈值告警 - 海珠区吞吐量', status: 'info' },
  { time: '14:12:08', level: 4, agentEn: 'Deterministic Exp Agent', agentZh: '确定性体验Agent', actEn: 'QoS priority adjust for VIP user (auto)', actZh: 'VIP用户QoS优先级调整（自动）', status: 'executed' },
  { time: '14:08:44', level: 3, agentEn: 'Churn Prevention Agent', agentZh: '离网维挽Agent', actEn: 'Retention offer deployment (approved)', actZh: '维挽方案投放（已审批）', status: 'approved' },
  { time: '14:05:20', level: 5, agentEn: 'Event Assurance Agent', agentZh: '事件保障Agent', actEn: 'Emergency capacity expansion - Stadium (VP)', actZh: '紧急扩容 - 体育场（VP已批准）', status: 'emergency' },
];

export default function Permissions() {
  const { t } = useText();
  const [auditTick, setAuditTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setAuditTick(p => p + 1), 3000); return () => clearInterval(iv); }, []);

  return (
    <div className="p-5 overflow-auto h-full space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-cyan" />
          {t('Permission Control', '权限控制')}
        </h1>
        <p className="text-xs text-text-muted mt-0.5">{t('Layered L1-L5 permission model for Agent operations', '分层L1-L5权限模型，管控Agent操作权限')}</p>
      </div>

      {/* ① Permission Levels */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Permission Levels', '权限等级')}</h2>
        <div className="grid grid-cols-5 gap-3">
          {LEVELS.map(lv => {
            const Icon = lv.icon;
            return (
              <div key={lv.level} className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: lv.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: lv.color }} />
                  </div>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{lv.level}</span>
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1">{t(lv.nameEn, lv.nameZh)}</h3>
                <p className="text-[10px] text-text-muted mb-3 leading-relaxed">{t(lv.descEn, lv.descZh)}</p>
                <div className="space-y-1.5 text-[10px]">
                  {(t(lv.opsEn[0], lv.opsZh[0]) === lv.opsEn[0] ? lv.opsEn : lv.opsZh).map((op, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-text-secondary">
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: lv.color }} /><span>{op}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-text-muted">{t('Approval', '审批')}</span><span className="text-text-secondary">{t(lv.approvalEn, lv.approvalZh)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Agents', 'Agent数')}</span><span className="text-text-secondary">{lv.agentCount}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ② Escalation Flow */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Escalation Flow', '升级流程')}</h2>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            {LEVELS.map((lv, i) => (
              <div key={lv.level} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2" style={{ borderColor: lv.color, backgroundColor: lv.color + '15' }}>
                    <span className="text-sm font-bold" style={{ color: lv.color }}>L{lv.level}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2 text-center w-24">{t(lv.nameEn, lv.nameZh)}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{t(lv.approvalEn, lv.approvalZh)}</p>
                </div>
                {i < LEVELS.length - 1 && (
                  <div className="flex items-center mx-2 mb-8">
                    <div className="w-12 h-px bg-border" /><ArrowUp className="w-4 h-4 text-text-muted rotate-90" /><div className="w-12 h-px bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-5">
        {/* ③ Permission Matrix */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Permission Matrix', '权限矩阵')}</h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-text-muted font-medium">{t('Operation', '操作')}</th>
                  {LEVELS.map(lv => (
                    <th key={lv.level} className="px-3 py-2.5 text-center">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{lv.level}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MATRIX_OPS.map((op, i) => (
                  <tr key={i} className="hover:bg-bg-hover/30 transition-colors">
                    <td className="px-4 py-2 text-text-secondary">{t(op.en, op.zh)}</td>
                    {op.levels.map((allowed, j) => (
                      <td key={j} className="px-3 py-2 text-center">
                        {allowed === true ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green mx-auto" />
                          : allowed === 'approval' ? <Clock className="w-3.5 h-3.5 text-status-yellow mx-auto" />
                          : <XCircle className="w-3.5 h-3.5 text-text-muted/30 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ④ Audit Trail */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            {t('Audit Trail', '审计日志')}
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {AUDIT_LOG.map((entry, i) => {
                const lv = LEVELS[entry.level - 1];
                const sc = entry.status === 'approved' ? 'text-status-green bg-status-green/10'
                  : entry.status === 'executed' ? 'text-accent-cyan bg-accent-cyan/10'
                  : entry.status === 'pending' ? 'text-status-yellow bg-status-yellow/10'
                  : entry.status === 'emergency' ? 'text-status-red bg-status-red/10'
                  : entry.status === 'completed' ? 'text-status-green bg-status-green/10'
                  : 'text-text-muted bg-bg-tertiary';
                const active = (auditTick + i) % AUDIT_LOG.length === 0;
                return (
                  <div key={i} className={`px-4 py-2.5 flex items-center gap-3 transition-all duration-500 ${active ? 'bg-accent-cyan/5' : ''}`}>
                    <span className="text-[10px] text-text-muted font-mono w-14 shrink-0">{entry.time}</span>
                    <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: lv.color + '20', color: lv.color }}>L{entry.level}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary truncate">{t(entry.actEn, entry.actZh)}</p>
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
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
