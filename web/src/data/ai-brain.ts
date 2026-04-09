/* ─── AI Brain (Gemma 4) Data Types & Mock Data ─── */

export interface ModelInstance {
  id: string;
  name: string;
  version: string;
  parameters: string;
  quantization: string;
  status: 'online' | 'offline' | 'warming' | 'training';
  engine: string;
  gpuAllocation: string;
  maxSeqLen: number;
  description: string;
  descriptionZh: string;
}

export interface InferenceMetric {
  id: string;
  name: string;
  nameZh: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  history: number[];
  goodDirection: 'up' | 'down';
}

export interface LoraAdapter {
  id: string;
  name: string;
  nameZh: string;
  domain: string;
  domainZh: string;
  baseModel: string;
  rank: number;
  trainSamples: number;
  accuracy: number;
  status: 'active' | 'training' | 'standby';
  color: string;
  description: string;
  descriptionZh: string;
  agentId: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  color: string;
  sources: { name: string; nameZh: string }[];
  outputs: { name: string; nameZh: string }[];
  latency: number;
  throughput: number;
}

export interface GpuNode {
  id: string;
  name: string;
  type: string;
  memory: string;
  utilization: number;
  temperature: number;
  status: 'active' | 'idle' | 'maintenance';
  assignedTo: string;
}

export interface RagStatus {
  id: string;
  name: string;
  nameZh: string;
  vectorStore: string;
  embeddingModel: string;
  totalDocs: number;
  totalChunks: number;
  indexSize: string;
  lastSync: string;
  status: 'synced' | 'syncing' | 'error';
  color: string;
}

/* ─── Mock data ─── */

export const gemma4Instance: ModelInstance = {
  id: 'gemma-4-27b',
  name: 'Gemma 4 27B',
  version: '4.0.1',
  parameters: '27B',
  quantization: 'BF16',
  status: 'online',
  engine: 'vLLM 0.8.2',
  gpuAllocation: '2× A100 80GB',
  maxSeqLen: 131072,
  description: 'Google Gemma 4 open-weight model, fine-tuned for telecom operations with domain LoRA adapters',
  descriptionZh: 'Google Gemma 4 开源权重模型，通过领域 LoRA 适配器针对电信运维场景微调',
};

export const inferenceMetrics: InferenceMetric[] = [
  { id: 'latency', name: 'Avg Latency', nameZh: '平均延迟', value: 142, unit: 'ms', trend: 'down', change: -8, history: [168, 162, 155, 149, 158, 151, 148, 145, 142], goodDirection: 'down' },
  { id: 'throughput', name: 'Throughput', nameZh: '吞吐量', value: 4280, unit: 'tok/s', trend: 'up', change: 12, history: [3850, 3920, 4010, 4080, 4150, 4200, 4230, 4260, 4280], goodDirection: 'up' },
  { id: 'gpu-util', name: 'GPU Utilization', nameZh: 'GPU利用率', value: 73.2, unit: '%', trend: 'stable', change: 0.5, history: [71, 72, 74, 73, 72, 74, 73, 73, 73.2], goodDirection: 'up' },
  { id: 'success-rate', name: 'Success Rate', nameZh: '成功率', value: 99.7, unit: '%', trend: 'stable', change: 0.1, history: [99.5, 99.6, 99.5, 99.7, 99.6, 99.8, 99.7, 99.7, 99.7], goodDirection: 'up' },
  { id: 'rpm', name: 'Requests/min', nameZh: '请求数/分', value: 847, unit: 'rpm', trend: 'up', change: 23, history: [720, 745, 780, 798, 810, 825, 832, 840, 847], goodDirection: 'up' },
  { id: 'queue', name: 'Queue Depth', nameZh: '队列深度', value: 3, unit: '', trend: 'down', change: -2, history: [8, 7, 6, 5, 5, 4, 4, 3, 3], goodDirection: 'down' },
];

export const padeStages: PipelineStage[] = [
  {
    id: 'perception',
    name: 'Perception',
    nameZh: '感知',
    description: 'Real-time data ingestion from network elements, alarms, KPIs, and user feedback',
    descriptionZh: '从网元、告警、KPI和用户反馈实时采集数据',
    color: '#06b6d4',
    sources: [
      { name: 'Network KPIs', nameZh: '网络KPI' },
      { name: 'Alarm Stream', nameZh: '告警流' },
      { name: 'User Feedback', nameZh: '用户反馈' },
      { name: 'OSS/BSS Events', nameZh: 'OSS/BSS事件' },
    ],
    outputs: [
      { name: 'Structured Events', nameZh: '结构化事件' },
      { name: 'Anomaly Signals', nameZh: '异常信号' },
    ],
    latency: 12,
    throughput: 15000,
  },
  {
    id: 'analysis',
    name: 'Analysis',
    nameZh: '分析',
    description: 'Gemma 4 powered root cause analysis, trend prediction, and pattern recognition',
    descriptionZh: 'Gemma 4 驱动的根因分析、趋势预测和模式识别',
    color: '#3b82f6',
    sources: [
      { name: 'Structured Events', nameZh: '结构化事件' },
      { name: 'RAG Knowledge', nameZh: 'RAG知识库' },
      { name: 'Historical Data', nameZh: '历史数据' },
    ],
    outputs: [
      { name: 'Root Cause Report', nameZh: '根因报告' },
      { name: 'Risk Assessment', nameZh: '风险评估' },
    ],
    latency: 142,
    throughput: 4280,
  },
  {
    id: 'decision',
    name: 'Decision',
    nameZh: '决策',
    description: 'SOP matching, action plan generation, risk evaluation, and human-in-the-loop approval',
    descriptionZh: 'SOP匹配、行动方案生成、风险评估和人机协同审批',
    color: '#8b5cf6',
    sources: [
      { name: 'Root Cause Report', nameZh: '根因报告' },
      { name: 'SOP Library', nameZh: 'SOP库' },
      { name: 'Permission Rules', nameZh: '权限规则' },
    ],
    outputs: [
      { name: 'Action Plan', nameZh: '执行方案' },
      { name: 'Approval Request', nameZh: '审批请求' },
    ],
    latency: 85,
    throughput: 2400,
  },
  {
    id: 'execution',
    name: 'Execution',
    nameZh: '执行',
    description: 'Automated ticket dispatch, parameter tuning, configuration push, and closed-loop verification',
    descriptionZh: '自动工单下发、参数调优、配置下发和闭环验证',
    color: '#22c55e',
    sources: [
      { name: 'Action Plan', nameZh: '执行方案' },
      { name: 'Tool APIs', nameZh: '工具API' },
    ],
    outputs: [
      { name: 'Execution Result', nameZh: '执行结果' },
      { name: 'Feedback Loop', nameZh: '反馈闭环' },
    ],
    latency: 230,
    throughput: 580,
  },
];

export const loraAdapters: LoraAdapter[] = [
  { id: 'lora-planning', name: 'Telecom Planning LoRA', nameZh: '网络规划LoRA', domain: 'Network Planning', domainZh: '网络规划', baseModel: 'Gemma 4 27B', rank: 64, trainSamples: 28500, accuracy: 94.2, status: 'active', color: '#f97316', description: 'Coverage planning, capacity modeling, site selection optimization', descriptionZh: '覆盖规划、容量建模、站址选择优化', agentId: 'planning' },
  { id: 'lora-optimization', name: 'Network Optimization LoRA', nameZh: '网络优化LoRA', domain: 'Network Optimization', domainZh: '网络优化', baseModel: 'Gemma 4 27B', rank: 64, trainSamples: 42300, accuracy: 96.1, status: 'active', color: '#3b82f6', description: 'KPI optimization, parameter tuning, interference management', descriptionZh: 'KPI优化、参数调优、干扰管理', agentId: 'optimization' },
  { id: 'lora-experience', name: 'User Experience LoRA', nameZh: '用户体验LoRA', domain: 'User Experience', domainZh: '用户体验', baseModel: 'Gemma 4 27B', rank: 32, trainSamples: 35800, accuracy: 93.8, status: 'active', color: '#ec4899', description: 'Experience profiling, complaint handling, QoS management', descriptionZh: '体验画像、投诉处理、QoS管理', agentId: 'experience' },
  { id: 'lora-ops', name: 'Network Ops LoRA', nameZh: '运维管理LoRA', domain: 'Network Operations', domainZh: '运维管理', baseModel: 'Gemma 4 27B', rank: 64, trainSamples: 51200, accuracy: 97.3, status: 'active', color: '#06b6d4', description: 'Fault diagnosis, alarm correlation, preventive maintenance', descriptionZh: '故障诊断、告警关联、预防性维护', agentId: 'ops' },
  { id: 'lora-marketing', name: 'Smart Marketing LoRA', nameZh: '智慧营销LoRA', domain: 'Smart Marketing', domainZh: '智慧营销', baseModel: 'Gemma 4 27B', rank: 32, trainSamples: 22100, accuracy: 91.5, status: 'active', color: '#eab308', description: 'Churn prediction, precision marketing, package recommendation', descriptionZh: '流失预测、精准营销、套餐推荐', agentId: 'marketing' },
];

export const gpuNodes: GpuNode[] = [
  { id: 'gpu-0', name: 'GPU-0', type: 'A100 80GB', memory: '80GB HBM2e', utilization: 76, temperature: 62, status: 'active', assignedTo: 'Gemma 4 27B (TP-0)' },
  { id: 'gpu-1', name: 'GPU-1', type: 'A100 80GB', memory: '80GB HBM2e', utilization: 71, temperature: 59, status: 'active', assignedTo: 'Gemma 4 27B (TP-1)' },
  { id: 'gpu-2', name: 'A10G-0', type: 'A10G 24GB', memory: '24GB GDDR6X', utilization: 45, temperature: 51, status: 'active', assignedTo: 'BGE-M3 Embedding' },
  { id: 'gpu-3', name: 'A10G-1', type: 'A10G 24GB', memory: '24GB GDDR6X', utilization: 0, temperature: 38, status: 'idle', assignedTo: 'Standby' },
];

export const ragSources: RagStatus[] = [
  { id: 'rag-sop', name: 'SOP Knowledge Base', nameZh: 'SOP知识库', vectorStore: 'Milvus 2.4', embeddingModel: 'BGE-M3', totalDocs: 1284, totalChunks: 18960, indexSize: '2.3GB', lastSync: '2 min ago', status: 'synced', color: '#8b5cf6' },
  { id: 'rag-alarm', name: 'Alarm History', nameZh: '告警历史库', vectorStore: 'Milvus 2.4', embeddingModel: 'BGE-M3', totalDocs: 45820, totalChunks: 312400, indexSize: '18.7GB', lastSync: '30 sec ago', status: 'synced', color: '#ef4444' },
  { id: 'rag-3gpp', name: '3GPP Standards', nameZh: '3GPP标准库', vectorStore: 'Milvus 2.4', embeddingModel: 'BGE-M3', totalDocs: 892, totalChunks: 67300, indexSize: '8.1GB', lastSync: '1 hr ago', status: 'synced', color: '#06b6d4' },
  { id: 'rag-vendor', name: 'Vendor Manuals', nameZh: '厂商手册库', vectorStore: 'Milvus 2.4', embeddingModel: 'BGE-M3', totalDocs: 2340, totalChunks: 156800, indexSize: '12.4GB', lastSync: '15 min ago', status: 'synced', color: '#22c55e' },
];
