import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { ScenarioProvider } from './context/ScenarioContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Agents from './pages/Agents';
import Workflows from './pages/Workflows';
import Knowledge from './pages/Knowledge';
import Topology from './pages/Topology';
import Lab from './pages/Lab';
import Permissions from './pages/Permissions';

export default function App() {
  const theme = useStore((s) => s.theme);

  /* Apply the active theme by toggling data-theme on <html>.
     "dark" is the default and needs no attribute (uses :root @theme tokens). */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ScenarioProvider>
      <div className="h-dvh flex flex-col bg-bg-primary">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/topology" element={<Topology />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="/permissions" element={<Permissions />} />
            </Routes>
          </main>
        </div>
      </div>
    </ScenarioProvider>
  );
}
