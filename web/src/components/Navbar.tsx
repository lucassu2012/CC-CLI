import { Activity, Bell, Globe, Wifi } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useText } from '../hooks/useText';
import ScenarioSwitcher from './ScenarioSwitcher';

export default function Navbar() {
  const toggleLanguage = useStore((s) => s.toggleLanguage);
  const { t, language } = useText();

  return (
    <header className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-accent-cyan" />
        </div>
        <span className="text-lg font-semibold text-text-primary tracking-tight">IOE</span>
        <span className="text-xs text-text-muted hidden sm:inline">
          {t('Intelligent Operations Engine', '智能运营引擎')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ScenarioSwitcher />

        <div className="flex items-center gap-2 text-xs">
          <Wifi className="w-3.5 h-3.5 text-status-green" />
          <span className="text-status-green">{t('System Online', '系统在线')}</span>
        </div>

        <div className="relative">
          <Bell className="w-4.5 h-4.5 text-text-secondary hover:text-text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-status-red rounded-full text-[9px] text-white flex items-center justify-center font-medium">3</span>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          {language === 'en' ? '中文' : 'EN'}
        </button>
      </div>
    </header>
  );
}
