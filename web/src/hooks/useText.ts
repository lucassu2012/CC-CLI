import { useStore } from '../store/useStore';

export function useText() {
  const language = useStore((s) => s.language);
  const isZh = language === 'zh';

  function t(en: string, zh: string): string {
    return isZh ? zh : en;
  }

  return { t, isZh, language };
}
