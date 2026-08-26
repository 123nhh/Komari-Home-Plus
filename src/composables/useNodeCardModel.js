// 节点卡片数据模型：静态 node + 实时 live 合并派生
// 返回 reactive 对象（自动解包内层 computed ref），模板里可直接 model.xxx 取值
import { computed, reactive } from 'vue'
import {
  formatBytes,
  formatUptime,
  expireMeta,
  priceMeta,
  monthlyPrice,
  parseTags
} from '@/utils/format'

// 保留 monthlyPrice 导出引用（供排序使用）
export { monthlyPrice }

function pickNum(obj, keys) {
  if (!obj) return 0
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return Number(obj[k]) || 0
  }
  return 0
}

// 累计流量优先取实时状态（后端 network.totalUp/totalDown 或 net_total_up/down），
// 状态里没有（如离线节点）再回退到节点静态字段。
function pickTraffic(live, node, keys) {
  for (const k of keys) {
    if (live && live[k] !== undefined && live[k] !== null) return Number(live[k]) || 0
  }
  for (const k of keys) {
    if (node && node[k] !== undefined && node[k] !== null) return Number(node[k]) || 0
  }
  return 0
}

export function useNodeCardModel(node, live) {
  return reactive({
    online: computed(() => (live.value ? live.value.online === true : false)),
    cpuPct: computed(() => (live.value ? Math.min(100, Math.round(live.value.cpu ?? 0)) : 0)),
    memUsed: computed(() => live.value?.ram ?? 0),
    memTotal: computed(() => live.value?.ram_total ?? 0),
    memPct: computed(() => {
      const total = live.value?.ram_total || 0
      return total ? Math.min(100, Math.round(((live.value.ram ?? 0) / total) * 100)) : 0
    }),
    diskUsed: computed(() => live.value?.disk ?? 0),
    diskTotal: computed(() => live.value?.disk_total ?? 0),
    diskPct: computed(() => {
      const total = live.value?.disk_total || 0
      return total ? Math.min(100, Math.round(((live.value.disk ?? 0) / total) * 100)) : 0
    }),
    load: computed(() => live.value?.load ?? 0),
    cores: computed(() => node.value?.cpu_cores || 4),
    loadFraction: computed(() => {
      const load = live.value?.load ?? 0
      const cores = node.value?.cpu_cores || 4
      return Math.max(0, Math.min(1, load / Math.max(1, cores)))
    }),
    netIn: computed(() => live.value?.net_in ?? 0),
    netOut: computed(() => live.value?.net_out ?? 0),
    uptime: computed(() => (live.value ? formatUptime(live.value.uptime) : '-')),
    hasLive: computed(() => !!live.value),

    trafficUp: computed(() =>
      pickTraffic(live.value, node.value, ['traffic_out', 'trafficUp', 'traffic_up'])
    ),
    trafficDown: computed(() =>
      pickTraffic(live.value, node.value, ['traffic_in', 'trafficDown', 'traffic_down'])
    ),
    trafficLimit: computed(() => pickNum(node.value, ['trafficLimit', 'traffic_limit'])),
    trafficLimitType: computed(() =>
      node.value?.trafficLimitType || node.value?.traffic_limit_type || 'sum'
    ),

    quota: computed(() => {
      const limit = pickNum(node.value, ['trafficLimit', 'traffic_limit'])
      if (!limit || limit <= 0) return null
      const up = pickNum(node.value, ['trafficUp', 'traffic_up'])
      const down = pickNum(node.value, ['trafficDown', 'traffic_down'])
      let used = up + down
      const type = node.value?.trafficLimitType || node.value?.traffic_limit_type || 'sum'
      if (type === 'up') used = up
      else if (type === 'down') used = down
      else if (type === 'max') used = Math.max(up, down)
      else if (type === 'min') used = Math.min(up, down)
      const fraction = Math.max(0, Math.min(1, used / limit))
      const remaining = Math.max(0, limit - used)
      const typeLabel =
        type === 'up' ? '上行' : type === 'down' ? '下行' : type === 'max' ? '取大' : type === 'min' ? '取小' : '合计'
      return {
        fraction,
        remainingLabel: formatBytes(remaining),
        detail: `${formatBytes(used)} / ${formatBytes(limit)}`,
        typeLabel
      }
    }),

    expire: computed(() => expireMeta(node.value)),
    price: computed(() => priceMeta(node.value)),
    monthly: computed(() => monthlyPrice(node.value)),
    tags: computed(() => parseTags(node.value)),
    subtitle: computed(() => {
      const parts = []
      if (node.value?.group) parts.push(node.value.group)
      if (node.value?.region) parts.push(node.value.region)
      return parts.join(' · ')
    }),
    region: computed(() => node.value?.region || ''),
    os: computed(() => node.value?.os || ''),
    ipv4: computed(() => node.value?.ipv4 || ''),
    ipv6: computed(() => node.value?.ipv6 || ''),
    name: computed(() => node.value?.name || '未知节点')
  })
}