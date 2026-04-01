import { useState, useCallback } from 'react';
import { Radio, Server, Database, Wifi, X } from 'lucide-react';
import { useText } from '../hooks/useText';
import { topoNodes, topoLinks, type TopoNode } from '../data/topology';
import StatusBadge from '../components/StatusBadge';

const nodeIcons: Record<string, typeof Server> = {
  'core': Server,
  'aggregation': Radio,
  'bts': Wifi,
  'data-center': Database,
};

const nodeSize: Record<string, number> = {
  'data-center': 24,
  'core': 20,
  'aggregation': 16,
  'bts': 14,
};

const statusFill: Record<string, string> = {
  normal: '#22c55e',
  warning: '#eab308',
  fault: '#ef4444',
};

const linkStroke: Record<string, string> = {
  normal: '#334155',
  degraded: '#eab308',
  down: '#ef4444',
};

function NodeDetail({ node, onClose }: { node: TopoNode; onClose: () => void }) {
  const { t } = useText();
  const Icon = nodeIcons[node.type];

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{t(node.name, node.nameZh)}</h3>
            <p className="text-xs text-text-muted">{node.type.replace('-', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {node.details.ip && (
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[10px] text-text-muted">IP</p>
            <p className="text-xs font-mono text-text-primary">{node.details.ip}</p>
          </div>
        )}
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Location', '位置')}</p>
          <p className="text-xs text-text-primary">{t(node.details.location, node.details.locationZh)}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Status', '状态')}</p>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={node.status} />
            <span className="text-xs text-text-primary capitalize">{node.status}</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Uptime', '运行时间')}</p>
          <p className="text-xs text-text-primary">{node.details.uptime}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Load', '负载')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${node.details.load > 80 ? 'bg-status-red' : node.details.load > 60 ? 'bg-status-yellow' : 'bg-status-green'}`}
                style={{ width: `${node.details.load}%` }}
              />
            </div>
            <span className="text-xs text-text-primary">{node.details.load}%</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[10px] text-text-muted">{t('Alarms', '告警')}</p>
          <p className={`text-xs font-medium ${node.details.alarms > 0 ? 'text-status-red' : 'text-status-green'}`}>
            {node.details.alarms}
          </p>
        </div>
        {node.details.subscribers !== undefined && (
          <div className="bg-bg-primary rounded-lg p-2.5 col-span-2">
            <p className="text-[10px] text-text-muted">{t('Subscribers', '用户数')}</p>
            <p className="text-xs text-text-primary">{node.details.subscribers.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Topology() {
  const { t } = useText();
  const [selectedNode, setSelectedNode] = useState<TopoNode | null>(null);

  const handleNodeClick = useCallback((node: TopoNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const svgWidth = 920;
  const svgHeight = 500;

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Digital Twin - Network Topology', '数字孪生 - 网络拓扑')}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {topoNodes.length} {t('nodes', '节点')} &middot; {topoLinks.length} {t('links', '链路')}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-status-green" />{t('Normal', '正常')}</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-status-yellow" />{t('Warning', '告警')}</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-status-red" />{t('Fault', '故障')}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        {/* SVG Topology */}
        <div className="bg-bg-card rounded-xl border border-border p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

            {/* Links */}
            {topoLinks.map((link) => {
              const src = topoNodes.find((n) => n.id === link.source);
              const tgt = topoNodes.find((n) => n.id === link.target);
              if (!src || !tgt) return null;
              return (
                <g key={link.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={linkStroke[link.status]}
                    strokeWidth={link.status === 'down' ? 1 : 2}
                    strokeDasharray={link.status === 'down' ? '6,4' : link.status === 'degraded' ? '4,2' : undefined}
                    opacity={link.status === 'down' ? 0.5 : 0.8}
                  />
                  {link.status === 'normal' && (
                    <circle r="3" fill="#06b6d4" opacity="0.6">
                      <animateMotion
                        dur={`${3 + Math.random() * 2}s`}
                        repeatCount="indefinite"
                        path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {topoNodes.map((node) => {
              const size = nodeSize[node.type];
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Glow for fault/warning */}
                  {node.status !== 'normal' && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size + 8}
                      fill={statusFill[node.status]}
                      opacity={0.15}
                    >
                      <animate attributeName="r" values={`${size + 4};${size + 12};${size + 4}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size + 6}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Node background */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size}
                    fill="#1e293b"
                    stroke={statusFill[node.status]}
                    strokeWidth={2}
                  />

                  {/* Icon placeholder - simple shapes */}
                  {node.type === 'data-center' && (
                    <rect x={node.x - 7} y={node.y - 7} width={14} height={14} rx={2} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'core' && (
                    <polygon points={`${node.x},${node.y - 7} ${node.x + 7},${node.y + 4} ${node.x - 7},${node.y + 4}`} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'aggregation' && (
                    <circle cx={node.x} cy={node.y} r={6} fill={statusFill[node.status]} opacity={0.6} />
                  )}
                  {node.type === 'bts' && (
                    <>
                      <line x1={node.x} y1={node.y + 5} x2={node.x} y2={node.y - 5} stroke={statusFill[node.status]} strokeWidth={2} opacity={0.6} />
                      <line x1={node.x - 4} y1={node.y - 2} x2={node.x + 4} y2={node.y - 2} stroke={statusFill[node.status]} strokeWidth={2} opacity={0.6} />
                    </>
                  )}

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + size + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
          ) : (
            <div className="bg-bg-card rounded-xl border border-border flex items-center justify-center h-64">
              <div className="text-center">
                <Radio className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">{t('Click a node to view details', '点击节点查看详情')}</p>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          <div className="mt-4 bg-bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              {t('Simulation Results', '仿真结果')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Network Resilience Score', '网络韧性评分')}</span>
                <span className="text-text-primary font-medium">87/100</span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="h-full bg-accent-cyan rounded-full" style={{ width: '87%' }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-3">
                <span className="text-text-muted">{t('Single Point of Failure', '单点故障')}</span>
                <span className="text-status-yellow font-medium">2 {t('detected', '已检测')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Redundancy Coverage', '冗余覆盖率')}</span>
                <span className="text-status-green font-medium">94.2%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('Failover Time (avg)', '故障切换时间(平均)')}</span>
                <span className="text-text-primary font-medium">1.8s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
