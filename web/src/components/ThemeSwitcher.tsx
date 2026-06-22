import { useState } from 'react';
import { Palette, Check, Moon, Sun, Flame, type LucideIcon } from 'lucide-react';
import { useStore, type ThemeId } from '../store/useStore';
import { useText } from '../hooks/useText';

interface ThemeMeta {
  id: ThemeId;
  name: string;
  nameZh: string;
  desc: string;
  descZh: string;
  icon: LucideIcon;
  /* [background, primary accent, secondary accent] for the preview swatch */
  swatches: [string, string, string];
}

const THEMES: ThemeMeta[] = [
  {
    id: 'dark',
    name: 'Dark',
    nameZh: '深色',
    desc: 'Default slate & cyan',
    descZh: '默认石墨蓝主题',
    icon: Moon,
    swatches: ['#0f172a', '#06b6d4', '#8b5cf6'],
  },
  {
    id: 'ioh',
    name: 'IOH',
    nameZh: 'IOH 印尼',
    desc: 'Indosat Ooredoo Hutchison',
    descZh: 'Indosat Ooredoo Hutchison',
    icon: Flame,
    swatches: ['#1A0F13', '#E89313', '#C8102E'],
  },
  {
    id: 'light',
    name: 'Light',
    nameZh: '浅色',
    desc: 'Clean daytime theme',
    descZh: '清爽日间主题',
    icon: Sun,
    swatches: ['#ffffff', '#0891b2', '#2563eb'],
  },
];

export default function ThemeSwitcher() {
  const { t } = useText();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  const active = THEMES.find((th) => th.id === theme) ?? THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs transition-all cursor-pointer"
        title={t('Switch theme', '切换主题')}
      >
        <Palette className="w-3.5 h-3.5" />
        {/* mini swatch preview of the active theme */}
        <span className="hidden sm:flex items-center gap-0.5">
          {active.swatches.map((c, i) => (
            <span key={i} className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: c }} />
          ))}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 w-auto sm:w-[300px] bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">{t('Theme', '主题')}</h3>
              <p className="text-[10px] text-text-muted">{t('Choose an interface theme', '选择界面主题')}</p>
            </div>

            {/* Theme options */}
            <div className="p-2 space-y-1">
              {THEMES.map((th) => {
                const Icon = th.icon;
                const selected = th.id === theme;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      setTheme(th.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-accent-cyan/10 border border-accent-cyan/30'
                        : 'hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: th.swatches[0], border: '1px solid rgba(128,128,128,0.25)' }}>
                      <Icon className="w-4 h-4" style={{ color: th.swatches[1] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary">{t(th.name, th.nameZh)}</div>
                      <div className="text-[10px] text-text-muted truncate">{t(th.desc, th.descZh)}</div>
                    </div>
                    {/* color swatch strip */}
                    <div className="flex items-center gap-1 shrink-0">
                      {th.swatches.map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    {selected && <Check className="w-3.5 h-3.5 text-accent-cyan shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
