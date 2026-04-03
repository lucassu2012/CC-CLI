import { useState, useCallback, useEffect } from 'react';
import { Radio, Server, Database, Wifi, X, Activity, Users, BarChart3, Wrench, Zap, AlertTriangle, CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { useText } from '../hooks/useText';
import { topoNodes, topoLinks, type TopoNode } from '../data/topology';
import StatusBadge from '../components/StatusBadge';

type TabId = 'network' | 'experience' | 'capacity' | 'ops';
const TABS: { id: TabId; icon: typeof Radio; label: string; labelZh: string }[] = [
  { id: 'network', icon: Radio, label: 'Network Twin', labelZh: '网络数字孪生' },
  { id: 'experience', icon: Users, label: 'Experience Twin', labelZh: '体验优化孪生' },
  { id: 'capacity', icon: BarChart3, label: 'Capacity Twin', labelZh: '容量规划孪生' },
  { id: 'ops', icon: Wrench, label: 'O&M Twin', labelZh: '智能运维孪生' },
];

const nodeIcons: Record<string, typeof Server> = {
  'core': Server,
  'aggregation': Radio,
  'bts': Wifi,
  'data-center': Database,
};

const nodeSize: Record<string, number> = {
  'data-center': 24,
  'core': 20,
  'aggregation': 16,
  'bts': 14,
};

const statusFill: Record<string, string> = {
  normal: '#22c55e',
  warning: '#eab308',
  fault: '#ef4444',
};

const linkStroke: Record<string, string> = {
  normal: '#334155',
  degraded: '#eab308',
  down: '#ef4444',
};

function NodeDetail({ node, onClose }: { node: TopoNode; onClose: () => void }) {
  const { t } = useText();
  const Icon = nodeIcons[node.type];

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{t(node.name, node.nameZh)}</h3>
            <p className="text-xs text-text-muted">{node.type.replace('-', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {node.details.ip && (
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[10px] text-text-muted">IP</p>
            <p className="text-xs font-mono text-text-primary">{node.details.ip}</p>
          </div>
        )}
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Location', '位置')}</p>
          <p className="text-xs text-text-primary">{t(node.details.location, node.details.locationZh)}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Status', '状态')}</p>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={node.status} />
            <span className="text-xs text-text-primary capitalize">{node.status}</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Uptime', '运行时间')}</p>
          <p className="text-xs text-text-primary">{node.details.uptime}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Load', '负载')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${node.details.load > 80 ? 'bg-status-red' : node.details.load > 60 ? 'bg-status-yellow' : 'bg-status-green'}`}
                style={{ width: `${node.details.load}%` }}
              />
            </div>
            <span className="text-xs text-text-primary">{node.details.load}%</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Alarms', '告警')}</p>
          <p className={`text-xs font-medium ${node.details.alarms > 0 ? 'text-status-red' : 'text-status-green'}`}>
            {node.details.alarms}
          </p>
        </div>
        {node.details.subscribers !== undefined && (
          <div className="bg-bg-primary rounded-lg p-2.5 col-span-2">
            <p className="text-[10px] text-text-muted">{t('Subscribers', '用户数')}</p>
            <p className="text-xs text-text-primary">{node.details.subscribers.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Experience Twin ─── */
function ExperienceTwin({ t }: { t: (en: string, zh: string) => string }) {
  const [scenario, setScenario] = useState(0);
  const heatBase = [
    [72,68,85,91,78,65,88,76],[60,82,90,95,87,73,69,84],[55,77,93,88,92,80,71,67],
    [63,70,86,94,89,75,83,72],[58,74,81,90,96,82,76,69],[66,79,87,93,85,78,80,73],
  ];
  const heatImproved = heatBase.map(row => row.map(v => Math.min(99, v + 8 + Math.floor(Math.random() * 5))));
  const heat = scenario > 0 ? heatImproved : heatBase;
  const vips = [
    { name: 'VIP-张总', mos: scenario > 0 ? 4.5 : 3.8, throughput: scenario > 0 ? '156Mbps' : '89Mbps', latency: scenario > 0 ? '12ms' : '35ms' },
    { name: 'VIP-李总', mos: scenario > 0 ? 4.7 : 4.1, throughput: scenario > 0 ? '203Mbps' : '145Mbps', latency: scenario > 0 ? '8ms' : '22ms' },
    { name: 'VIP-王总', mos: scenario > 0 ? 4.3 : 3.5, throughput: scenario > 0 ? '128Mbps' : '67Mbps', latency: scenario > 0 ? '15ms' : '48ms' },
    { name: 'VIP-刘总', mos: scenario > 0 ? 4.6 : 4.0, throughput: scenario > 0 ? '178Mbps' : '120Mbps', latency: scenario > 0 ? '10ms' : '28ms' },
    { name: 'VIP-赵总', mos: scenario > 0 ? 4.8 : 3.9, throughput: scenario > 0 ? '215Mbps' : '98Mbps', latency: scenario > 0 ? '6ms' : '32ms' },
  ];
  return (
    <div className="space-y-4">
      {/* What-if controls */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-accent-cyan" />{t('What-If Scenario', 'What-If 场景模拟')}</h3>
        <div className="flex gap-3">
          {[t('Baseline', '基线状态'), t('+ Base Stations', '+ 增加基站'), t('+ Power Tuning', '+ 功率调优')].map((label, i) => (
            <button key={i} onClick={() => setScenario(i)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${scenario === i ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40' : 'bg-bg-primary text-text-secondary border border-border hover:border-accent-cyan/30'}`}>{label}</button>
          ))}
        </div>
        {scenario > 0 && (
          <div className="mt-3 flex gap-4">
            <div className="bg-status-green/10 rounded-lg px-3 py-2 border border-status-green/30"><p className="text-xs text-status-green font-medium">{t('Experience +15%', '体验提升 +15%')}</p></div>
            <div className="bg-status-green/10 rounded-lg px-3 py-2 border border-status-green/30"><p className="text-xs text-status-green font-medium">{t('VIP Satisfaction 98%', 'VIP满意度 98%')}</p></div>
            <div className="bg-accent-cyan/10 rounded-lg px-3 py-2 border border-accent-cyan/30"><p className="text-xs text-accent-cyan font-medium">{t('Avg MOS 4.58', '平均MOS 4.58')}</p></div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Heat map */}
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">{t('User Experience Heatmap', '用户体验热力图')}</h3>
          <div className="grid grid-rows-6 gap-1">
            {heat.map((row, ri) => (
              <div key={ri} className="grid grid-cols-8 gap-1">
                {row.map((v, ci) => (
                  <div key={ci} className="aspect-square rounded-md flex items-center justify-center text-[10px] font-mono transition-all duration-500"
                    style={{ backgroundColor: v >= 90 ? 'rgba(34,197,94,0.3)' : v >= 75 ? 'rgba(6,182,212,0.25)' : v >= 60 ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)', color: v >= 90 ? '#22c55e' : v >= 75 ? '#06b6d4' : v >= 60 ? '#eab308' : '#ef4444' }}>
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.3)' }} />&lt;60</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(234,179,8,0.3)' }} />60-75</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(6,182,212,0.3)' }} />75-90</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.3)' }} />&gt;90</span>
          </div>
        </div>
        {/* VIP tracking */}
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">{t('VIP User Tracking', 'VIP用户追踪')}</h3>
          <div className="space-y-2">{vips.map((v, i) => (
            <div key={i} className="bg-bg-primary rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-text-primary">{v.name}</span><span className={`text-xs font-medium ${v.mos >= 4.0 ? 'text-status-green' : 'text-status-yellow'}`}>MOS {v.mos}</span></div>
              <div className="flex gap-3 text-[10px] text-text-muted"><span>{v.throughput}</span><span>{v.latency}</span></div>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Capacity Twin ─── */
function CapacityTwin({ t }: { t: (en: string, zh: string) => string }) {
  const gauges = [
    { label: 'PRB', labelZh: 'PRB利用率', value: 72, max: 100 },
    { label: 'Bandwidth', labelZh: '带宽利用率', value: 58, max: 100 },
    { label: 'Sessions', labelZh: '会话数', value: 85, max: 100 },
    { label: 'Connections', labelZh: '连接数', value: 63, max: 100 },
  ];
  const scenarios = [
    { label: t('Normal Growth', '正常增长'), color: '#22c55e', demand: [40, 45, 50, 55, 62, 68, 74, 80, 85, 88, 92, 95] },
    { label: t('Event Surge', '突发事件'), color: '#eab308', demand: [40, 45, 52, 78, 95, 98, 85, 70, 60, 55, 50, 48] },
    { label: t('Peak Holiday', '节假日高峰'), color: '#ef4444', demand: [40, 48, 55, 65, 75, 88, 95, 98, 96, 90, 80, 65] },
  ];
  const capacity = [80, 80, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {gauges.map(g => {
          const pct = g.value / g.max;
          const r = 36; const c = 2 * Math.PI * r; const offset = c * (1 - pct * 0.75);
          return (
            <div key={g.label} className="bg-bg-card rounded-xl border border-border p-4 flex flex-col items-center">
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={r} fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray={`${c * 0.75} ${c * 0.25}`} strokeLinecap="round" transform="rotate(135 45 45)" />
                <circle cx="45" cy="45" r={r} fill="none" stroke={pct > 0.8 ? '#ef4444' : pct > 0.6 ? '#eab308' : '#22c55e'} strokeWidth="6" strokeDasharray={`${c * 0.75} ${c * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 45 45)" />
                <text x="45" y="45" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="16" fontWeight="bold">{g.value}%</text>
              </svg>
              <p className="text-xs text-text-secondary mt-1">{t(g.label, g.labelZh)}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">{t('Capacity vs Demand Forecast', '容量与需求预测')}</h3>
        <svg viewBox="0 0 600 200" className="w-full">
          <defs><pattern id="cgrid" width="50" height="40" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" /></pattern></defs>
          <rect width="600" height="200" fill="url(#cgrid)" />
          {/* Capacity line */}
          <polyline points={capacity.map((v, i) => `${i * 50 + 25},${180 - v * 1.6}`).join(' ')} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="6 3" />
          {scenarios.map((sc, si) => (
            <polyline key={si} points={sc.demand.map((v, i) => `${i * 50 + 25},${180 - v * 1.6}`).join(' ')} fill="none" stroke={sc.color} strokeWidth="1.5" opacity="0.8" />
          ))}
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
            <text key={m} x={i * 50 + 25} y="198" textAnchor="middle" fill="#64748b" fontSize="8">{m}</text>
          ))}
        </svg>
        <div className="flex gap-4 mt-2 text-[10px]">
          <span className="text-text-muted flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-[#475569]" />{t('Capacity', '容量')}</span>
          {scenarios.map(s => <span key={s.label} className="flex items-center gap-1"><span className="w-4 h-0 border-t-2" style={{ borderColor: s.color }} />{s.label}</span>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-4">
          <h4 className="text-xs font-medium text-accent-cyan mb-2">{t('Expansion Recommendations', '扩容建议')}</h4>
          <div className="space-y-1.5">
            {[t('Site GD-A003: Add 5G carrier', '站点GD-A003: 新增5G载波'), t('Link SZ-GZ: Upgrade to 100G', '链路SZ-GZ: 升级至100G'), t('UPF-02: Scale to 200Gbps', 'UPF-02: 扩容至200Gbps')].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-primary bg-bg-primary rounded px-2.5 py-1.5"><AlertTriangle className="w-3 h-3 text-status-yellow shrink-0" />{r}</div>
            ))}
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-status-green/30 p-4">
          <h4 className="text-xs font-medium text-status-green mb-2">{t('Optimization Opportunities', '优化机会')}</h4>
          <div className="space-y-1.5">
            {[t('Low-traffic cells: 12 eligible for sleep', '低流量小区: 12个可休眠'), t('PRB load balancing: 8% gain possible', 'PRB负载均衡: 可提升8%'), t('Carrier aggregation: Enable on 23 sites', '载波聚合: 23站点可开启')].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-primary bg-bg-primary rounded px-2.5 py-1.5"><CheckCircle2 className="w-3 h-3 text-status-green shrink-0" />{r}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── O&M Twin ─── */
function OpsTwin({ t }: { t: (en: string, zh: string) => string }) {
  const [fault, setFault] = useState<string | null>(null);
  const [diagStep, setDiagStep] = useState(-1);
  const faults = [
    { id: 'link-down', label: t('Link Down', '链路中断'), steps: [t('Detect alarm','检测告警'), t('Locate fault link','定位故障链路'), t('Check redundancy','检查冗余路径'), t('Reroute traffic','流量重路由'), t('Verify recovery','验证恢复')] },
    { id: 'power-fail', label: t('Power Failure', '电源故障'), steps: [t('Detect power loss','检测断电'), t('Activate battery','启动电池'), t('Transfer traffic','流量转移'), t('Dispatch team','派遣维修'), t('Restore power','恢复供电')] },
    { id: 'overload', label: t('Overload', '过载'), steps: [t('Detect high load','检测高负载'), t('Analyze traffic','分析流量'), t('Load balancing','负载均衡'), t('Throttle low-priority','降级低优先'), t('Monitor stability','监控稳定')] },
  ];
  const predictions = [
    { label: t('BTS-GD-007 battery degradation','BTS-GD-007 电池老化'), risk: 78, eta: '3天' },
    { label: t('Link SZ-GZ-02 BER rising','链路SZ-GZ-02 误码率上升'), risk: 65, eta: '7天' },
    { label: t('Core-01 memory leak trend','Core-01 内存泄漏趋势'), risk: 52, eta: '14天' },
  ];

  useEffect(() => {
    if (!fault || diagStep < 0) return;
    const f = faults.find(f => f.id === fault);
    if (!f || diagStep >= f.steps.length) return;
    const timer = setTimeout(() => setDiagStep(s => s + 1), 1200);
    return () => clearTimeout(timer);
  }, [fault, diagStep]);

  const injectFault = (id: string) => { setFault(id); setDiagStep(0); };
  const resetFault = () => { setFault(null); setDiagStep(-1); };
  const activeFault = faults.find(f => f.id === fault);

  return (
    <div className="space-y-4">
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-status-red" />{t('Fault Injection Simulator', '故障注入模拟器')}</h3>
        <div className="flex gap-3 mb-4">
          {faults.map(f => (
            <button key={f.id} onClick={() => injectFault(f.id)} disabled={!!fault}
              className="px-3 py-2 rounded-lg bg-status-red/10 text-status-red text-xs font-medium border border-status-red/30 hover:bg-status-red/20 cursor-pointer disabled:opacity-40 transition-all">{f.label}</button>
          ))}
          {fault && <button onClick={resetFault} className="px-3 py-2 rounded-lg bg-bg-primary text-text-secondary text-xs border border-border hover:bg-bg-hover cursor-pointer"><RotateCcw className="w-3 h-3 inline mr-1" />{t('Reset', '重置')}</button>}
        </div>
        {activeFault && (
          <div className="bg-bg-primary rounded-lg p-4 border border-status-red/20">
            <p className="text-xs text-text-muted mb-3">{t('TAOR Auto-Diagnosis', 'TAOR自动诊断')}</p>
            <div className="space-y-2">
              {activeFault.steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-500 ${i <= diagStep ? 'opacity-100' : 'opacity-30'}`}>
                  {i < diagStep ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" /> :
                    i === diagStep ? <Activity className="w-3.5 h-3.5 text-accent-cyan animate-pulse shrink-0" /> :
                    <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                  <span className={i <= diagStep ? 'text-text-primary' : 'text-text-muted'}>{step}</span>
                  {i < diagStep && <span className="text-[10px] text-status-green ml-auto">OK</span>}
                </div>
              ))}
            </div>
            {diagStep >= activeFault.steps.length && (
              <div className="mt-3 bg-status-green/10 border border-status-green/30 rounded-lg p-2.5">
                <p className="text-xs text-status-green font-medium">{t('Recovery complete! Time: 6.2s', '恢复完成！用时: 6.2s')}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-status-yellow" />{t('Predictive Maintenance', '预测性维护')}</h3>
        <div className="space-y-2">{predictions.map((p, i) => (
          <div key={i} className="bg-bg-primary rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-text-primary">{p.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.risk}%`, backgroundColor: p.risk > 70 ? '#ef4444' : p.risk > 50 ? '#eab308' : '#22c55e' }} /></div>
                <span className="text-[10px] text-text-muted">{p.risk}%</span>
              </div>
            </div>
            <div className="text-right"><p className="text-[10px] text-text-muted">{t('ETA', '预计')}</p><p className="text-xs text-text-primary font-medium">{p.eta}</p></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Topology() {
  const { t } = useText();
  const [activeTab, setActiveTab] = useState<TabId>('network');
  const [selectedNode, setSelectedNode] = useState<TopoNode | null>(null);
  const [simRunning, setSimRunning] = useState(true);

  const handleNodeClick = useCallback((node: TopoNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const svgWidth = 920;
  const svgHeight = 500;

  return (
    <div className="p-5 overflow-auto h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Digital Twin Platform', '数字孪生平台')}</h1>
          <p className="text-xs text-text-muted mt-0.5">{t('Multi-scenario simulation & pre-validation engine', '多场景仿真与预验证引擎')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSimRunning(!simRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${simRunning ? 'bg-status-green/20 text-status-green' : 'bg-bg-primary text-text-muted'}`}>
            <Play className="w-3 h-3" />{simRunning ? t('Simulating', '仿真中') : t('Paused', '已暂停')}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-bg-card rounded-lg border border-border p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-secondary hover:bg-bg-primary'}`}>
              <Icon className="w-3.5 h-3.5" />{t(tab.label, tab.labelZh)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'experience' && <ExperienceTwin t={t} />}
      {activeTab === 'capacity' && <CapacityTwin t={t} />}
      {activeTab === 'ops' && <OpsTwin t={t} />}

      {activeTab === 'network' && (
      <div className="grid grid-cols-[1fr_300px] gap-5">
        {/* Stats bar */}
        <div className="col-span-2 grid grid-cols-4 gap-3">
          {[{ l: t('Nodes','节点'), v: topoNodes.length }, { l: t('Active Links','活跃链路'), v: topoLinks.filter(l => l.status === 'normal').length }, { l: t('Avg Latency','平均时延'), v: '2.3ms' }, { l: t('Total Throughput','总吞吐'), v: '48.7Tbps' }].map((s, i) => (
            <div key={i} className="bg-bg-card rounded-lg border border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">{s.l}</span>
              <span className="text-sm font-semibold text-text-primary">{s.v}</span>
            </div>
          ))}
        </div>
        {/* SVG Topology */}
        <div className="bg-bg-card rounded-xl border border-border p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

            {/* Links */}
            {topoLinks.map((link) => {
              const src = topoNodes.find((n) => n.id === link.source);
              const tgt = topoNodes.find((n) => n.id === link.target);
              if (!src || !tgt) return null;
              return (
                <g key={link.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={linkStroke[link.status]}
                    strokeWidth={link.status === 'down' ? 1 : 2}
                    strokeDasharray={link.status === 'down' ? '6,4' : link.status === 'degraded' ? '4,2' : undefined}
                    opacity={link.status === 'down' ? 0.5 : 0.8}
                  />
                  {link.status === 'normal' && (
                    <circle r="3" fill="#06b6d4" opacity="0.6">
                      <animateMotion
                        dur={`${3 + Math.random() * 2}s`}
                        repeatCount="indefinite"
                        path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {topoNodes.map((node) => {
              const size = nodeSize[node.type];
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Glow for fault/warning */}
                  {node.status !== 'normal' && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size + 8}
                      fill={statusFill[node.status]}
                      opacity={0.15}
                    >
                      <animate attributeName="r" values={`${size + 4};${size + 12};${size + 4}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size + 6}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Node background */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size}
                    fill="#1e293b"
                    stroke={statusFill[node.status]}
                    strokeWidth={2}
                  />

                  {/* Icon placeholder - simple shapes */}
                  {node.type === 'data-center' && (
                    <rect x={node.x - 7} y={node.y - 7} width={14} height={14} rx={2} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'core' && (
                    <polygon points={`${node.x},${node.y - 7} ${node.x + 7},${node.y + 4} ${node.x - 7},${node.y + 4}`} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'aggregation' && (
                    <circle cx={node.x} cy={node.y} r={6} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'bts' && (
                    <>
                      <line x1={node.x} y1={node.y + 5} x2={node.x} y2={node.y - 5} stroke={statusFill[node.status]} strokeWidth={2} opacity={0.6} />
                      <line x1={node.x - 4} y1={node.y - 2} x2={node.x + 4} y2={node.y - 2} stroke={statusFill[node.status]} strokeWidth={2} opacity={0.6} />
                    </>
                  )}

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + size + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
          ) : (
            <div className="bg-bg-card rounded-xl border border-border flex items-center justify-center h-64">
              <div className="text-center">
                <Radio className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">{t('Click a node to view details', '点击节点查看详情')}</p>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          <div className="mt-4 bg-bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              {t('Simulation Results', '仿真结果')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Network Resilience Score', '网络韧性评分')}</span>
                <span className="text-text-primary font-medium">87/100</span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="h-full bg-accent-cyan rounded-full" style={{ width: '87%' }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-3">
                <span className="text-text-muted">{t('Single Point of Failure', '单点故障')}</span>
                <span className="text-status-yellow font-medium">2 {t('detected', '已检测')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Redundancy Coverage', '冗余覆盖率')}</span>
                <span className="text-status-green font-medium">94.2%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Failover Time (avg)', '故障切换时间(平均)')}</span>
                <span className="text-text-primary font-medium">1.8s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Footer watermark */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-text-muted/40">Powered by GTS-LLM-s + IOE Harness | Digital Twin Engine v2.0</p>
      </div>
    </div>
  );
}
