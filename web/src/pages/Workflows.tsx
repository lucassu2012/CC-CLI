import { GitBranch, Plus, Play, Pause } from 'lucide-react';
import { useText } from '../hooks/useText';

export default function Workflows() {
  const { t } = useText();

  const demoWorkflows = [
    { id: 'wf-1', name: 'Alarm Correlation & Auto-Heal', nameZh: '告警关联与自动修复', status: 'active', nodes: 12, lastRun: '2 min ago' },
    { id: 'wf-2', name: 'SLA Breach Prevention', nameZh: 'SLA违约预防', status: 'active', nodes: 8, lastRun: '15 min ago' },
    { id: 'wf-3', name: 'Security Incident Response', nameZh: '安全事件响应', status: 'paused', nodes: 15, lastRun: '1 hr ago' },
    { id: 'wf-4', name: 'Customer Churn Prevention', nameZh: '客户流失预防', status: 'active', nodes: 10, lastRun: '30 min ago' },
  ];

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Workflow Orchestration', '工作流编排')}</h1>
          <p className="text-xs text-text-muted mt-0.5">{t('n8n-style visual workflow editor', 'n8n风格可视化工作流编辑器')}</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan text-bg-primary text-sm font-medium hover:bg-accent-cyan/80 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          {t('New Workflow', '新建工作流')}
        </button>
      </div>

      {/* Workflow list */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {demoWorkflows.map((wf) => (
          <div key={wf.id} className="bg-bg-card rounded-xl border border-border p-5 hover:border-accent-cyan/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-sm font-medium text-text-primary">{t(wf.name, wf.nameZh)}</h3>
              </div>
              {wf.status === 'active' ? (
                <Pause className="w-4 h-4 text-status-green cursor-pointer" />
              ) : (
                <Play className="w-4 h-4 text-text-muted cursor-pointer" />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>{wf.nodes} {t('nodes', '节点')}</span>
              <span>{t('Last run:', '上次运行:')} {wf.lastRun}</span>
              <span className={wf.status === 'active' ? 'text-status-green' : 'text-text-muted'}>
                {wf.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder editor area */}
      <div className="bg-bg-card rounded-xl border-2 border-dashed border-border flex items-center justify-center h-96">
        <div className="text-center">
          <GitBranch className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium text-text-secondary">{t('Workflow Editor', '工作流编辑器')}</h2>
          <p className="text-sm text-text-muted mt-1 max-w-md">
            {t(
              'Visual workflow editor with drag-and-drop nodes. Click "New Workflow" to start building agent orchestration pipelines.',
              '可视化工作流编辑器，支持拖拽节点。点击"新建工作流"开始构建智能体编排管道。'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
