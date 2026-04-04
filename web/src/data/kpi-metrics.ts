// KPI指标时序数据 - IOE智能运营引擎演示数据
// Time-series KPI data for charts (24 hours, hourly granularity)
// 基准时间: 2026-03-31 00:00 至 2026-03-31 23:00

export interface KpiDataPoint {
  time: string;
  value: number;
}

export interface KpiSeries {
  name: string;
  unit: string;
  data: KpiDataPoint[];
  threshold?: { warning: number; critical: number };
}

const hours = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

function makeData(values: number[]): KpiDataPoint[] {
  return hours.map((time, i) => ({ time, value: values[i] }));
}

export const kpiMetrics = {
  networkAvailability: {
    name: '网络可用率',
    unit: '%',
    data: makeData([
      99.98, 99.99, 99.99, 99.99, 99.99, 99.98,
      99.97, 99.95, 99.93, 99.91, 99.89, 99.85,
      99.82, 99.87, 99.91, 99.93, 99.90, 99.88,
      99.85, 99.90, 99.94, 99.96, 99.97, 99.98,
    ]),
    threshold: { warning: 99.9, critical: 99.5 },
  } as KpiSeries,

  callDropRate: {
    name: '掉话率',
    unit: '%',
    data: makeData([
      0.32, 0.28, 0.25, 0.22, 0.20, 0.23,
      0.35, 0.48, 0.62, 0.75, 0.81, 0.92,
      1.05, 0.88, 0.72, 0.65, 0.71, 0.83,
      0.95, 0.78, 0.55, 0.42, 0.38, 0.35,
    ]),
    threshold: { warning: 0.8, critical: 1.5 },
  } as KpiSeries,

  handoverSuccessRate: {
    name: '切换成功率',
    unit: '%',
    data: makeData([
      99.45, 99.52, 99.58, 99.62, 99.65, 99.55,
      99.38, 99.22, 99.10, 98.95, 98.88, 98.75,
      98.68, 98.82, 99.02, 99.15, 99.05, 98.92,
      98.85, 99.05, 99.25, 99.35, 99.42, 99.48,
    ]),
    threshold: { warning: 99.0, critical: 98.0 },
  } as KpiSeries,

  averageThroughputDL: {
    name: '平均下行吞吐量',
    unit: 'Mbps',
    data: makeData([
      285.3, 312.5, 340.2, 355.8, 362.1, 348.6,
      298.4, 245.6, 198.3, 175.2, 162.8, 148.5,
      135.2, 152.6, 178.4, 195.3, 182.1, 165.8,
      152.3, 185.6, 225.4, 262.3, 278.5, 292.1,
    ]),
    threshold: { warning: 150, critical: 100 },
  } as KpiSeries,

  averageThroughputUL: {
    name: '平均上行吞吐量',
    unit: 'Mbps',
    data: makeData([
      42.5, 48.2, 52.8, 55.3, 56.8, 53.2,
      45.6, 38.2, 32.5, 28.6, 26.2, 24.1,
      22.8, 25.3, 29.8, 32.6, 30.2, 27.8,
      25.5, 30.2, 36.8, 40.5, 42.1, 43.8,
    ]),
    threshold: { warning: 25, critical: 15 },
  } as KpiSeries,

  activeUsers: {
    name: '在线用户数',
    unit: '万',
    data: makeData([
      12.3, 8.5, 5.2, 3.8, 3.2, 4.5,
      15.6, 28.3, 42.5, 48.6, 52.3, 55.8,
      58.2, 56.5, 53.8, 50.2, 52.6, 55.3,
      58.8, 52.3, 42.5, 35.6, 25.8, 18.2,
    ]),
  } as KpiSeries,

  trafficVolume: {
    name: '流量',
    unit: 'TB',
    data: makeData([
      2.8, 1.9, 1.2, 0.8, 0.7, 1.0,
      3.5, 6.2, 9.8, 11.5, 12.8, 13.5,
      14.2, 13.8, 12.5, 11.2, 12.0, 13.2,
      14.5, 12.8, 9.5, 7.2, 5.5, 3.8,
    ]),
  } as KpiSeries,

  averageLatency: {
    name: '平均时延',
    unit: 'ms',
    data: makeData([
      8.2, 7.5, 6.8, 6.2, 5.8, 6.5,
      9.2, 12.5, 15.8, 18.2, 19.5, 21.2,
      22.8, 20.5, 17.8, 15.2, 16.5, 18.8,
      20.2, 17.5, 13.8, 11.2, 9.8, 8.5,
    ]),
    threshold: { warning: 20, critical: 30 },
  } as KpiSeries,

  prbUtilization: {
    name: 'PRB利用率',
    unit: '%',
    data: makeData([
      25.3, 18.2, 12.5, 8.8, 7.2, 10.5,
      32.5, 52.8, 68.5, 75.2, 78.8, 82.5,
      85.2, 82.8, 78.5, 72.3, 75.8, 80.2,
      83.5, 76.2, 62.5, 48.3, 38.5, 28.6,
    ]),
    threshold: { warning: 80, critical: 90 },
  } as KpiSeries,

  userExperienceScore: {
    name: '用户体验评分',
    unit: '分',
    data: makeData([
      8.8, 9.0, 9.2, 9.3, 9.4, 9.2,
      8.6, 8.0, 7.5, 7.2, 7.0, 6.8,
      6.5, 6.9, 7.3, 7.6, 7.4, 7.1,
      6.8, 7.3, 7.8, 8.2, 8.5, 8.7,
    ]),
    threshold: { warning: 7.0, critical: 5.0 },
  } as KpiSeries,
};

// 分区域KPI汇总
export const regionalKpiSummary = [
  {
    region: '广东',
    availability: 99.92,
    avgThroughputDL: 215.6,
    avgLatency: 14.3,
    activeUsers: 38.5,
    trafficVolume: 82.3,
    prbUtilization: 68.5,
    experienceScore: 7.6,
    alarmCount: { critical: 1, major: 3, minor: 5 },
  },
  {
    region: '浙江',
    availability: 99.95,
    avgThroughputDL: 238.2,
    avgLatency: 12.8,
    activeUsers: 28.2,
    trafficVolume: 58.6,
    prbUtilization: 62.3,
    experienceScore: 7.9,
    alarmCount: { critical: 0, major: 2, minor: 4 },
  },
  {
    region: '北京',
    availability: 99.88,
    avgThroughputDL: 202.5,
    avgLatency: 15.6,
    activeUsers: 42.8,
    trafficVolume: 95.2,
    prbUtilization: 72.8,
    experienceScore: 7.4,
    alarmCount: { critical: 1, major: 2, minor: 3 },
  },
];

// 各小时各区域下行吞吐量对比数据
export const regionalThroughputComparison = hours.map((time, i) => ({
  time,
  guangdong: [
    280, 305, 332, 348, 355, 340, 290, 238, 192, 168, 155, 142,
    128, 145, 172, 188, 175, 158, 145, 178, 218, 255, 272, 285,
  ][i],
  zhejiang: [
    295, 322, 348, 365, 372, 358, 308, 255, 205, 182, 170, 155,
    142, 160, 185, 202, 190, 172, 160, 192, 232, 270, 285, 298,
  ][i],
  beijing: [
    275, 298, 325, 342, 350, 335, 285, 232, 188, 165, 152, 138,
    125, 142, 168, 185, 172, 155, 142, 175, 215, 252, 268, 282,
  ][i],
}));

// 5G/4G流量占比趋势
export const techTrafficSplit = hours.map((time, i) => ({
  time,
  fiveG: [
    52, 55, 58, 60, 62, 58, 48, 42, 38, 36, 35, 33,
    32, 34, 36, 38, 37, 35, 34, 37, 42, 46, 48, 50,
  ][i],
  fourG: [
    48, 45, 42, 40, 38, 42, 52, 58, 62, 64, 65, 67,
    68, 66, 64, 62, 63, 65, 66, 63, 58, 54, 52, 50,
  ][i],
}));

// Top 10 高负荷小区
export const topLoadedCells = [
  { siteId: 'GD-GZ-002', cellId: 'GD-GZ-002A', name: '珠江新城站-A扇区', prbUtil: 92.3, users: 523, throughput: 125.6 },
  { siteId: 'BJ-CY-001', cellId: 'BJ-CY-001B', name: '国贸CBD站-B扇区', prbUtil: 90.8, users: 612, throughput: 118.2 },
  { siteId: 'GD-SZ-002', cellId: 'GD-SZ-002A', name: '福田CBD站-A扇区', prbUtil: 89.5, users: 548, throughput: 122.8 },
  { siteId: 'ZJ-HZ-004', cellId: 'ZJ-HZ-004C', name: '滨江高新区站-C扇区', prbUtil: 88.2, users: 478, throughput: 115.3 },
  { siteId: 'BJ-DC-001', cellId: 'BJ-DC-001A', name: '东城王府井站-A扇区', prbUtil: 87.6, users: 502, throughput: 112.5 },
  { siteId: 'GD-SZ-004', cellId: 'GD-SZ-004B', name: '南山后海站-B扇区', prbUtil: 86.9, users: 456, throughput: 108.6 },
  { siteId: 'ZJ-HZ-002', cellId: 'ZJ-HZ-002A', name: '钱江新城站-A扇区', prbUtil: 85.3, users: 435, throughput: 132.4 },
  { siteId: 'BJ-FT-002', cellId: 'BJ-FT-002D', name: '大兴机场站-D扇区', prbUtil: 84.8, users: 389, throughput: 145.2 },
  { siteId: 'GD-GZ-004', cellId: 'GD-GZ-004A', name: '广州塔站-A扇区', prbUtil: 83.5, users: 367, throughput: 138.6 },
  { siteId: 'BJ-CY-002', cellId: 'BJ-CY-002C', name: '望京SOHO站-C扇区', prbUtil: 82.1, users: 398, throughput: 105.8 },
];
