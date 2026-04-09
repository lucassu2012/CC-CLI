import { Routes, Route } from 'react-router-dom';
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
