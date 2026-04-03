import { useState } from 'react';
import { Bot, ChevronDown, ChevronRight, Shield, Wrench, BarChart3, X, Save, Settings } from 'lucide-react';
import { useText } from '../hooks/useText';
import { domainAgents, type DomainAgent, type SubAgent } from '../data/agents';
import StatusBadge from '../components/StatusBadge';

function PermissionBadge({ level }: { level: number }) {
  const colors = ['', 'bg-status-green/20 text-status-green border-status-green/30', 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30', 'bg-status-yellow/20 text-status-yellow border-status-yellow/30', 'bg-status-orange/20 text-status-orange border-status-orange/30', 'bg-status-red/20 text-status-red border-status-red/30'];
  return <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors[level]}`}>L{level}</span>;
}

/* ─── Edit Modal ─── */
function EditModal({ title, fields, onClose, onSave }: {
  title: string;
  fields: { label: string; value: string; key: string; type?: 'text' | 'textarea' | 'select'; options?: string[] }[];
  onClose: () => void;
  onSave: (vals: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(fields.map(f => [f.key, f.value])));
  const [saved, setSaved] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Settings className="w-4 h-4 text-accent-cyan" />{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} rows={3}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-cyan/50 resize-none" />
              ) : f.type === 'select' && f.options ? (
                <select value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-cyan/50 cursor-pointer">
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-cyan/50" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-text-muted hover:text-text-primary rounded-lg border border-border cursor-pointer">Cancel</button>
          <button onClick={() => { onSave(vals); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
            className="px-4 py-1.5 text-sm bg-accent-cyan text-bg-primary rounded-lg hover:bg-accent-cyan/80 flex items-center gap-1.5 cursor-pointer">
            {saved ? <><span className="text-status-green">✓</span> Saved</> : <><Save className="w-3.5 h-3.5" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: DomainAgent }) {
  const [expanded, setExpanded] = useState(false);
  const [editAgent, setEditAgent] = useState(false);
  const [editSub, setEditSub] = useState<SubAgent | null>(null);
  const { t } = useText();

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden hover:border-accent-cyan/30 transition-all">
      <div className="flex items-center">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left px-5 py-4 flex items-center gap-4 cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0"><Bot className="w-5 h-5 text-accent-cyan" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">{t(agent.name, agent.nameZh)}</h3>
              <StatusBadge status={agent.status} />
            </div>
            <p className="text-xs text-text-muted mt-0.5 truncate">{t(agent.description, agent.descriptionZh)}</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-secondary shrink-0">
            <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.taskCount}</p><p className="text-text-muted">{t('Tasks', '任务')}</p></div>
            <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.successRate}%</p><p className="text-text-muted">{t('Success', '成功率')}</p></div>
            <div className="text-center"><p className="text-lg font-semibold text-text-primary">{agent.subAgents.length}</p><p className="text-text-muted">{t('Sub-agents', '子Agent')}</p></div>
            {expanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
          </div>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setEditAgent(true); }}
          className="px-3 py-2 mr-3 text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-colors cursor-pointer" title={t('Edit Agent', '编辑Agent')}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {agent.subAgents.map(sub => (
            <div key={sub.id} className="px-5 py-3 flex items-center gap-4 hover:bg-bg-hover/50 transition-colors group">
              <div className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center"><Wrench className="w-3.5 h-3.5 text-text-muted" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary">{t(sub.name, sub.nameZh)}</span>
                  <StatusBadge status={sub.status} />
                  <PermissionBadge level={sub.permissionLevel} />
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{t(sub.currentTask, sub.currentTaskZh)}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                <div className="flex items-center gap-1"><Wrench className="w-3 h-3" /><span>{sub.toolCalls.toLocaleString()}</span></div>
                <div className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /><span>{sub.successRate}%</span></div>
                <div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>L{sub.permissionLevel}</span></div>
                <button onClick={() => setEditSub(sub)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all cursor-pointer" title={t('Edit', '编辑')}>
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Agent Modal */}
      {editAgent && (
        <EditModal
          title={t('Edit Domain Agent', '编辑领域Agent') + ': ' + t(agent.name, agent.nameZh)}
          fields={[
            { label: t('Name', '名称'), value: t(agent.name, agent.nameZh), key: 'name' },
            { label: t('Description', '描述'), value: t(agent.description, agent.descriptionZh), key: 'desc', type: 'textarea' },
            { label: t('Status', '状态'), value: agent.status, key: 'status', type: 'select', options: ['active', 'idle', 'warning', 'error'] },
            { label: t('Model', '模型'), value: 'pangu-telecom-72b', key: 'model', type: 'select', options: ['pangu-telecom-72b', 'pangu-telecom-7b', 'gts-llm-s-718b'] },
            { label: t('Max Concurrent Tasks', '最大并发任务'), value: '10', key: 'maxTasks' },
            { label: t('Permission Level', '权限等级'), value: 'L3', key: 'perm', type: 'select', options: ['L1', 'L2', 'L3', 'L4', 'L5'] },
          ]}
          onClose={() => setEditAgent(false)}
          onSave={() => setEditAgent(false)}
        />
      )}

      {/* Edit Sub-Agent Modal */}
      {editSub && (
        <EditModal
          title={t('Edit Sub-Agent', '编辑子Agent') + ': ' + t(editSub.name, editSub.nameZh)}
          fields={[
            { label: t('Name', '名称'), value: t(editSub.name, editSub.nameZh), key: 'name' },
            { label: t('Current Task', '当前任务'), value: t(editSub.currentTask, editSub.currentTaskZh), key: 'task' },
            { label: t('Status', '状态'), value: editSub.status, key: 'status', type: 'select', options: ['active', 'idle', 'warning', 'error'] },
            { label: t('Permission Level', '权限等级'), value: `L${editSub.permissionLevel}`, key: 'perm', type: 'select', options: ['L1', 'L2', 'L3', 'L4', 'L5'] },
            { label: t('Tools Available', '可用工具'), value: 'NetworkQueryTool, ConfigWriteTool, OSSCommandTool, DigitalTwinSimTool', key: 'tools', type: 'textarea' },
            { label: t('NETWORK.md Rules', 'NETWORK.md规则'), value: '# 禁止操作\n- 高峰期禁止重启核心网元\n- 参数调整不超过安全范围', key: 'rules', type: 'textarea' },
          ]}
          onClose={() => setEditSub(null)}
          onSave={() => setEditSub(null)}
        />
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
          <p className="text-xs text-text-muted mt-0.5">{totalAgents} {t('domain agents', '领域Agent')} · {totalSubAgents} {t('sub-agents', '子Agent')}</p>
        </div>
        <div className="flex items-center gap-3">
          {['active', 'warning', 'error', 'idle'].map(status => {
            const count = domainAgents.filter(a => a.status === status).length;
            if (count === 0) return null;
            return (<div key={status} className="flex items-center gap-1.5 text-xs text-text-secondary"><StatusBadge status={status as 'active'} /><span>{count} {status}</span></div>);
          })}
        </div>
      </div>
      <div className="space-y-3">
        {domainAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
      </div>
    </div>
  );
}
