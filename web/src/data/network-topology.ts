// 网络拓扑数据 - IOE智能运营引擎演示数据
// Network topology data for visualization

export interface Site {
  id: string;
  name: string;
  type: '4G' | '5G' | 'both';
  lat: number;
  lng: number;
  status: 'normal' | 'warning' | 'fault';
  azimuth: number[];
  height: number;
  vendor: string;
  bandConfig: string[];
  neighborList: string[];
  region: string;
  siteType: 'macro' | 'micro' | 'indoor';
  capacity: number;
  activeUsers: number;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  type: 'backhaul' | 'fronthaul' | 'midhaul';
  bandwidth: number;
  utilization: number;
  status: 'normal' | 'degraded' | 'down';
  latency: number;
}

export interface CoreElement {
  id: string;
  name: string;
  type: 'MME' | 'SGW' | 'PGW' | 'AMF' | 'UPF' | 'SMF' | 'NSSF' | 'PCF';
  generation: '4G' | '5G';
  status: 'normal' | 'warning' | 'fault';
  load: number;
  region: string;
  connectedSites: number;
}

export const networkTopology = {
  regions: [
    { id: 'GD', name: '广东', center: { lat: 23.13, lng: 113.26 }, siteCount: 12 },
    { id: 'ZJ', name: '浙江', center: { lat: 30.27, lng: 120.15 }, siteCount: 10 },
    { id: 'BJ', name: '北京', center: { lat: 39.90, lng: 116.40 }, siteCount: 8 },
  ],

  sites: [
    // 广东 - 广州
    { id: 'GD-GZ-001', name: '天河体育中心站', type: 'both', lat: 23.1397, lng: 113.3186, status: 'normal', azimuth: [0, 120, 240], height: 35, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['GD-GZ-002', 'GD-GZ-003'], region: 'GD', siteType: 'macro', capacity: 1200, activeUsers: 876 },
    { id: 'GD-GZ-002', name: '珠江新城站', type: 'both', lat: 23.1189, lng: 113.3218, status: 'warning', azimuth: [30, 150, 270], height: 40, vendor: '华为', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['GD-GZ-001', 'GD-GZ-004'], region: 'GD', siteType: 'macro', capacity: 1500, activeUsers: 1423 },
    { id: 'GD-GZ-003', name: '天河城室内站', type: '5G', lat: 23.1378, lng: 113.3260, status: 'normal', azimuth: [0, 90, 180, 270], height: 8, vendor: '中兴', bandConfig: ['n78', 'n41'], neighborList: ['GD-GZ-001'], region: 'GD', siteType: 'indoor', capacity: 600, activeUsers: 312 },
    { id: 'GD-GZ-004', name: '广州塔站', type: 'both', lat: 23.1066, lng: 113.3245, status: 'normal', azimuth: [0, 120, 240], height: 30, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['GD-GZ-002', 'GD-GZ-005'], region: 'GD', siteType: 'macro', capacity: 1800, activeUsers: 1102 },
    { id: 'GD-GZ-005', name: '琶洲会展站', type: '5G', lat: 23.1002, lng: 113.3580, status: 'fault', azimuth: [0, 120, 240], height: 28, vendor: '中兴', bandConfig: ['n78', 'n41', 'n28'], neighborList: ['GD-GZ-004', 'GD-GZ-006'], region: 'GD', siteType: 'macro', capacity: 2000, activeUsers: 45 },
    { id: 'GD-GZ-006', name: '黄埔开发区站', type: 'both', lat: 23.1812, lng: 113.4610, status: 'normal', azimuth: [10, 130, 250], height: 32, vendor: '爱立信', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['GD-GZ-005'], region: 'GD', siteType: 'macro', capacity: 1000, activeUsers: 623 },
    // 广东 - 深圳
    { id: 'GD-SZ-001', name: '深圳湾科技园站', type: 'both', lat: 22.5268, lng: 113.9479, status: 'normal', azimuth: [0, 120, 240], height: 38, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['GD-SZ-002', 'GD-SZ-003'], region: 'GD', siteType: 'macro', capacity: 1600, activeUsers: 1245 },
    { id: 'GD-SZ-002', name: '福田CBD站', type: 'both', lat: 22.5333, lng: 114.0574, status: 'normal', azimuth: [20, 140, 260], height: 42, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['GD-SZ-001', 'GD-SZ-003'], region: 'GD', siteType: 'macro', capacity: 2000, activeUsers: 1678 },
    { id: 'GD-SZ-003', name: '华强北微站', type: '5G', lat: 22.5460, lng: 114.0870, status: 'normal', azimuth: [0, 180], height: 12, vendor: '中兴', bandConfig: ['n78'], neighborList: ['GD-SZ-002'], region: 'GD', siteType: 'micro', capacity: 400, activeUsers: 289 },
    { id: 'GD-SZ-004', name: '南山后海站', type: 'both', lat: 22.5095, lng: 113.9380, status: 'warning', azimuth: [0, 120, 240], height: 36, vendor: '爱立信', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['GD-SZ-001'], region: 'GD', siteType: 'macro', capacity: 1400, activeUsers: 1356 },
    { id: 'GD-SZ-005', name: '龙岗大运站', type: '4G', lat: 22.7200, lng: 114.2350, status: 'normal', azimuth: [0, 120, 240], height: 30, vendor: '中兴', bandConfig: ['B1', 'B3', 'B41'], neighborList: ['GD-SZ-006'], region: 'GD', siteType: 'macro', capacity: 800, activeUsers: 412 },
    { id: 'GD-SZ-006', name: '坂田华为基地站', type: 'both', lat: 22.6530, lng: 114.0620, status: 'normal', azimuth: [0, 120, 240], height: 25, vendor: '华为', bandConfig: ['B1', 'n78', 'n41'], neighborList: ['GD-SZ-005'], region: 'GD', siteType: 'macro', capacity: 1200, activeUsers: 834 },
    // 浙江 - 杭州
    { id: 'ZJ-HZ-001', name: '西湖文化广场站', type: 'both', lat: 30.2782, lng: 120.1680, status: 'normal', azimuth: [0, 120, 240], height: 30, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['ZJ-HZ-002', 'ZJ-HZ-003'], region: 'ZJ', siteType: 'macro', capacity: 1300, activeUsers: 978 },
    { id: 'ZJ-HZ-002', name: '钱江新城站', type: 'both', lat: 30.2460, lng: 120.2120, status: 'normal', azimuth: [15, 135, 255], height: 45, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['ZJ-HZ-001', 'ZJ-HZ-004'], region: 'ZJ', siteType: 'macro', capacity: 1800, activeUsers: 1345 },
    { id: 'ZJ-HZ-003', name: '武林银泰室内站', type: '5G', lat: 30.2750, lng: 120.1710, status: 'normal', azimuth: [0, 90, 180, 270], height: 6, vendor: '中兴', bandConfig: ['n78'], neighborList: ['ZJ-HZ-001'], region: 'ZJ', siteType: 'indoor', capacity: 500, activeUsers: 267 },
    { id: 'ZJ-HZ-004', name: '滨江高新区站', type: 'both', lat: 30.2085, lng: 120.2100, status: 'warning', azimuth: [0, 120, 240], height: 33, vendor: '爱立信', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['ZJ-HZ-002', 'ZJ-HZ-005'], region: 'ZJ', siteType: 'macro', capacity: 1400, activeUsers: 1389 },
    { id: 'ZJ-HZ-005', name: '未来科技城站', type: '5G', lat: 30.2910, lng: 120.0250, status: 'normal', azimuth: [0, 120, 240], height: 28, vendor: '华为', bandConfig: ['n78', 'n41'], neighborList: ['ZJ-HZ-004'], region: 'ZJ', siteType: 'macro', capacity: 1100, activeUsers: 645 },
    // 浙江 - 宁波
    { id: 'ZJ-NB-001', name: '天一广场站', type: 'both', lat: 29.8683, lng: 121.5440, status: 'normal', azimuth: [0, 120, 240], height: 32, vendor: '中兴', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['ZJ-NB-002'], region: 'ZJ', siteType: 'macro', capacity: 1000, activeUsers: 723 },
    { id: 'ZJ-NB-002', name: '东部新城站', type: 'both', lat: 29.8540, lng: 121.6120, status: 'normal', azimuth: [0, 120, 240], height: 35, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['ZJ-NB-001', 'ZJ-NB-003'], region: 'ZJ', siteType: 'macro', capacity: 1200, activeUsers: 856 },
    { id: 'ZJ-NB-003', name: '北仑港区站', type: '4G', lat: 29.9310, lng: 121.8440, status: 'normal', azimuth: [0, 120, 240], height: 40, vendor: '爱立信', bandConfig: ['B1', 'B3', 'B41'], neighborList: ['ZJ-NB-002'], region: 'ZJ', siteType: 'macro', capacity: 600, activeUsers: 234 },
    { id: 'ZJ-NB-004', name: '鄞州万达微站', type: '5G', lat: 29.8350, lng: 121.5560, status: 'normal', azimuth: [0, 180], height: 10, vendor: '中兴', bandConfig: ['n78'], neighborList: ['ZJ-NB-001'], region: 'ZJ', siteType: 'micro', capacity: 350, activeUsers: 198 },
    { id: 'ZJ-NB-005', name: '慈溪开发区站', type: 'both', lat: 30.1700, lng: 121.2660, status: 'normal', azimuth: [0, 120, 240], height: 30, vendor: '华为', bandConfig: ['B1', 'n78'], neighborList: [], region: 'ZJ', siteType: 'macro', capacity: 800, activeUsers: 412 },
    // 北京
    { id: 'BJ-CY-001', name: '国贸CBD站', type: 'both', lat: 39.9087, lng: 116.4605, status: 'normal', azimuth: [0, 120, 240], height: 48, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['BJ-CY-002', 'BJ-DC-001'], region: 'BJ', siteType: 'macro', capacity: 2200, activeUsers: 1876 },
    { id: 'BJ-CY-002', name: '望京SOHO站', type: 'both', lat: 39.9870, lng: 116.4770, status: 'normal', azimuth: [10, 130, 250], height: 38, vendor: '华为', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['BJ-CY-001'], region: 'BJ', siteType: 'macro', capacity: 1600, activeUsers: 1234 },
    { id: 'BJ-DC-001', name: '东城王府井站', type: 'both', lat: 39.9142, lng: 116.4103, status: 'normal', azimuth: [0, 120, 240], height: 25, vendor: '中兴', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['BJ-CY-001', 'BJ-XC-001'], region: 'BJ', siteType: 'macro', capacity: 1800, activeUsers: 1567 },
    { id: 'BJ-XC-001', name: '西单大悦城室内站', type: '5G', lat: 39.9102, lng: 116.3740, status: 'normal', azimuth: [0, 90, 180, 270], height: 8, vendor: '华为', bandConfig: ['n78', 'n41'], neighborList: ['BJ-DC-001'], region: 'BJ', siteType: 'indoor', capacity: 800, activeUsers: 534 },
    { id: 'BJ-HD-001', name: '中关村科技园站', type: 'both', lat: 39.9836, lng: 116.3106, status: 'normal', azimuth: [0, 120, 240], height: 35, vendor: '爱立信', bandConfig: ['B1', 'B3', 'n78', 'n41'], neighborList: ['BJ-HD-002'], region: 'BJ', siteType: 'macro', capacity: 1500, activeUsers: 1123 },
    { id: 'BJ-HD-002', name: '五道口微站', type: '5G', lat: 39.9920, lng: 116.3380, status: 'fault', azimuth: [0, 180], height: 10, vendor: '中兴', bandConfig: ['n78'], neighborList: ['BJ-HD-001'], region: 'BJ', siteType: 'micro', capacity: 400, activeUsers: 12 },
    { id: 'BJ-FT-001', name: '丰台科技园站', type: 'both', lat: 39.8430, lng: 116.2870, status: 'normal', azimuth: [0, 120, 240], height: 32, vendor: '华为', bandConfig: ['B1', 'B3', 'n78'], neighborList: ['BJ-FT-002'], region: 'BJ', siteType: 'macro', capacity: 1000, activeUsers: 678 },
    { id: 'BJ-FT-002', name: '大兴机场站', type: 'both', lat: 39.5098, lng: 116.4107, status: 'normal', azimuth: [0, 60, 120, 180, 240, 300], height: 20, vendor: '华为', bandConfig: ['B1', 'B3', 'n78', 'n41', 'n28'], neighborList: ['BJ-FT-001'], region: 'BJ', siteType: 'macro', capacity: 3000, activeUsers: 2134 },
  ] as Site[],

  connections: [
    { id: 'CONN-GD-001', source: 'GD-GZ-001', target: 'GD-GZ-002', type: 'backhaul', bandwidth: 10000, utilization: 62, status: 'normal', latency: 1.2 },
    { id: 'CONN-GD-002', source: 'GD-GZ-001', target: 'GD-GZ-003', type: 'fronthaul', bandwidth: 25000, utilization: 45, status: 'normal', latency: 0.3 },
    { id: 'CONN-GD-003', source: 'GD-GZ-002', target: 'GD-GZ-004', type: 'backhaul', bandwidth: 10000, utilization: 78, status: 'normal', latency: 1.5 },
    { id: 'CONN-GD-004', source: 'GD-GZ-004', target: 'GD-GZ-005', type: 'backhaul', bandwidth: 10000, utilization: 5, status: 'down', latency: 999 },
    { id: 'CONN-GD-005', source: 'GD-GZ-005', target: 'GD-GZ-006', type: 'backhaul', bandwidth: 10000, utilization: 0, status: 'down', latency: 999 },
    { id: 'CONN-GD-006', source: 'GD-SZ-001', target: 'GD-SZ-002', type: 'backhaul', bandwidth: 10000, utilization: 71, status: 'normal', latency: 1.8 },
    { id: 'CONN-GD-007', source: 'GD-SZ-002', target: 'GD-SZ-003', type: 'fronthaul', bandwidth: 25000, utilization: 55, status: 'normal', latency: 0.2 },
    { id: 'CONN-GD-008', source: 'GD-SZ-001', target: 'GD-SZ-004', type: 'backhaul', bandwidth: 10000, utilization: 85, status: 'degraded', latency: 3.2 },
    { id: 'CONN-GD-009', source: 'GD-SZ-005', target: 'GD-SZ-006', type: 'backhaul', bandwidth: 10000, utilization: 48, status: 'normal', latency: 2.1 },
    { id: 'CONN-ZJ-001', source: 'ZJ-HZ-001', target: 'ZJ-HZ-002', type: 'backhaul', bandwidth: 10000, utilization: 58, status: 'normal', latency: 1.4 },
    { id: 'CONN-ZJ-002', source: 'ZJ-HZ-001', target: 'ZJ-HZ-003', type: 'fronthaul', bandwidth: 25000, utilization: 40, status: 'normal', latency: 0.2 },
    { id: 'CONN-ZJ-003', source: 'ZJ-HZ-002', target: 'ZJ-HZ-004', type: 'backhaul', bandwidth: 10000, utilization: 88, status: 'degraded', latency: 2.8 },
    { id: 'CONN-ZJ-004', source: 'ZJ-HZ-004', target: 'ZJ-HZ-005', type: 'backhaul', bandwidth: 10000, utilization: 42, status: 'normal', latency: 3.5 },
    { id: 'CONN-ZJ-005', source: 'ZJ-NB-001', target: 'ZJ-NB-002', type: 'backhaul', bandwidth: 10000, utilization: 55, status: 'normal', latency: 1.6 },
    { id: 'CONN-ZJ-006', source: 'ZJ-NB-002', target: 'ZJ-NB-003', type: 'backhaul', bandwidth: 10000, utilization: 30, status: 'normal', latency: 4.2 },
    { id: 'CONN-ZJ-007', source: 'ZJ-NB-001', target: 'ZJ-NB-004', type: 'fronthaul', bandwidth: 25000, utilization: 38, status: 'normal', latency: 0.3 },
    { id: 'CONN-BJ-001', source: 'BJ-CY-001', target: 'BJ-CY-002', type: 'backhaul', bandwidth: 10000, utilization: 72, status: 'normal', latency: 1.1 },
    { id: 'CONN-BJ-002', source: 'BJ-CY-001', target: 'BJ-DC-001', type: 'backhaul', bandwidth: 10000, utilization: 68, status: 'normal', latency: 1.3 },
    { id: 'CONN-BJ-003', source: 'BJ-DC-001', target: 'BJ-XC-001', type: 'fronthaul', bandwidth: 25000, utilization: 52, status: 'normal', latency: 0.4 },
    { id: 'CONN-BJ-004', source: 'BJ-HD-001', target: 'BJ-HD-002', type: 'fronthaul', bandwidth: 25000, utilization: 3, status: 'degraded', latency: 15.6 },
    { id: 'CONN-BJ-005', source: 'BJ-FT-001', target: 'BJ-FT-002', type: 'backhaul', bandwidth: 10000, utilization: 65, status: 'normal', latency: 5.2 },
  ] as Connection[],

  coreNetwork: [
    { id: 'CORE-GD-MME-01', name: '广东MME-01', type: 'MME', generation: '4G', status: 'normal', load: 62, region: 'GD', connectedSites: 12 },
    { id: 'CORE-GD-SGW-01', name: '广东SGW-01', type: 'SGW', generation: '4G', status: 'normal', load: 58, region: 'GD', connectedSites: 12 },
    { id: 'CORE-GD-PGW-01', name: '广东PGW-01', type: 'PGW', generation: '4G', status: 'normal', load: 55, region: 'GD', connectedSites: 12 },
    { id: 'CORE-GD-AMF-01', name: '广东AMF-01', type: 'AMF', generation: '5G', status: 'normal', load: 48, region: 'GD', connectedSites: 10 },
    { id: 'CORE-GD-UPF-01', name: '广东UPF-01', type: 'UPF', generation: '5G', status: 'normal', load: 52, region: 'GD', connectedSites: 10 },
    { id: 'CORE-ZJ-MME-01', name: '浙江MME-01', type: 'MME', generation: '4G', status: 'normal', load: 45, region: 'ZJ', connectedSites: 10 },
    { id: 'CORE-ZJ-SGW-01', name: '浙江SGW-01', type: 'SGW', generation: '4G', status: 'normal', load: 42, region: 'ZJ', connectedSites: 10 },
    { id: 'CORE-ZJ-AMF-01', name: '浙江AMF-01', type: 'AMF', generation: '5G', status: 'normal', load: 51, region: 'ZJ', connectedSites: 8 },
    { id: 'CORE-ZJ-UPF-01', name: '浙江UPF-01', type: 'UPF', generation: '5G', status: 'warning', load: 82, region: 'ZJ', connectedSites: 8 },
    { id: 'CORE-ZJ-SMF-01', name: '浙江SMF-01', type: 'SMF', generation: '5G', status: 'normal', load: 38, region: 'ZJ', connectedSites: 8 },
    { id: 'CORE-BJ-MME-01', name: '北京MME-01', type: 'MME', generation: '4G', status: 'normal', load: 71, region: 'BJ', connectedSites: 8 },
    { id: 'CORE-BJ-AMF-01', name: '北京AMF-01', type: 'AMF', generation: '5G', status: 'normal', load: 66, region: 'BJ', connectedSites: 7 },
    { id: 'CORE-BJ-UPF-01', name: '北京UPF-01', type: 'UPF', generation: '5G', status: 'normal', load: 59, region: 'BJ', connectedSites: 7 },
    { id: 'CORE-BJ-NSSF-01', name: '北京NSSF-01', type: 'NSSF', generation: '5G', status: 'normal', load: 22, region: 'BJ', connectedSites: 7 },
    { id: 'CORE-BJ-PCF-01', name: '北京PCF-01', type: 'PCF', generation: '5G', status: 'normal', load: 34, region: 'BJ', connectedSites: 7 },
  ] as CoreElement[],
};
