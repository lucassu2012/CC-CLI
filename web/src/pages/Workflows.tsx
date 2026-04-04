import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Play, Pause, Square, ChevronDown, GitBranch, ArrowRight, RefreshCw, X, Plus, Trash2, GripVertical, ZoomIn, ZoomOut, Maximize2, ArrowLeft } from 'lucide-react';
import { useText } from '../hooks/useText';

/* ------------------------------------------------------------------ */
/*  Inline workflow template data (self-contained, no cross-import)   */
/* ------------------------------------------------------------------ */

interface WfNode {
  id: string;
  type: 'trigger' | 'agent' | 'condition' | 'action' | 'merge' | 'split' | 'transform' | 'connector';
  name: string;
  agentType?: string;
  subAgent?: string;
  connectorType?: string;
  x: number;
  y: number;
  config?: Record<string, any>;
}

const SUB_AGENTS: Record<string, { name: string; nameEn: string; subs: string[]; subsEn: string[] }> = {
  planning:     { name: '规划Agent', nameEn: 'Planning Agent', subs: ['价值洞察', '网络仿真', '市场收益预测', '收益预估'], subsEn: ['Value Insight', 'Network Sim', 'Revenue Forecast', 'ROI Estimation'] },
  optimization: { name: '网络优化Agent', nameEn: 'Optimization Agent', subs: ['实时优化', '工程优化', '事件保障'], subsEn: ['Real-time Opt', 'Engineering Opt', 'Event Assurance'] },
  experience:   { name: '体验保障Agent', nameEn: 'Experience Agent', subs: ['投诉预警', '差异化体验', '确定性体验'], subsEn: ['Complaint Alert', 'Differentiated Exp', 'Deterministic Exp'] },
  ops:          { name: '网络运维Agent', nameEn: 'O&M Agent', subs: ['运维监控', '故障分析', '上站维护'], subsEn: ['Monitoring', 'Fault Analysis', 'On-site Maint'] },
  marketing:    { name: '运营支撑Agent', nameEn: 'Marketing Agent', subs: ['潜客识别', '实时营销', '离网维挽'], subsEn: ['Lead Identification', 'Real-time Marketing', 'Churn Prevention'] },
};

const CONNECTORS: Record<string, { name: string; nameEn: string; color: string; desc: string; descEn: string }> = {
  oss:        { name: 'OSS平台', nameEn: 'OSS Platform', color: '#f97316', desc: '网管系统·配置下发·性能采集', descEn: 'NMS · Config deploy · Perf collection' },
  ticket:     { name: '工单系统', nameEn: 'Ticket/ITSM', color: '#8b5cf6', desc: '工单创建·派单·闭环', descEn: 'Ticket create · Dispatch · Close loop' },
  smartcare:  { name: 'SmartCare', nameEn: 'Huawei SmartCare', color: '#ec4899', desc: '用户体验管理·CEM分析', descEn: 'User experience · CEM analytics' },
  autin:      { name: 'AUTIN', nameEn: 'Huawei AUTIN', color: '#06b6d4', desc: '自治网络·智能运维', descEn: 'Autonomous network · Intelligent O&M' },
  crm:        { name: 'CRM系统', nameEn: 'CRM System', color: '#10b981', desc: '客户管理·营销触达·渠道', descEn: 'Customer mgmt · Marketing · Channels' },
  bss:        { name: 'BSS/计费', nameEn: 'BSS/Billing', color: '#eab308', desc: '计费·套餐·账务', descEn: 'Billing · Plans · Accounting' },
};

let _nextId = 100;

interface WfEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface WfTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  nodes: WfNode[];
  edges: WfEdge[];
}

const TEMPLATES: WfTemplate[] = [
  {
    id: 'wf1', name: '网络故障自动诊断与修复', nameEn: 'Auto Fault Diagnosis & Repair',
    description: '接收告警→分类→严重程度判断→跨域分析/自动修复→验证', descriptionEn: 'Alarm receive → Classify → Severity check → Cross-domain analysis / Auto repair → Verify',
    nodes: [
      { id: 't1', type: 'trigger', name: '告警接收', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '告警分类', agentType: 'ops', x: 300, y: 200 },
      { id: 'c1', type: 'condition', name: '严重程度', x: 550, y: 200 },
      { id: 'a2', type: 'agent', name: '跨域分析', agentType: 'ops', x: 800, y: 80 },
      { id: 'a3', type: 'agent', name: '数字孪生仿真', agentType: 'optimization', x: 1050, y: 80 },
      { id: 'c2', type: 'condition', name: '安全检查', x: 1300, y: 80 },
      { id: 'a4', type: 'action', name: '执行修复', x: 1550, y: 30 },
      { id: 'a5', type: 'action', name: '验证结果', x: 1800, y: 30 },
      { id: 'a6', type: 'action', name: '人工审核', x: 1550, y: 160 },
      { id: 'a7', type: 'agent', name: '自动修复', agentType: 'ops', x: 800, y: 320 },
      { id: 'a8', type: 'action', name: '关闭工单', x: 1050, y: 320 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'c1' },
      { id: 'e3', source: 'c1', target: 'a2', label: '严重' },
      { id: 'e4', source: 'c1', target: 'a7', label: '一般' },
      { id: 'e5', source: 'a2', target: 'a3' },
      { id: 'e6', source: 'a3', target: 'c2' },
      { id: 'e7', source: 'c2', target: 'a4', label: '安全' },
      { id: 'e8', source: 'c2', target: 'a6', label: '不安全' },
      { id: 'e9', source: 'a4', target: 'a5' },
      { id: 'e10', source: 'a7', target: 'a8' },
    ],
  },
  {
    id: 'wf2', name: '用户投诉闭环处理', nameEn: 'Complaint Closed-loop Handling',
    description: '接收投诉→体验分析→网络检查→优化或套餐推荐→通知用户', descriptionEn: 'Receive complaint → Experience analysis → Network check → Optimize or plan recommend → Notify user',
    nodes: [
      { id: 't1', type: 'trigger', name: '投诉接收', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '体验分析', agentType: 'experience', x: 300, y: 200 },
      { id: 'a2', type: 'agent', name: '网络检查', agentType: 'ops', x: 550, y: 200 },
      { id: 'c1', type: 'condition', name: '网络问题?', x: 800, y: 200 },
      { id: 'a3', type: 'agent', name: '参数优化', agentType: 'optimization', x: 1050, y: 100 },
      { id: 'a4', type: 'agent', name: '效果验证', agentType: 'experience', x: 1300, y: 100 },
      { id: 'a5', type: 'action', name: '通知已修复', x: 1550, y: 100 },
      { id: 'a6', type: 'agent', name: '套餐检查', agentType: 'marketing', x: 1050, y: 310 },
      { id: 'c2', type: 'condition', name: '需升级?', x: 1300, y: 310 },
      { id: 'a7', type: 'action', name: '推荐升级', x: 1550, y: 260 },
      { id: 'a8', type: 'action', name: '通知已处理', x: 1550, y: 370 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'a2' },
      { id: 'e3', source: 'a2', target: 'c1' },
      { id: 'e4', source: 'c1', target: 'a3', label: '是' },
      { id: 'e5', source: 'c1', target: 'a6', label: '否' },
      { id: 'e6', source: 'a3', target: 'a4' },
      { id: 'e7', source: 'a4', target: 'a5' },
      { id: 'e8', source: 'a6', target: 'c2' },
      { id: 'e9', source: 'c2', target: 'a7', label: '是' },
      { id: 'e10', source: 'c2', target: 'a8', label: '否' },
    ],
  },
  {
    id: 'wf3', name: '新站开通优化', nameEn: 'New Site Activation Optimization',
    description: '新站激活→覆盖验证→工程优化→体验监控→KPI达标检查', descriptionEn: 'Site activation → Coverage verify → Engineering opt → Experience monitor → KPI target check',
    nodes: [
      { id: 't1', type: 'trigger', name: '新站激活', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '覆盖验证', agentType: 'planning', x: 300, y: 200 },
      { id: 'a2', type: 'agent', name: '工程优化', agentType: 'optimization', x: 550, y: 200 },
      { id: 'a3', type: 'agent', name: '体验监控', agentType: 'experience', x: 800, y: 200 },
      { id: 'c1', type: 'condition', name: 'KPI达标?', x: 1050, y: 200 },
      { id: 'a4', type: 'action', name: '标记完成', x: 1300, y: 140 },
      { id: 'a5', type: 'agent', name: '重新优化', agentType: 'optimization', x: 1300, y: 280 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'a2' },
      { id: 'e3', source: 'a2', target: 'a3' },
      { id: 'e4', source: 'a3', target: 'c1' },
      { id: 'e5', source: 'c1', target: 'a4', label: '达标' },
      { id: 'e6', source: 'c1', target: 'a5', label: '未达标' },
      { id: 'e7', source: 'a5', target: 'a2' },
    ],
  },
  {
    id: 'wf4', name: '突发事件保障', nameEn: 'Emergency Event Assurance',
    description: '事件检测→容量扩充→体验监控→稳定性监控→汇总→问题处理', descriptionEn: 'Event detect → Capacity expand → Experience monitor → Stability monitor → Summary → Issue handling',
    nodes: [
      { id: 't1', type: 'trigger', name: '事件检测', x: 50, y: 200 },
      { id: 's1', type: 'split', name: '并行保障', x: 300, y: 200 },
      { id: 'a1', type: 'agent', name: '容量扩充', agentType: 'optimization', x: 550, y: 80 },
      { id: 'a2', type: 'agent', name: '体验监控', agentType: 'experience', x: 550, y: 200 },
      { id: 'a3', type: 'agent', name: '稳定性监控', agentType: 'ops', x: 550, y: 320 },
      { id: 'm1', type: 'merge', name: '汇总报告', x: 800, y: 200 },
      { id: 'c1', type: 'condition', name: '有问题?', x: 1050, y: 200 },
      { id: 'a4', type: 'action', name: '升级处理', x: 1300, y: 140 },
      { id: 'a5', type: 'action', name: '保障结束', x: 1300, y: 280 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 's1' },
      { id: 'e2', source: 's1', target: 'a1' },
      { id: 'e3', source: 's1', target: 'a2' },
      { id: 'e4', source: 's1', target: 'a3' },
      { id: 'e5', source: 'a1', target: 'm1' },
      { id: 'e6', source: 'a2', target: 'm1' },
      { id: 'e7', source: 'a3', target: 'm1' },
      { id: 'e8', source: 'm1', target: 'c1' },
      { id: 'e9', source: 'c1', target: 'a4', label: '是' },
      { id: 'e10', source: 'c1', target: 'a5', label: '否' },
    ],
  },
  {
    id: 'wf5', name: '精准营销活动', nameEn: 'Precision Marketing Campaign',
    description: '营销创建→潜客识别→容量评估→执行营销→效果监控→报告', descriptionEn: 'Campaign create → Lead identify → Capacity assess → Execute marketing → Monitor → Report',
    nodes: [
      { id: 't1', type: 'trigger', name: '营销创建', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '潜客识别', agentType: 'marketing', x: 300, y: 200 },
      { id: 'a2', type: 'agent', name: '容量评估', agentType: 'planning', x: 550, y: 200 },
      { id: 'c1', type: 'condition', name: '容量充足?', x: 800, y: 200 },
      { id: 'a3', type: 'agent', name: '执行营销', agentType: 'marketing', x: 1050, y: 130 },
      { id: 'a4', type: 'agent', name: '效果监控', agentType: 'experience', x: 1300, y: 130 },
      { id: 'a5', type: 'action', name: '生成报告', x: 1550, y: 130 },
      { id: 'a6', type: 'action', name: '暂停营销', x: 1050, y: 300 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'a2' },
      { id: 'e3', source: 'a2', target: 'c1' },
      { id: 'e4', source: 'c1', target: 'a3', label: '充足' },
      { id: 'e5', source: 'c1', target: 'a6', label: '不足' },
      { id: 'e6', source: 'a3', target: 'a4' },
      { id: 'e7', source: 'a4', target: 'a5' },
    ],
  },
  {
    id: 'wf6', name: '全网健康巡检', nameEn: 'Network-wide Health Inspection',
    description: '定时触发→分区域巡检→汇总→异常处理→生成报告', descriptionEn: 'Scheduled trigger → Zone inspection → Aggregate → Anomaly handling → Generate report',
    nodes: [
      { id: 't1', type: 'trigger', name: '定时触发', x: 50, y: 200 },
      { id: 's1', type: 'split', name: '分区巡检', x: 300, y: 200 },
      { id: 'a1', type: 'agent', name: '广东巡检', agentType: 'ops', x: 550, y: 80 },
      { id: 'a2', type: 'agent', name: '浙江巡检', agentType: 'ops', x: 550, y: 200 },
      { id: 'a3', type: 'agent', name: '北京巡检', agentType: 'ops', x: 550, y: 320 },
      { id: 'm1', type: 'merge', name: '汇总结果', x: 800, y: 200 },
      { id: 'c1', type: 'condition', name: '发现异常?', x: 1050, y: 200 },
      { id: 'a4', type: 'agent', name: '创建工单', agentType: 'ops', x: 1300, y: 130 },
      { id: 'a5', type: 'action', name: '生成报告', x: 1300, y: 290 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 's1' },
      { id: 'e2', source: 's1', target: 'a1' },
      { id: 'e3', source: 's1', target: 'a2' },
      { id: 'e4', source: 's1', target: 'a3' },
      { id: 'e5', source: 'a1', target: 'm1' },
      { id: 'e6', source: 'a2', target: 'm1' },
      { id: 'e7', source: 'a3', target: 'm1' },
      { id: 'e8', source: 'm1', target: 'c1' },
      { id: 'e9', source: 'c1', target: 'a4', label: '是' },
      { id: 'e10', source: 'c1', target: 'a5' },
      { id: 'e11', source: 'a4', target: 'a5' },
    ],
  },
  {
    id: 'wf7', name: '跨系统故障工单自动化', nameEn: 'Cross-system Fault Ticket Automation',
    description: 'OSS告警→故障分析→SmartCare体验关联→自动创建工单→AUTIN闭环', descriptionEn: 'OSS alarm → Fault analysis → SmartCare correlation → Auto ticket → AUTIN close loop',
    nodes: [
      { id: 't1', type: 'connector', name: 'OSS告警接入', connectorType: 'oss', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '故障分析', agentType: 'ops', x: 300, y: 200 },
      { id: 's1', type: 'split', name: '并行关联', x: 550, y: 200 },
      { id: 'c1', type: 'connector', name: 'SmartCare查询', connectorType: 'smartcare', x: 800, y: 80 },
      { id: 'a2', type: 'agent', name: '影响分析', agentType: 'experience', x: 800, y: 320 },
      { id: 'm1', type: 'merge', name: '综合研判', x: 1050, y: 200 },
      { id: 'cd1', type: 'condition', name: '需现场?', x: 1300, y: 200 },
      { id: 'c2', type: 'connector', name: '创建工单', connectorType: 'ticket', x: 1550, y: 120 },
      { id: 'c3', type: 'connector', name: 'AUTIN远程修复', connectorType: 'autin', x: 1550, y: 300 },
      { id: 'a3', type: 'action', name: '验证&闭环', x: 1800, y: 200 },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 's1' },
      { id: 'e3', source: 's1', target: 'c1' },
      { id: 'e4', source: 's1', target: 'a2' },
      { id: 'e5', source: 'c1', target: 'm1' },
      { id: 'e6', source: 'a2', target: 'm1' },
      { id: 'e7', source: 'm1', target: 'cd1' },
      { id: 'e8', source: 'cd1', target: 'c2', label: '是' },
      { id: 'e9', source: 'cd1', target: 'c3', label: '否' },
      { id: 'e10', source: 'c2', target: 'a3' },
      { id: 'e11', source: 'c3', target: 'a3' },
    ],
  },
  {
    id: 'wf8', name: '精准营销全流程自动化', nameEn: 'End-to-end Marketing Automation',
    description: 'CRM潜客→BSS套餐匹配→营销执行→SmartCare体验监控→工单跟进', descriptionEn: 'CRM leads → BSS plan matching → Marketing execute → SmartCare monitor → Ticket follow-up',
    nodes: [
      { id: 'c1', type: 'connector', name: 'CRM潜客数据', connectorType: 'crm', x: 50, y: 200 },
      { id: 'a1', type: 'agent', name: '潜客筛选', agentType: 'marketing', x: 300, y: 200 },
      { id: 'c2', type: 'connector', name: 'BSS套餐查询', connectorType: 'bss', x: 550, y: 200 },
      { id: 'a2', type: 'agent', name: '方案匹配', agentType: 'marketing', x: 800, y: 200 },
      { id: 'cd1', type: 'condition', name: '匹配成功?', x: 1050, y: 200 },
      { id: 'c3', type: 'connector', name: 'CRM营销触达', connectorType: 'crm', x: 1300, y: 120 },
      { id: 'c4', type: 'connector', name: 'SmartCare监控', connectorType: 'smartcare', x: 1550, y: 120 },
      { id: 'a3', type: 'action', name: '效果报告', x: 1800, y: 120 },
      { id: 'a4', type: 'action', name: '标记观望', x: 1300, y: 310 },
    ],
    edges: [
      { id: 'e1', source: 'c1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'c2' },
      { id: 'e3', source: 'c2', target: 'a2' },
      { id: 'e4', source: 'a2', target: 'cd1' },
      { id: 'e5', source: 'cd1', target: 'c3', label: '是' },
      { id: 'e6', source: 'cd1', target: 'a4', label: '否' },
      { id: 'e7', source: 'c3', target: 'c4' },
      { id: 'e8', source: 'c4', target: 'a3' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Visual constants                                                  */
/* ------------------------------------------------------------------ */

const NODE_W = 170;
const NODE_H = 64;
const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  trigger:   { bg: '#7c2d12', border: '#f97316', text: '#fed7aa' },
  agent:     { bg: '#1e3a5f', border: '#3b82f6', text: '#bfdbfe' },
  condition: { bg: '#713f12', border: '#eab308', text: '#fef9c3' },
  action:    { bg: '#14532d', border: '#22c55e', text: '#bbf7d0' },
  merge:     { bg: '#374151', border: '#6b7280', text: '#d1d5db' },
  split:     { bg: '#374151', border: '#6b7280', text: '#d1d5db' },
  transform: { bg: '#581c87', border: '#a855f7', text: '#e9d5ff' },
  connector: { bg: '#164e63', border: '#06b6d4', text: '#a5f3fc' },
};

const AGENT_COLORS: Record<string, string> = {
  ops: '#ef4444', optimization: '#3b82f6', experience: '#8b5cf6',
  planning: '#f59e0b', marketing: '#10b981',
};

function nodeIcon(type: string) {
  switch (type) {
    case 'trigger': return '⚡';
    case 'agent': return '🤖';
    case 'condition': return '◆';
    case 'action': return '▶';
    case 'merge': return '⤵';
    case 'split': return '⤴';
    case 'transform': return '⇄';
    case 'connector': return '🔌';
    default: return '●';
  }
}

/* ------------------------------------------------------------------ */
/*  SVG edge path helper                                               */
/* ------------------------------------------------------------------ */

function edgePath(src: WfNode, tgt: WfNode): string {
  // n8n-style horizontal bezier: from right port to left port
  const sx = src.x + NODE_W;
  const sy = src.y + NODE_H / 2;
  const tx = tgt.x;
  const ty = tgt.y + NODE_H / 2;
  const dx = Math.abs(tx - sx) * 0.5;
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Workflows() {
  const { t } = useText();
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [selectedNode, setSelectedNode] = useState<WfNode | null>(null);
  const [running, setRunning] = useState(false);
  const [activeNodeIdx, setActiveNodeIdx] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Custom workflow state
  const [customNodes, setCustomNodes] = useState<WfNode[]>([]);
  const [customEdges, setCustomEdges] = useState<WfEdge[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  // Drag state
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Connection state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // Agent selector for new nodes
  const [agentPicker, setAgentPicker] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  // Zoom state
  const [zoom, setZoom] = useState(1);
  // Canvas panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  const template = TEMPLATES[selectedTemplate];
  const nodes = isCustom ? customNodes : template.nodes;
  const edges = isCustom ? customEdges : template.edges;

  // Topological execution order
  const executionOrder = useMemo(() => {
    const order: string[] = [];
    const visited = new Set<string>();
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => adj.get(e.source)?.push(e.target));

    function dfs(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      adj.get(id)?.forEach(dfs);
      order.unshift(id);
    }
    nodes.forEach(n => dfs(n.id));
    return order;
  }, [nodes, edges]);

  // Demo run animation
  useEffect(() => {
    if (!running) { setActiveNodeIdx(-1); return; }
    if (activeNodeIdx >= executionOrder.length) {
      setRunning(false);
      setActiveNodeIdx(-1);
      return;
    }
    const timer = setTimeout(() => setActiveNodeIdx(i => i + 1), 700);
    return () => clearTimeout(timer);
  }, [running, activeNodeIdx, executionOrder.length]);

  const startRun = useCallback(() => {
    setRunning(true);
    setActiveNodeIdx(0);
  }, []);

  const stopRun = useCallback(() => {
    setRunning(false);
    setActiveNodeIdx(-1);
  }, []);

  const activeNodeIds = useMemo(() => {
    if (activeNodeIdx < 0) return new Set<string>();
    return new Set(executionOrder.slice(0, activeNodeIdx + 1));
  }, [activeNodeIdx, executionOrder]);

  // --- Drag & Drop handlers ---
  const getSvgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    return { x, y };
  }, [zoom]);

  const handlePaletteDragStart = useCallback((e: React.DragEvent, type: WfNode['type'], agentType?: string, connectorType?: string) => {
    e.dataTransfer.setData('nodeType', type);
    if (agentType) e.dataTransfer.setData('agentType', agentType);
    if (connectorType) e.dataTransfer.setData('connectorType', connectorType);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType') as WfNode['type'];
    if (!type) return;
    const agentType = e.dataTransfer.getData('agentType') || undefined;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - NODE_W / 2;
    const y = (e.clientY - rect.top) / zoom - NODE_H / 2;
    const id = `n${_nextId++}`;
    const connectorType = e.dataTransfer.getData('connectorType') || undefined;
    const names: Record<string, string> = { trigger: t('New Trigger', '新触发器'), agent: agentType ? (t(SUB_AGENTS[agentType]?.nameEn, SUB_AGENTS[agentType]?.name) || 'Agent') : 'Agent', condition: t('New Condition', '新条件'), action: t('New Action', '新动作'), merge: t('Merge', '合并'), split: t('Split', '拆分'), transform: t('Transform', '转换'), connector: connectorType ? (t(CONNECTORS[connectorType]?.nameEn, CONNECTORS[connectorType]?.name) || t('Connector', '连接器')) : t('Connector', '连接器') };
    const newNode: WfNode = { id, type, name: names[type] || type, agentType, connectorType, x: Math.max(0, x), y: Math.max(0, y) };
    if (!isCustom) {
      setCustomNodes([...template.nodes, newNode]);
      setCustomEdges([...template.edges]);
      setIsCustom(true);
    } else {
      setCustomNodes(prev => [...prev, newNode]);
    }
    // Open agent picker for agent nodes
    if (type === 'agent') {
      setAgentPicker({ nodeId: id, x: e.clientX, y: e.clientY });
    }
    setSelectedNode(newNode);
  }, [isCustom, template]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (!isCustom && !connectingFrom) return;
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom !== nodeId) {
        const edgeId = `ce${_nextId++}`;
        setCustomEdges(prev => [...prev, { id: edgeId, source: connectingFrom, target: nodeId }]);
      }
      setConnectingFrom(null);
      return;
    }
    e.stopPropagation();
    const pt = getSvgPoint(e);
    const node = customNodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
    setDraggingNode(nodeId);
  }, [isCustom, connectingFrom, customNodes, getSvgPoint]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = getSvgPoint(e);
    setMousePos(pt);
    if (draggingNode && isCustom) {
      setCustomNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x: Math.max(0, pt.x - dragOffset.x), y: Math.max(0, pt.y - dragOffset.y) } : n));
    }
  }, [draggingNode, isCustom, dragOffset, getSvgPoint]);

  const handleSvgMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  const handlePortClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!isCustom) {
      setCustomNodes([...template.nodes]);
      setCustomEdges([...template.edges]);
      setIsCustom(true);
    }
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const edgeId = `ce${_nextId++}`;
        setCustomEdges(prev => [...prev, { id: edgeId, source: connectingFrom, target: nodeId }]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  }, [connectingFrom, isCustom, template]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!isCustom) return;
    setCustomNodes(prev => prev.filter(n => n.id !== nodeId));
    setCustomEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [isCustom, selectedNode]);

  const handleNewWorkflow = useCallback(() => {
    setCustomNodes([{ id: 'start', type: 'trigger', name: t('Start', '开始'), x: 400, y: 40 }]);
    setCustomEdges([]);
    setIsCustom(true);
    setSelectedNode(null);
    stopRun();
  }, [stopRun]);

  const handleSelectAgent = useCallback((nodeId: string, agentType: string, subAgent: string) => {
    setCustomNodes(prev => prev.map(n => n.id === nodeId ? { ...n, agentType, subAgent, name: subAgent } : n));
    setAgentPicker(null);
  }, []);

  const handleBackToTemplate = useCallback(() => {
    setIsCustom(false);
    setCustomNodes([]);
    setCustomEdges([]);
    setSelectedNode(null);
    stopRun();
  }, [stopRun]);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.15, 2.5)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.15, 0.3)), []);
  const handleZoomFit = useCallback(() => {
    setZoom(1);
    if (canvasRef.current) { canvasRef.current.scrollLeft = 0; canvasRef.current.scrollTop = 0; }
  }, []);

  // Canvas panning (drag empty area to scroll)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Start pan on background elements only (div container, svg root, or background grid rect)
    const tag = (e.target as HTMLElement).tagName?.toLowerCase();
    const isBackground = e.target === canvasRef.current || e.target === svgRef.current
      || (tag === 'rect' && (e.target as SVGRectElement).getAttribute('fill')?.includes('url(#grid)'))
      || tag === 'div';
    if (!isBackground) return;
    const container = canvasRef.current;
    if (!container) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setScrollStart({ x: container.scrollLeft, y: container.scrollTop });
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const container = canvasRef.current;
    if (!container) return;
    container.scrollLeft = scrollStart.x - (e.clientX - panStart.x);
    container.scrollTop = scrollStart.y - (e.clientY - panStart.y);
  }, [isPanning, panStart, scrollStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const currentNodeId = activeNodeIdx >= 0 && activeNodeIdx < executionOrder.length
    ? executionOrder[activeNodeIdx] : null;

  // Canvas bounds
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + NODE_W > maxX) maxX = n.x + NODE_W;
      if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
    });
    const pad = 80;
    return { w: Math.max(maxX + pad, 900), h: Math.max(maxY + pad, 500) };
  }, [nodes]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-card shrink-0">
        <div className="flex items-center gap-4">
          <GitBranch className="w-5 h-5 text-accent-cyan" />
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg border border-border hover:border-accent-cyan/40 text-sm text-text-primary cursor-pointer"
            >
              {t(template.nameEn, template.name)}
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-bg-card border border-border rounded-lg shadow-xl z-50">
                {TEMPLATES.map((tmpl, i) => (
                  <button
                    key={tmpl.id}
                    onClick={() => { setSelectedTemplate(i); setDropdownOpen(false); setSelectedNode(null); setIsCustom(false); stopRun(); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bg-primary transition-colors cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                      i === selectedTemplate ? 'text-accent-cyan bg-bg-primary' : 'text-text-secondary'
                    }`}
                  >
                    <div className="font-medium">{t(tmpl.nameEn, tmpl.name)}</div>
                    <div className="text-xs text-text-muted mt-0.5">{t(tmpl.descriptionEn, tmpl.description)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted">{isCustom ? t('Custom', '自定义') : 'v1.0'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            running ? 'bg-status-green/20 text-status-green' : connectingFrom ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-bg-primary text-text-muted'
          }`}>
            {running ? t('Running', '运行中') : connectingFrom ? t('Connecting...', '连线中...') : t('Ready', '就绪')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <button onClick={handleBackToTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary text-text-secondary text-sm font-medium hover:bg-bg-hover border border-border transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> {t('Back', '返回模板')}
            </button>
          )}
          <button onClick={handleNewWorkflow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/30 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> {t('New', '新建')}
          </button>
          {!running ? (
            <button onClick={startRun} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-green/20 text-status-green text-sm font-medium hover:bg-status-green/30 transition-colors cursor-pointer">
              <Play className="w-4 h-4" /> {t('Run', '运行')}
            </button>
          ) : (
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-yellow/20 text-status-yellow text-sm font-medium cursor-pointer">
                <Pause className="w-4 h-4" /> {t('Pause', '暂停')}
              </button>
              <button onClick={stopRun} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-red/20 text-status-red text-sm font-medium hover:bg-status-red/30 transition-colors cursor-pointer">
                <Square className="w-4 h-4" /> {t('Stop', '停止')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node palette */}
        <div className="w-48 border-r border-border bg-bg-card p-3 shrink-0 overflow-auto">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('Node Types', '节点类型')}</h3>
          {(['trigger', 'agent', 'connector', 'condition', 'action', 'merge', 'split', 'transform'] as const).map(type => {
            const c = COLORS[type];
            return (
              <div key={type} draggable onDragStart={e => handlePaletteDragStart(e, type)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-primary transition-colors mb-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3 text-text-muted/40" />
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                  {nodeIcon(type)}
                </div>
                <span className="text-xs text-text-secondary capitalize">{type === 'trigger' ? t('Trigger', '触发器') : type === 'agent' ? 'Agent' : type === 'connector' ? t('Connector', '连接器') : type === 'condition' ? t('Condition', '条件') : type === 'action' ? t('Action', '动作') : type === 'merge' ? t('Merge', '合并') : type === 'split' ? t('Split', '拆分') : t('Transform', '转换')}</span>
              </div>
            );
          })}
          <div className="border-t border-border mt-3 pt-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('Agents', '领域Agent')}</h3>
            {Object.entries(SUB_AGENTS).map(([key, val]) => (
              <div key={key} draggable onDragStart={e => handlePaletteDragStart(e, 'agent', key)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-primary transition-colors mb-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3 text-text-muted/40" />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AGENT_COLORS[key] }} />
                <span className="text-xs text-text-secondary">{t(val.nameEn, val.name)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('Connectors', '外部连接器')}</h3>
            {Object.entries(CONNECTORS).map(([key, conn]) => (
              <div key={key} draggable onDragStart={e => handlePaletteDragStart(e, 'connector', undefined, key)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-primary transition-colors mb-1 cursor-grab active:cursor-grabbing"
                title={t(conn.descEn, conn.desc)}>
                <GripVertical className="w-3 h-3 text-text-muted/40" />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: conn.color }} />
                <span className="text-xs text-text-secondary">{t(conn.nameEn, conn.name)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: SVG Canvas */}
        <div ref={canvasRef} className="flex-1 overflow-auto bg-bg-primary relative"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onDragOver={e => e.preventDefault()} onDrop={handleCanvasDrop}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: bounds.w, height: bounds.h }}>
          <svg ref={svgRef}
            width={bounds.w} height={bounds.h}
            className="block"
            onMouseMove={handleSvgMouseMove} onMouseUp={handleSvgMouseUp}
            onClick={() => { if (connectingFrom) setConnectingFrom(null); setAgentPicker(null); }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
              <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
              <marker id="arrow-connector" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
              </marker>
              {/* Grid pattern */}
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="0.8" fill="#1e293b" />
              </pattern>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Animated dash */}
              <style>{`
                @keyframes dash { to { stroke-dashoffset: -20; } }
                .edge-active { animation: dash 0.5s linear infinite; }
                @keyframes pulse-glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
                .node-active-glow { animation: pulse-glow 0.8s ease-in-out infinite; }
              `}</style>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connection preview line */}
            {connectingFrom && (() => {
              const fromNode = nodes.find(n => n.id === connectingFrom);
              if (!fromNode) return null;
              const sx = fromNode.x + NODE_W; const sy = fromNode.y + NODE_H / 2;
              const dx = Math.abs(mousePos.x - sx) * 0.5;
              return <path d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${mousePos.x - dx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                fill="none" stroke="#06b6d4" strokeWidth={2} strokeDasharray="6 3" />;
            })()}

            {/* Edges */}
            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.source)!;
              const tgt = nodes.find(n => n.id === edge.target)!;
              if (!src || !tgt) return null;
              const path = edgePath(src, tgt);
              const srcDone = activeNodeIds.has(edge.source);
              const tgtDone = activeNodeIds.has(edge.target);
              const isActive = srcDone && tgtDone;
              const isAnimating = srcDone && !tgtDone && running;
              const isConnectorEdge = src.type === 'connector' || tgt.type === 'connector';
              const connEdgeColor = isConnectorEdge ? '#06b6d4' : '#475569';

              return (
                <g key={edge.id}>
                  <path d={path} fill="none" stroke={isActive ? '#22c55e' : connEdgeColor} strokeWidth={isActive ? 2.5 : isConnectorEdge ? 2 : 1.5}
                    markerEnd={isActive ? 'url(#arrow-active)' : isConnectorEdge ? 'url(#arrow-connector)' : 'url(#arrow)'}
                    strokeDasharray={isAnimating ? '6 4' : isConnectorEdge ? '8 3' : 'none'}
                    className={isAnimating ? 'edge-active' : ''}
                    style={{ transition: 'stroke 0.3s' }}
                  />
                  {edge.label && (
                    <text x={(src.x + NODE_W + tgt.x) / 2}
                          y={(src.y + NODE_H/2 + tgt.y + NODE_H/2) / 2 - 8}
                          fill="#94a3b8" fontSize="9" textAnchor="middle">
                      {edge.label}
                    </text>
                  )}
                  {isConnectorEdge && !edge.label && (
                    <text x={(src.x + NODE_W + tgt.x) / 2}
                          y={(src.y + NODE_H/2 + tgt.y + NODE_H/2) / 2 - 8}
                          fill="#06b6d4" fontSize="8" textAnchor="middle" opacity={0.7}>
                      API
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const c = COLORS[node.type];
              const isDone = activeNodeIds.has(node.id);
              const isCurrent = currentNodeId === node.id;
              const isSelected = selectedNode?.id === node.id;
              const agentColor = node.agentType ? AGENT_COLORS[node.agentType] : undefined;
              const connColor = node.connectorType ? CONNECTORS[node.connectorType]?.color : undefined;

              return (
                <g key={node.id} onClick={() => setSelectedNode(node)}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  style={{ cursor: isCustom ? (draggingNode === node.id ? 'grabbing' : 'grab') : 'pointer' }}>
                  {/* Glow behind active node */}
                  {isCurrent && (
                    <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8}
                      rx={12} fill="none" stroke="#22c55e" strokeWidth={2}
                      className="node-active-glow" filter="url(#glow)" />
                  )}
                  {/* Selection outline */}
                  {isSelected && !isCurrent && (
                    <rect x={node.x - 3} y={node.y - 3} width={NODE_W + 6} height={NODE_H + 6}
                      rx={11} fill="none" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 2" />
                  )}
                  {/* n8n-style node body */}
                  <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
                    fill={isDone ? '#14532d' : '#111827'}
                    stroke={isDone ? '#22c55e' : (connColor || agentColor || c.border)}
                    strokeWidth={isCurrent ? 2.5 : 1.5}
                    style={{ transition: 'all 0.3s' }}
                  />
                  {/* n8n-style icon circle on left */}
                  <circle cx={node.x + 26} cy={node.y + NODE_H / 2} r={18}
                    fill={isDone ? '#22c55e20' : (connColor ? `${connColor}20` : agentColor ? `${agentColor}20` : `${c.border}20`)}
                    stroke={isDone ? '#22c55e40' : (connColor ? `${connColor}40` : agentColor ? `${agentColor}40` : `${c.border}40`)}
                    strokeWidth={1} />
                  <text x={node.x + 26} y={node.y + NODE_H / 2 + 1}
                    fill={isDone ? '#bbf7d0' : (connColor || agentColor || c.text)} fontSize="14" textAnchor="middle" dominantBaseline="middle">
                    {isDone ? '✓' : nodeIcon(node.type)}
                  </text>
                  {/* Name (right of icon) */}
                  <text x={node.x + 52} y={node.y + NODE_H / 2 - 6}
                    fill={isDone ? '#bbf7d0' : '#e2e8f0'} fontSize="12" dominantBaseline="middle"
                    fontWeight={600}>
                    {node.name}
                  </text>
                  {/* Subtitle: agent type or node type */}
                  <text x={node.x + 52} y={node.y + NODE_H / 2 + 10}
                    fill="#64748b" fontSize="9" dominantBaseline="middle">
                    {node.subAgent || (node.connectorType ? CONNECTORS[node.connectorType]?.nameEn : node.agentType ? SUB_AGENTS[node.agentType]?.name : node.type)}
                  </text>
                  {/* n8n-style left port (input) */}
                  <circle cx={node.x} cy={node.y + NODE_H / 2} r={5}
                    fill="#1e293b" stroke={connectingFrom ? '#06b6d4' : '#475569'} strokeWidth={1.5}
                    onClick={e => handlePortClick(e, node.id)}
                    style={{ cursor: 'crosshair' }} />
                  {/* n8n-style right port (output) */}
                  <circle cx={node.x + NODE_W} cy={node.y + NODE_H / 2} r={5}
                    fill="#1e293b" stroke={connectingFrom === node.id ? '#06b6d4' : '#475569'} strokeWidth={1.5}
                    onClick={e => handlePortClick(e, node.id)}
                    style={{ cursor: 'crosshair' }} />
                </g>
              );
            })}
          </svg>
          </div>

          {/* Agent picker popup */}
          {agentPicker && (() => {
            const svg = svgRef.current;
            if (!svg) return null;
            const rect = svg.getBoundingClientRect();
            return (
              <div className="absolute z-50 bg-bg-card border border-border rounded-lg shadow-xl p-2 w-48"
                style={{ left: agentPicker.x - rect.left, top: agentPicker.y - rect.top }}
                onClick={e => e.stopPropagation()}>
                <p className="text-xs text-text-muted mb-1 px-2">{t('Select Agent & Sub-Agent', '选择Agent和子Agent')}</p>
                {Object.entries(SUB_AGENTS).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-text-secondary px-2 py-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: AGENT_COLORS[key] }} />
                      {val.name}
                    </p>
                    {val.subs.map(sub => (
                      <button key={sub} onClick={() => handleSelectAgent(agentPicker.nodeId, key, sub)}
                        className="w-full text-left text-xs text-text-secondary hover:bg-bg-primary px-4 py-1 rounded cursor-pointer">
                        {sub}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Zoom controls */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
            <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-colors" title={t('Zoom In', '放大')}>
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-colors" title={t('Zoom Out', '缩小')}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleZoomFit} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-colors" title={t('Fit View', '适配视图')}>
              <Maximize2 className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-text-muted text-center">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="absolute bottom-3 right-3 w-32 h-20 bg-bg-card/80 border border-border rounded-lg overflow-hidden">
            <svg viewBox={`0 0 ${bounds.w} ${bounds.h}`} width="100%" height="100%">
              {edges.map(e => {
                const src = nodes.find(n => n.id === e.source)!;
                const tgt = nodes.find(n => n.id === e.target)!;
                if (!src || !tgt) return null;
                return <line key={e.id} x1={src.x+NODE_W} y1={src.y+NODE_H/2} x2={tgt.x} y2={tgt.y+NODE_H/2} stroke="#334155" strokeWidth="3" />;
              })}
              {nodes.map(n => (
                <rect key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={4}
                  fill={activeNodeIds.has(n.id) ? '#22c55e' : COLORS[n.type].border} opacity={0.6} />
              ))}
            </svg>
          </div>
        </div>

        {/* Right: Config panel */}
        {selectedNode && (
          <div className="w-64 border-l border-border bg-bg-card p-4 shrink-0 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">{t('Node Config', '节点配置')}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted block mb-1">{t('Name', '名称')}</label>
                <div className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary">{selectedNode.name}</div>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">{t('Type', '类型')}</label>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ backgroundColor: COLORS[selectedNode.type].bg, border: `1px solid ${COLORS[selectedNode.type].border}` }}>
                    {nodeIcon(selectedNode.type)}
                  </div>
                  <span className="text-sm text-text-secondary capitalize">{selectedNode.type}</span>
                </div>
              </div>
              {selectedNode.agentType && (
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('Agent', '领域Agent')}</label>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AGENT_COLORS[selectedNode.agentType] }} />
                    <span className="text-sm text-text-secondary">
                      {selectedNode.agentType === 'ops' ? '网络运维' : selectedNode.agentType === 'optimization' ? '网络优化' : selectedNode.agentType === 'experience' ? '体验保障' : selectedNode.agentType === 'planning' ? '规划' : '运营支撑'}Agent
                    </span>
                  </div>
                </div>
              )}
              {selectedNode.connectorType && CONNECTORS[selectedNode.connectorType] && (
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('External System', '外部系统')}</label>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CONNECTORS[selectedNode.connectorType].color }} />
                    <span className="text-sm text-text-secondary">{t(CONNECTORS[selectedNode.connectorType].nameEn, CONNECTORS[selectedNode.connectorType].name)}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{t(CONNECTORS[selectedNode.connectorType].descEn, CONNECTORS[selectedNode.connectorType].desc)}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-green" />
                      <span className="text-status-green">{t('Connected', '已连接')}</span>
                    </div>
                    <div className="text-[10px] text-text-muted">API: https://{selectedNode.connectorType}.telecom.cn/api/v2</div>
                    <div className="text-[10px] text-text-muted">{t('Latency', '延迟')}: {Math.floor(Math.random() * 30 + 10)}ms</div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-text-muted block mb-1">{t('Position', '位置')}</label>
                <div className="text-sm text-text-secondary">x: {selectedNode.x}, y: {selectedNode.y}</div>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">{t('Status', '状态')}</label>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeNodeIds.has(selectedNode.id)
                    ? 'bg-status-green/20 text-status-green'
                    : 'bg-bg-primary text-text-muted'
                }`}>
                  {activeNodeIds.has(selectedNode.id) ? t('Completed', '已完成') : t('Pending', '待执行')}
                </span>
              </div>

              {/* Agent/Sub-Agent selector for custom mode */}
              {isCustom && selectedNode.type === 'agent' && (
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('Domain Agent', '领域Agent')}</label>
                  <select value={selectedNode.agentType || ''} onChange={e => {
                    const val = e.target.value;
                    setCustomNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, agentType: val || undefined } : n));
                    setSelectedNode({ ...selectedNode, agentType: val || undefined });
                  }} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary">
                    <option value="">{t('Select...', '选择...')}</option>
                    {Object.entries(SUB_AGENTS).map(([k, v]) => <option key={k} value={k}>{t(v.nameEn, v.name)}</option>)}
                  </select>
                </div>
              )}
              {isCustom && selectedNode.agentType && SUB_AGENTS[selectedNode.agentType] && (
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('Sub-Agent', '子Agent')}</label>
                  <select value={selectedNode.subAgent || ''} onChange={e => {
                    const val = e.target.value;
                    setCustomNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, subAgent: val, name: val || SUB_AGENTS[selectedNode.agentType!].name } : n));
                    setSelectedNode({ ...selectedNode, subAgent: val, name: val || SUB_AGENTS[selectedNode.agentType!].name });
                  }} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary">
                    <option value="">{t('Select sub-agent...', '选择子Agent...')}</option>
                    {SUB_AGENTS[selectedNode.agentType].subs.map((s, i) => <option key={s} value={s}>{t(SUB_AGENTS[selectedNode.agentType!].subsEn[i], s)}</option>)}
                  </select>
                </div>
              )}

              {/* Connections */}
              <div className="border-t border-border pt-3">
                <label className="text-xs text-text-muted block mb-2">{t('Connections', '连接')}</label>
                {edges.filter(e => e.source === selectedNode.id).map(e => {
                  const tgt = nodes.find(n => n.id === e.target);
                  return (
                    <div key={e.id} className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                      <ArrowRight className="w-3 h-3 text-text-muted" />
                      <span>{tgt?.name}</span>
                      {e.label && <span className="text-text-muted">({e.label})</span>}
                    </div>
                  );
                })}
                {edges.filter(e => e.target === selectedNode.id).map(e => {
                  const src = nodes.find(n => n.id === e.source);
                  return (
                    <div key={e.id} className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                      <RefreshCw className="w-3 h-3 text-text-muted" />
                      <span>← {src?.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Delete button for custom mode */}
              {isCustom && (
                <div className="border-t border-border pt-3">
                  <button onClick={() => handleDeleteNode(selectedNode.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-red/20 text-status-red text-xs font-medium hover:bg-status-red/30 transition-colors cursor-pointer w-full justify-center">
                    <Trash2 className="w-3 h-3" /> {t('Delete Node', '删除节点')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
