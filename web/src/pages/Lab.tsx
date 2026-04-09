import { useState, useEffect, useRef } from 'react';
import {
  FlaskConical, Brain, Play, RotateCcw, ChevronRight, CheckCircle2,
  Loader2, Activity, Zap, AlertTriangle, MapPin, TrendingDown,
  MessageSquare, Battery, Sparkles, Target, ArrowRight, Cpu,
  Layers, Radio, BarChart3, Rocket, ShieldCheck,
} from 'lucide-react';
import { useText } from '../hooks/useText';
import { labExperiments, labStats, type LabExperiment } from '../data/lab-experiments';

/* ─── Icon mapping for experiments ─── */
import type { LucideIcon } from 'lucide-react';
const EXP_ICONS: Record<string, LucideIcon> = {
  AlertTriangle, MapPin, TrendingDown, Zap, MessageSquare, Battery,
};

/* ─── Experiment Detail View (with reasoning playback) ─── */
function ExperimentDetail({ exp, t, onBack }: { exp: LabExperiment; t: (en: string, zh: string) => string; onBack: () => void }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const Icon = EXP_ICONS[exp.icon] || Sparkles;

  const runExperiment = () => {
    // Clear any existing timers
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];

    setRunning(true);
    setCompleted(false);
    setCurrentStep(-1);

    let cumulative = 0;
    exp.reasoning.forEach((step, idx) => {
      // Cap each step playback at 1.5s for UX (real latency is shown in metric)
      const playDuration = Math.min(step.duration, 1500);
      const startDelay = cumulative + 200;
      const id = window.setTimeout(() => setCurrentStep(idx), startDelay);
      timeoutsRef.current.push(id);
      cumulative = startDelay + playDuration;
    });

    const finalId = window.setTimeout(() => {
      setRunning(false);
      setCompleted(true);
      setCurrentStep(exp.reasoning.length);
    }, cumulative + 300);
    timeoutsRef.current.push(finalId);
  };

  const reset = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    setRunning(false);
    setCompleted(false);
    setCurrentStep(-1);
  };

  useEffect(() => () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-text-muted hover:text-text-primary cursor-pointer text-xs flex items-center gap-1">
          <ChevronRight className="w-3 h-3 rotate-180" /> {t('Back to Lab', '返回实验室')}
        </button>
      </div>

      {/* Experiment Title Card */}
      <div className="rounded-xl border-2 p-4" style={{ borderColor: exp.color + '50', backgroundColor: exp.color + '08' }}>
        <div className="flex flex-col md:flex-row md:items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: exp.color + '20', border: `1px solid ${exp.color}40` }}>
              <Icon className="w-5 h-5" style={{ color: exp.color }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-text-primary">{t(exp.name, exp.nameZh)}</h2>
                {exp.productionDeployed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-green/15 text-status-green flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> {t('Production', '生产环境')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">{t(exp.domain, exp.domainZh)} · {exp.loraAdapter}</p>
              <p className="text-xs text-text-secondary mt-2">{t(exp.problem, exp.problemZh)}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!running && !completed && (
              <button onClick={runExperiment} className="px-3 py-1.5 text-xs rounded-lg cursor-pointer flex items-center gap-1.5 transition-all"
                style={{ backgroundColor: exp.color, color: '#fff' }}>
                <Play className="w-3.5 h-3.5" /> {t('Run with Gemma 4', '使用 Gemma 4 运行')}
              </button>
            )}
            {running && (
              <div className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('Running...', '运行中...')}
              </div>
            )}
            {completed && (
              <button onClick={reset} className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary cursor-pointer flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> {t('Reset', '重置')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inputs */}
      <section>
        <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> {t('Input Data', '输入数据')}
        </h3>
        <div className="bg-bg-card rounded-xl border border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {exp.inputs.map(inp => (
            <div key={inp.label} className="flex justify-between text-[11px] py-1 border-b border-border last:border-0">
              <span className="text-text-muted">{t(inp.label, inp.labelZh)}</span>
              <span className="text-text-primary font-mono truncate ml-2">{inp.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Reasoning Steps */}
      <section>
        <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-accent-cyan" /> {t('Gemma 4 Reasoning', 'Gemma 4 推理过程')}
          {(running || completed) && (
            <span className="ml-2 text-[10px] text-text-muted">{t('Step', '步骤')} {Math.min(currentStep + 1, exp.reasoning.length)}/{exp.reasoning.length}</span>
          )}
        </h3>
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          {exp.reasoning.map((step, idx) => {
            const active = idx === currentStep && running;
            const done = currentStep > idx || completed;
            const visible = currentStep >= idx;
            return (
              <div key={idx} className={`px-4 py-3 border-b border-border last:border-0 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-30'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${active ? 'bg-accent-cyan animate-pulse' : done ? 'bg-status-green' : 'bg-bg-tertiary'}`}>
                    {active ? <Loader2 className="w-3 h-3 text-white animate-spin" /> :
                     done ? <CheckCircle2 className="w-3 h-3 text-white" /> :
                     <span className="text-[10px] text-text-muted font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">{t(step.phase, step.phaseZh)}</span>
                      <span className="text-[10px] text-text-muted font-mono">{step.duration}ms</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">{t(step.detail, step.detailZh)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Output */}
      {(completed || currentStep >= exp.reasoning.length - 1) && (
        <section className="animate-fade-in">
          <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-status-green" /> {t('Solution', '解决方案')}
          </h3>
          <div className="rounded-xl border-2 p-4" style={{ borderColor: '#22c55e50', backgroundColor: '#22c55e08' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-green" />
              <h4 className="text-sm font-semibold text-text-primary">{t(exp.outputTitle, exp.outputTitleZh)}</h4>
            </div>
            <p className="text-xs text-text-secondary mb-3">{t(exp.outputSummary, exp.outputSummaryZh)}</p>
            <div className="space-y-1.5">
              {exp.actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px]">
                  <ArrowRight className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                  <span className="text-text-secondary">{t(action.en, action.zh)}</span>
                </div>
              ))}
            </div>
            {/* Impact metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-status-green/20">
              {exp.impact.map(m => (
                <div key={m.label} className="text-center p-2 rounded-lg bg-bg-card border border-border">
                  <p className="text-[10px] text-text-muted">{t(m.label, m.labelZh)}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Production Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-muted">{t('Total Runs', '总运行次数')}</p>
          <p className="text-base font-semibold text-text-primary tabular-nums">{exp.runs.toLocaleString()}</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-muted">{t('Success Rate', '成功率')}</p>
          <p className="text-base font-semibold text-status-green tabular-nums">{exp.successRate}%</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-muted">{t('Avg Latency', '平均延迟')}</p>
          <p className="text-base font-semibold text-accent-cyan tabular-nums">{exp.avgLatency}ms</p>
        </div>
      </section>
    </div>
  );
}

/* ─── Main Lab Page ─── */
export default function Lab() {
  const { t } = useText();
  const [selected, setSelected] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  /* Pulse for live indicator */
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  const selectedExp = labExperiments.find(e => e.id === selected);

  return (
    <div className="p-3 md:p-5 space-y-5 overflow-auto h-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-accent-cyan" />
          {t('Lab', '实验室')}
        </h1>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <div className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
          <span className="text-xs text-status-green font-medium">Gemma 4 27B {t('Online', '在线')}</span>
          <span className="text-xs text-text-muted">|</span>
          <Radio className="w-3 h-3 text-accent-cyan animate-pulse" />
          <span className="text-xs text-text-muted">{t('PADE Loop', 'PADE循环')} #{3847 + tick}</span>
        </div>
      </div>

      {!selected && (
        <>
          {/* Lab description banner */}
          <div className="bg-bg-card rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-accent-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-text-primary">{t('Production Experiment Library', '生产实验库')}</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {t(
                    'Real telecom scenarios where Gemma 4 + domain LoRA adapters drive perception → analysis → decision → execution. Each experiment is deployed to production and continuously runs against live data.',
                    'Gemma 4 + 领域 LoRA 适配器驱动感知 → 分析 → 决策 → 执行的真实电信场景。每个实验已部署到生产环境，并持续基于实时数据运行。',
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Lab Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-text-muted text-[10px]">
                <FlaskConical className="w-3 h-3" /> {t('Experiments', '实验')}
              </div>
              <p className="text-xl font-semibold text-text-primary tabular-nums mt-1">{labStats.totalExperiments}</p>
              <p className="text-[10px] text-text-muted">{labStats.productionDeployed} {t('in production', '生产部署')}</p>
            </div>
            <div className="bg-bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-text-muted text-[10px]">
                <Activity className="w-3 h-3" /> {t('Total Runs', '总运行')}
              </div>
              <p className="text-xl font-semibold text-text-primary tabular-nums mt-1">{labStats.totalRuns.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted">{labStats.todayRuns} {t('today', '今日')}</p>
            </div>
            <div className="bg-bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-text-muted text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> {t('Avg Success', '平均成功率')}
              </div>
              <p className="text-xl font-semibold text-status-green tabular-nums mt-1">{labStats.avgSuccessRate}%</p>
              <p className="text-[10px] text-text-muted">{t('across all experiments', '所有实验')}</p>
            </div>
            <div className="bg-bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-text-muted text-[10px]">
                <Cpu className="w-3 h-3" /> {t('Model Core', '模型核心')}
              </div>
              <p className="text-xl font-semibold text-accent-cyan tabular-nums mt-1">Gemma 4</p>
              <p className="text-[10px] text-text-muted">27B · 5 LoRA adapters</p>
            </div>
          </div>

          {/* Experiment Library */}
          <section>
            <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-accent-purple" />
              {t('Available Experiments', '可用实验')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {labExperiments.map(exp => {
                const Icon = EXP_ICONS[exp.icon] || Sparkles;
                return (
                  <div key={exp.id}
                    onClick={() => setSelected(exp.id)}
                    className="rounded-xl border-2 p-4 cursor-pointer hover:scale-[1.02] transition-all group"
                    style={{ borderColor: exp.color + '50', backgroundColor: exp.color + '06' }}>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: exp.color + '20', border: `1px solid ${exp.color}40` }}>
                        <Icon className="w-5 h-5" style={{ color: exp.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{t(exp.name, exp.nameZh)}</h3>
                        <p className="text-[10px] text-text-muted truncate">{t(exp.domain, exp.domainZh)}</p>
                      </div>
                      {exp.productionDeployed && (
                        <div className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse shrink-0 mt-1.5" />
                      )}
                    </div>
                    {/* Description */}
                    <p className="text-[11px] text-text-secondary line-clamp-2 mb-3">{t(exp.description, exp.descriptionZh)}</p>
                    {/* Stats */}
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t" style={{ borderColor: exp.color + '20' }}>
                      <span className="text-text-muted">
                        <span className="text-text-secondary tabular-nums">{exp.runs.toLocaleString()}</span> {t('runs', '运行')}
                      </span>
                      <span className={exp.successRate >= 95 ? 'text-status-green' : 'text-status-yellow'}>
                        {exp.successRate}% {t('success', '成功')}
                      </span>
                      <span className="text-accent-cyan font-mono">{exp.avgLatency}ms</span>
                    </div>
                    {/* Hover hint */}
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3 h-3" /> {t('Click to run experiment', '点击运行实验')}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Production Mode Banner */}
          <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: '#22c55e30', backgroundColor: '#22c55e08' }}>
            <ShieldCheck className="w-5 h-5 text-status-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary">{t('Production Operations Mode', '生产作业模式')}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {t(
                  'All 6 experiments are deployed to production and processing live network data. Gemma 4 inference is running on dedicated GPU cluster with 99.7% uptime.',
                  '全部 6 个实验已部署生产环境，正在处理实时网络数据。Gemma 4 推理运行在专用 GPU 集群上，可用率 99.7%。',
                )}
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-status-green shrink-0" />
          </div>
        </>
      )}

      {selectedExp && <ExperimentDetail exp={selectedExp} t={t} onBack={() => setSelected(null)} />}
    </div>
  );
}
