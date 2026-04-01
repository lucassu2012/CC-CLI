/**
 * Node Config Panel - Right sidebar for editing selected node configuration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Node } from 'reactflow';
import type { IOENodeData } from './CustomNode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NodeConfigPanelProps {
  selectedNode: Node<IOENodeData> | null;
  onUpdateNode: (nodeId: string, data: Partial<IOENodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NodeConfigPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}: NodeConfigPanelProps) {
  const [localLabel, setLocalLabel] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [localConfig, setLocalConfig] = useState('');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setLocalLabel(selectedNode.data.label || '');
      setLocalDesc(selectedNode.data.description || '');
      setLocalConfig(
        JSON.stringify(selectedNode.data.config || {}, null, 2),
      );
      setConfigError('');
    }
  }, [selectedNode?.id, selectedNode?.data]);

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalLabel(val);
      if (selectedNode) {
        onUpdateNode(selectedNode.id, { label: val });
      }
    },
    [selectedNode, onUpdateNode],
  );

  const handleDescChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalDesc(val);
      if (selectedNode) {
        onUpdateNode(selectedNode.id, { description: val });
      }
    },
    [selectedNode, onUpdateNode],
  );

  const handleConfigChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalConfig(val);
      try {
        const parsed = JSON.parse(val);
        setConfigError('');
        if (selectedNode) {
          onUpdateNode(selectedNode.id, { config: parsed });
        }
      } catch {
        setConfigError('Invalid JSON');
      }
    },
    [selectedNode, onUpdateNode],
  );

  if (!selectedNode) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div style={styles.emptyTitle}>No Node Selected</div>
          <div style={styles.emptyDesc}>
            Click on a node in the canvas to view and edit its configuration.
          </div>
        </div>
      </div>
    );
  }

  const nodeType = selectedNode.data.nodeType;
  const agentType = selectedNode.data.agentType;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLabel}>Node Configuration</div>
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          style={styles.deleteBtn}
          title="Delete node"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>

      {/* Type Badge */}
      <div style={styles.section}>
        <div style={styles.typeBadgeRow}>
          <span style={styles.typeBadge(nodeType)}>
            {nodeType.toUpperCase()}
          </span>
          {agentType && (
            <span style={styles.agentBadge(agentType)}>
              {agentType}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div style={styles.section}>
        <label style={styles.label}>Name</label>
        <input
          style={styles.input}
          value={localLabel}
          onChange={handleLabelChange}
          placeholder="Node name"
        />
      </div>

      {/* Description */}
      <div style={styles.section}>
        <label style={styles.label}>Description</label>
        <input
          style={styles.input}
          value={localDesc}
          onChange={handleDescChange}
          placeholder="Node description"
        />
      </div>

      {/* Node-type specific fields */}
      {nodeType === 'trigger' && (
        <TriggerConfig config={selectedNode.data.config} />
      )}
      {nodeType === 'agent' && (
        <AgentConfig config={selectedNode.data.config} agentType={agentType} />
      )}
      {nodeType === 'condition' && (
        <ConditionConfig config={selectedNode.data.config} />
      )}
      {nodeType === 'action' && (
        <ActionConfig config={selectedNode.data.config} />
      )}

      {/* Raw Config JSON */}
      <div style={styles.section}>
        <label style={styles.label}>
          Configuration (JSON)
          {configError && (
            <span style={{ color: '#EF4444', marginLeft: 8, fontSize: 11 }}>
              {configError}
            </span>
          )}
        </label>
        <textarea
          style={{
            ...styles.textarea,
            borderColor: configError ? '#EF4444' : '#D1D5DB',
          }}
          value={localConfig}
          onChange={handleConfigChange}
          rows={10}
          spellCheck={false}
        />
      </div>

      {/* Node ID (read-only) */}
      <div style={styles.section}>
        <label style={styles.label}>Node ID</label>
        <input
          style={{ ...styles.input, background: '#F3F4F6', color: '#6B7280' }}
          value={selectedNode.id}
          readOnly
        />
      </div>

      {/* Position (read-only) */}
      <div style={styles.section}>
        <label style={styles.label}>Position</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...styles.input, flex: 1, background: '#F3F4F6', color: '#6B7280' }}
            value={`x: ${Math.round(selectedNode.position.x)}`}
            readOnly
          />
          <input
            style={{ ...styles.input, flex: 1, background: '#F3F4F6', color: '#6B7280' }}
            value={`y: ${Math.round(selectedNode.position.y)}`}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type-specific info panels (read-only summaries)
// ---------------------------------------------------------------------------

function TriggerConfig({ config }: { config?: Record<string, any> }) {
  const kind = config?.triggerKind || config?.type || 'manual';
  return (
    <div style={styles.section}>
      <label style={styles.label}>Trigger Type</label>
      <div style={styles.infoBox}>
        <InfoRow label="Kind" value={kind} />
        {config?.cron && <InfoRow label="Cron" value={config.cron} />}
        {config?.endpoint && <InfoRow label="Endpoint" value={config.endpoint} />}
        {config?.alarmTypes && <InfoRow label="Alarm Types" value={config.alarmTypes.join(', ')} />}
      </div>
    </div>
  );
}

function AgentConfig({
  config,
  agentType,
}: {
  config?: Record<string, any>;
  agentType?: string;
}) {
  return (
    <div style={styles.section}>
      <label style={styles.label}>Agent Details</label>
      <div style={styles.infoBox}>
        <InfoRow label="Agent" value={agentType || 'unknown'} />
        <InfoRow label="Action" value={config?.action || 'analyze'} />
        {config?.params &&
          Object.entries(config.params).slice(0, 4).map(([k, v]) => (
            <InfoRow key={k} label={k} value={String(v)} />
          ))}
      </div>
    </div>
  );
}

function ConditionConfig({ config }: { config?: Record<string, any> }) {
  return (
    <div style={styles.section}>
      <label style={styles.label}>Condition Expression</label>
      <div style={styles.infoBox}>
        <code style={{ fontSize: 12, color: '#92400E', wordBreak: 'break-all' }}>
          {config?.expression || 'true'}
        </code>
      </div>
    </div>
  );
}

function ActionConfig({ config }: { config?: Record<string, any> }) {
  const actionType = config?.actionType || 'log';
  return (
    <div style={styles.section}>
      <label style={styles.label}>Action Details</label>
      <div style={styles.infoBox}>
        <InfoRow label="Type" value={actionType} />
        {config?.command && <InfoRow label="Command" value={config.command} />}
        {config?.url && <InfoRow label="URL" value={config.url} />}
        {config?.channel && <InfoRow label="Channel" value={config.channel} />}
        {config?.message && <InfoRow label="Message" value={config.message} />}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
      <span style={{ fontSize: 11, color: '#6B7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#1F2937', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: '#F97316',
  agent: '#3B82F6',
  condition: '#EAB308',
  transform: '#A855F7',
  action: '#22C55E',
  merge: '#6B7280',
  split: '#6B7280',
};

const AGENT_TYPE_COLORS: Record<string, string> = {
  planning: '#6366F1',
  optimization: '#0EA5E9',
  experience: '#EC4899',
  ops: '#F59E0B',
  marketing: '#10B981',
};

const styles = {
  container: {
    width: 280,
    height: '100%',
    background: '#FAFAFA',
    borderLeft: '1px solid #E5E7EB',
    overflowY: 'auto' as const,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottom: '1px solid #E5E7EB',
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #FCA5A5',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  section: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 13,
    color: '#1F2937',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1F2937',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  infoBox: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 10px',
  },
  typeBadgeRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  typeBadge: (nodeType: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    background: NODE_TYPE_COLORS[nodeType] || '#6B7280',
    color: '#fff',
    letterSpacing: '0.05em',
  }),
  agentBadge: (agentType: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    background: AGENT_TYPE_COLORS[agentType] || '#6B7280',
    color: '#fff',
    textTransform: 'capitalize' as const,
  }),
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center' as const,
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#6B7280',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },
};

export default NodeConfigPanel;
