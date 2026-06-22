import { create } from 'zustand';

export type ThemeId = 'dark' | 'ioh' | 'light';

function getInitialTheme(): ThemeId {
  try {
    const t = localStorage.getItem('ioe-theme');
    if (t === 'ioh' || t === 'light' || t === 'dark') return t;
  } catch {
    /* localStorage unavailable */
  }
  return 'dark';
}

interface AppState {
  language: 'en' | 'zh';
  theme: ThemeId;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedAgent: string | null;
  selectedConversation: string | null;
  toggleLanguage: () => void;
  setTheme: (theme: ThemeId) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSelectedAgent: (id: string | null) => void;
  setSelectedConversation: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  selectedAgent: null,
  selectedConversation: null,
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'zh' : 'en' })),
  setTheme: (theme) => {
    try {
      localStorage.setItem('ioe-theme', theme);
    } catch {
      /* localStorage unavailable */
    }
    set({ theme });
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setSelectedAgent: (id) => set({ selectedAgent: id }),
  setSelectedConversation: (id) => set({ selectedConversation: id }),
}));
