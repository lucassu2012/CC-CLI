export interface TopoNode {
  id: string;
  type: 'core' | 'aggregation' | 'bts' | 'data-center';
  name: string;
  nameZh: string;
  x: number;
  y: number;
  status: 'normal' | 'warning' | 'fault';
  details: {
    ip?: string;
    location: string;
    locationZh: string;
    subscribers?: number;
    uptime: string;
    load: number;
    alarms: number;
  };
}

export interface TopoLink {
  id: string;
  source: string;
  target: string;
  type: 'fiber' | 'microwave' | 'ethernet';
  status: 'normal' | 'degraded' | 'down';
  bandwidth: string;
  utilization: number;
}

export const topoNodes: TopoNode[] = [
  { id: 'DC-01', type: 'data-center', name: 'Core Data Center', nameZh: '核心数据中心', x: 450, y: 80, status: 'normal', details: { ip: '10.0.0.1', location: 'Central HQ', locationZh: '中心总部', uptime: '99.999%', load: 42, alarms: 0 } },
  { id: 'CR-01', type: 'core', name: 'Core Router North', nameZh: '北区核心路由器', x: 300, y: 180, status: 'normal', details: { ip: '10.1.0.1', location: 'North District', locationZh: '北区', uptime: '99.98%', load: 65, alarms: 0 } },
  { id: 'CR-02', type: 'core', name: 'Core Router South', nameZh: '南区核心路由器', x: 600, y: 180, status: 'warning', details: { ip: '10.2.0.1', location: 'South District', locationZh: '南区', uptime: '99.95%', load: 87, alarms: 2 } },
  { id: 'AGG-N-01', type: 'aggregation', name: 'AGG North 01', nameZh: '北区汇聚01', x: 150, y: 300, status: 'normal', details: { ip: '10.1.1.1', location: 'North Zone A', locationZh: '北区A片', uptime: '99.97%', load: 58, alarms: 0 } },
  { id: 'AGG-N-02', type: 'aggregation', name: 'AGG North 02', nameZh: '北区汇聚02', x: 350, y: 300, status: 'normal', details: { ip: '10.1.2.1', location: 'North Zone B', locationZh: '北区B片', uptime: '99.96%', load: 52, alarms: 0 } },
  { id: 'AGG-S-01', type: 'aggregation', name: 'AGG South 01', nameZh: '南区汇聚01', x: 500, y: 300, status: 'normal', details: { ip: '10.2.1.1', location: 'South Zone A', locationZh: '南区A片', uptime: '99.94%', load: 71, alarms: 1 } },
  { id: 'AGG-S-03', type: 'aggregation', name: 'AGG South 03', nameZh: '南区汇聚03', x: 720, y: 300, status: 'fault', details: { ip: '10.2.3.1', location: 'South Zone C', locationZh: '南区C片', uptime: '98.50%', load: 95, alarms: 5 } },
  { id: 'BTS-1001', type: 'bts', name: 'BTS-1001', nameZh: '基站1001', x: 80, y: 420, status: 'normal', details: { location: 'Riverside Park', locationZh: '滨江公园', subscribers: 1250, uptime: '99.9%', load: 45, alarms: 0 } },
  { id: 'BTS-1002', type: 'bts', name: 'BTS-1002', nameZh: '基站1002', x: 200, y: 420, status: 'normal', details: { location: 'Tech District', locationZh: '科技园区', subscribers: 2100, uptime: '99.8%', load: 67, alarms: 0 } },
  { id: 'BTS-2001', type: 'bts', name: 'BTS-2001', nameZh: '基站2001', x: 310, y: 420, status: 'normal', details: { location: 'University Area', locationZh: '大学城', subscribers: 3200, uptime: '99.7%', load: 78, alarms: 0 } },
  { id: 'BTS-2002', type: 'bts', name: 'BTS-2002', nameZh: '基站2002', x: 410, y: 420, status: 'warning', details: { location: 'Shopping Mall', locationZh: '商业中心', subscribers: 1800, uptime: '99.5%', load: 82, alarms: 1 } },
  { id: 'BTS-3001', type: 'bts', name: 'BTS-3001', nameZh: '基站3001', x: 520, y: 420, status: 'normal', details: { location: 'Industrial Zone', locationZh: '工业区', subscribers: 890, uptime: '99.9%', load: 34, alarms: 0 } },
  { id: 'BTS-4701', type: 'bts', name: 'BTS-4701', nameZh: '基站4701', x: 640, y: 420, status: 'fault', details: { location: 'South Residential', locationZh: '南区住宅', subscribers: 2400, uptime: '95.2%', load: 12, alarms: 3 } },
  { id: 'BTS-4705', type: 'bts', name: 'BTS-4705', nameZh: '基站4705', x: 750, y: 420, status: 'fault', details: { location: 'South Commercial', locationZh: '南区商业', subscribers: 1600, uptime: '94.8%', load: 8, alarms: 4 } },
  { id: 'BTS-4709', type: 'bts', name: 'BTS-4709', nameZh: '基站4709', x: 840, y: 420, status: 'warning', details: { location: 'South Suburb', locationZh: '南区郊区', subscribers: 720, uptime: '97.1%', load: 55, alarms: 2 } },
];

export const topoLinks: TopoLink[] = [
  { id: 'L-01', source: 'DC-01', target: 'CR-01', type: 'fiber', status: 'normal', bandwidth: '100G', utilization: 45 },
  { id: 'L-02', source: 'DC-01', target: 'CR-02', type: 'fiber', status: 'normal', bandwidth: '100G', utilization: 62 },
  { id: 'L-03', source: 'CR-01', target: 'CR-02', type: 'fiber', status: 'normal', bandwidth: '100G', utilization: 38 },
  { id: 'L-04', source: 'CR-01', target: 'AGG-N-01', type: 'fiber', status: 'normal', bandwidth: '10G', utilization: 55 },
  { id: 'L-05', source: 'CR-01', target: 'AGG-N-02', type: 'fiber', status: 'normal', bandwidth: '10G', utilization: 48 },
  { id: 'L-06', source: 'CR-02', target: 'AGG-S-01', type: 'fiber', status: 'normal', bandwidth: '10G', utilization: 68 },
  { id: 'L-07', source: 'CR-02', target: 'AGG-S-03', type: 'fiber', status: 'down', bandwidth: '10G', utilization: 0 },
  { id: 'L-08', source: 'AGG-N-01', target: 'BTS-1001', type: 'fiber', status: 'normal', bandwidth: '1G', utilization: 42 },
  { id: 'L-09', source: 'AGG-N-01', target: 'BTS-1002', type: 'fiber', status: 'normal', bandwidth: '1G', utilization: 65 },
  { id: 'L-10', source: 'AGG-N-02', target: 'BTS-2001', type: 'fiber', status: 'normal', bandwidth: '1G', utilization: 72 },
  { id: 'L-11', source: 'AGG-N-02', target: 'BTS-2002', type: 'fiber', status: 'degraded', bandwidth: '1G', utilization: 85 },
  { id: 'L-12', source: 'AGG-S-01', target: 'BTS-3001', type: 'fiber', status: 'normal', bandwidth: '1G', utilization: 30 },
  { id: 'L-13', source: 'AGG-S-03', target: 'BTS-4701', type: 'fiber', status: 'down', bandwidth: '1G', utilization: 0 },
  { id: 'L-14', source: 'AGG-S-03', target: 'BTS-4705', type: 'fiber', status: 'down', bandwidth: '1G', utilization: 0 },
  { id: 'L-15', source: 'AGG-S-03', target: 'BTS-4709', type: 'microwave', status: 'degraded', bandwidth: '500M', utilization: 78 },
];
