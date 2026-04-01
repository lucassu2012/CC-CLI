/**
 * Workflow Controls - Top toolbar with run/pause/stop buttons and template selector.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
}

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

interface WorkflowControlsProps {
  templates: WorkflowTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  workflowName: string;
  workflowVersion: number;
  workflowStatus: string;
  executionState: ExecutionState;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTogglePalette: () => void;
  paletteVisible: boolean;
  executionProgress?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowControls({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  workflowName,
  workflowVersion,
  workflowStatus,
  executionState,
  onRun,
  onPause,
  onResume,
  onStop,
  onTogglePalette,
  paletteVisible,
  executionProgress,
}: WorkflowControlsProps) {
  const isRunning = executionState === 'running';
  const isPaused = executionState === 'paused';
  const canRun = executionState === 'idle' || executionState === 'completed' || executionState === 'failed';

  return (
    <div style={styles.container}>
      {/* Left section: palette toggle + template selector */}
      <div style={styles.leftSection}>
        <button
          onClick={onTogglePalette}
          style={{
            ...styles.iconBtn,
            background: paletteVisible ? '#EFF6FF' : '#fff',
            borderColor: paletteVisible ? '#3B82F6' : '#D1D5DB',
          }}
          title={paletteVisible ? 'Hide palette' : 'Show palette'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={paletteVisible ? '#3B82F6' : '#6B7280'} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>

        <div style={styles.divider} />

        <label style={styles.selectLabel}>Template:</label>
        <select
          style={styles.select}
          value={selectedTemplateId}
          onChange={(e) => onSelectTemplate(e.target.value)}
          disabled={isRunning || isPaused}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.nameEn})
            </option>
          ))}
        </select>
      </div>

      {/* Center section: workflow info */}
      <div style={styles.centerSection}>
        <span style={styles.workflowName}>{workflowName}</span>
        <span style={styles.versionBadge}>v{workflowVersion}</span>
        <span style={styles.statusBadge(workflowStatus)}>{workflowStatus}</span>
        {executionProgress && (
          <span style={styles.progressText}>{executionProgress}</span>
        )}
      </div>

      {/* Right section: execution controls */}
      <div style={styles.rightSection}>
        {canRun && (
          <button onClick={onRun} style={styles.runBtn} title="Run workflow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Run</span>
          </button>
        )}

        {isRunning && (
          <button onClick={onPause} style={styles.pauseBtn} title="Pause execution">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <line x1="8" y1="4" x2="8" y2="20" /><line x1="16" y1="4" x2="16" y2="20" />
            </svg>
            <span>Pause</span>
          </button>
        )}

        {isPaused && (
          <button onClick={onResume} style={styles.resumeBtn} title="Resume execution">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Resume</span>
          </button>
        )}

        {(isRunning || isPaused) && (
          <button onClick={onStop} style={styles.stopBtn} title="Stop execution">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            <span>Stop</span>
          </button>
        )}

        {(executionState === 'completed') && (
          <span style={styles.completedBadge}>Completed</span>
        )}
        {(executionState === 'failed') && (
          <span style={styles.failedBadge}>Failed</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  active: { bg: '#DCFCE7', text: '#166534' },
  paused: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    background: '#fff',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 16px',
    gap: 16,
    flexShrink: 0,
  } as React.CSSProperties,

  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '0 0 auto',
  } as React.CSSProperties,

  centerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '1 1 auto',
    justifyContent: 'center',
  } as React.CSSProperties,

  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '0 0 auto',
  } as React.CSSProperties,

  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,

  divider: {
    width: 1,
    height: 24,
    background: '#E5E7EB',
  } as React.CSSProperties,

  selectLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6B7280',
  } as React.CSSProperties,

  select: {
    fontSize: 12,
    padding: '4px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    background: '#fff',
    color: '#1F2937',
    maxWidth: 280,
    outline: 'none',
  } as React.CSSProperties,

  workflowName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1F2937',
  } as React.CSSProperties,

  versionBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    background: '#E0E7FF',
    color: '#4338CA',
  } as React.CSSProperties,

  statusBadge: (status: string): React.CSSProperties => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return {
      fontSize: 10,
      fontWeight: 600,
      padding: '1px 6px',
      borderRadius: 4,
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
    };
  },

  progressText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: 500,
  } as React.CSSProperties,

  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 14px',
    background: '#22C55E',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  pauseBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 14px',
    background: '#F59E0B',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  resumeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 14px',
    background: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  stopBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 14px',
    background: '#EF4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  completedBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 6,
    background: '#DCFCE7',
    color: '#166534',
  } as React.CSSProperties,

  failedBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 6,
    background: '#FEE2E2',
    color: '#991B1B',
  } as React.CSSProperties,
};

export default WorkflowControls;
