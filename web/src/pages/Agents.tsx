import { useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Shield,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { useText } from '../hooks/useText';
import { domainAgents, type DomainAgent } from '../data/agents';
import StatusBadge from '../components/StatusBadge';

function PermissionBadge({ level }: { level: number }) {
  const colors = [
    '',
    'bg-status-green/20 text-status-green border-status-green/30',
    'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
    'bg-status-yellow/20 text-status-yellow border-status-yellow/30',
    'bg-status-orange/20 text-status-orange border-status-orange/30',
    'bg-status-red/20 text-status-red border-status-red/30',
  ];
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors[level]}`}>
      L{level}
    </span>
  );
}

function AgentCard({ agent }: { agent: DomainAgent }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useText();

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden animate-fade-in hover:border-accent-cyan/30 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-accent-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary">{t(agent.name, agent.nameZh)}</h3>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{t(agent.description, agent.descriptionZh)}</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-secondary shrink-0">
          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">{agent.taskCount}</p>
            <p className="text-text-muted">{t('Tasks', '任务')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">{agent.successRate}%</p>
            <p className="text-text-muted">{t('Success', '成功率')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">{agent.subAgents.length}</p>
            <p className="text-text-muted">{t('Sub-agents', '子智能体')}</p>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="grid grid-cols-1 divide-y divide-border">
            {agent.subAgents.map((sub) => (
              <div key={sub.id} className="px-5 py-3 flex items-center gap-4 hover:bg-bg-hover/50 transition-colors">
                <div className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">{t(sub.name, sub.nameZh)}</span>
                    <StatusBadge status={sub.status} />
                    <PermissionBadge level={sub.permissionLevel} />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{t(sub.currentTask, sub.currentTaskZh)}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-text-secondary shrink-0">
                  <div className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    <span>{sub.toolCalls.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>{sub.successRate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>L{sub.permissionLevel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const { t } = useText();
  const totalAgents = domainAgents.length;
  const totalSubAgents = domainAgents.reduce((sum, a) => sum + a.subAgents.length, 0);

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Agent Management', '智能体管理')}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {totalAgents} {t('domain agents', '领域智能体')} &middot; {totalSubAgents} {t('sub-agents', '子智能体')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {['active', 'warning', 'error', 'idle'].map((status) => {
            const count = domainAgents.filter((a) => a.status === status).length;
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <StatusBadge status={status as 'active'} />
                <span>{count} {status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hierarchy view */}
      <div className="space-y-3">
        {domainAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
