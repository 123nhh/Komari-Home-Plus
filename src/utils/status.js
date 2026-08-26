// 实时状态归一化：兼容嵌套（cpu:{usage} / network:{up,down,totalUp,totalDown}）
// 与扁平（cpu / net_in / net_total_up）两种后端形态，统一输出扁平模型。
function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function bool(v) {
  return v === true || v === 1 || v === 'true'
}

export function normalizeStatus(raw) {
  if (!raw || typeof raw !== 'object') return raw || {}

  const cpu = raw.cpu
  const isNested = !!cpu && typeof cpu === 'object' && cpu !== null && 'usage' in cpu

  // 在线判定：显式 online 优先；未提供时只要记录有内容即视为在线
  const online = raw.online !== undefined ? bool(raw.online) : Object.keys(raw).length > 0

  if (isNested) {
    const net = raw.network || {}
    const load = raw.load || {}
    const conn = raw.connections || {}
    return {
      online,
      cpu: num(cpu.usage),
      ram: num(raw.ram?.used),
      ram_total: num(raw.ram?.total),
      swap: num(raw.swap?.used),
      swap_total: num(raw.swap?.total),
      disk: num(raw.disk?.used),
      disk_total: num(raw.disk?.total),
      net_in: num(net.down),
      net_out: num(net.up),
      traffic_in: num(net.totalDown),
      traffic_out: num(net.totalUp),
      connections: num(conn.tcp),
      connections_udp: num(conn.udp),
      load: num(load.load1),
      load5: num(load.load5),
      load15: num(load.load15),
      uptime: num(raw.uptime),
      process: num(raw.process),
      updated_at: raw.updated_at ?? raw.time ?? null
    }
  }

  return {
    online,
    cpu: num(raw.cpu),
    ram: num(raw.ram),
    ram_total: num(raw.ram_total),
    swap: num(raw.swap),
    swap_total: num(raw.swap_total),
    disk: num(raw.disk),
    disk_total: num(raw.disk_total),
    net_in: num(raw.net_in),
    net_out: num(raw.net_out),
    traffic_in: num(raw.net_total_down),
    traffic_out: num(raw.net_total_up),
    connections: num(raw.connections),
    connections_udp: num(raw.connections_udp),
    load: num(raw.load),
    load5: num(raw.load5),
    load15: num(raw.load15),
    uptime: num(raw.uptime),
    process: num(raw.process),
    updated_at: raw.updated_at ?? raw.time ?? null
  }
}