import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle,
  Clock, Loader2, Activity, X, ChevronRight, Zap, Radio, Plug, Users, ChevronDown,
  Terminal, Server, ArrowRightLeft, Shield, Wrench, RefreshCw, Play,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useText } from '../hooks/useText';
import { useScenario } from '../context/ScenarioContext';
import { kpiMetrics as defaultKpiBase, activeAlerts as defaultAlerts, recentTasks as defaultTasks, extraTasks as defaultExtraTasks, extraAlerts as defaultExtraAlerts, type TaskItem, type AlertItem } from '../data/dashboard';
import { domainAgents as defaultAgents, type SubAgent } from '../data/agents';
import StatusBadge from '../components/StatusBadge';

/* ─── helpers ─── */
const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TIMESTAMP_MAP: Record<string, string> = {
  '刚刚': 'Just now', '2分钟前': '2 min ago', '5分钟前': '5 min ago',
  '15分钟前': '15 min ago', '20分钟前': '20 min ago', '35分钟前': '35 min ago',
  '1小时前': '1 hr ago', '1.5小时前': '1.5 hr ago', '2小时前': '2 hr ago',
};
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
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
  const { scenario } = useScenario();

  // Scenario-aware data sources
  const kpiBase = scenario?.dashboard.kpis ?? defaultKpiBase;
  const activeAlerts = scenario?.dashboard.alerts ?? defaultAlerts;
  const recentTasks = scenario?.dashboard.tasks ?? defaultTasks;
  const extraTasksData = scenario?.dashboard.extraTasks ?? defaultExtraTasks;
  const extraAlertsData = scenario?.dashboard.extraAlerts ?? defaultExtraAlerts;
  const agents = scenario?.agents ?? defaultAgents;

  /* Reset state when scenario changes */
  const scenarioKey = scenario?.meta.id ?? 'default';
  /* Live KPI animation: fluctuate values every 2 seconds */
  const [liveKpis, setLiveKpis] = useState(kpiBase);
  useEffect(() => { setLiveKpis(kpiBase); }, [scenarioKey]);
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
      const id = agents[Math.floor(Math.random() * agents.length)].id;
      setAgentTicks(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  /* Dynamic task rotation */
  const [liveTasks, setLiveTasks] = useState<TaskItem[]>(recentTasks.slice(0, 6));
  useEffect(() => { setLiveTasks(recentTasks.slice(0, 6)); }, [scenarioKey]);
  const extraTaskIdx = useRef(0);
  const taskScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveTasks(prev => {
        const pool = extraTasksData;
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
  useEffect(() => { setLiveAlerts(activeAlerts.slice(0, 6)); }, [scenarioKey]);
  const extraAlertIdx = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveAlerts(prev => {
        const pool = extraAlertsData;
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
  const [agentModal, setAgentModal] = useState<typeof agents[0] | null>(null);
  const [subAgentModal, setSubAgentModal] = useState<SubAgent | null>(null);
  const [subTaskDetail, setSubTaskDetail] = useState<{ title: string; status: string; start: string; elapsed: string } | null>(null);
  const [subAlarmDetail, setSubAlarmDetail] = useState<{ severity: string; title: string; time: string; status: string } | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);
  const [systemModal, setSystemModal] = useState<string | null>(null);

  /* Pulse indicator */
  const pulseClass = tick % 2 === 0 ? 'opacity-100' : 'opacity-60';

  /* Timestamp translator */
  const ts = (v: string) => t(TIMESTAMP_MAP[v] || v, v);

  return (
    <div className="p-3 md:p-5 space-y-5 overflow-auto h-full">
      {/* System status header with pulse */}
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-2 h-2 rounded-full bg-status-green transition-opacity duration-1000 ${pulseClass}`} />
        <span className="text-xs text-status-green font-medium">{t('System Online', '系统在线')}</span>
        <span className="text-xs text-text-muted">|</span>
        <Radio className="w-3 h-3 text-accent-cyan animate-pulse" />
        <span className="text-xs text-text-muted">{t('Real-time monitoring active', '实时监控运行中')}</span>
        <span className="text-xs text-text-muted ml-auto">{t('TAOR Loop', 'TAOR循环')} #{1247 + tick}</span>
      </div>

      {/* ① KPI Metrics (moved above agents per requirement) */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-cyan" />
          {t('Key Performance Indicators', '关键性能指标')}
          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
          <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {agents.map(agent => (
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

      {/* ②-b Connected External Systems */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Plug className="w-4 h-4 text-accent-cyan" />
          {t('Connected Systems', '外部系统连接')}
          <span className="ml-2 text-xs bg-status-green/20 text-status-green px-2 py-0.5 rounded-full">
            6/6 {t('Online', '在线')}
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'oss', name: 'OSS平台', nameEn: 'OSS Platform', color: '#f97316', status: 'connected', latency: 12, api: 'CORBA/MTOSI', tasks: 1247 },
            { id: 'ticket', name: '工单系统', nameEn: 'Ticket/ITSM', color: '#8b5cf6', status: 'connected', latency: 8, api: 'REST API', tasks: 892 },
            { id: 'smartcare', name: 'SmartCare', nameEn: 'Huawei CEM', color: '#ec4899', status: 'connected', latency: 23, api: 'Northbound', tasks: 456 },
            { id: 'autin', name: 'AUTIN', nameEn: 'Huawei ADN', color: '#06b6d4', status: 'connected', latency: 18, api: 'Intent API', tasks: 334 },
            { id: 'crm', name: 'CRM系统', nameEn: 'CRM System', color: '#10b981', status: 'connected', latency: 15, api: 'REST API', tasks: 2103 },
            { id: 'bss', name: 'BSS/计费', nameEn: 'BSS/Billing', color: '#eab308', status: 'connected', latency: 11, api: 'SOAP/REST', tasks: 1578 },
          ].map(sys => (
            <div key={sys.id} onClick={() => setSystemModal(sys.id)}
              className="bg-bg-card rounded-xl border border-border p-3 hover:border-accent-cyan/40 transition-all group cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: sys.color }} />
                <span className="text-xs font-medium text-text-primary truncate">{t(sys.nameEn, sys.name)}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-status-green ml-auto shrink-0" />
              </div>
              <p className="text-[10px] text-text-muted mb-2">{t(sys.nameEn, sys.name) === sys.nameEn ? sys.name : sys.nameEn}</p>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-text-muted">{t('Protocol', '协议')}</span><span className="text-text-secondary font-mono">{sys.api}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{t('Latency', '延迟')}</span><span className="text-status-green">{sys.latency}ms</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{t('Calls/24h', '调用/24h')}</span><span className="text-text-secondary tabular-nums">{sys.tasks.toLocaleString()}</span></div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                {t('View architecture', '查看架构')} <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <span className="text-xs text-text-muted shrink-0">{ts(task.timestamp)}</span>
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
                    <p className="text-xs text-text-muted">{ts(alert.timestamp)}</p>
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
              <span className="text-xs text-text-muted">{ts(taskModal.timestamp)}</span>
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
              <span className="text-xs text-text-muted">{ts(alertModal.timestamp)}</span>
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

      {/* ─── Connected System Architecture Drill-down ─── */}
      <SystemArchModal systemId={systemModal} onClose={() => setSystemModal(null)} t={t} />
    </div>
  );
}

/* ─── System Architecture Data ─── */
type McpTool = { name: string; desc: string; descEn: string; protocol: string; permission: string };
type ArchLayer = { label: string; labelEn: string; components: string[] };
type DataFlow = { from: string; to: string; protocol: string; rate: string; direction: 'inbound' | 'outbound' | 'bidirectional' };
type SystemArch = {
  name: string; nameEn: string; color: string;
  ioeLayer: ArchLayer; adapterLayer: ArchLayer; systemLayer: ArchLayer;
  protocols: { name: string; type: string; latency: string; mode: string }[];
  dataFlows: DataFlow[];
  mcpTools: McpTool[];
};
const SYSTEM_ARCH: Record<string, SystemArch> = {
  oss: {
    name: 'OSS平台', nameEn: 'OSS Platform', color: '#f97316',
    ioeLayer: { label: 'IOE 智能运维层', labelEn: 'IOE Intelligent Ops Layer', components: ['Ops Agent', 'Optimization Agent', 'Alarm Correlator', 'Config Validator', 'Topology Engine'] },
    adapterLayer: { label: 'OSS 适配层', labelEn: 'OSS Adapter Layer', components: ['CORBA/MTOSI Gateway', 'SNMP Collector', 'NETCONF Proxy', 'Kafka Connector', 'Mediation Engine'] },
    systemLayer: { label: 'OSS 核心系统', labelEn: 'OSS Core Systems', components: ['Fault Mgmt (FM)', 'Performance Mgmt (PM)', 'Config Mgmt (CM)', 'Inventory/Topology', 'Service Activation'] },
    protocols: [
      { name: 'CORBA/MTOSI', type: 'Northbound', latency: '<50ms', mode: 'Real-time' },
      { name: 'SNMP v2c/v3', type: 'Monitoring', latency: '<100ms', mode: 'Polling 30s' },
      { name: 'NETCONF/YANG', type: 'Config', latency: '<200ms', mode: 'On-demand' },
      { name: 'Kafka', type: 'Streaming', latency: '<10ms', mode: 'Real-time' },
      { name: 'REST API', type: 'Integration', latency: '<30ms', mode: 'Req/Resp' },
    ],
    dataFlows: [
      { from: 'OSS FM', to: 'IOE Alarm Correlator', protocol: 'CORBA/Kafka', rate: '2K events/min', direction: 'inbound' },
      { from: 'OSS PM', to: 'IOE Data Lake', protocol: 'Kafka', rate: '12K msg/s', direction: 'inbound' },
      { from: 'IOE Config Validator', to: 'OSS CM', protocol: 'NETCONF', rate: '450 ops/min', direction: 'outbound' },
      { from: 'NE/BTS', to: 'OSS Collector', protocol: 'SNMP', rate: '8K traps/min', direction: 'inbound' },
      { from: 'IOE Topology Engine', to: 'OSS Inventory', protocol: 'REST', rate: '60 syncs/hr', direction: 'bidirectional' },
    ],
    mcpTools: [
      { name: 'oss_get_alarms', desc: '查询活动告警列表（按严重级别/区域/网元过滤）', descEn: 'Query active alarms (filter by severity/region/NE)', protocol: 'MCP → CORBA', permission: 'L1' },
      { name: 'oss_acknowledge_alarm', desc: '确认告警并标记处理状态', descEn: 'Acknowledge alarm and mark handling status', protocol: 'MCP → REST', permission: 'L2' },
      { name: 'oss_get_pm_counters', desc: '获取网元性能计数器（15min/1hr粒度）', descEn: 'Get NE performance counters (15min/1hr granularity)', protocol: 'MCP → Kafka', permission: 'L1' },
      { name: 'oss_push_config', desc: '向网元下发配置变更（带回滚方案）', descEn: 'Push config change to NE (with rollback plan)', protocol: 'MCP → NETCONF', permission: 'L3' },
      { name: 'oss_get_topology', desc: '获取网络拓扑及资源清单', descEn: 'Get network topology and resource inventory', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'oss_create_maintenance_window', desc: '创建维护窗口并冻结告警', descEn: 'Create maintenance window and freeze alarms', protocol: 'MCP → REST', permission: 'L3' },
      { name: 'oss_run_diagnostic', desc: '对指定网元执行诊断测试', descEn: 'Run diagnostic test on specified NE', protocol: 'MCP → SNMP', permission: 'L2' },
    ],
  },
  ticket: {
    name: '工单系统', nameEn: 'Ticket/ITSM', color: '#8b5cf6',
    ioeLayer: { label: 'IOE 流程编排层', labelEn: 'IOE Process Orchestration Layer', components: ['Ops Agent', 'SLA Monitor', 'Escalation Engine', 'Workload Balancer', 'Resolution KB'] },
    adapterLayer: { label: 'ITSM 适配层', labelEn: 'ITSM Adapter Layer', components: ['REST Gateway', 'gRPC Bridge', 'Kafka Event Bus', 'DB Connector (PostgreSQL)', 'Webhook Handler'] },
    systemLayer: { label: 'ITSM 核心', labelEn: 'ITSM Core', components: ['Incident Mgmt', 'Problem Mgmt', 'Change Mgmt', 'Service Catalog', 'CMDB'] },
    protocols: [
      { name: 'REST API', type: 'CRUD', latency: '<20ms', mode: 'Req/Resp' },
      { name: 'gRPC', type: 'Streaming', latency: '<5ms', mode: 'Bidirectional' },
      { name: 'Kafka', type: 'Events', latency: '<10ms', mode: 'Event-driven' },
      { name: 'PostgreSQL', type: 'Database', latency: '<3ms', mode: 'Direct' },
    ],
    dataFlows: [
      { from: 'IOE Ops Agent', to: 'ITSM Incident', protocol: 'REST', rate: '120 tickets/hr', direction: 'outbound' },
      { from: 'ITSM Events', to: 'IOE Event Bus', protocol: 'Kafka', rate: '500 events/hr', direction: 'inbound' },
      { from: 'IOE Escalation', to: 'ITSM Change Mgmt', protocol: 'gRPC', rate: '80 changes/hr', direction: 'outbound' },
      { from: 'ITSM CMDB', to: 'IOE Resolution KB', protocol: 'PostgreSQL', rate: '2K queries/hr', direction: 'inbound' },
    ],
    mcpTools: [
      { name: 'itsm_create_incident', desc: '创建故障工单（含优先级/影响范围/关联CI）', descEn: 'Create incident ticket (with priority/impact/related CI)', protocol: 'MCP → REST', permission: 'L2' },
      { name: 'itsm_update_ticket', desc: '更新工单状态/备注/分配', descEn: 'Update ticket status/notes/assignment', protocol: 'MCP → REST', permission: 'L2' },
      { name: 'itsm_query_tickets', desc: '按条件查询工单列表', descEn: 'Query tickets by conditions (status/assignee/SLA)', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'itsm_create_change', desc: '创建变更请求（含影响评估和审批链）', descEn: 'Create change request (with impact assessment & approval chain)', protocol: 'MCP → gRPC', permission: 'L3' },
      { name: 'itsm_get_cmdb_ci', desc: '查询CMDB配置项及关联关系', descEn: 'Query CMDB CI and relationships', protocol: 'MCP → PostgreSQL', permission: 'L1' },
      { name: 'itsm_escalate', desc: '升级工单到上级处理组', descEn: 'Escalate ticket to higher support group', protocol: 'MCP → REST', permission: 'L2' },
    ],
  },
  smartcare: {
    name: 'SmartCare', nameEn: 'Huawei SmartCare CEM', color: '#ec4899',
    ioeLayer: { label: 'IOE 用户体验层', labelEn: 'IOE Customer Experience Layer', components: ['Experience Agent', 'QoE Analyzer', 'Churn Predictor', 'VIP Protector', 'Journey Mapper'] },
    adapterLayer: { label: 'CEM 适配层', labelEn: 'CEM Adapter Layer', components: ['Northbound REST Client', 'Kafka XDR Consumer', 'Hive/Spark Connector', 'gRPC Stream Client', 'Data Normalizer'] },
    systemLayer: { label: 'SmartCare 核心', labelEn: 'SmartCare Core', components: ['XDR Probe & Parser', 'KQI/KPI Engine', 'User Profiling', 'Network Insight', 'Service Quality Mgmt'] },
    protocols: [
      { name: 'Northbound API', type: 'REST', latency: '<100ms', mode: 'Req/Resp' },
      { name: 'Kafka', type: 'XDR Stream', latency: '<500ms', mode: 'Near-RT' },
      { name: 'Hive/Spark', type: 'Batch', latency: '<5s', mode: 'Batch' },
      { name: 'gRPC', type: 'Streaming', latency: '<10ms', mode: 'Bidirectional' },
    ],
    dataFlows: [
      { from: 'SmartCare XDR', to: 'IOE QoE Analyzer', protocol: 'Kafka', rate: '50K XDR/s', direction: 'inbound' },
      { from: 'IOE Experience Agent', to: 'SmartCare NBI', protocol: 'REST', rate: '800 queries/hr', direction: 'outbound' },
      { from: 'SmartCare Profiling', to: 'IOE Churn Predictor', protocol: 'Hive', rate: 'Batch 4x/day', direction: 'inbound' },
      { from: 'IOE VIP Protector', to: 'SmartCare SQM', protocol: 'gRPC', rate: '200 alerts/hr', direction: 'outbound' },
    ],
    mcpTools: [
      { name: 'cem_get_user_qoe', desc: '查询用户实时QoE评分（语音/数据/视频）', descEn: 'Query user real-time QoE score (voice/data/video)', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'cem_get_cell_kqi', desc: '获取小区级KQI指标（覆盖/容量/质量）', descEn: 'Get cell-level KQI metrics (coverage/capacity/quality)', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'cem_query_xdr', desc: '查询用户详单记录（时间段/业务类型）', descEn: 'Query user XDR records (time range/service type)', protocol: 'MCP → Kafka', permission: 'L2' },
      { name: 'cem_get_user_profile', desc: '获取用户360°画像（套餐/终端/行为）', descEn: 'Get user 360° profile (plan/device/behavior)', protocol: 'MCP → Hive', permission: 'L1' },
      { name: 'cem_set_vip_protection', desc: '设置VIP用户体验保障策略', descEn: 'Set VIP user experience protection policy', protocol: 'MCP → gRPC', permission: 'L3' },
      { name: 'cem_predict_churn', desc: '运行用户流失预测模型', descEn: 'Run user churn prediction model', protocol: 'MCP → Hive/Spark', permission: 'L2' },
    ],
  },
  autin: {
    name: 'AUTIN', nameEn: 'Huawei AUTIN ADN', color: '#06b6d4',
    ioeLayer: { label: 'IOE 自智网络层', labelEn: 'IOE Autonomous Network Layer', components: ['Optimization Agent', 'Intent Translator', 'Closed-loop Controller', 'Telemetry Analyzer', 'RCA Engine'] },
    adapterLayer: { label: 'ADN 适配层', labelEn: 'ADN Adapter Layer', components: ['Intent API Client', 'NETCONF Session Mgr', 'Kafka Telemetry Consumer', 'SNMP Manager', 'Model Translator'] },
    systemLayer: { label: 'AUTIN 核心', labelEn: 'AUTIN Core', components: ['Intent Engine', 'Digital Twin', 'Auto-healing', 'Auto-optimization', 'Knowledge Graph'] },
    protocols: [
      { name: 'Intent API', type: 'REST/gRPC', latency: '<50ms', mode: 'Intent-driven' },
      { name: 'NETCONF', type: 'Config', latency: '<200ms', mode: 'Transaction' },
      { name: 'Kafka', type: 'Telemetry', latency: '<100ms', mode: 'Streaming' },
      { name: 'SNMP', type: 'Monitoring', latency: '<100ms', mode: 'Trap/Poll' },
    ],
    dataFlows: [
      { from: 'IOE Intent Translator', to: 'AUTIN Intent Engine', protocol: 'Intent API', rate: '60 intents/hr', direction: 'outbound' },
      { from: 'AUTIN Telemetry', to: 'IOE Telemetry Analyzer', protocol: 'Kafka', rate: '5K msgs/s', direction: 'inbound' },
      { from: 'IOE Closed-loop', to: 'AUTIN Auto-healing', protocol: 'NETCONF', rate: '200 configs/hr', direction: 'outbound' },
      { from: 'AUTIN Knowledge Graph', to: 'IOE RCA Engine', protocol: 'REST', rate: '400 queries/hr', direction: 'inbound' },
    ],
    mcpTools: [
      { name: 'adn_submit_intent', desc: '提交网络意图（如"保障区域X覆盖>-95dBm"）', descEn: 'Submit network intent (e.g. "ensure area X coverage >-95dBm")', protocol: 'MCP → Intent API', permission: 'L3' },
      { name: 'adn_get_intent_status', desc: '查询意图执行状态与闭环结果', descEn: 'Query intent execution status and closed-loop result', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'adn_get_telemetry', desc: '获取网元实时遥测数据（CPU/内存/接口）', descEn: 'Get NE real-time telemetry (CPU/memory/interface)', protocol: 'MCP → Kafka', permission: 'L1' },
      { name: 'adn_trigger_rca', desc: '触发根因分析（关联告警+拓扑+历史）', descEn: 'Trigger root cause analysis (correlate alarms+topology+history)', protocol: 'MCP → gRPC', permission: 'L2' },
      { name: 'adn_query_digital_twin', desc: '查询数字孪生模型状态', descEn: 'Query digital twin model state', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'adn_execute_optimization', desc: '执行参数优化方案（天线倾角/功率/邻区）', descEn: 'Execute parameter optimization (antenna tilt/power/neighbor)', protocol: 'MCP → NETCONF', permission: 'L4' },
    ],
  },
  crm: {
    name: 'CRM系统', nameEn: 'CRM System', color: '#10b981',
    ioeLayer: { label: 'IOE 客户智能层', labelEn: 'IOE Customer Intelligence Layer', components: ['Marketing Agent', 'Segment Engine', 'Offer Optimizer', 'Retention Manager', 'Interaction Tracker'] },
    adapterLayer: { label: 'CRM 适配层', labelEn: 'CRM Adapter Layer', components: ['REST API Gateway', 'Kafka Event Bridge', 'Oracle DB Connector', 'gRPC Notifier', 'ETL Pipeline'] },
    systemLayer: { label: 'CRM 核心', labelEn: 'CRM Core', components: ['Customer Master', 'Campaign Mgmt', 'Order Mgmt', 'Service Request', 'Loyalty Program'] },
    protocols: [
      { name: 'REST API', type: 'CRUD', latency: '<30ms', mode: 'Req/Resp' },
      { name: 'Kafka', type: 'Events', latency: '<10ms', mode: 'Event-driven' },
      { name: 'Oracle/MySQL', type: 'Database', latency: '<5ms', mode: 'Direct' },
      { name: 'gRPC', type: 'Real-time', latency: '<5ms', mode: 'Streaming' },
    ],
    dataFlows: [
      { from: 'CRM Customer Master', to: 'IOE Segment Engine', protocol: 'Kafka', rate: '3K events/hr', direction: 'inbound' },
      { from: 'IOE Offer Optimizer', to: 'CRM Campaign', protocol: 'REST', rate: '500 pushes/hr', direction: 'outbound' },
      { from: 'CRM Order Mgmt', to: 'IOE Interaction Tracker', protocol: 'Kafka', rate: '1.2K orders/hr', direction: 'inbound' },
      { from: 'IOE Marketing Agent', to: 'CRM Loyalty', protocol: 'gRPC', rate: '300 offers/hr', direction: 'outbound' },
    ],
    mcpTools: [
      { name: 'crm_get_customer', desc: '查询客户360°画像（基本信息/套餐/消费/投诉）', descEn: 'Query customer 360° profile (info/plan/spend/complaints)', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'crm_search_customers', desc: '按条件检索客户群（区域/ARPU/套餐/标签）', descEn: 'Search customer segments (region/ARPU/plan/tags)', protocol: 'MCP → Oracle', permission: 'L1' },
      { name: 'crm_create_campaign', desc: '创建精准营销活动（目标群体/渠道/内容）', descEn: 'Create targeted campaign (segment/channel/content)', protocol: 'MCP → REST', permission: 'L3' },
      { name: 'crm_push_offer', desc: '推送个性化套餐推荐', descEn: 'Push personalized plan recommendation', protocol: 'MCP → gRPC', permission: 'L2' },
      { name: 'crm_get_interaction_log', desc: '查询客户交互历史（通话/投诉/办理）', descEn: 'Query customer interaction history (call/complaint/order)', protocol: 'MCP → Oracle', permission: 'L1' },
      { name: 'crm_update_service_request', desc: '更新服务请求状态', descEn: 'Update service request status', protocol: 'MCP → REST', permission: 'L2' },
    ],
  },
  bss: {
    name: 'BSS/计费', nameEn: 'BSS/Billing', color: '#eab308',
    ioeLayer: { label: 'IOE 收入保障层', labelEn: 'IOE Revenue Assurance Layer', components: ['Planning Agent', 'Revenue Analyzer', 'Fraud Detector', 'Usage Auditor', 'Tariff Simulator'] },
    adapterLayer: { label: 'BSS 适配层', labelEn: 'BSS Adapter Layer', components: ['SOAP/XML Wrapper', 'REST API Bridge', 'Kafka CDR Consumer', 'Oracle RAC Connector', 'Batch ETL Scheduler'] },
    systemLayer: { label: 'BSS 核心', labelEn: 'BSS Core', components: ['Rating Engine', 'Billing Engine', 'Product Catalog', 'Payment Gateway', 'Revenue Assurance'] },
    protocols: [
      { name: 'SOAP/XML', type: 'Legacy', latency: '<100ms', mode: 'Req/Resp' },
      { name: 'REST API', type: 'Modern', latency: '<30ms', mode: 'Req/Resp' },
      { name: 'Kafka', type: 'CDR Stream', latency: '<500ms', mode: 'Near-RT' },
      { name: 'Oracle RAC', type: 'Database', latency: '<5ms', mode: 'Direct' },
    ],
    dataFlows: [
      { from: 'BSS CDR Stream', to: 'IOE Revenue Analyzer', protocol: 'Kafka', rate: '20K CDR/s', direction: 'inbound' },
      { from: 'IOE Usage Auditor', to: 'BSS Rating Engine', protocol: 'REST', rate: '200 queries/hr', direction: 'outbound' },
      { from: 'BSS Product Catalog', to: 'IOE Tariff Simulator', protocol: 'SOAP', rate: 'Batch 24x/day', direction: 'inbound' },
      { from: 'IOE Fraud Detector', to: 'BSS Rev Assurance', protocol: 'Kafka', rate: '50 alerts/hr', direction: 'outbound' },
    ],
    mcpTools: [
      { name: 'bss_query_balance', desc: '查询用户账户余额与信用额度', descEn: 'Query user account balance and credit limit', protocol: 'MCP → REST', permission: 'L1' },
      { name: 'bss_get_bill', desc: '获取用户账单明细（月账单/实时话单）', descEn: 'Get user bill details (monthly bill/real-time CDR)', protocol: 'MCP → Oracle', permission: 'L1' },
      { name: 'bss_query_product_catalog', desc: '查询产品目录与资费方案', descEn: 'Query product catalog and tariff plans', protocol: 'MCP → SOAP', permission: 'L1' },
      { name: 'bss_provision_service', desc: '执行业务开通/套餐变更', descEn: 'Execute service provisioning/plan change', protocol: 'MCP → REST', permission: 'L3' },
      { name: 'bss_detect_fraud', desc: '运行实时欺诈检测规则', descEn: 'Run real-time fraud detection rules', protocol: 'MCP → Kafka', permission: 'L2' },
      { name: 'bss_simulate_tariff', desc: '模拟资费方案对收入的影响', descEn: 'Simulate tariff plan revenue impact', protocol: 'MCP → Oracle', permission: 'L2' },
    ],
  },
};

function SystemArchModal({ systemId, onClose, t }: { systemId: string | null; onClose: () => void; t: (en: string, zh: string) => string }) {
  const [flowTick, setFlowTick] = useState(0);
  const [activeTool, setActiveTool] = useState<number>(-1);
  const [toolOutput, setToolOutput] = useState('');
  useEffect(() => {
    if (!systemId) return;
    const iv = setInterval(() => setFlowTick(p => p + 1), 1800);
    return () => clearInterval(iv);
  }, [systemId]);

  // Simulate MCP tool invocation
  useEffect(() => {
    if (!systemId) return;
    const sys = SYSTEM_ARCH[systemId];
    if (!sys) return;
    const iv = setInterval(() => {
      const idx = Math.floor(Math.random() * sys.mcpTools.length);
      setActiveTool(idx);
      setToolOutput(`> ${sys.mcpTools[idx].name}()\n  status: 200 OK  |  ${Math.floor(Math.random() * 40 + 5)}ms`);
      setTimeout(() => setActiveTool(-1), 2500);
    }, 4000);
    return () => clearInterval(iv);
  }, [systemId]);

  if (!systemId || !SYSTEM_ARCH[systemId]) return null;
  const sys = SYSTEM_ARCH[systemId];
  const permColor: Record<string, string> = { L1: 'text-status-green', L2: 'text-accent-cyan', L3: 'text-status-yellow', L4: 'text-status-orange', L5: 'text-status-red' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[1060px] max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: sys.color + '20' }}>
              <Plug className="w-4.5 h-4.5" style={{ color: sys.color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{t(sys.nameEn, sys.name)} — {t('Connection Architecture', '连接架构')}</h3>
              <p className="text-xs text-text-muted">{t('Multi-protocol integration · MCP tool invocation · Real-time & batch data flows', '多协议集成 · MCP工具调用 · 实时与批量数据流')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Unified Architecture Diagram: 3 columns ── */}
          <div className="bg-bg-primary rounded-xl border border-border p-5">
            <div className="overflow-x-auto md:overflow-x-visible">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-0" style={{ minHeight: 320 }}>

              {/* Column 1: External System */}
              <div className="flex flex-col">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1.5" style={{ color: sys.color }}>
                  <Plug className="w-3.5 h-3.5" />
                  {t('Existing System', '现有系统')}
                </div>
                <div className="flex-1 rounded-xl border-2 p-4 flex flex-col" style={{ borderColor: sys.color + '50', backgroundColor: sys.color + '06' }}>
                  {/* System icon & name */}
                  <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: sys.color + '20' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: sys.color + '18' }}>
                      <Plug className="w-4 h-4" style={{ color: sys.color }} />
                    </div>
                    <div className="text-sm font-bold" style={{ color: sys.color }}>{t(sys.nameEn, sys.name)}</div>
                  </div>
                  {/* Components */}
                  <div className="flex-1 space-y-1.5">
                    {sys.systemLayer.components.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all hover:scale-[1.02]" style={{ backgroundColor: sys.color + '08', borderColor: sys.color + '20', color: sys.color }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sys.color }} />
                        {c}
                      </div>
                    ))}
                  </div>
                  {/* Metrics footer */}
                  <div className="mt-3 pt-2 border-t flex items-center justify-around text-[9px]" style={{ borderColor: sys.color + '20' }}>
                    <div className="text-center">
                      <div className="font-semibold" style={{ color: sys.color }}>{sys.protocols.length}</div>
                      <div className="text-text-muted">{t('APIs', 'API数')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-status-green">{sys.protocols[0]?.latency}</div>
                      <div className="text-text-muted">{t('Latency', '延迟')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow column 1→2: Data flows with animated protocols */}
              <div className="flex flex-col items-center justify-center px-3 pt-8">
                <div className="space-y-2">
                  {sys.dataFlows.map((flow, i) => {
                    const active = (flowTick + i) % sys.dataFlows.length === 0;
                    const isIn = flow.direction === 'inbound';
                    const isBi = flow.direction === 'bidirectional';
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded mb-0.5 transition-all duration-500 ${active ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'bg-bg-tertiary text-text-muted border border-transparent'}`}>
                          {flow.protocol}
                        </span>
                        <div className="relative w-16 h-[2px]">
                          <div className="absolute inset-0 bg-border rounded-full" />
                          <div className={`absolute top-0 h-full rounded-full transition-all duration-1000 ${active ? 'bg-accent-cyan shadow-[0_0_6px_rgba(6,182,212,0.4)]' : 'bg-border'}`}
                            style={{ width: active ? '100%' : '0%', [isIn ? 'right' : 'left']: 0 }} />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[8px] font-bold ${active ? 'text-accent-cyan' : 'text-text-muted'}`}>{isBi ? '⇄' : isIn ? '→' : '←'}</span>
                          <span className={`text-[7px] font-mono ${active ? 'text-status-green' : 'text-text-muted'}`}>{flow.rate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Integration / Adapter Layer */}
              <div className="flex flex-col">
                <div className="text-[10px] font-semibold text-status-yellow uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {t('Integration Layer', '集成适配层')}
                </div>
                <div className="flex-1 rounded-xl border-2 border-status-yellow/40 bg-status-yellow/5 p-4 flex flex-col">
                  {/* Protocol badges header */}
                  <div className="flex flex-wrap justify-center gap-1 mb-3 pb-3 border-b border-status-yellow/20">
                    {sys.protocols.map((p, i) => (
                      <span key={i} className={`text-[8px] font-mono px-2 py-0.5 rounded-full border transition-all duration-700 ${(flowTick + i) % sys.protocols.length === 0 ? 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan shadow-[0_0_4px_rgba(6,182,212,0.3)]' : 'bg-bg-tertiary border-border text-text-muted'}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                  {/* Adapter components */}
                  <div className="flex-1 space-y-1.5">
                    {sys.adapterLayer.components.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-status-yellow/8 border border-status-yellow/15 text-[10px] text-status-yellow font-medium transition-all hover:scale-[1.02]">
                        <ArrowRightLeft className="w-3 h-3 shrink-0 opacity-50" />
                        {c}
                      </div>
                    ))}
                  </div>
                  {/* Mode & latency footer */}
                  <div className="mt-3 pt-2 border-t border-status-yellow/20 flex items-center justify-around text-[9px]">
                    <div className="text-center">
                      <div className="font-semibold text-status-yellow">{t('Real-time', '实时')}</div>
                      <div className="text-text-muted">&lt;100ms</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-status-yellow">{t('Batch', '批量')}</div>
                      <div className="text-text-muted">{t('Scheduled', '定时')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow column 2→3: MCP connection */}
              <div className="flex flex-col items-center justify-center px-3 pt-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="px-2 py-1 rounded-lg bg-accent-cyan/10 border border-accent-cyan/25 text-center">
                    <Terminal className="w-3.5 h-3.5 text-accent-cyan mx-auto mb-0.5" />
                    <div className="text-[8px] font-mono font-semibold text-accent-cyan">MCP</div>
                  </div>
                  <div className="relative w-px h-16">
                    <div className="absolute inset-0 bg-border" />
                    <div className="absolute top-0 left-0 w-full bg-accent-cyan transition-all duration-1000" style={{ height: flowTick % 2 === 0 ? '100%' : '30%' }} />
                  </div>
                  <div className="text-[9px] text-accent-cyan font-bold">⇅</div>
                  <div className="relative w-px h-16">
                    <div className="absolute inset-0 bg-border" />
                    <div className="absolute bottom-0 left-0 w-full bg-accent-cyan transition-all duration-1000" style={{ height: flowTick % 2 === 0 ? '30%' : '100%' }} />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                </div>
              </div>

              {/* Column 3: IOE Agent Harness */}
              <div className="flex flex-col">
                <div className="text-[10px] font-semibold text-accent-cyan uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  {t('IOE Agent Harness', 'IOE Agent Harness')}
                </div>
                <div className="flex-1 rounded-xl border-2 border-accent-cyan/40 bg-accent-cyan/5 p-4 flex flex-col">
                  {/* Orchestrator header */}
                  <div className="rounded-lg bg-accent-cyan/12 border border-accent-cyan/25 p-2.5 text-center mb-3">
                    <div className="flex items-center justify-center gap-2">
                      <Server className="w-4 h-4 text-accent-cyan" />
                      <div>
                        <div className="text-[11px] font-bold text-accent-cyan">{t('TAOR Orchestrator', 'TAOR 编排器')}</div>
                        <div className="text-[8px] text-text-muted">{t('Think → Act → Observe → Repeat', '思考 → 行动 → 观察 → 重复')}</div>
                      </div>
                    </div>
                  </div>
                  {/* IOE Layer components */}
                  <div className="flex-1 space-y-1.5">
                    {sys.ioeLayer.components.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent-cyan/8 border border-accent-cyan/15 text-[10px] text-accent-cyan font-medium transition-all hover:scale-[1.02]">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                  {/* Footer: State & Memory + Safety */}
                  <div className="mt-3 pt-2 border-t border-accent-cyan/20 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-bg-tertiary/50 border border-border p-1.5 text-center">
                      <Activity className="w-3 h-3 text-text-muted mx-auto mb-0.5" />
                      <div className="text-[8px] text-text-muted font-medium">{t('State & Memory', '状态与记忆')}</div>
                    </div>
                    <div className="rounded-lg bg-bg-tertiary/50 border border-border p-1.5 text-center">
                      <Shield className="w-3 h-3 text-text-muted mx-auto mb-0.5" />
                      <div className="text-[8px] text-text-muted font-medium">{t('Safety Guard', '安全护栏')}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── MCP Tool Invocations ── */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Terminal className="w-3 h-3" /> {t('MCP Tool Invocations', 'MCP 工具调用')}
              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">MCP Protocol</span>
            </h4>
            {/* Live terminal output */}
            {toolOutput && (
              <div className="mb-3 bg-[#0d1117] rounded-lg border border-border p-3 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 mb-1.5 text-text-muted">
                  <Play className="w-3 h-3 text-status-green" />
                  <span>{t('Live MCP Call', '实时MCP调用')}</span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                </div>
                <pre className="text-status-green whitespace-pre-wrap">{toolOutput}</pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {sys.mcpTools.map((tool, i) => (
                <div key={i} className={`bg-bg-primary rounded-lg border p-3 transition-all duration-500 ${activeTool === i ? 'border-accent-cyan/60 bg-accent-cyan/5 ring-1 ring-accent-cyan/20' : 'border-border hover:border-border'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Wrench className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="text-[11px] font-mono font-semibold text-accent-cyan truncate">{tool.name}</span>
                    {activeTool === i && <RefreshCw className="w-3 h-3 text-accent-cyan animate-spin ml-auto shrink-0" />}
                  </div>
                  <p className="text-[10px] text-text-secondary mb-2 leading-relaxed">{t(tool.descEn, tool.desc)}</p>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">{tool.protocol}</span>
                    <span className={`font-mono font-semibold ${permColor[tool.permission] || 'text-text-muted'}`}>
                      <Shield className="w-2.5 h-2.5 inline mr-0.5" />{tool.permission}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* ── Integration Summary ── */}
          <div className="bg-bg-primary rounded-lg border border-border p-4">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-text-primary">{sys.protocols.length}</p>
                <p className="text-[10px] text-text-muted">{t('Protocols', '协议数')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-status-green">&lt;1s</p>
                <p className="text-[10px] text-text-muted">{t('Latency', '延迟')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-accent-cyan">{sys.dataFlows.length}</p>
                <p className="text-[10px] text-text-muted">{t('Data Flows', '数据流')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: sys.color }}>{sys.mcpTools.length}</p>
                <p className="text-[10px] text-text-muted">{t('MCP Tools', 'MCP工具')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">3</p>
                <p className="text-[10px] text-text-muted">{t('Arch Layers', '架构层')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

