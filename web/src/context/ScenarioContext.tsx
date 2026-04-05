import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ScenarioData } from '../data/scenario-types';

interface ScenarioContextValue {
  scenario: ScenarioData | null;
  scenarioId: string;  // 'default' | scenario meta.id
  loadScenario: (data: ScenarioData) => void;
  resetToDefault: () => void;
  exportScenario: () => string;  // returns JSON string
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [scenarioId, setScenarioId] = useState('default');

  const loadScenario = useCallback((data: ScenarioData) => {
    setScenario(data);
    setScenarioId(data.meta.id);
  }, []);

  const resetToDefault = useCallback(() => {
    setScenario(null);
    setScenarioId('default');
  }, []);

  const exportScenario = useCallback(() => {
    return JSON.stringify(scenario, null, 2);
  }, [scenario]);

  return (
    <ScenarioContext.Provider value={{ scenario, scenarioId, loadScenario, resetToDefault, exportScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
