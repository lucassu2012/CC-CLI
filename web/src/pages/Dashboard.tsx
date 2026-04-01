import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useText } from '../hooks/useText';
import { kpiMetrics, activeAlerts, recentTasks } from '../data/dashboard';
import { domainAgents } from '../data/agents';
import StatusBadge from '../components/StatusBadge';

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

export default function Dashboard() {
  const { t } = useText();

  return (
    <div className="p-5 space-y-5 overflow-auto h-full">
      {/* Domain Agent Status */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Domain Agent Status', '领域智能体状态')}</h2>
        <div className="grid grid-cols-5 gap-3">
          {domainAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/40 transition-all animate-fade-in"
            >
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={agent.status} size="md" />
                <span className="text-xs text-text-muted">{agent.subAgents.length} {t('sub-agents', '子智能体')}</span>
              </div>
              <h3 className="text-sm font-medium text-text-primary truncate">{t(agent.name, agent.nameZh)}</h3>
              <p className="text-xs text-text-muted mt-1">{t(agent.domain, agent.domainZh)}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-text-secondary">{agent.taskCount} {t('tasks', '任务')}</span>
                <span className={agent.successRate >= 97 ? 'text-status-green' : agent.successRate >= 95 ? 'text-status-yellow' : 'text-status-red'}>
                  {agent.successRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI Metrics */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('Key Performance Indicators', '关键性能指标')}</h2>
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {kpiMetrics.map((kpi) => {
            const TIcon = trendIcon[kpi.trend];
            const trendColor = kpi.trend === 'up' ? (kpi.id === 'alarm-count' ? 'text-status-red' : 'text-status-green') : kpi.trend === 'down' ? (kpi.id === 'alarm-count' || kpi.id === 'mttr' ? 'text-status-green' : 'text-status-red') : 'text-text-muted';
            const chartData = kpi.history.map((v, i) => ({ v, i }));
            const chartColor = trendColor.includes('green') ? '#22c55e' : trendColor.includes('red') ? '#ef4444' : '#64748b';

            return (
              <div key={kpi.id} className="bg-bg-card rounded-xl border border-border p-4 animate-fade-in">
                <p className="text-xs text-text-muted mb-1 truncate">{t(kpi.name, kpi.nameZh)}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-semibold text-text-primary">{kpi.value}</span>
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
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                        labelFormatter={() => ''}
                        formatter={(value) => [String(value), t(kpi.name, kpi.nameZh)]}
                      />
                      <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#grad-${kpi.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent Tasks */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('Recent Tasks', '最近任务')}
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {recentTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-colors">
                  {taskStatusIcon[task.status]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t(task.title, task.titleZh)}</p>
                    <p className="text-xs text-text-muted">{task.agent} &middot; {task.duration}</p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{task.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Active Alerts */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t('Active Alerts', '活跃告警')}
            <span className="ml-auto text-xs bg-status-red/20 text-status-red px-2 py-0.5 rounded-full">
              {activeAlerts.filter((a) => !a.acknowledged).length} {t('new', '新')}
            </span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-colors">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${severityColor[alert.severity]}`}>
                    {alert.severity.toUpperCase().slice(0, 4)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t(alert.title, alert.titleZh)}</p>
                    <p className="text-xs text-text-muted">{alert.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">{alert.timestamp}</p>
                    {alert.acknowledged && (
                      <span className="text-[10px] text-status-green">{t('ACK', '已确认')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
