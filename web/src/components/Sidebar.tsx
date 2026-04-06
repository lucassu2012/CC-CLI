import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  GitBranch,
  BookOpen,
  Network,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useText } from '../hooks/useText';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', labelZh: '仪表盘' },
  { path: '/chat', icon: MessageSquare, label: 'Chat', labelZh: '对话' },
  { path: '/agents', icon: Bot, label: 'Agents', labelZh: '智能体' },
  { path: '/workflows', icon: GitBranch, label: 'Workflows', labelZh: '工作流' },
  { path: '/knowledge', icon: BookOpen, label: 'Knowledge', labelZh: '知识库' },
  { path: '/topology', icon: Network, label: 'Digital Twin', labelZh: '数字孪生' },
  { path: '/permissions', icon: Shield, label: 'Permissions', labelZh: '权限控制' },
];

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);
  const mobileSidebarOpen = useStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useStore((s) => s.setMobileSidebarOpen);
  const { t } = useText();

  // Close mobile sidebar on nav
  const handleNavClick = () => {
    if (mobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            <span className="truncate">{t(item.label, item.labelZh)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-52'
        } bg-bg-secondary border-r border-border flex-col shrink-0 transition-all duration-200 hidden md:flex`}
      >
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-accent-cyan/15 text-accent-cyan'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{t(item.label, item.labelZh)}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggle}
          className="p-3 border-t border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4 mx-auto" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-bg-secondary border-r border-border flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">IOE</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
