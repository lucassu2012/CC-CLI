import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle,
  Clock, Loader2, Activity, X, ChevronRight, Zap, Radio,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useText } from '../hooks/useText';
import { kpiMetrics as kpiBase, activeAlerts, recentTasks } from '../data/dashboard';
import { domainAgents } from '../data/agents';
import StatusBadge from '../components/StatusBadge';

/* ─── helpers ─── */
const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
const severityColor: Record<string, string> = {
  critical: 'border-status-red text-status-red bg-status-red/10',
  major: 'border-status-orange text-status-orange bg-status-orange/10',
  warning: 'border-status-yellow text-status-yellow bg-status-yellow/10',
  minor: 'border-text-muted text-text-muted bg-text-muted/10',
};
const taskStatusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-status-green" />,
  running: <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />,
  failed: <XCircle className="w-4 h-4 text-status-red" />,
  queued: <Clock className="w-4 h-4 text-text-muted" />,
};

/* ─── Modal component ─── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Dashboard() {
  const { t } = useText();

  /* Live KPI animation: fluctuate values every 2 seconds */
  const [liveKpis, setLiveKpis] = useState(kpiBase);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setTick(t => t + 1);
      setLiveKpis(prev => prev.map(kpi => {
        const jitter = (Math.random() - 0.5) * 2;
        const scale = kpi.id === 'throughput' ? 5 : kpi.id === 'alarm-count' ? 2 : kpi.id === 'mttr' ? 0.3 : 0.1;
        let newVal = Math.round((kpi.value + jitter * scale) * 100) / 100;
        // Clamp percentage KPIs to valid range
        if (kpi.unit === '%') newVal = Math.min(newVal, 99.99);
        if (kpi.id === 'alarm-count') newVal = Math.max(0, Math.round(newVal));
        if (kpi.id === 'mttr') newVal = Math.max(0.1, newVal);
        const newHist = [...kpi.history.slice(1), newVal];
        return { ...kpi, value: newVal, history: newHist };
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  /* Live agent task count animation */
  const [agentTicks, setAgentTicks] = useState<Record<string, number>>({});
  useEffect(() => {
    const iv = setInterval(() => {
      const id = domainAgents[Math.floor(Math.random() * domainAgents.length)].id;
      setAgentTicks(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  /* Modals */
  const [taskModal, setTaskModal] = useState<typeof recentTasks[0] | null>(null);
  const [alertModal, setAlertModal] = useState<typeof activeAlerts[0] | null>(null);
  const [agentModal, setAgentModal] = useState<typeof domainAgents[0] | null>(null);

  /* Pulse indicator */
  const pulseClass = tick % 2 === 0 ? 'opacity-100' : 'opacity-60';

  return (
    <div className="p-5 space-y-5 overflow-auto h-full">
      {/* System status header with pulse */}
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-2 h-2 rounded-full bg-status-green transition-opacity duration-1000 ${pulseClass}`} />
        <span className="text-xs text-status-green font-medium">{t('System Online', '系统在线')}</span>
        <span className="text-xs text-text-muted">|</span>
        <Radio className="w-3 h-3 text-accent-cyan animate-pulse" />
        <span className="text-xs text-text-muted">{t('Real-time monitoring active', '实时监控运行中')}</span>
        <span className="text-xs text-text-muted ml-auto">TAOR Loop #{1247 + tick}</span>
      </div>

      {/* ① KPI Metrics (moved above agents per requirement) */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-cyan" />
          {t('Key Performance Indicators', '关键性能指标')}
          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
          <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
        </h2>
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {liveKpis.map(kpi => {
            const TIcon = trendIcon[kpi.trend];
            const trendColor = kpi.trend === 'up' ? (kpi.id === 'alarm-count' ? 'text-status-red' : 'text-status-green') : kpi.trend === 'down' ? (kpi.id === 'alarm-count' || kpi.id === 'mttr' ? 'text-status-green' : 'text-status-red') : 'text-text-muted';
            const chartData = kpi.history.map((v, i) => ({ v, i }));
            const chartColor = trendColor.includes('green') ? '#22c55e' : trendColor.includes('red') ? '#ef4444' : '#64748b';

            return (
              <div key={kpi.id} className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/30 transition-all group">
                <p className="text-xs text-text-muted mb-1 truncate">{t(kpi.name, kpi.nameZh)}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-semibold text-text-primary tabular-nums transition-all duration-500">{kpi.value}</span>
                    <span className="text-xs text-text-muted ml-1">{kpi.unit}</span>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                    <TIcon className="w-3 h-3" />
                    <span>{kpi.change > 0 ? '+' : ''}{kpi.change}</span>
                  </div>
                </div>
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#f1f5f9' }} labelFormatter={() => ''} formatter={v => [String(v), t(kpi.name, kpi.nameZh)]} />
                      <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#grad-${kpi.id})`} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ② Domain Agent Status (clickable to drill into sub-agents) */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Domain Agent Status', '领域智能体状态')}</h2>
        <div className="grid grid-cols-5 gap-3">
          {domainAgents.map(agent => (
            <div key={agent.id}
              onClick={() => setAgentModal(agent)}
              className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/40 transition-all cursor-pointer group relative overflow-hidden">
              {/* Animated scan line */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent animate-pulse" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={agent.status} size="md" />
                <span className="text-xs text-text-muted">{agent.subAgents.length} {t('sub-agents', '子Agent')}</span>
              </div>
              <h3 className="text-sm font-medium text-text-primary truncate">{t(agent.name, agent.nameZh)}</h3>
              <p className="text-xs text-text-muted mt-1">{t(agent.domain, agent.domainZh)}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-text-secondary tabular-nums">{agent.taskCount + (agentTicks[agent.id] || 0)} {t('tasks', '任务')}</span>
                <span className={agent.successRate >= 97 ? 'text-status-green' : agent.successRate >= 95 ? 'text-status-yellow' : 'text-status-red'}>
                  {agent.successRate}%
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                {t('Click to view sub-agents', '点击查看子Agent')} <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-5">
        {/* ③ Recent Tasks (clickable) */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('Recent Tasks', '最近任务')}
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {recentTasks.map(task => (
                <div key={task.id} onClick={() => setTaskModal(task)}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-colors cursor-pointer group">
                  {taskStatusIcon[task.status]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t(task.title, task.titleZh)}</p>
                    <p className="text-xs text-text-muted">{task.agent} · {task.duration}</p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{task.timestamp}</span>
                  <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Active Alerts (clickable) */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t('Active Alerts', '活跃告警')}
            <span className="ml-auto text-xs bg-status-red/20 text-status-red px-2 py-0.5 rounded-full animate-pulse">
              {activeAlerts.filter(a => !a.acknowledged).length} {t('new', '新')}
            </span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {activeAlerts.map(alert => (
                <div key={alert.id} onClick={() => setAlertModal(alert)}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-colors cursor-pointer group">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${severityColor[alert.severity]}`}>
                    {alert.severity === 'critical' ? 'CRIT' : alert.severity === 'major' ? 'MAJR' : alert.severity === 'warning' ? 'WARN' : 'MINR'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t(alert.title, alert.titleZh)}</p>
                    <p className="text-xs text-text-muted">{alert.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">{alert.timestamp}</p>
                    {alert.acknowledged && <span className="text-[10px] text-status-green">{t('ACK', '已确认')}</span>}
                  </div>
                  <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ─── Agent drill-down modal ─── */}
      <Modal open={!!agentModal} onClose={() => setAgentModal(null)} title={agentModal ? t(agentModal.name, agentModal.nameZh) + ' — ' + t('Sub-Agent Details', '子Agent详情') : ''}>
        {agentModal && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={agentModal.status} size="md" />
              <div>
                <div className="text-sm font-medium text-text-primary">{t(agentModal.name, agentModal.nameZh)}</div>
                <div className="text-xs text-text-muted">{t(agentModal.domain, agentModal.domainZh)} · {agentModal.taskCount} {t('tasks', '任务')} · {agentModal.successRate}% {t('success', '成功率')}</div>
              </div>
            </div>
            <div className="text-xs text-text-muted mb-2">{t('Sub-Agents', '子Agent列表')}:</div>
            {agentModal.subAgents.map((sub: any) => (
              <div key={sub.id} className="bg-bg-primary rounded-lg border border-border p-3 flex items-center gap-3">
                <StatusBadge status={sub.status || 'active'} size="sm" />
                <div className="flex-1">
                  <div className="text-sm text-text-primary">{t(sub.name, sub.nameZh)}</div>
                  <div className="text-xs text-text-muted">{t(sub.description || '', sub.descriptionZh || sub.description || '')}</div>
                </div>
                <div className="text-xs text-text-muted tabular-nums">{sub.taskCount || Math.floor(Math.random() * 50 + 10)} {t('tasks', '任务')}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ─── Task detail modal ─── */}
      <Modal open={!!taskModal} onClose={() => setTaskModal(null)} title={taskModal ? t(taskModal.title, taskModal.titleZh) : ''}>
        {taskModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {taskStatusIcon[taskModal.status]}
              <span className="text-sm font-medium text-text-primary capitalize">{taskModal.status}</span>
              <span className="text-xs text-text-muted">· {taskModal.agent} · {taskModal.duration}</span>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Detail', '详情')}</div>
              <div className="text-sm text-text-secondary bg-bg-primary rounded-lg p-3 border border-border">{t(taskModal.detail, taskModal.detailZh)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Result', '结果')}</div>
              <div className="text-sm text-status-green bg-bg-primary rounded-lg p-3 border border-border">{t(taskModal.result, taskModal.resultZh)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Alert detail modal ─── */}
      <Modal open={!!alertModal} onClose={() => setAlertModal(null)} title={alertModal ? t(alertModal.title, alertModal.titleZh) : ''}>
        {alertModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-1 rounded border ${severityColor[alertModal.severity]}`}>{alertModal.severity.toUpperCase()}</span>
              <span className="text-xs text-text-muted">{alertModal.timestamp}</span>
              {alertModal.acknowledged && <span className="text-xs text-status-green bg-status-green/10 px-2 py-0.5 rounded">{t('Acknowledged', '已确认')}</span>}
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Source', '来源')}</div>
              <div className="text-sm text-text-secondary">{alertModal.source}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Detail', '详情')}</div>
              <div className="text-sm text-text-secondary bg-bg-primary rounded-lg p-3 border border-border">{t(alertModal.detail, alertModal.detailZh)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Affected Scope', '影响范围')}</div>
              <div className="text-sm text-text-secondary">{t(alertModal.affectedScope, alertModal.affectedScopeZh)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
