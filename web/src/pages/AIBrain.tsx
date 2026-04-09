import { useState, useEffect } from 'react';
import {
  Brain, Cpu, Activity, ChevronRight, Server, Database,
  Layers, TrendingUp, TrendingDown, Minus, RefreshCw, CheckCircle2,
  Radio, ArrowRight, Settings, Gauge,
  Thermometer, HardDrive, GitBranch,
  Search, Bot, RotateCcw,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useText } from '../hooks/useText';
import {
  gemma4Instance,
  inferenceMetrics as defaultMetrics,
  padeStages,
  loraAdapters,
  gpuNodes,
  ragSources,
  type InferenceMetric,
} from '../data/ai-brain';
import { domainAgents } from '../data/agents';

/* ─── Helpers ─── */
const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

const statusDot: Record<string, string> = {
  online: 'bg-status-green',
  offline: 'bg-status-red',
  warming: 'bg-status-yellow animate-pulse',
  training: 'bg-accent-purple animate-pulse',
  active: 'bg-status-green',
  idle: 'bg-text-muted',
  maintenance: 'bg-status-yellow',
  synced: 'bg-status-green',
  syncing: 'bg-status-yellow animate-pulse',
  error: 'bg-status-red',
  standby: 'bg-text-muted',
};

const statusLabel: Record<string, { en: string; zh: string }> = {
  online: { en: 'Online', zh: '在线' },
  offline: { en: 'Offline', zh: '离线' },
  warming: { en: 'Warming Up', zh: '预热中' },
  training: { en: 'Training', zh: '训练中' },
  active: { en: 'Active', zh: '运行中' },
  idle: { en: 'Idle', zh: '空闲' },
  maintenance: { en: 'Maintenance', zh: '维护中' },
  synced: { en: 'Synced', zh: '已同步' },
  syncing: { en: 'Syncing', zh: '同步中' },
  standby: { en: 'Standby', zh: '待机' },
};

/* ─── PADE Pipeline Visual ─── */
function PADEPipeline({ t, tick }: { t: (en: string, zh: string) => string; tick: number }) {
  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-accent-purple" />
        {t('PADE Pipeline', 'PADE 流水线')}
        <span className="ml-2 text-[10px] bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full">
          {t('Perception → Analysis → Decision → Execution', '感知 → 分析 → 决策 → 执行')}
        </span>
      </h2>
      <div className="overflow-x-auto">
        <div className="min-w-[700px] flex items-stretch gap-0">
          {padeStages.map((stage, i) => {
            const isActive = tick % 4 === i;
            return (
              <div key={stage.id} className="flex items-stretch flex-1 min-w-0">
                <div
                  className={`flex-1 rounded-xl border-2 p-3 transition-all duration-500 ${isActive ? 'scale-[1.02] shadow-lg' : ''}`}
                  style={{
                    borderColor: stage.color + (isActive ? '80' : '40'),
                    backgroundColor: stage.color + (isActive ? '15' : '08'),
                    boxShadow: isActive ? `0 0 20px ${stage.color}30` : 'none',
                  }}
                >
                  {/* Stage header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: stage.color }}>
                      {stage.id[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{t(stage.name, stage.nameZh)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mb-2 line-clamp-2">{t(stage.description, stage.descriptionZh)}</p>

                  {/* Sources */}
                  <div className="mb-2">
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">{t('Input', '输入')}</p>
                    <div className="flex flex-wrap gap-1">
                      {stage.sources.map(s => (
                        <span key={s.name} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: stage.color + '30', color: stage.color, backgroundColor: stage.color + '10' }}>
                          {t(s.name, s.nameZh)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div className="mb-2">
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">{t('Output', '输出')}</p>
                    <div className="flex flex-wrap gap-1">
                      {stage.outputs.map(o => (
                        <span key={o.name} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: stage.color + '30', color: stage.color, backgroundColor: stage.color + '10' }}>
                          {t(o.name, o.nameZh)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-3 text-[10px] pt-1 border-t" style={{ borderColor: stage.color + '20' }}>
                    <span className="text-text-muted">{t('Latency', '延迟')}: <span className="text-text-secondary font-mono">{stage.latency}ms</span></span>
                    <span className="text-text-muted">{t('TPS', '吞吐')}: <span className="text-text-secondary font-mono">{stage.throughput.toLocaleString()}</span></span>
                  </div>
                </div>
                {/* Connector arrow */}
                {i < padeStages.length - 1 && (
                  <div className="flex items-center px-1 shrink-0">
                    <ArrowRight className={`w-4 h-4 transition-all duration-500 ${isActive ? 'text-accent-cyan scale-125' : 'text-text-muted'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Model Config Modal ─── */
function ModelConfigModal({ open, onClose, t }: { open: boolean; onClose: () => void; t: (en: string, zh: string) => string }) {
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [topP, setTopP] = useState(0.9);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Settings className="w-4 h-4 text-accent-cyan" />
            {t('Model Configuration', '模型配置')}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer text-lg">&times;</button>
        </div>
        <div className="p-5 space-y-5">
          {/* Temperature */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Temperature: <span className="font-mono text-accent-cyan">{temp}</span></label>
            <input type="range" min={0} max={2} step={0.1} value={temp} onChange={e => setTemp(Number(e.target.value))}
              className="w-full accent-accent-cyan" />
            <div className="flex justify-between text-[10px] text-text-muted"><span>{t('Precise', '精确')}</span><span>{t('Creative', '创造')}</span></div>
          </div>
          {/* Max Tokens */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Max Tokens: <span className="font-mono text-accent-cyan">{maxTokens.toLocaleString()}</span></label>
            <input type="range" min={1024} max={131072} step={1024} value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
              className="w-full accent-accent-cyan" />
            <div className="flex justify-between text-[10px] text-text-muted"><span>1K</span><span>128K</span></div>
          </div>
          {/* Top-P */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Top-P: <span className="font-mono text-accent-cyan">{topP}</span></label>
            <input type="range" min={0} max={1} step={0.05} value={topP} onChange={e => setTopP(Number(e.target.value))}
              className="w-full accent-accent-cyan" />
            <div className="flex justify-between text-[10px] text-text-muted"><span>{t('Focused', '聚焦')}</span><span>{t('Diverse', '多样')}</span></div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setTemp(0.7); setMaxTokens(8192); setTopP(0.9); }}
              className="flex-1 px-3 py-2 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3 h-3" /> {t('Reset Defaults', '恢复默认')}
            </button>
            <button onClick={() => { onClose(); alert(t('Configuration saved', '配置已保存')); }}
              className="flex-1 px-3 py-2 text-xs bg-accent-cyan text-white rounded-lg hover:bg-accent-cyan/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {t('Apply', '应用')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AIBrain() {
  const { t } = useText();
  const [tick, setTick] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState<InferenceMetric[]>(defaultMetrics);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);

  /* Live metric animation */
  useEffect(() => {
    const iv = setInterval(() => {
      setTick(prev => prev + 1);
      setLiveMetrics(prev => prev.map(m => {
        const jitter = (Math.random() - 0.5) * 2;
        const scale = m.id === 'throughput' ? 30 : m.id === 'rpm' ? 8 : m.id === 'latency' ? 3 : m.id === 'queue' ? 0.5 : 0.15;
        let newVal = Math.round((m.value + jitter * scale) * 100) / 100;
        if (m.unit === '%') newVal = Math.min(newVal, 99.99);
        if (m.id === 'queue') newVal = Math.max(0, Math.round(newVal));
        if (m.id === 'latency') newVal = Math.max(50, newVal);
        const newHist = [...m.history.slice(1), newVal];
        return { ...m, value: newVal, history: newHist };
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="p-3 md:p-5 space-y-5 overflow-auto h-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-cyan" />
          {t('AI Brain', 'AI 大脑')}
        </h1>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className={`w-2 h-2 rounded-full ${statusDot[gemma4Instance.status]}`} />
          <span className="text-xs text-status-green font-medium">{gemma4Instance.name} {t(statusLabel[gemma4Instance.status].en, statusLabel[gemma4Instance.status].zh)}</span>
          <span className="text-xs text-text-muted">|</span>
          <Radio className="w-3 h-3 text-accent-cyan animate-pulse" />
          <span className="text-xs text-text-muted">{t('PADE Loop', 'PADE循环')} #{3847 + tick}</span>
        </div>
      </div>

      {/* ① Model Overview Card */}
      <section className="bg-bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Model icon + info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-accent-cyan" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-text-primary">{gemma4Instance.name}</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan font-mono">v{gemma4Instance.version}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple">{gemma4Instance.parameters}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-green/15 text-status-green">{gemma4Instance.quantization}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">{t(gemma4Instance.description, gemma4Instance.descriptionZh)}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-text-secondary">
                <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {gemma4Instance.engine}</span>
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {gemma4Instance.gpuAllocation}</span>
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {t('Max Seq', '最大序列')} {(gemma4Instance.maxSeqLen / 1024).toFixed(0)}K</span>
                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {loraAdapters.length} LoRA {t('Adapters', '适配器')}</span>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfigOpen(true)}
              className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> {t('Config', '配置')}
            </button>
            <button onClick={() => alert(t('Model restarting...', '模型重启中...'))}
              className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> {t('Restart', '重启')}
            </button>
          </div>
        </div>
      </section>

      {/* ② Live Inference Metrics */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-cyan" />
          {t('Inference Metrics', '推理指标')}
          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
          <span className="text-xs text-text-muted font-normal">{t('Live', '实时')}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {liveMetrics.map(m => {
            const TIcon = trendIcon[m.trend];
            const isGood = (m.goodDirection === 'up' && m.trend === 'up') || (m.goodDirection === 'down' && m.trend === 'down') || m.trend === 'stable';
            const trendColor = isGood ? 'text-status-green' : 'text-status-red';
            const chartColor = isGood ? '#22c55e' : '#ef4444';
            const chartData = m.history.map((v, i) => ({ v, i }));

            return (
              <div key={m.id} className="bg-bg-card rounded-xl border border-border p-4 hover:border-accent-cyan/30 transition-all">
                <p className="text-xs text-text-muted mb-1 truncate">{t(m.name, m.nameZh)}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-semibold text-text-primary tabular-nums transition-all duration-500">
                      {m.id === 'throughput' || m.id === 'rpm' ? Math.round(m.value).toLocaleString() : m.value}
                    </span>
                    {m.unit && <span className="text-xs text-text-muted ml-1">{m.unit}</span>}
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                    <TIcon className="w-3 h-3" />
                    <span>{m.change > 0 ? '+' : ''}{m.change}</span>
                  </div>
                </div>
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`brain-grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#f1f5f9' }} labelFormatter={() => ''} formatter={v => [String(v), t(m.name, m.nameZh)]} />
                      <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#brain-grad-${m.id})`} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ③ PADE Pipeline */}
      <PADEPipeline t={t} tick={tick} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ④ LoRA Adapters */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-purple" />
            {t('Domain LoRA Adapters', '领域 LoRA 适配器')}
            <span className="ml-2 text-xs bg-status-green/20 text-status-green px-2 py-0.5 rounded-full">
              {loraAdapters.filter(a => a.status === 'active').length}/{loraAdapters.length} {t('Active', '激活')}
            </span>
          </h2>
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {loraAdapters.map(adapter => {
                const agent = domainAgents.find(a => a.id === adapter.agentId);
                return (
                  <div key={adapter.id}
                    onClick={() => setSelectedAdapter(selectedAdapter === adapter.id ? null : adapter.id)}
                    className="px-4 py-3 hover:bg-bg-hover/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: adapter.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{t(adapter.name, adapter.nameZh)}</p>
                        <p className="text-[10px] text-text-muted truncate">{t(adapter.domain, adapter.domainZh)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-text-secondary">r{adapter.rank}</span>
                        <span className={`text-[10px] ${adapter.accuracy >= 95 ? 'text-status-green' : adapter.accuracy >= 92 ? 'text-status-yellow' : 'text-text-secondary'}`}>
                          {adapter.accuracy}%
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusDot[adapter.status]}`} />
                        <ChevronRight className={`w-3 h-3 text-text-muted transition-transform ${selectedAdapter === adapter.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {/* Expanded detail */}
                    {selectedAdapter === adapter.id && (
                      <div className="mt-3 pt-3 border-t space-y-2 animate-fade-in" style={{ borderColor: adapter.color + '20' }}>
                        <p className="text-[10px] text-text-muted">{t(adapter.description, adapter.descriptionZh)}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex justify-between"><span className="text-text-muted">{t('Base Model', '基座模型')}</span><span className="text-text-secondary font-mono">{adapter.baseModel}</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{t('LoRA Rank', 'LoRA秩')}</span><span className="text-text-secondary font-mono">{adapter.rank}</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{t('Train Samples', '训练样本')}</span><span className="text-text-secondary font-mono">{adapter.trainSamples.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{t('Accuracy', '准确率')}</span><span className="text-status-green font-mono">{adapter.accuracy}%</span></div>
                        </div>
                        {agent && (
                          <div className="flex items-center gap-2 text-[10px] pt-1">
                            <Bot className="w-3 h-3 text-accent-cyan" />
                            <span className="text-text-muted">{t('Bound to', '绑定到')}: </span>
                            <span className="text-accent-cyan">{t(agent.name, agent.nameZh)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ⑤ GPU Cluster */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent-cyan" />
            {t('GPU Cluster', 'GPU 集群')}
            <span className="ml-2 text-xs bg-accent-cyan/20 text-accent-cyan px-2 py-0.5 rounded-full">
              {gpuNodes.filter(g => g.status === 'active').length}/{gpuNodes.length} {t('Active', '运行')}
            </span>
          </h2>
          <div className="space-y-3">
            {gpuNodes.map(gpu => {
              const utilColor = gpu.utilization >= 70 ? '#22c55e' : gpu.utilization >= 40 ? '#eab308' : '#64748b';
              const tempColor = gpu.temperature >= 70 ? '#ef4444' : gpu.temperature >= 55 ? '#eab308' : '#22c55e';
              return (
                <div key={gpu.id} className="bg-bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs font-medium text-text-primary">{gpu.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{gpu.type}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ml-auto ${statusDot[gpu.status]}`} />
                    <span className="text-[10px] text-text-muted">{t(statusLabel[gpu.status].en, statusLabel[gpu.status].zh)}</span>
                  </div>
                  {/* Utilization bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gauge className="w-3 h-3 text-text-muted" />
                    <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${gpu.utilization}%`, backgroundColor: utilColor }} />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: utilColor }}>{gpu.utilization}%</span>
                  </div>
                  {/* Temp + Memory + Assignment */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                    <span className="flex items-center gap-1 text-text-muted"><Thermometer className="w-3 h-3" style={{ color: tempColor }} /> {gpu.temperature}°C</span>
                    <span className="flex items-center gap-1 text-text-muted"><HardDrive className="w-3 h-3" /> {gpu.memory}</span>
                    <span className="text-text-secondary truncate">{gpu.assignedTo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ⑥ RAG Knowledge Integration */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-accent-blue" />
            {t('RAG Knowledge Sources', 'RAG 知识源')}
            <span className="ml-2 text-xs bg-status-green/20 text-status-green px-2 py-0.5 rounded-full">
              {ragSources.filter(r => r.status === 'synced').length}/{ragSources.length} {t('Synced', '已同步')}
            </span>
          </h2>
          <div className="space-y-3">
            {ragSources.map(rag => (
              <div key={rag.id} className="bg-bg-card rounded-xl border border-border p-3 hover:border-accent-cyan/30 transition-all cursor-pointer"
                onClick={() => alert(t(`${rag.name}: ${rag.totalDocs} docs, ${rag.totalChunks.toLocaleString()} chunks`, `${t(rag.name, rag.nameZh)}: ${rag.totalDocs} 文档, ${rag.totalChunks.toLocaleString()} 分块`))}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rag.color }} />
                  <span className="text-xs font-medium text-text-primary">{t(rag.name, rag.nameZh)}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ml-auto ${statusDot[rag.status]}`} />
                  <span className="text-[10px] text-text-muted">{t(statusLabel[rag.status].en, statusLabel[rag.status].zh)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-text-muted">{t('Docs', '文档')}</span><span className="text-text-secondary font-mono">{rag.totalDocs.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Chunks', '分块')}</span><span className="text-text-secondary font-mono">{rag.totalChunks.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Index Size', '索引大小')}</span><span className="text-text-secondary font-mono">{rag.indexSize}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{t('Last Sync', '上次同步')}</span><span className="text-status-green font-mono">{rag.lastSync}</span></div>
                </div>
                <div className="flex gap-2 mt-2 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {rag.vectorStore}</span>
                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {rag.embeddingModel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⑦ Agent ↔ Model Mapping */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-cyan" />
            {t('Agent ↔ Model Integration', 'Agent ↔ 模型集成')}
          </h2>
          <div className="space-y-3">
            {domainAgents.map(agent => {
              const adapter = loraAdapters.find(a => a.agentId === agent.id);
              return (
                <div key={agent.id} className="bg-bg-card rounded-xl border border-border p-3 hover:border-accent-cyan/30 transition-all cursor-pointer"
                  onClick={() => alert(t(`${agent.name}: Using Gemma 4 27B + ${adapter?.name || 'Base Model'}`, `${agent.nameZh}: 使用 Gemma 4 27B + ${adapter?.nameZh || '基座模型'}`))}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (adapter?.color || '#06b6d4') + '15', border: `1px solid ${(adapter?.color || '#06b6d4')}30` }}>
                      <Bot className="w-4 h-4" style={{ color: adapter?.color || '#06b6d4' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{t(agent.name, agent.nameZh)}</p>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-accent-cyan" />
                          Gemma 4 27B
                        </span>
                        {adapter && (
                          <>
                            <span>+</span>
                            <span style={{ color: adapter.color }}>{t(adapter.name, adapter.nameZh)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text-secondary tabular-nums">{agent.taskCount} {t('tasks', '任务')}</span>
                      <span className={`text-[10px] ${agent.successRate >= 97 ? 'text-status-green' : 'text-status-yellow'}`}>{agent.successRate}%</span>
                      <ChevronRight className="w-3 h-3 text-text-muted" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Config modal */}
      <ModelConfigModal open={configOpen} onClose={() => setConfigOpen(false)} t={t} />
    </div>
  );
}
