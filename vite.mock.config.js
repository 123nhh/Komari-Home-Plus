// 开发用 mock 配置：拦截 /api/rpc2（POST + WS）返回模拟数据
// 用法：npx vite --config vite.mock.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const LINUX_DO_LOGO = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZlcnNpb249IjEuMiIgYmFzZVByb2ZpbGU9InRpbnktcHMiIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTIwIDEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TElOVVggRE8gTG9nbzwvdGl0bGU+PGNsaXBQYXRoIGlkPSJhIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI0NyIvPjwvY2xpcFBhdGg+PGNpcmNsZSBmaWxsPSIjZjBmMGYwIiBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz48cmVjdCBmaWxsPSIjMWMxYzFlIiBjbGlwLXBhdGg9InVybCgjYSkiIHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIzMCIvPjxyZWN0IGZpbGw9IiNmMGYwZjAiIGNsaXAtcGF0aD0idXJsKCNhKSIgeD0iMTAiIHk9IjQwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIi8+PHJlY3QgZmlsbD0iI2ZmYjAwMyIgY2xpcC1wYXRoPSJ1cmwoI2EpIiB4PSIxMCIgeT0iODAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiLz48L3N2Zz4='

const themeSettings = {
  displayName: '123nhh',
  location: '上海',
  bio: '这是一段个人简介',
  enableHomeSites: true,
  enableHitokoto: false,
  enableClock: false,
  enableRssFeed: false,
  enableCustomHtml: false,
  socialLinks: [
    { name: 'Linux.do', icon: LINUX_DO_LOGO, url: 'https://linux.do/u/123nhh/summary' },
    { name: 'NodeSeek', icon: 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png', url: 'https://www.nodeseek.com/space/48457' },
    { name: 'Telegram', icon: 'telegram', url: 'https://t.me/nhh_awa' },
    { name: 'GitHub', icon: 'github', url: 'https://github.com/123nhh' }
  ],
  avatarUrl: '',
  homeSites: [],
  webSites: []
}

const GB = 1024 ** 3
const MB = 1024 ** 2

const nodes = [
  {
    uuid: '11111111-1111-1111-1111-111111111111',
    name: '东京主力',
    os: 'Ubuntu 22.04',
    region: '日本 · 东京',
    group: '主力',
    tags: 'cn2;gia',
    price: 12.5,
    currency: '￥',
    billing_cycle: 30,
    expired_at: '2026-09-01',
    weight: 1,
    cpu_cores: 4,
    cpu_name: 'AMD EPYC 7B13',
    cpu_physical_cores: 4,
    arch: 'x86_64',
    virtualization: 'KVM',
    ipv4: '1.2.3.4',
    ipv6: '2001:db8::1',
    trafficUp: 50 * GB,
    trafficDown: 100 * GB,
    trafficLimit: 1024 * GB,
    trafficLimitType: 'sum'
  },
  {
    uuid: '22222222-2222-2222-2222-222222222222',
    name: '洛杉矶节点',
    os: 'Debian 12',
    region: '美国 · 洛杉矶',
    group: '海外',
    tags: 'cn2',
    price: 0,
    currency: '￥',
    billing_cycle: 30,
    expired_at: '',
    weight: 2,
    cpu_cores: 2,
    cpu_name: 'Intel Xeon E5-2680',
    cpu_physical_cores: 2,
    arch: 'x86_64',
    virtualization: 'KVM',
    ipv4: '5.6.7.8',
    ipv6: '',
    trafficUp: 12 * GB,
    trafficDown: 30 * GB,
    trafficLimit: 512 * GB,
    trafficLimitType: 'up'
  },
  {
    uuid: '33333333-3333-3333-3333-333333333333',
    name: '离线测试机',
    os: 'CentOS 7',
    region: '香港',
    group: '',
    tags: '',
    price: 3.2,
    currency: '￥',
    billing_cycle: 30,
    expired_at: '2026-07-01',
    weight: 3,
    cpu_cores: 1,
    cpu_name: 'Intel Xeon',
    arch: 'x86_64',
    virtualization: 'KVM',
    ipv4: '',
    ipv6: '',
    trafficUp: 0,
    trafficDown: 0,
    trafficLimit: 100 * GB,
    trafficLimitType: 'sum'
  }
]

function statusFor(i, ts) {
  const isOnline = i < 2
  // 累计流量：在线节点在静态基线基础上随时间缓慢增长
  const growth = (ts % 7200) * 1024 * 64
  return {
    online: isOnline,
    cpu: { usage: i === 0 ? 35.5 : 12.2 },
    ram: { used: (i === 0 ? 4 : 2) * GB, total: (i === 0 ? 8 : 4) * GB },
    swap: { used: 0, total: 0 },
    load: { load1: i === 0 ? 1.2 : 0.4, load5: 1.1, load15: 0.9 },
    disk: { used: (i === 0 ? 40 : 20) * GB, total: (i === 0 ? 100 : 60) * GB },
    network: {
      up: (i === 0 ? 0.8 : 0.1) * MB,
      down: (i === 0 ? 2.5 : 0.3) * MB,
      totalUp: nodes[i].trafficUp + (isOnline ? growth : 0),
      totalDown: nodes[i].trafficDown + (isOnline ? growth * 2 : 0)
    },
    connections: { tcp: 100 + i, udp: 5 + i },
    uptime: 86400 * 5 + 3600 * 3 + ts % 60,
    process: 120 + i * 10,
    updated_at: new Date(ts).toISOString()
  }
}

function statusMap() {
  const now = Date.now()
  return Object.fromEntries(nodes.map((n, i) => [n.uuid, statusFor(i, now)]))
}

// 生成最近 1 小时的 ping 记录（每 150s 一条）
function pingRecords(seed) {
  const records = []
  const now = Date.now()
  for (let i = 0; i < 24; i++) {
    const t = now - (23 - i) * 150000
    const v = 25 + ((seed * 7 + i * 13) % 90)
    records.push({ value: v, created_at: new Date(t).toISOString() })
  }
  return { records }
}

// 生成最近 6 小时的历史状态记录（每 60s 一条，嵌套结构）
function recentRecords(seed) {
  const records = []
  const now = Date.now()
  const base = statusFor(seed % 2, now)
  for (let i = 0; i < 6 * 60; i++) {
    const t = now - (6 * 3600 - i * 60) * 1000
    const wave = Math.sin(i / 18) * 15 + (seed * 5 + i % 7) * 2
    const growth = i * 60 * 1024 * 64
    records.push({
      updated_at: new Date(t).toISOString(),
      online: seed < 2,
      cpu: { usage: Math.max(5, Math.min(95, 32 + wave)) },
      ram: { used: base.ram.used + (i % 20) * 30 * 1024 * 1024, total: base.ram.total },
      swap: { used: 0, total: 0 },
      load: {
        load1: +(base.load.load1 + wave / 20).toFixed(2),
        load5: +(base.load.load1 + 0.1).toFixed(2),
        load15: +base.load.load1.toFixed(2)
      },
      disk: { used: base.disk.used + i * 1024 * 1024, total: base.disk.total },
      network: {
        up: base.network.up * (0.5 + (i % 5) / 4),
        down: base.network.down * (0.5 + (i % 3) / 2),
        totalUp: nodes[seed % 2].trafficUp + growth,
        totalDown: nodes[seed % 2].trafficDown + growth * 2
      },
      connections: { tcp: 90 + (i % 30), udp: 3 + (i % 6) },
      uptime: 86400 * 5 + 3600 * 3 + i * 60,
      process: 115 + (i % 15)
    })
  }
  return { records }
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'mock-rpc',
      configureServer(server) {
        server.middlewares.use('/api/rpc2', (req, res) => {
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            let id = 1
            let method = ''
            let params = {}
            try {
              const parsed = JSON.parse(body)
              id = parsed.id
              method = parsed.method
              params = parsed.params || {}
            } catch {}

            let result
            switch (method) {
              case 'public:getPublicSettings':
                result = { theme_settings: themeSettings, sitename: 'Komari 测试站' }
                break
              case 'common:getNodes':
                result = params.uuid ? nodes.find(n => n.uuid === params.uuid) || null : nodes
                break
              case 'common:getNodeRecentStatus': {
                const uuidStr = String(params.uuid || '')
                const idx = nodes.findIndex(n => n.uuid === uuidStr)
                result = idx >= 0 ? recentRecords(idx) : { records: [] }
                break
              }
              case 'common:getRecords': {
                const uuidStr = String(params.uuid || '')
                const idx = nodes.findIndex(n => n.uuid === uuidStr)
                const data = idx >= 0 ? recentRecords(idx) : { records: [] }
                result = { count: data.records.length, records: idx >= 0 ? { [uuidStr]: data.records } : {} }
                break
              }
              case 'public:getPublicPingTasks':
                result = [
                  { id: 1, name: 'Cloudflare 全球', clients: [nodes[0].uuid, nodes[1].uuid] },
                  { id: 2, name: '本地监测', clients: [nodes[0].uuid] }
                ]
                break
              case 'public:getPingRecords': {
                const uuid = String(params.uuid || '')
                const idx = nodes.findIndex(n => n.uuid === uuid)
                result = pingRecords(Math.max(0, idx))
                break
              }
              case 'public:getVersion':
                result = { version: '1.3.0-mock' }
                break
              case 'public:getMe':
                result = { logged_in: true }
                break
              default:
                result = null
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ jsonrpc: '2.0', id, result }))
          })
        })

        // WS 通道：响应 common:getNodesLatestStatus
        server.httpServer?.on('upgrade', (req, socket, head) => {
          if (!req.url || !req.url.startsWith('/api/rpc2')) return
          import('ws').then(({ WebSocketServer }) => {
            const wss = new WebSocketServer({ noServer: true })
            wss.handleUpgrade(req, socket, head, ws => {
              ws.on('message', msg => {
                let parsed
                try { parsed = JSON.parse(msg.toString()) } catch { return }
                if (parsed.method === 'common:getNodesLatestStatus') {
                  ws.send(JSON.stringify({ jsonrpc: '2.0', id: parsed.id, result: statusMap() }))
                }
              })
            })
          })
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})