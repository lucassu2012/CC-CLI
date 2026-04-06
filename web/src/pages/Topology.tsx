import { useState, useCallback, useEffect, useRef } from 'react';
import { Radio, Server, Database, Wifi, X, Activity, Users, Zap, CheckCircle2, Play, Search, Filter, Layers, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, Terminal, ChevronDown, ChevronUp, ArrowRight, Network } from 'lucide-react';
import { useText } from '../hooks/useText';
import { topoNodes, topoLinks, type TopoNode } from '../data/topology';
import StatusBadge from '../components/StatusBadge';

type TabId = 'network' | 'experience' | 'user';
const TABS: { id: TabId; icon: typeof Radio; label: string; labelZh: string }[] = [
  { id: 'network', icon: Radio, label: 'Network Twin', labelZh: '网络数字孪生' },
  { id: 'experience', icon: Activity, label: 'Experience Twin', labelZh: '体验优化孪生' },
  { id: 'user', icon: Users, label: 'User Twin', labelZh: '用户数字孪生' },
];

const NODE_LAYERS = ['data-center', 'core', 'aggregation', 'bts'] as const;
const LAYER_LABELS: Record<string, { en: string; zh: string }> = {
  'data-center': { en: 'Data Center', zh: '数据中心' },
  'core': { en: 'Core', zh: '核心层' },
  'aggregation': { en: 'Aggregation', zh: '汇聚层' },
  'bts': { en: 'BTS', zh: '基站' },
};

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

      {/* Relationships (Azure DT Explorer style) */}
      <div className="mt-3 border-t border-border pt-3">
        <h4 className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">{t('Relationships', '关联关系')}</h4>
        <div className="space-y-1">
          {topoLinks.filter(l => l.source === node.id || l.target === node.id).map(l => {
            const peer = topoNodes.find(n => n.id === (l.source === node.id ? l.target : l.source));
            if (!peer) return null;
            const isSource = l.source === node.id;
            return (
              <div key={l.id} className="flex items-center gap-1.5 text-[10px] bg-bg-primary rounded px-2 py-1">
                <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'normal' ? 'bg-status-green' : l.status === 'degraded' ? 'bg-status-yellow' : 'bg-status-red'}`} />
                <span className="text-text-muted">{isSource ? '→' : '←'}</span>
                <span className="text-text-primary font-medium">{peer.name}</span>
                <span className="text-text-muted ml-auto">{l.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Telemetry (Azure DT style property inspector) */}
      <div className="mt-3 border-t border-border pt-3">
        <h4 className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">{t('Live Telemetry', '实时遥测')}</h4>
        <div className="space-y-1 text-[10px]">
          {[
            { key: 'throughput', label: t('Throughput','吞吐量'), value: `${(Math.random() * 50 + 20).toFixed(1)} Gbps` },
            { key: 'latency', label: t('Latency','时延'), value: `${(Math.random() * 5 + 0.5).toFixed(1)} ms` },
            { key: 'packetLoss', label: t('Packet Loss','丢包率'), value: `${(Math.random() * 0.5).toFixed(3)}%` },
            { key: 'temperature', label: t('Temperature','温度'), value: `${(Math.random() * 20 + 30).toFixed(1)}°C` },
          ].map(t => (
            <div key={t.key} className="flex items-center justify-between bg-bg-primary rounded px-2 py-1">
              <span className="text-text-muted">{t.label}</span>
              <span className="text-text-primary font-mono">{t.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Experience Twin: RF Coverage Simulation ─── */
function ExperienceTwin({ t }: { t: (en: string, zh: string) => string }) {
  const [scenario, setScenario] = useState(0);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optStep, setOptStep] = useState(-1);

  // Base station positions and RF coverage data
  const cells = [
    { id: 0, name: 'BTS-001', x: 200, y: 180, power: 43, freq: '3.5GHz', azimuth: 0, tilt: 6, radius: scenario > 0 ? 130 : 110, rsrp: scenario > 0 ? -78 : -85 },
    { id: 1, name: 'BTS-002', x: 480, y: 140, power: 40, freq: '3.5GHz', azimuth: 120, tilt: 8, radius: scenario > 0 ? 120 : 100, rsrp: scenario > 0 ? -80 : -88 },
    { id: 2, name: 'BTS-003', x: 360, y: 320, power: 46, freq: '2.1GHz', azimuth: 240, tilt: 4, radius: scenario > 0 ? 150 : 130, rsrp: scenario > 0 ? -72 : -82 },
    { id: 3, name: 'BTS-004', x: 600, y: 300, power: 43, freq: '3.5GHz', azimuth: 60, tilt: 6, radius: scenario > 1 ? 140 : 105, rsrp: scenario > 1 ? -75 : -90 },
    { id: 4, name: 'BTS-005', x: 140, y: 370, power: 38, freq: '700MHz', azimuth: 180, tilt: 10, radius: scenario > 1 ? 160 : 140, rsrp: scenario > 1 ? -68 : -76 },
    ...(scenario > 0 ? [{ id: 5, name: 'BTS-NEW', x: 420, y: 220, power: 46, freq: '3.5GHz', azimuth: 0, tilt: 5, radius: 120, rsrp: -74 }] : []),
  ];

  // KPIs
  const avgRsrp = cells.reduce((s, c) => s + c.rsrp, 0) / cells.length;
  const coverage = scenario > 1 ? 96.8 : scenario > 0 ? 92.4 : 85.2;
  const weakSpots = scenario > 1 ? 1 : scenario > 0 ? 3 : 7;

  // Optimization animation
  useEffect(() => {
    if (!optimizing || optStep < 0) return;
    if (optStep >= 5) { setOptimizing(false); return; }
    const timer = setTimeout(() => setOptStep(s => s + 1), 1000);
    return () => clearTimeout(timer);
  }, [optimizing, optStep]);

  const startOptimize = () => { setOptimizing(true); setOptStep(0); };
  const optSteps = [
    t('Scanning coverage gaps...', '扫描覆盖空洞...'),
    t('Calculating propagation model...', '计算传播模型...'),
    t('Optimizing antenna tilt & power...', '优化天线下倾角和功率...'),
    t('Simulating interference pattern...', '仿真干扰模式...'),
    t('Optimization complete! Coverage +7.2%', '优化完成！覆盖率 +7.2%'),
  ];

  return (
    <div className="space-y-3">
      {/* Control bar */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {[t('Baseline', '基线'), t('+ New Site', '+ 新增站点'), t('+ Power Opt', '+ 功率优化')].map((label, i) => (
            <button key={i} onClick={() => setScenario(i)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${scenario === i ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40' : 'bg-bg-card text-text-secondary border border-border hover:border-accent-cyan/30'}`}>{label}</button>
          ))}
        </div>
        <button onClick={startOptimize} disabled={optimizing}
          className="px-3 py-1.5 rounded-lg text-xs bg-status-green/10 text-status-green border border-status-green/30 cursor-pointer disabled:opacity-40 flex items-center gap-1.5">
          <Play className="w-3 h-3" />{t('Run Optimization', '运行优化仿真')}
        </button>
        <div className="ml-auto flex gap-3 text-xs">
          <span className="text-text-muted">{t('Coverage:', '覆盖率:')}<span className={`ml-1 font-semibold ${coverage > 90 ? 'text-status-green' : 'text-status-yellow'}`}>{coverage}%</span></span>
          <span className="text-text-muted">{t('Avg RSRP:', '平均RSRP:')}<span className="ml-1 font-semibold text-text-primary">{avgRsrp.toFixed(0)} dBm</span></span>
          <span className="text-text-muted">{t('Weak spots:', '弱覆盖:')}<span className={`ml-1 font-semibold ${weakSpots <= 2 ? 'text-status-green' : 'text-status-yellow'}`}>{weakSpots}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-3">
        {/* RF Coverage Map (CloudRF-style) */}
        <div className="bg-bg-card rounded-xl border border-border p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />{t('RF Coverage Simulation', 'RF覆盖仿真')}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />&gt;-70dBm</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #f97316, #eab308)' }} />-70~-85</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #eab308, #22c55e)' }} />-85~-95</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #22c55e, #3b82f6)' }} />-95~-105</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[#1e3a5f]" />&lt;-105</span>
            </div>
          </div>
          <svg viewBox="0 0 740 480" className="w-full rounded-lg" style={{ background: '#0c1222' }}>
            <defs>
              {/* Grid */}
              <pattern id="rfgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.3" />
              </pattern>
              {/* RF propagation gradients - warm to cool like CloudRF */}
              {cells.map(c => (
                <radialGradient key={`rfg-${c.id}`} id={`rfgrad-${c.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                  <stop offset="25%" stopColor="#f97316" stopOpacity="0.35" />
                  <stop offset="45%" stopColor="#eab308" stopOpacity="0.25" />
                  <stop offset="65%" stopColor="#22c55e" stopOpacity="0.18" />
                  <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0" />
                </radialGradient>
              ))}
              <filter id="rfBlur"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>
            <rect width="740" height="480" fill="url(#rfgrid)" />

            {/* Coverage zones - overlapping radial gradients like CloudRF heatmap */}
            <g filter="url(#rfBlur)">
              {cells.map(c => (
                <circle key={`cov-${c.id}`} cx={c.x} cy={c.y} r={c.radius}
                  fill={`url(#rfgrad-${c.id})`} className="transition-all duration-1000" />
              ))}
            </g>

            {/* Coverage boundary contour lines */}
            {cells.map(c => (
              <g key={`contour-${c.id}`}>
                <circle cx={c.x} cy={c.y} r={c.radius * 0.3} fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />
                <circle cx={c.x} cy={c.y} r={c.radius * 0.6} fill="none" stroke="#eab308" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />
                <circle cx={c.x} cy={c.y} r={c.radius * 0.9} fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 3" />
              </g>
            ))}

            {/* Weak coverage indicators */}
            {scenario === 0 && [
              { x: 550, y: 200 }, { x: 100, y: 100 }, { x: 650, y: 420 },
            ].map((p, i) => (
              <g key={`weak-${i}`}>
                <circle cx={p.x} cy={p.y} r={18} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" opacity="0.6">
                  <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">!</text>
              </g>
            ))}

            {/* Base station towers */}
            {cells.map(c => {
              const sel = selectedCell === c.id;
              const isNew = c.id === 5;
              return (
                <g key={`bts-${c.id}`} onClick={() => setSelectedCell(sel ? null : c.id)} className="cursor-pointer">
                  {/* Selection ring */}
                  {sel && <circle cx={c.x} cy={c.y} r={20} fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.8">
                    <animate attributeName="r" values="18;24;18" dur="1.5s" repeatCount="indefinite" />
                  </circle>}
                  {/* Tower icon */}
                  <circle cx={c.x} cy={c.y} r={12} fill={isNew ? '#22c55e' : '#0f172a'} stroke={isNew ? '#22c55e' : '#06b6d4'} strokeWidth={2} />
                  {/* Antenna symbol */}
                  <line x1={c.x} y1={c.y + 6} x2={c.x} y2={c.y - 6} stroke={isNew ? '#fff' : '#06b6d4'} strokeWidth="2" />
                  <line x1={c.x - 4} y1={c.y - 3} x2={c.x + 4} y2={c.y - 3} stroke={isNew ? '#fff' : '#06b6d4'} strokeWidth="1.5" />
                  <line x1={c.x - 3} y1={c.y} x2={c.x + 3} y2={c.y} stroke={isNew ? '#fff' : '#06b6d4'} strokeWidth="1" />
                  {/* Label */}
                  <text x={c.x} y={c.y + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">{c.name}</text>
                  {/* RSRP badge */}
                  <rect x={c.x + 10} y={c.y - 18} width={36} height={13} rx={3} fill="rgba(0,0,0,0.8)" stroke={c.rsrp > -80 ? '#22c55e' : c.rsrp > -90 ? '#eab308' : '#ef4444'} strokeWidth="0.5" />
                  <text x={c.x + 28} y={c.y - 9} textAnchor="middle" fill={c.rsrp > -80 ? '#86efac' : c.rsrp > -90 ? '#fde047' : '#fca5a5'} fontSize="7" fontFamily="monospace">{c.rsrp}dBm</text>
                </g>
              );
            })}

            {/* Signal propagation wave animation */}
            {cells.slice(0, 3).map(c => (
              <circle key={`wave-${c.id}`} cx={c.x} cy={c.y} r="10" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0">
                <animate attributeName="r" values="15;80" dur="3s" repeatCount="indefinite" begin={`${c.id * 0.8}s`} />
                <animate attributeName="opacity" values="0.4;0" dur="3s" repeatCount="indefinite" begin={`${c.id * 0.8}s`} />
              </circle>
            ))}
          </svg>
        </div>

        {/* Right panel: Cell inspector + optimization */}
        <div className="space-y-3 overflow-auto max-h-[540px]">
          {/* Selected cell inspector */}
          {selectedCell !== null && (() => {
            const c = cells.find(c => c.id === selectedCell);
            if (!c) return null;
            return (
              <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-accent-cyan" />{c.name}</h4>
                  <button onClick={() => setSelectedCell(null)} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { l: t('Frequency', '频段'), v: c.freq },
                    { l: t('Power', '功率'), v: `${c.power} dBm` },
                    { l: t('Azimuth', '方位角'), v: `${c.azimuth}°` },
                    { l: t('Tilt', '下倾角'), v: `${c.tilt}°` },
                    { l: 'RSRP', v: `${c.rsrp} dBm` },
                    { l: t('Radius', '覆盖半径'), v: `${(c.radius * 3).toFixed(0)}m` },
                  ].map(item => (
                    <div key={item.l} className="bg-bg-primary rounded px-2 py-1.5">
                      <span className="text-text-muted block">{item.l}</span>
                      <span className="text-text-primary font-mono">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Optimization process */}
          {optimizing && (
            <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-3">
              <h4 className="text-xs font-semibold text-accent-cyan mb-2">{t('RF Optimization', 'RF优化仿真')}</h4>
              <div className="space-y-1.5">
                {optSteps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[10px] transition-all ${i <= optStep ? 'opacity-100' : 'opacity-30'}`}>
                    {i < optStep ? <CheckCircle2 className="w-3 h-3 text-status-green shrink-0" /> :
                      i === optStep ? <Activity className="w-3 h-3 text-accent-cyan animate-pulse shrink-0" /> :
                      <div className="w-3 h-3 rounded-full border border-border shrink-0" />}
                    <span className={i <= optStep ? 'text-text-primary' : 'text-text-muted'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIP Experience Tracking */}
          <div className="bg-bg-card rounded-xl border border-border p-3">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{t('VIP Experience', 'VIP用户体验')}</h4>
            <div className="space-y-1.5">
              {[
                { name: 'VIP-张总', rsrp: scenario > 0 ? -72 : -88, sinr: scenario > 0 ? 18 : 8, rate: scenario > 0 ? '256Mbps' : '67Mbps' },
                { name: 'VIP-李总', rsrp: scenario > 0 ? -68 : -82, sinr: scenario > 0 ? 22 : 12, rate: scenario > 0 ? '312Mbps' : '145Mbps' },
                { name: 'VIP-王总', rsrp: scenario > 0 ? -75 : -95, sinr: scenario > 0 ? 15 : 5, rate: scenario > 0 ? '198Mbps' : '32Mbps' },
              ].map((v, i) => (
                <div key={i} className="bg-bg-primary rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-text-primary">{v.name}</span>
                    <span className={`text-[10px] font-mono ${v.rsrp > -80 ? 'text-status-green' : v.rsrp > -90 ? 'text-status-yellow' : 'text-status-red'}`}>{v.rsrp}dBm</span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-text-muted">
                    <span>SINR {v.sinr}dB</span>
                    <span>{v.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage improvement metrics */}
          {scenario > 0 && (
            <div className="bg-bg-card rounded-xl border border-status-green/30 p-3">
              <h4 className="text-xs font-medium text-status-green mb-2">{t('Improvement', '优化效果')}</h4>
              <div className="space-y-1.5 text-[10px]">
                {[
                  { l: t('Coverage', '覆盖率'), before: '85.2%', after: scenario > 1 ? '96.8%' : '92.4%', delta: scenario > 1 ? '+11.6%' : '+7.2%' },
                  { l: t('Avg RSRP', '平均RSRP'), before: '-84dBm', after: scenario > 1 ? '-74dBm' : '-80dBm', delta: scenario > 1 ? '+10dB' : '+4dB' },
                  { l: t('Weak spots', '弱覆盖区'), before: '7', after: scenario > 1 ? '1' : '3', delta: scenario > 1 ? '-6' : '-4' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-bg-primary rounded px-2 py-1.5">
                    <span className="text-text-muted w-16">{m.l}</span>
                    <span className="text-text-muted">{m.before}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-primary font-medium">{m.after}</span>
                    <span className="text-status-green font-medium ml-auto">{m.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── User Twin: Churn Prediction + Lead Identification (LUM Model) ─── */
function UserTwin({ t }: { t: (en: string, zh: string) => string }) {
  const [activeView, setActiveView] = useState<'churn' | 'lead'>('churn');
  const [predicting, setPredicting] = useState(false);
  const [predStep, setPredStep] = useState(-1);
  const [intervened, setIntervened] = useState<Set<number>>(new Set());

  // Churn risk users
  const churnUsers = [
    { id: 1, name: t('Zhang Minghui', '张明辉'), phone: '138****2891', plan: t('Ice Cream 129', '冰激凌129'), arpu: 98, months: 36, riskScore: 92, reason: t('3-month ARPU decline, 2 unresolved complaints', '连续3月ARPU下降, 投诉2次未解决'), signal: t('Call duration down 45%, data usage down 60%', '通话时长下降45%, 流量使用减少60%') },
    { id: 2, name: t('Li Ting', '李婷'), phone: '139****5567', plan: t('Enjoy 199', '畅享199'), arpu: 156, months: 24, riskScore: 85, reason: t('Competitor number active, plan overflow frequent', '竞对号码活跃, 套餐溢出频繁'), signal: t('Dual-SIM switching up, nighttime data migration', '双卡切换比例上升, 夜间流量转移') },
    { id: 3, name: t('Wang Zhiqiang', '王志强'), phone: '136****8834', plan: t('Ice Cream 99', '冰激凌99'), arpu: 72, months: 48, riskScore: 78, reason: t('Contract expiring, low renewal intent', '合约即将到期, 未续约意愿低'), signal: t('30 days to expiry, inquired number portability', '合约到期前30天, 咨询携号转网') },
    { id: 4, name: t('Zhao Yanan', '赵雅楠'), phone: '135****1123', plan: t('Enjoy 299', '畅享299'), arpu: 245, months: 12, riskScore: 71, reason: t('Poor VoLTE quality causing dissatisfaction', 'VoLTE质量差导致不满'), signal: t('Repeated network quality complaints, satisfaction 2/5', '连续投诉网络质量, 满意度评分2/5') },
    { id: 5, name: t('Liu Jianguo', '刘建国'), phone: '137****4456', plan: t('Ice Cream 59', '冰激凌59'), arpu: 45, months: 60, riskScore: 65, reason: t('Low-ARPU long-term user, price sensitive', '低ARPU长期用户, 价格敏感'), signal: t('Frequent tariff inquiries, watching competitor low-price plans', '频繁查询资费, 关注竞对低价套餐') },
  ];

  // Lead identification users
  const leadUsers = [
    { id: 1, name: t('Chen Siyuan', '陈思远'), phone: '138****7712', current: t('Ice Cream 99', '冰激凌99'), predicted: t('Enjoy 199', '畅享199'), confidence: 94, trigger: t('3-month data overflow, video consumption +200%', '流量连续3月溢出, 视频消费增长200%'), value: '+¥100/月' },
    { id: 2, name: t('Huang Xiaoming', '黄小明'), phone: '136****3345', current: t('Basic Plan', '基础套餐'), predicted: t('5G Premium 399', '5G尊享399'), confidence: 88, trigger: t('Purchased 5G phone, frequent HD video usage', '已购5G手机, 频繁使用高清视频'), value: '+¥340/月' },
    { id: 3, name: t('Wu Lihua', '吴丽华'), phone: '139****9901', current: t('Ice Cream 129', '冰激凌129'), predicted: t('Family Bundle', '家庭融合版'), confidence: 82, trigger: t('3 family SIMs scattered, broadband expiring', '家庭成员3张卡分散消费, 宽带即将到期'), value: '+¥80/月' },
    { id: 4, name: t('Zhou Jie', '周杰'), phone: '135****6678', current: t('Enjoy 59', '畅享59'), predicted: t('Ice Cream 129', '冰激凌129'), confidence: 76, trigger: t('Rising data trend, night data pack maxed', '数据用量上升趋势, 夜间流量包已满'), value: '+¥70/月' },
  ];

  // LUM prediction animation
  useEffect(() => {
    if (!predicting || predStep < 0) return;
    if (predStep >= 5) { setPredicting(false); return; }
    const timer = setTimeout(() => setPredStep(s => s + 1), 900);
    return () => clearTimeout(timer);
  }, [predicting, predStep]);

  const startPredict = () => { setPredicting(true); setPredStep(0); };
  const handleIntervene = (id: number) => setIntervened(prev => new Set(prev).add(id));

  const lumSteps = [
    t('Loading user behavior sequences...', '加载用户行为序列...'),
    t('LUM Encoder: extracting behavior embeddings...', 'LUM编码器: 提取行为嵌入向量...'),
    t('Adapter: aligning telecom domain features...', '适配器: 对齐电信领域特征...'),
    t('LLM Decoder: generating predictions...', 'LLM解码器: 生成预测结果...'),
    t('Prediction complete! 5 churn risks, 4 leads identified', '预测完成！识别5个离网风险, 4个潜在客户'),
  ];

  return (
    <div className="space-y-3">
      {/* Header controls */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-bg-card rounded-lg border border-border p-0.5">
          <button onClick={() => setActiveView('churn')} className={`px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all ${activeView === 'churn' ? 'bg-status-red/10 text-status-red border border-status-red/30' : 'text-text-secondary hover:bg-bg-primary'}`}>
            {t('Churn Prediction', '离网预测')}
          </button>
          <button onClick={() => setActiveView('lead')} className={`px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all ${activeView === 'lead' ? 'bg-status-green/10 text-status-green border border-status-green/30' : 'text-text-secondary hover:bg-bg-primary'}`}>
            {t('Lead Identification', '潜客识别')}
          </button>
        </div>
        <button onClick={startPredict} disabled={predicting}
          className="px-3 py-1.5 rounded-lg text-xs bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 cursor-pointer disabled:opacity-40 flex items-center gap-1.5">
          <Play className="w-3 h-3" />{t('Run LUM Prediction', '运行LUM预测')}
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
          <span className="px-2 py-0.5 bg-bg-card rounded border border-border">LUM v2.0</span>
          <span>Encoder-Adapter-LLM</span>
        </div>
      </div>

      {/* LUM prediction animation */}
      {predicting && (
        <div className="bg-bg-card rounded-xl border border-accent-cyan/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-accent-cyan animate-pulse" />
            <h4 className="text-sm font-semibold text-text-primary">{t('LUM Model Inference', 'LUM模型推理')}</h4>
            <span className="text-[10px] text-text-muted ml-2">Large User Model — Encoder + Domain Adapter + LLM Decoder</span>
          </div>
          {/* LUM architecture diagram */}
          <div className="flex items-center gap-2 mb-3 px-4">
            {[
              { label: t('Behavior Seq', '行为序列'), color: '#3b82f6' },
              { label: t('LUM Encoder', 'LUM编码器'), color: '#8b5cf6' },
              { label: t('Domain Adapter', '领域适配器'), color: '#f59e0b' },
              { label: t('LLM Decoder', 'LLM解码器'), color: '#22c55e' },
              { label: t('Prediction', '预测结果'), color: '#06b6d4' },
            ].map((block, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-500 ${i <= predStep ? 'opacity-100' : 'opacity-30'}`}
                  style={{ backgroundColor: `${block.color}15`, borderColor: `${block.color}40`, color: block.color }}>
                  {block.label}
                </div>
                {i < 4 && <ArrowRight className={`w-3 h-3 transition-all duration-500 ${i < predStep ? 'text-accent-cyan' : 'text-text-muted/30'}`} />}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {lumSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all ${i <= predStep ? 'opacity-100' : 'opacity-30'}`}>
                {i < predStep ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" /> :
                  i === predStep ? <Activity className="w-3.5 h-3.5 text-accent-cyan animate-pulse shrink-0" /> :
                  <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                <span className={i <= predStep ? 'text-text-primary' : 'text-text-muted'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn Prediction View */}
      {activeView === 'churn' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-3 mb-2">
            {[
              { l: t('High Risk','高风险'), v: '5', c: 'text-status-red', bg: 'bg-status-red/10 border-status-red/30' },
              { l: t('Avg Risk Score','平均风险分'), v: '78.2', c: 'text-status-yellow', bg: 'bg-status-yellow/10 border-status-yellow/30' },
              { l: t('Intervened','已干预'), v: `${intervened.size}`, c: 'text-status-green', bg: 'bg-status-green/10 border-status-green/30' },
              { l: t('Predicted ARPU Save','预计挽回ARPU'), v: '¥616/月', c: 'text-accent-cyan', bg: 'bg-accent-cyan/10 border-accent-cyan/30' },
            ].map((s, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2 ${s.bg}`}>
                <p className="text-[10px] text-text-muted">{s.l}</p>
                <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          {/* Flowy-style user cards */}
          {churnUsers.map(u => {
            const done = intervened.has(u.id);
            return (
              <div key={u.id} className={`bg-bg-card rounded-xl border p-4 transition-all ${done ? 'border-status-green/40 opacity-70' : u.riskScore >= 85 ? 'border-status-red/40' : 'border-border'}`}>
                <div className="flex items-start gap-4">
                  {/* Risk score gauge */}
                  <div className="shrink-0">
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#1e293b" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none"
                        stroke={u.riskScore >= 85 ? '#ef4444' : u.riskScore >= 70 ? '#eab308' : '#22c55e'}
                        strokeWidth="4" strokeDasharray={`${u.riskScore * 1.5} ${150 - u.riskScore * 1.5}`}
                        strokeLinecap="round" transform="rotate(-90 28 28)" />
                      <text x="28" y="28" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{u.riskScore}</text>
                    </svg>
                  </div>
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{u.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">{u.phone}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted">{u.plan}</span>
                      <span className="text-[10px] text-text-muted">ARPU ¥{u.arpu}</span>
                      <span className="text-[10px] text-text-muted">{u.months}{t('mo','个月')}</span>
                    </div>
                    <p className="text-xs text-status-red mb-1">{t('Risk: ','风险: ')}{u.reason}</p>
                    <p className="text-[10px] text-text-muted">{t('Signal: ','信号: ')}{u.signal}</p>
                  </div>
                  {/* Action */}
                  <div className="shrink-0">
                    {done ? (
                      <span className="flex items-center gap-1 text-xs text-status-green"><CheckCircle2 className="w-3.5 h-3.5" />{t('Intervened','已干预')}</span>
                    ) : (
                      <button onClick={() => handleIntervene(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 cursor-pointer hover:bg-accent-cyan/20 transition-all">
                        {t('Intervene','主动干预')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Identification View */}
      {activeView === 'lead' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-3 mb-2">
            {[
              { l: t('Leads Found','识别潜客'), v: '4', c: 'text-status-green', bg: 'bg-status-green/10 border-status-green/30' },
              { l: t('Avg Confidence','平均置信度'), v: '85%', c: 'text-accent-cyan', bg: 'bg-accent-cyan/10 border-accent-cyan/30' },
              { l: t('Revenue Potential','收入潜力'), v: '+¥590/月', c: 'text-status-green', bg: 'bg-status-green/10 border-status-green/30' },
              { l: t('Conversion Rate','预计转化率'), v: '34.2%', c: 'text-text-primary', bg: 'bg-bg-card border-border' },
            ].map((s, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2 ${s.bg}`}>
                <p className="text-[10px] text-text-muted">{s.l}</p>
                <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          {/* Lead cards */}
          {leadUsers.map(u => (
            <div key={u.id} className="bg-bg-card rounded-xl border border-border p-4 hover:border-status-green/40 transition-all">
              <div className="flex items-start gap-4">
                {/* Confidence gauge */}
                <div className="shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#22c55e" strokeWidth="4"
                      strokeDasharray={`${u.confidence * 1.5} ${150 - u.confidence * 1.5}`}
                      strokeLinecap="round" transform="rotate(-90 28 28)" />
                    <text x="28" y="28" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{u.confidence}</text>
                  </svg>
                </div>
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{u.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{u.phone}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted">{u.current}</span>
                    <ArrowRight className="w-3 h-3 text-status-green" />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-green/10 text-status-green border border-status-green/30">{u.predicted}</span>
                  </div>
                  <p className="text-xs text-status-green mb-1">{t('Trigger: ','触发: ')}{u.trigger}</p>
                </div>
                {/* Revenue value */}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-status-green">{u.value}</p>
                  <button onClick={() => alert(t('Offer pushed successfully', '优惠已成功推送'))} className="mt-1 px-3 py-1 rounded-lg text-[10px] bg-status-green/10 text-status-green border border-status-green/30 cursor-pointer hover:bg-status-green/20 transition-all">
                    {t('Push Offer','推送优惠')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── Simulation Log Entry ─── */
interface LogEntry { time: string; level: 'info' | 'warn' | 'error'; msg: string; }
const INITIAL_LOGS: LogEntry[] = [
  { time: '01:04:32', level: 'info', msg: '[Twin] 数字孪生引擎初始化完成' },
  { time: '01:04:33', level: 'info', msg: '[Sync] 同步网络拓扑数据: 15节点, 18链路' },
  { time: '01:04:35', level: 'warn', msg: '[Alert] BTS-GD-005 PRB利用率 92% 超过阈值' },
  { time: '01:04:36', level: 'info', msg: '[Sim] 启动容量预测仿真 (正常增长模式)' },
  { time: '01:04:38', level: 'error', msg: '[Fault] Link GZ-SZ-03 BER告警: 1.2E-6' },
  { time: '01:04:40', level: 'info', msg: '[TAOR] Think: 分析BER上升根因 → Act: 查询历史数据' },
  { time: '01:04:42', level: 'info', msg: '[Recovery] 自动切换至备份路径, 业务无损' },
];

/* ─── Main Component ─── */
export default function Topology() {
  const { t } = useText();
  const [activeTab, setActiveTab] = useState<TabId>('network');
  const [selectedNode, setSelectedNode] = useState<TopoNode | null>(null);
  const [simRunning, setSimRunning] = useState(true);
  // Graph Explorer enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(NODE_LAYERS));
  const [zoom, setZoom] = useState(1);
  const [showOverlay, setShowOverlay] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((node: TopoNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const toggleLayer = useCallback((layer: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer); else next.add(layer);
      return next;
    });
  }, []);

  // Filtered nodes/links based on search and layer visibility
  const filteredNodes = topoNodes.filter(n =>
    visibleLayers.has(n.type) &&
    (searchQuery === '' || n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.nameZh?.includes(searchQuery))
  );
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = topoLinks.filter(l => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target));

  // Live log generation
  useEffect(() => {
    if (!simRunning) return;
    const msgs = [
      '[Telemetry] 更新15节点实时遥测数据', '[Sim] 体验评分计算完成: 平均87.3',
      '[Twin] 拓扑状态同步: 13/15节点正常', '[TAOR] Observe: KPI达标率 96.7%',
      '[Predict] BTS-GD-007电池寿命预测: 剩余89天',
    ];
    const timer = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setLogs(prev => [...prev.slice(-20), { time, level: Math.random() > 0.85 ? 'warn' : 'info', msg }]);
    }, 3000);
    return () => clearInterval(timer);
  }, [simRunning]);

  const svgWidth = 920;
  const svgHeight = 500;

  return (
    <div className="p-5 overflow-auto h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Network className="w-5 h-5 text-accent-cyan" />{t('Digital Twin', '数字孪生')}</h1>
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
      {activeTab === 'user' && <UserTwin t={t} />}

      {activeTab === 'network' && (
      <div className="space-y-3">
        {/* Query bar (Azure DT Explorer style) */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-bg-card rounded-lg border border-border px-3 py-2 focus-within:border-accent-cyan/60 transition-colors">
            <Search className="w-4 h-4 text-text-muted" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Search twins by name...', '按名称搜索孪生实例...')}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none" />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowOverlay(!showOverlay)}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${showOverlay ? 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan' : 'bg-bg-card border-border text-text-muted'}`}
              title={t('Toggle KPI Overlay', '切换KPI叠加')}>
              {showOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{filteredNodes.length}/{topoNodes.length} {t('twins','孪生实例')}</span>
            <span>{filteredLinks.length} {t('relationships','关系')}</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { l: t('Twins','孪生实例'), v: filteredNodes.length, c: 'text-accent-cyan' },
            { l: t('Relationships','关系'), v: filteredLinks.length, c: 'text-text-primary' },
            { l: t('Active','活跃'), v: filteredLinks.filter(l => l.status === 'normal').length, c: 'text-status-green' },
            { l: t('Avg Latency','平均时延'), v: '2.3ms', c: 'text-text-primary' },
            { l: t('Throughput','总吞吐'), v: '48.7Tbps', c: 'text-text-primary' },
          ].map((s, i) => (
            <div key={i} className="bg-bg-card rounded-lg border border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">{s.l}</span>
              <span className={`text-sm font-semibold ${s.c}`}>{s.v}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[auto_1fr_300px] gap-3">
        {/* Layer filter panel (Azure DT Explorer model viewer) */}
        <div className="bg-bg-card rounded-xl border border-border p-3 w-40">
          <h4 className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3 h-3" />{t('Layers', '层级')}
          </h4>
          {NODE_LAYERS.map(layer => {
            const count = topoNodes.filter(n => n.type === layer).length;
            const visible = visibleLayers.has(layer);
            return (
              <button key={layer} onClick={() => toggleLayer(layer)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs mb-1 transition-all cursor-pointer ${visible ? 'bg-bg-primary text-text-primary' : 'text-text-muted opacity-50'}`}>
                {visible ? <Eye className="w-3 h-3 text-accent-cyan" /> : <EyeOff className="w-3 h-3" />}
                <span className="flex-1 text-left">{t(LAYER_LABELS[layer].en, LAYER_LABELS[layer].zh)}</span>
                <span className="text-[10px] text-text-muted">{count}</span>
              </button>
            );
          })}
          <div className="mt-2 pt-2 border-t border-border">
            <h4 className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3 h-3" />{t('Status','状态')}
            </h4>
            {['normal','warning','fault'].map(s => {
              const count = filteredNodes.filter(n => n.status === s).length;
              return (
                <div key={s} className="flex items-center gap-2 px-2 py-1 text-xs">
                  <span className={`w-2 h-2 rounded-full ${s === 'normal' ? 'bg-status-green' : s === 'warning' ? 'bg-status-yellow' : 'bg-status-red'}`} />
                  <span className="text-text-secondary capitalize">{s}</span>
                  <span className="text-text-muted ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SVG Graph Viewer (enhanced) */}
        <div ref={svgContainerRef} className="bg-bg-card rounded-xl border border-border p-2 overflow-hidden relative">
          {/* Zoom controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="w-7 h-7 bg-bg-primary/80 backdrop-blur border border-border rounded flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="w-7 h-7 bg-bg-primary/80 backdrop-blur border border-border rounded flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={() => setZoom(1)} className="w-7 h-7 bg-bg-primary/80 backdrop-blur border border-border rounded flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="absolute top-3 left-3 z-10 text-[10px] text-text-muted bg-bg-primary/60 backdrop-blur rounded px-2 py-0.5">{(zoom * 100).toFixed(0)}%</div>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
              <filter id="nodeShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" /></filter>
            </defs>
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

            {/* Links */}
            {filteredLinks.map((link) => {
              const src = filteredNodes.find((n) => n.id === link.source);
              const tgt = filteredNodes.find((n) => n.id === link.target);
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
            {filteredNodes.map((node) => {
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
                  {/* KPI overlay (Azure DT telemetry style) */}
                  {showOverlay && (
                    <g>
                      <rect x={node.x + size - 2} y={node.y - size - 4} width={38} height={14} rx={3}
                        fill="rgba(0,0,0,0.7)" stroke={node.details.load > 80 ? '#ef4444' : '#334155'} strokeWidth={0.5} />
                      <text x={node.x + size + 17} y={node.y - size + 6} textAnchor="middle" fill={node.details.load > 80 ? '#fca5a5' : '#94a3b8'} fontSize="8" fontFamily="monospace">
                        {node.details.load}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Property Inspector (Azure DT Explorer style) */}
        <div className="overflow-auto max-h-[500px]">
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
          ) : (
            <div className="bg-bg-card rounded-xl border border-border flex items-center justify-center h-48">
              <div className="text-center">
                <Radio className="w-6 h-6 text-text-muted mx-auto mb-1.5" />
                <p className="text-xs text-text-muted">{t('Select a twin instance', '选择孪生实例')}</p>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          <div className="mt-3 bg-bg-card rounded-xl border border-border p-3">
            <h3 className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">
              {t('Simulation Results', '仿真结果')}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Resilience Score', '韧性评分')}</span>
                <span className="text-text-primary font-medium">87/100</span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="h-full bg-accent-cyan rounded-full" style={{ width: '87%' }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('SPOF', '单点故障')}</span>
                <span className="text-status-yellow font-medium">2</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Redundancy', '冗余率')}</span>
                <span className="text-status-green font-medium">94.2%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Failover', '故障切换')}</span>
                <span className="text-text-primary font-medium">1.8s</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Console/Output panel (Azure DT Explorer style) */}
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={() => setConsoleOpen(!consoleOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-bg-primary transition-colors">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Terminal className="w-3.5 h-3.5" />{t('Simulation Console', '仿真控制台')}
              <span className="text-text-muted">({logs.length})</span>
            </span>
            {consoleOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronUp className="w-3.5 h-3.5 text-text-muted" />}
          </button>
          {consoleOpen && (
            <div className="border-t border-border px-3 py-2 max-h-32 overflow-auto font-mono text-[10px] space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 ${log.level === 'error' ? 'text-status-red' : log.level === 'warn' ? 'text-status-yellow' : 'text-text-muted'}`}>
                  <span className="text-text-muted/60 shrink-0">{log.time}</span>
                  <span>{log.msg}</span>
                </div>
              ))}
            </div>
          )}
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
