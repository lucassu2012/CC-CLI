import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle,
  Clock, Loader2, Activity, X, ChevronRight, Zap, Radio, Plug, Users, ChevronDown,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useText } from '../hooks/useText';
import { kpiMetrics as kpiBase, activeAlerts, recentTasks, extraTasks, extraAlerts, type TaskItem, type AlertItem } from '../data/dashboard';
import { domainAgents, type SubAgent } from '../data/agents';
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

  /* Dynamic task rotation */
  const [liveTasks, setLiveTasks] = useState<TaskItem[]>(recentTasks.slice(0, 6));
  const extraTaskIdx = useRef(0);
  const taskScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveTasks(prev => {
        const pool = extraTasks;
        const newTask = { ...pool[extraTaskIdx.current % pool.length], id: `TSK-D${Date.now()}`, timestamp: '刚刚' };
        extraTaskIdx.current++;
        // Remove oldest completed, add new at top
        const updated = [newTask, ...prev.filter(t => t.status !== 'completed' || prev.indexOf(t) < 4)];
        // Mark a running task as completed randomly
        const running = updated.filter(t => t.status === 'running' && t.id !== newTask.id);
        if (running.length > 1) {
          const toComplete = running[Math.floor(Math.random() * running.length)];
          const idx = updated.findIndex(t => t.id === toComplete.id);
          if (idx >= 0) updated[idx] = { ...toComplete, status: 'completed', result: 'Auto-completed', resultZh: '已自动完成' };
        }
        return updated.slice(0, 8);
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  /* Dynamic alert rotation */
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>(activeAlerts.slice(0, 6));
  const extraAlertIdx = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveAlerts(prev => {
        const pool = extraAlerts;
        const newAlert = { ...pool[extraAlertIdx.current % pool.length], id: `ALM-D${Date.now()}`, timestamp: '刚刚' };
        extraAlertIdx.current++;
        // Acknowledge an existing one randomly
        const unacked = prev.filter(a => !a.acknowledged);
        const updated = [newAlert, ...prev];
        if (unacked.length > 1) {
          const toAck = unacked[Math.floor(Math.random() * unacked.length)];
          const idx = updated.findIndex(a => a.id === toAck.id);
          if (idx >= 0) updated[idx] = { ...toAck, acknowledged: true };
        }
        return updated.slice(0, 8);
      });
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  /* Modals */
  const [taskModal, setTaskModal] = useState<TaskItem | null>(null);
  const [alertModal, setAlertModal] = useState<AlertItem | null>(null);
  const [agentModal, setAgentModal] = useState<typeof domainAgents[0] | null>(null);
  const [subAgentModal, setSubAgentModal] = useState<SubAgent | null>(null);
  const [subTaskDetail, setSubTaskDetail] = useState<{ title: string; status: string; start: string; elapsed: string } | null>(null);
  const [subAlarmDetail, setSubAlarmDetail] = useState<{ severity: string; title: string; time: string; status: string } | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);

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

      {/* ②-0 Connected External Systems */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Plug className="w-4 h-4 text-accent-cyan" />
          {t('Connected Systems', '外部系统连接')}
          <span className="ml-2 text-xs bg-status-green/20 text-status-green px-2 py-0.5 rounded-full">
            6/6 {t('Online', '在线')}
          </span>
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {[
            { id: 'oss', name: 'OSS平台', nameEn: 'OSS Platform', color: '#f97316', status: 'connected', latency: 12, api: 'CORBA/MTOSI', tasks: 1247 },
            { id: 'ticket', name: '工单系统', nameEn: 'Ticket/ITSM', color: '#8b5cf6', status: 'connected', latency: 8, api: 'REST API', tasks: 892 },
            { id: 'smartcare', name: 'SmartCare', nameEn: 'Huawei CEM', color: '#ec4899', status: 'connected', latency: 23, api: 'Northbound', tasks: 456 },
            { id: 'autin', name: 'AUTIN', nameEn: 'Huawei ADN', color: '#06b6d4', status: 'connected', latency: 18, api: 'Intent API', tasks: 334 },
            { id: 'crm', name: 'CRM系统', nameEn: 'CRM System', color: '#10b981', status: 'connected', latency: 15, api: 'REST API', tasks: 2103 },
            { id: 'bss', name: 'BSS/计费', nameEn: 'BSS/Billing', color: '#eab308', status: 'connected', latency: 11, api: 'SOAP/REST', tasks: 1578 },
          ].map(sys => (
            <div key={sys.id} className="bg-bg-card rounded-xl border border-border p-3 hover:border-accent-cyan/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: sys.color }} />
                <span className="text-xs font-medium text-text-primary truncate">{sys.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-status-green ml-auto shrink-0" />
              </div>
              <p className="text-[10px] text-text-muted mb-2">{sys.nameEn}</p>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-text-muted">{t('Protocol', '协议')}</span><span className="text-text-secondary font-mono">{sys.api}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{t('Latency', '延迟')}</span><span className="text-status-green">{sys.latency}ms</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{t('Calls/24h', '调用/24h')}</span><span className="text-text-secondary tabular-nums">{sys.tasks.toLocaleString()}</span></div>
              </div>
            </div>
          ))}
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
        {/* ③ Recent Tasks (dynamic, clickable) */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('Recent Tasks', '最近任务')}
            <span className="ml-2 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
            <span className="ml-auto text-xs text-text-muted tabular-nums">{liveTasks.filter(tt => tt.status === 'running').length} {t('running', '运行中')}</span>
          </h2>
          <div ref={taskScrollRef} className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {liveTasks.map(task => (
                <div key={task.id} onClick={() => { setTaskModal(task); setCollabOpen(false); }}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-all duration-500 cursor-pointer group animate-fadeIn">
                  {taskStatusIcon[task.status]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t(task.title, task.titleZh)}</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{task.agent}</span>
                      {task.collaborators && task.collaborators.length > 0 && (
                        <span className="flex items-center gap-0.5 text-accent-cyan/70">
                          <Users className="w-3 h-3" />+{task.collaborators.length}
                        </span>
                      )}
                      <span>· {task.duration}</span>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{task.timestamp}</span>
                  <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Active Alerts (dynamic, clickable) */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t('Active Alerts', '活跃告警')}
            <span className="ml-2 w-1.5 h-1.5 rounded-full bg-status-red animate-pulse" />
            <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
            <span className="ml-auto text-xs bg-status-red/20 text-status-red px-2 py-0.5 rounded-full animate-pulse">
              {liveAlerts.filter(a => !a.acknowledged).length} {t('new', '新')}
            </span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {liveAlerts.map(alert => (
                <div key={alert.id} onClick={() => setAlertModal(alert)}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover/50 transition-all duration-500 cursor-pointer group animate-fadeIn">
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
            {agentModal.subAgents.map((sub) => (
              <div key={sub.id} onClick={() => setSubAgentModal(sub)}
                className="bg-bg-primary rounded-lg border border-border p-3 flex items-center gap-3 hover:bg-bg-hover/50 hover:border-accent-cyan/30 cursor-pointer transition-colors group">
                <StatusBadge status={sub.status || 'active'} size="sm" />
                <div className="flex-1">
                  <div className="text-sm text-text-primary">{t(sub.name, sub.nameZh)}</div>
                  <div className="text-xs text-text-muted">{t(sub.currentTask, sub.currentTaskZh)}</div>
                </div>
                <div className="text-xs text-text-muted tabular-nums">{sub.toolCalls.toLocaleString()} {t('calls', '调用')}</div>
                <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ─── Sub-Agent drill-down modal ─── */}
      <Modal open={!!subAgentModal} onClose={() => setSubAgentModal(null)} title={subAgentModal ? t(subAgentModal.name, subAgentModal.nameZh) : ''}>
        {subAgentModal && (() => {
          // Generate realistic task & alarm data based on the sub-agent
          const subTasks = [
            { id: 't1', status: 'running' as const, title: t(subAgentModal.currentTask, subAgentModal.currentTaskZh), start: '14:20:03', elapsed: '2m 15s' },
            { id: 't2', status: 'completed' as const, title: subAgentModal.id.includes('opt') ? t('Parameter optimization batch #2847', '参数优化批次 #2847') : subAgentModal.id.includes('monitor') ? t('Routine health check - East Zone', '常规健康检查 - 东区') : subAgentModal.id.includes('complaint') ? t('Complaint trend analysis - Tianhe', '投诉趋势分析 - 天河区') : subAgentModal.id.includes('lead') ? t('Lead scoring refresh cycle', '潜客评分刷新周期') : t('Capacity simulation run #189', '容量仿真运行 #189'), start: '14:15:20', elapsed: '4m 43s' },
            { id: 't3', status: 'completed' as const, title: subAgentModal.id.includes('fault') ? t('Root cause analysis BTS-GD-012', '根因分析 BTS-GD-012') : subAgentModal.id.includes('market') ? t('Real-time push campaign #56', '实时推送活动 #56') : t('KPI baseline comparison', 'KPI基线对比'), start: '14:08:11', elapsed: '7m 09s' },
            { id: 't4', status: 'queued' as const, title: subAgentModal.id.includes('exp') ? t('Experience SLA verification', '体验SLA验证') : t('Scheduled maintenance check', '定时维护检查'), start: '—', elapsed: '—' },
          ];
          const subAlarms = [
            { id: 'a1', severity: subAgentModal.status === 'active' ? 'warning' : 'major', title: subAgentModal.id.includes('opt') ? t('PRB utilization >85% on 3 cells', '3个小区PRB利用率>85%') : subAgentModal.id.includes('monitor') ? t('Temperature alert on BTS-GD-018', 'BTS-GD-018温度告警') : subAgentModal.id.includes('complaint') ? t('MOS degradation trend detected', '检测到MOS下降趋势') : t('Unusual traffic pattern detected', '检测到异常流量模式'), time: '14:18:30', status: 'processing' },
            { id: 'a2', severity: 'minor', title: subAgentModal.id.includes('fault') ? t('Intermittent link flap GD-TN-009', 'GD-TN-009链路间歇性抖动') : t('Threshold approaching on cell GZ-045', '小区GZ-045指标接近阈值'), time: '14:05:12', status: 'resolved' },
          ];
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={subAgentModal.status} size="md" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{t(subAgentModal.name, subAgentModal.nameZh)}</div>
                  <div className="text-xs text-text-muted">{t('Permission', '权限')}: L{subAgentModal.permissionLevel} · {t('Success Rate', '成功率')}: {subAgentModal.successRate}% · {subAgentModal.toolCalls.toLocaleString()} {t('tool calls', '工具调用')}</div>
                </div>
              </div>

              {/* Running Tasks */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> {t('Running Tasks', '运行中任务')}
                </h4>
                <div className="space-y-1.5">
                  {subTasks.map(task => (
                    <div key={task.id} onClick={(e) => { e.stopPropagation(); setSubTaskDetail(task); }}
                      className="bg-bg-primary rounded-lg border border-border px-3 py-2 flex items-center gap-2.5 hover:bg-bg-hover/50 hover:border-accent-cyan/30 cursor-pointer transition-colors group/task">
                      {task.status === 'running' ? <Loader2 className="w-3.5 h-3.5 text-accent-cyan animate-spin shrink-0" />
                        : task.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary truncate">{task.title}</p>
                      </div>
                      <span className="text-[10px] text-text-muted shrink-0">{task.start}</span>
                      <span className="text-[10px] text-text-muted shrink-0 w-12 text-right">{task.elapsed}</span>
                      <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Alarms */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> {t('Related Alarms', '关联告警')}
                </h4>
                <div className="space-y-1.5">
                  {subAlarms.map(alarm => (
                    <div key={alarm.id} onClick={(e) => { e.stopPropagation(); setSubAlarmDetail(alarm); }}
                      className="bg-bg-primary rounded-lg border border-border px-3 py-2 flex items-center gap-2.5 hover:bg-bg-hover/50 hover:border-accent-cyan/30 cursor-pointer transition-colors group/alarm">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${severityColor[alarm.severity] || severityColor['minor']}`}>
                        {alarm.severity === 'major' ? 'MAJR' : alarm.severity === 'warning' ? 'WARN' : 'MINR'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary truncate">{alarm.title}</p>
                      </div>
                      <span className="text-[10px] text-text-muted shrink-0">{alarm.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${alarm.status === 'processing' ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-status-green/10 text-status-green'}`}>
                        {alarm.status === 'processing' ? t('Processing', '处理中') : t('Resolved', '已解决')}
                      </span>
                      <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover/alarm:opacity-100 transition-opacity shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Task detail modal (rich) ─── */}
      <Modal open={!!taskModal} onClose={() => { setTaskModal(null); setCollabOpen(false); }} title={taskModal ? t(taskModal.title, taskModal.titleZh) : ''}>
        {taskModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {taskStatusIcon[taskModal.status]}
              <span className="text-sm font-medium text-text-primary capitalize">{taskModal.status}</span>
              <span className="text-xs text-text-muted">· {taskModal.duration}</span>
              <span className="text-xs text-text-muted">{taskModal.timestamp}</span>
            </div>

            {/* Lead Agent */}
            <div>
              <div className="text-xs text-text-muted mb-1.5">{t('Lead Agent', '主导Agent')}</div>
              <div className="bg-bg-primary rounded-lg border border-accent-cyan/30 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-accent-cyan" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-accent-cyan">{taskModal.agent}</div>
                  <div className="text-[10px] text-text-muted">{t('Primary executor', '主要执行者')}</div>
                </div>
                <span className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-full">{t('Lead', '主导')}</span>
              </div>
            </div>

            {/* Collaborating Agents */}
            {taskModal.collaborators && taskModal.collaborators.length > 0 && (
              <div>
                <button onClick={() => setCollabOpen(!collabOpen)}
                  className="text-xs text-text-muted mb-1.5 flex items-center gap-1 cursor-pointer hover:text-text-secondary transition-colors">
                  <Users className="w-3 h-3" />
                  {t('Collaborating Agents', '协同Agent')} ({taskModal.collaborators.length})
                  <ChevronDown className={`w-3 h-3 transition-transform ${collabOpen ? 'rotate-180' : ''}`} />
                </button>
                {collabOpen && (
                  <div className="space-y-1.5">
                    {taskModal.collaborators.map((collab, i) => (
                      <div key={i} className="bg-bg-primary rounded-lg border border-border p-2.5 flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-text-primary">{collab}</div>
                        </div>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">{t('Assist', '协同')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-xs text-text-muted mb-1">{t('Detail', '详情')}</div>
              <div className="text-sm text-text-secondary bg-bg-primary rounded-lg p-3 border border-border">{t(taskModal.detail, taskModal.detailZh)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Result', '结果')}</div>
              <div className={`text-sm bg-bg-primary rounded-lg p-3 border border-border ${taskModal.status === 'completed' ? 'text-status-green' : taskModal.status === 'failed' ? 'text-status-red' : 'text-accent-cyan'}`}>
                {t(taskModal.result, taskModal.resultZh)}
              </div>
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

      {/* ─── Sub-agent task detail modal ─── */}
      <Modal open={!!subTaskDetail} onClose={() => setSubTaskDetail(null)} title={subTaskDetail?.title || ''}>
        {subTaskDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {subTaskDetail.status === 'running' ? <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
                : subTaskDetail.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-status-green" />
                : <Clock className="w-4 h-4 text-text-muted" />}
              <span className="text-sm font-medium text-text-primary capitalize">{subTaskDetail.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-primary rounded-lg border border-border p-3">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{t('Start Time', '开始时间')}</div>
                <div className="text-sm text-text-primary font-mono">{subTaskDetail.start}</div>
              </div>
              <div className="bg-bg-primary rounded-lg border border-border p-3">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{t('Elapsed', '已耗时')}</div>
                <div className="text-sm text-text-primary font-mono">{subTaskDetail.elapsed}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Task Description', '任务描述')}</div>
              <div className="text-sm text-text-secondary bg-bg-primary rounded-lg p-3 border border-border">{subTaskDetail.title}</div>
            </div>
            {subTaskDetail.status === 'running' && (
              <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-accent-cyan">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('Task is currently executing. Results will be available upon completion.', '任务正在执行中，完成后将显示结果。')}
                </div>
              </div>
            )}
            {subTaskDetail.status === 'completed' && (
              <div className="bg-status-green/5 border border-status-green/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-status-green">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('Task completed successfully. All outputs verified.', '任务已成功完成。所有输出已验证。')}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Sub-agent alarm detail modal ─── */}
      <Modal open={!!subAlarmDetail} onClose={() => setSubAlarmDetail(null)} title={subAlarmDetail?.title || ''}>
        {subAlarmDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-1 rounded border ${severityColor[subAlarmDetail.severity] || severityColor['minor']}`}>
                {subAlarmDetail.severity.toUpperCase()}
              </span>
              <span className="text-xs text-text-muted">{subAlarmDetail.time}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${subAlarmDetail.status === 'processing' ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-status-green/10 text-status-green'}`}>
                {subAlarmDetail.status === 'processing' ? t('Processing', '处理中') : t('Resolved', '已解决')}
              </span>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">{t('Alarm Description', '告警描述')}</div>
              <div className="text-sm text-text-secondary bg-bg-primary rounded-lg p-3 border border-border">{subAlarmDetail.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-primary rounded-lg border border-border p-3">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{t('Detected At', '检测时间')}</div>
                <div className="text-sm text-text-primary font-mono">{subAlarmDetail.time}</div>
              </div>
              <div className="bg-bg-primary rounded-lg border border-border p-3">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{t('Severity', '严重程度')}</div>
                <div className={`text-sm font-medium capitalize ${subAlarmDetail.severity === 'major' || subAlarmDetail.severity === 'critical' ? 'text-status-red' : subAlarmDetail.severity === 'warning' ? 'text-status-yellow' : 'text-text-muted'}`}>
                  {subAlarmDetail.severity}
                </div>
              </div>
            </div>
            {subAlarmDetail.status === 'processing' && (
              <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-accent-cyan">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('Agent is actively investigating this alarm. Root cause analysis in progress.', 'Agent正在积极排查此告警。根因分析进行中。')}
                </div>
              </div>
            )}
            {subAlarmDetail.status === 'resolved' && (
              <div className="bg-status-green/5 border border-status-green/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-status-green">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('Alarm has been resolved. Corrective actions applied successfully.', '告警已解决。纠正措施已成功应用。')}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
