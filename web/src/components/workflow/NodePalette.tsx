/**
 * Node Palette - Left sidebar with draggable node types for the workflow editor.
 */

import React, { type DragEvent } from 'react';

// ---------------------------------------------------------------------------
// Palette Items
// ---------------------------------------------------------------------------

interface PaletteItem {
  type: string;
  label: string;
  labelEn: string;
  color: string;
  iconBg: string;
  agentType?: string;
  connectorType?: string;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'trigger',
    label: '触发器',
    labelEn: 'Trigger',
    color: '#F97316',
    iconBg: '#FFF7ED',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    type: 'agent',
    label: '规划智能体',
    labelEn: 'Planning Agent',
    color: '#6366F1',
    iconBg: '#EEF2FF',
    agentType: 'planning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 3v18" />
      </svg>
    ),
  },
  {
    type: 'agent',
    label: '网络优化智能体',
    labelEn: 'Network Optimization Agent',
    color: '#0EA5E9',
    iconBg: '#F0F9FF',
    agentType: 'optimization',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    type: 'agent',
    label: '体验保障智能体',
    labelEn: 'Experience Assurance Agent',
    color: '#EC4899',
    iconBg: '#FDF2F8',
    agentType: 'experience',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    type: 'agent',
    label: '网络运维智能体',
    labelEn: 'Network O&M Agent',
    color: '#F59E0B',
    iconBg: '#FFFBEB',
    agentType: 'ops',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    type: 'agent',
    label: '运营支撑智能体',
    labelEn: 'Marketing Support Agent',
    color: '#10B981',
    iconBg: '#ECFDF5',
    agentType: 'marketing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: 'OSS平台',
    labelEn: 'OSS Platform',
    color: '#F97316',
    iconBg: '#FFF7ED',
    connectorType: 'oss',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: '工单系统',
    labelEn: 'Ticket/ITSM',
    color: '#8B5CF6',
    iconBg: '#F5F3FF',
    connectorType: 'ticket',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: 'SmartCare',
    labelEn: 'Huawei SmartCare',
    color: '#EC4899',
    iconBg: '#FDF2F8',
    connectorType: 'smartcare',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: 'AUTIN',
    labelEn: 'Huawei AUTIN',
    color: '#06B6D4',
    iconBg: '#ECFEFF',
    connectorType: 'autin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: 'CRM系统',
    labelEn: 'CRM System',
    color: '#10B981',
    iconBg: '#ECFDF5',
    connectorType: 'crm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    type: 'connector',
    label: 'BSS/计费',
    labelEn: 'BSS/Billing',
    color: '#EAB308',
    iconBg: '#FEFCE8',
    connectorType: 'bss',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    type: 'condition',
    label: '条件判断',
    labelEn: 'Condition',
    color: '#EAB308',
    iconBg: '#FEFCE8',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    type: 'transform',
    label: '数据转换',
    labelEn: 'Transform',
    color: '#A855F7',
    iconBg: '#FAF5FF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    type: 'action',
    label: '动作',
    labelEn: 'Action',
    color: '#22C55E',
    iconBg: '#F0FDF4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    type: 'merge',
    label: '合并',
    labelEn: 'Merge',
    color: '#6B7280',
    iconBg: '#F9FAFB',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6l4 6 4-6" /><line x1="12" y1="12" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    type: 'split',
    label: '拆分',
    labelEn: 'Split',
    color: '#6B7280',
    iconBg: '#F9FAFB',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="12" /><path d="M8 18l4-6 4 6" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NodePaletteProps {
  collapsed?: boolean;
}

export function NodePalette({ collapsed }: NodePaletteProps) {
  const onDragStart = (event: DragEvent<HTMLDivElement>, item: PaletteItem) => {
    const payload = JSON.stringify({
      type: item.type,
      label: item.label,
      agentType: item.agentType,
      connectorType: item.connectorType,
    });
    event.dataTransfer.setData('application/reactflow', payload);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (collapsed) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
        <span style={styles.headerText}>Node Palette</span>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Triggers</div>
        {PALETTE_ITEMS.filter((i) => i.type === 'trigger').map((item, idx) => (
          <PaletteCard key={`trigger-${idx}`} item={item} onDragStart={onDragStart} />
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Agents</div>
        {PALETTE_ITEMS.filter((i) => i.type === 'agent').map((item, idx) => (
          <PaletteCard key={`agent-${idx}`} item={item} onDragStart={onDragStart} />
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Connectors</div>
        {PALETTE_ITEMS.filter((i) => i.type === 'connector').map((item, idx) => (
          <PaletteCard key={`connector-${idx}`} item={item} onDragStart={onDragStart} />
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Logic</div>
        {PALETTE_ITEMS.filter((i) => ['condition', 'transform', 'merge', 'split'].includes(i.type)).map((item, idx) => (
          <PaletteCard key={`logic-${idx}`} item={item} onDragStart={onDragStart} />
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Actions</div>
        {PALETTE_ITEMS.filter((i) => i.type === 'action').map((item, idx) => (
          <PaletteCard key={`action-${idx}`} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Palette Card
// ---------------------------------------------------------------------------

function PaletteCard({
  item,
  onDragStart,
}: {
  item: PaletteItem;
  onDragStart: (e: DragEvent<HTMLDivElement>, item: PaletteItem) => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        borderColor: hovered ? item.color : '#E5E7EB',
        background: hovered ? item.iconBg : '#fff',
        transform: hovered ? 'translateX(2px)' : 'none',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: item.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {item.icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{item.label}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{item.labelEn}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 220,
    height: '100%',
    background: '#FAFAFA',
    borderRight: '1px solid #E5E7EB',
    overflowY: 'auto',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 6px 12px',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    letterSpacing: '0.02em',
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '6px 6px 4px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    marginBottom: 4,
    background: '#fff',
  },
};

export default NodePalette;
