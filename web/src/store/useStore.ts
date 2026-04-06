import { create } from 'zustand';

interface AppState {
  language: 'en' | 'zh';
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedAgent: string | null;
  selectedConversation: string | null;
  toggleLanguage: () => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSelectedAgent: (id: string | null) => void;
  setSelectedConversation: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  selectedAgent: null,
  selectedConversation: null,
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'zh' : 'en' })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setSelectedAgent: (id) => set({ selectedAgent: id }),
  setSelectedConversation: (id) => set({ selectedConversation: id }),
}));
