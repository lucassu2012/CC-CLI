import { useState, useRef } from 'react';
import { BookOpen, Upload, Download, ChevronDown, X, Check, RotateCcw, Zap, AlertTriangle, Users, Radio } from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useText } from '../hooks/useText';
import type { ScenarioData } from '../data/scenario-types';

// Lazy imports for built-in stories
import { storyAlarmStorm } from '../data/scenarios/story-alarm-storm';
import { storyChurnPrevention } from '../data/scenarios/story-churn-prevention';
import { storyEventAssurance } from '../data/scenarios/story-event-assurance';

const BUILT_IN_STORIES: { data: ScenarioData; icon: typeof Zap; color: string }[] = [
  { data: storyAlarmStorm, icon: AlertTriangle, color: '#ef4444' },
  { data: storyChurnPrevention, icon: Users, color: '#8b5cf6' },
  { data: storyEventAssurance, icon: Radio, color: '#f97316' },
];

export default function ScenarioSwitcher() {
  const { t } = useText();
  const { scenario, scenarioId, loadScenario, resetToDefault, exportScenario } = useScenario();
  const [open, setOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ScenarioData;
        if (!data.meta?.id || !data.dashboard || !data.agents) {
          setImportError(t('Invalid scenario format', '无效的场景数据格式'));
          return;
        }
        loadScenario(data);
        setOpen(false);
      } catch {
        setImportError(t('JSON parse error', 'JSON解析错误'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const json = exportScenario();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ioe-scenario-${scenarioId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentName = scenario
    ? t(scenario.meta.name, scenario.meta.nameZh)
    : t('Default Data', '默认数据');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs transition-all cursor-pointer"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{currentName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-[360px] bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{t('Scenario Data', '场景数据')}</h3>
                <p className="text-[10px] text-text-muted">{t('Switch scenarios to explore different IOE use cases', '切换场景以展示不同IOE用例')}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current scenario */}
            <div className="px-4 py-2.5 bg-accent-cyan/5 border-b border-border">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">{t('Active', '当前')}: {currentName}</span>
              </div>
              {scenario && (
                <p className="text-[10px] text-text-muted mt-1 ml-5.5">{t(scenario.meta.description, scenario.meta.descriptionZh)}</p>
              )}
            </div>

            {/* Built-in stories */}
            <div className="px-4 py-2 border-b border-border">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">{t('Built-in Scenarios', '内置场景')}</p>
              <div className="space-y-1.5">
                {/* Default option */}
                <button
                  onClick={() => { resetToDefault(); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${scenarioId === 'default' ? 'bg-accent-cyan/10 border border-accent-cyan/30' : 'hover:bg-bg-hover border border-transparent'}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-status-green/15 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-status-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary">{t('Default — Daily Operations', '默认 — 日常运营')}</div>
                    <div className="text-[10px] text-text-muted truncate">{t('Standard telecom ops monitoring dashboard', '标准电信运营监控仪表盘')}</div>
                  </div>
                  {scenarioId === 'default' && <Check className="w-3.5 h-3.5 text-accent-cyan shrink-0" />}
                </button>

                {/* Story scenarios */}
                {BUILT_IN_STORIES.map(({ data, icon: Icon, color }) => (
                  <button
                    key={data.meta.id}
                    onClick={() => { loadScenario(data); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${scenarioId === data.meta.id ? 'bg-accent-cyan/10 border border-accent-cyan/30' : 'hover:bg-bg-hover border border-transparent'}`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary">{t(data.meta.name, data.meta.nameZh)}</div>
                      <div className="text-[10px] text-text-muted truncate">{t(data.meta.description, data.meta.descriptionZh)}</div>
                    </div>
                    {scenarioId === data.meta.id && <Check className="w-3.5 h-3.5 text-accent-cyan shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Import / Export */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">{t('Import / Export', '导入 / 导出')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent-cyan/30 hover:bg-bg-hover text-xs text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('Import JSON', '导入 JSON')}
                </button>
                <button
                  onClick={handleExport}
                  disabled={!scenario}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent-cyan/30 hover:bg-bg-hover text-xs text-text-secondary hover:text-text-primary transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('Export JSON', '导出 JSON')}
                </button>
              </div>
              {scenario && (
                <button
                  onClick={() => { resetToDefault(); setOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-text-muted hover:text-status-red hover:bg-status-red/5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('Reset to default data', '重置为默认数据')}
                </button>
              )}
              {importError && (
                <p className="text-[10px] text-status-red">{importError}</p>
              )}
            </div>

            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </>
      )}
    </div>
  );
}
