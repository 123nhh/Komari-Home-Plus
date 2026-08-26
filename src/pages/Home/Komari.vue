<template>
  <div class="komari-page">
    <div class="k-head">
      <div class="k-title">
        <i class="bi bi-cpu-fill"></i>
        <span>服务器监控</span>
        <span class="k-conn" :class="wsConnected ? 'on' : 'off'"></span>
      </div>
      <div class="k-toolbar">
        <div class="k-sort">
          <i class="bi bi-sort-down"></i>
          <select v-model="sortField" title="排序方式">
            <option v-for="f in SORT_FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <button
            class="k-sort-dir"
            :title="sortDir === 'asc' ? '升序' : '降序'"
            @click="toggleDir"
          >
            <i :class="sortDir === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
          </button>
        </div>

        <div class="k-view" role="group" title="卡片视图">
          <button
            v-for="v in viewModes"
            :key="v.key"
            class="k-view-btn"
            :class="{ active: mode === v.key }"
            :title="v.label"
            @click="setMode(v.key)"
          >
            <i :class="v.icon"></i>
          </button>
        </div>

        <div class="k-appearance" role="group" title="外观">
          <button
            v-for="a in APPEARANCE_OPTIONS"
            :key="a.key"
            class="k-appearance-btn"
            :class="{ active: appearance === a.key }"
            :title="a.label"
            @click="setAppearance(a.key)"
          >
            <i :class="a.icon"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="k-overview">
      <div class="k-overview-item">
        <span class="k-overview-label"><i class="bi bi-broadcast"></i>在线节点</span>
        <span class="k-overview-value">
          {{ overview.online }}<small>/ {{ overview.total }}</small>
        </span>
      </div>
      <div class="k-overview-item">
        <span class="k-overview-label"><i class="bi bi-arrow-down-up"></i>实时带宽</span>
        <span class="k-overview-value" style="color: var(--k-up)">{{ overview.bandwidth }}</span>
      </div>
      <div class="k-overview-item">
        <span class="k-overview-label"><i class="bi bi-database"></i>累计流量</span>
        <span class="k-overview-value" style="color: var(--k-memory)">{{ overview.traffic }}</span>
      </div>
      <div class="k-overview-item">
        <span class="k-overview-label"><i class="bi bi-currency-yen"></i>资产概览</span>
        <span class="k-overview-value" style="color: var(--k-warn)">{{ assetValue }}</span>
        <span class="k-overview-note" v-if="assetNote">{{ assetNote }}</span>
      </div>
    </div>

    <div v-if="!nodes.length" class="k-empty">
      <i class="bi bi-inbox"></i>
      <p>暂无服务器数据</p>
    </div>

    <NodeListView
      v-else-if="mode === 'list'"
      :nodes="renderedNodes"
      :live="liveData"
      :ping="pingMap"
    />

    <div v-else class="k-grid" :style="{ '--k-grid-min': gridMin + 'px' }">
      <template v-if="mode === 'compact'">
        <CompactNodeCard
          v-for="n in renderedNodes"
          :key="n.uuid"
          :node="n"
          :live="liveData[n.uuid] || null"
          :ping="pingMap[n.uuid] || { lastValue: null, loss: null, buckets: [] }"
        />
      </template>
      <template v-else-if="mode === 'mini'">
        <MiniNodeCard
          v-for="n in renderedNodes"
          :key="n.uuid"
          :node="n"
          :live="liveData[n.uuid] || null"
        />
      </template>
      <NodeCard
        v-else
        v-for="n in renderedNodes"
        :key="n.uuid"
        :node="n"
        :live="liveData[n.uuid] || null"
        :trend="trends[n.uuid] || { up: [], down: [] }"
        :ping="pingMap[n.uuid] || { lastValue: null, loss: null, buckets: [] }"
      />
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { rpcCall, createRpcSocket } from '@/utils/rpc'
import { useAppearance } from '@/composables/useAppearance'
import { useViewMode } from '@/composables/useViewMode'
import { useThemeSettings } from '@/composables/useThemeSettings'
import { buildPingModel } from '@/utils/pingBuckets'
import { normalizeStatus } from '@/utils/status'
import { getExchangeRates, calculateCostSummary, formatCnyMoney } from '@/utils/cost'
import { formatBytes, monthlyPrice } from '@/utils/format'
import NodeCard from '@/components/node/NodeCard.vue'
import CompactNodeCard from '@/components/node/CompactNodeCard.vue'
import MiniNodeCard from '@/components/node/MiniNodeCard.vue'
import NodeListView from '@/components/node/NodeListView.vue'

const nodes = ref([])
const liveData = reactive({})
const trends = reactive({})
const pingMap = reactive({})
const wsConnected = ref(false)

const { mode, setMode } = useViewMode()
const { appearance, setAppearance } = useAppearance()
const { settings } = useThemeSettings()

const APPEARANCE_OPTIONS = [
  { key: 'light', label: '浅色', icon: 'bi-sun' },
  { key: 'system', label: '跟随系统', icon: 'bi-display' },
  { key: 'dark', label: '深色', icon: 'bi-moon' }
]

const viewModes = [
  { key: 'large', label: '大视图', icon: 'bi-layout-three-columns' },
  { key: 'compact', label: '小视图', icon: 'bi-grid-1x2-fill' },
  { key: 'mini', label: '迷你视图', icon: 'bi-grid-3x3-gap-fill' },
  { key: 'list', label: '列表视图', icon: 'bi-list-ul' }
]

const GRID_MIN = { large: 360, compact: 330, mini: 240 }
const gridMin = computed(() => GRID_MIN[mode.value] || 360)

// ===== 排序 =====
const SORT_FIELDS = [
  { key: 'default', label: '默认', dir: 'asc' },
  { key: 'name', label: '名称', dir: 'asc' },
  { key: 'speed', label: '实时网速', dir: 'desc' },
  { key: 'traffic', label: '累计流量', dir: 'desc' },
  { key: 'price', label: '价格', dir: 'desc' }
]
const sortField = ref('default')
const sortDir = ref('asc')

function setSort(field) {
  const f = SORT_FIELDS.find(x => x.key === field)
  sortField.value = field
  sortDir.value = f ? f.dir : 'asc'
}
watch(sortField, v => setSort(v))

function toggleDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

function isOnline(uuid) {
  const d = liveData[uuid]
  return d ? d.online === true : false
}

function sortKey(node) {
  const live = liveData[node.uuid]
  const online = live ? live.online === true : false
  let v
  switch (sortField.value) {
    case 'name':
      v = (node.name || '').toLowerCase()
      break
    case 'speed':
      v = online ? (live.net_in ?? 0) + (live.net_out ?? 0) : -1
      break
    case 'traffic':
      v = (node.trafficUp ?? node.traffic_up ?? 0) + (node.trafficDown ?? node.traffic_down ?? 0)
      break
    case 'price':
      v = monthlyPrice(node)
      break
    default:
      v = node.weight ?? 0
  }
  return { online, v }
}

const orderedNodes = computed(() => {
  const arr = [...nodes.value].map(node => ({ node, ...sortKey(node) }))
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1
    if (typeof a.v === 'string' && typeof b.v === 'string') {
      const c = a.v.localeCompare(b.v, 'zh-CN')
      return c * dir
    }
    if (a.v === b.v) return (a.node.weight ?? 0) - (b.node.weight ?? 0)
    return (a.v - b.v) * dir
  })
  return arr.map(x => x.node)
})

// 分批发渲染：先画前 12 张卡，其余按批追加，避免首帧一次性渲染大量卡片
const RENDER_BATCH = 12
const renderLimit = ref(RENDER_BATCH)

function ensureRenderMore() {
  if (orderedNodes.value.length > renderLimit.value) {
    setTimeout(() => {
      renderLimit.value = Math.min(orderedNodes.value.length, renderLimit.value + RENDER_BATCH)
      ensureRenderMore()
    }, 80)
  }
}

watch(orderedNodes, () => {
  if (renderLimit.value < orderedNodes.value.length) ensureRenderMore()
})

const renderedNodes = computed(() => orderedNodes.value.slice(0, renderLimit.value))

// ===== 概览 =====
const overview = computed(() => {
  let online = 0
  let netIn = 0
  let netOut = 0
  let trafficUp = 0
  let trafficDown = 0
  for (const n of nodes.value) {
    if (isOnline(n.uuid)) online++
    const live = liveData[n.uuid]
    if (live) {
      netIn += live.net_in ?? 0
      netOut += live.net_out ?? 0
    }
    // 累计流量优先取实时状态（离线节点无状态时回退节点静态字段）
    trafficUp += (live && live.traffic_out !== undefined ? live.traffic_out : (n.trafficUp ?? n.traffic_up ?? 0))
    trafficDown += (live && live.traffic_in !== undefined ? live.traffic_in : (n.trafficDown ?? n.traffic_down ?? 0))
  }
  return {
    total: nodes.value.length,
    online,
    bandwidth: formatBytes(netIn + netOut) + '/s',
    traffic: formatBytes(trafficUp + trafficDown)
  }
})

// ===== 资产概览（汇率换算 + 剩余预付价值） =====
const rates = ref(null)
const rateError = ref(false)

async function loadRates() {
  rateError.value = false
  try {
    rates.value = await getExchangeRates()
  } catch {
    rateError.value = true
  }
}

const costSummary = computed(() => {
  if (!rates.value) return null
  return calculateCostSummary(nodes.value, rates.value, settings.value.costIgnoredNodes)
})

const assetValue = computed(() => {
  if (!costSummary.value) return rateError.value ? '—' : '计算中'
  return formatCnyMoney(costSummary.value.remainingCny)
})

const assetNote = computed(() => {
  if (!costSummary.value) return rateError.value ? '汇率获取失败' : ''
  return `月均 ${formatCnyMoney(costSummary.value.monthlyCny)} · 实时汇率`
})

// ===== 数据拉取 =====
let socket = null
let pollTimer = null
let pingTimer = null
let pingBusy = false

// ===== 本地快照：首帧秒开（上次节点+实时状态先渲染，再异步刷新） =====
const SNAPSHOT_KEY = 'komari_monitor_snapshot'
const SAVE_INTERVAL = 15000
let lastSave = 0

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return
    const snap = JSON.parse(raw)
    if (Array.isArray(snap.nodes) && snap.live && typeof snap.live === 'object') {
      nodes.value = snap.nodes
      for (const [uuid, status] of Object.entries(snap.live)) {
        if (status && typeof status === 'object') liveData[uuid] = status
      }
    }
  } catch {}
}

function saveSnapshot(force = false) {
  const now = Date.now()
  if (!force && now - lastSave < SAVE_INTERVAL) return
  lastSave = now
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ nodes: nodes.value, live: liveData }))
  } catch {}
}

loadSnapshot()

const TREND_MAX = 60

function pushTrend(uuid, status) {
  let t = trends[uuid]
  if (!t) {
    t = { up: [], down: [] }
    trends[uuid] = t
  }
  t.up.push(status.net_out ?? 0)
  t.down.push(status.net_in ?? 0)
  if (t.up.length > TREND_MAX) t.up.shift()
  if (t.down.length > TREND_MAX) t.down.shift()
}

async function fetchNodes() {
  try {
    const data = await rpcCall('common:getNodes')
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      nodes.value = Object.values(data)
    } else if (Array.isArray(data)) {
      nodes.value = data
    }
    saveSnapshot(true)
  } catch {}
}

function connectAndPoll() {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)

  socket = createRpcSocket()

  const poll = () => {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.call('common:getNodesLatestStatus', {}, 8000)
      .then(data => {
        wsConnected.value = true
        if (data && typeof data === 'object') {
          const entries = Object.entries(data)
          for (const [uuid, status] of entries) {
            const norm = normalizeStatus(status)
            liveData[uuid] = norm
            pushTrend(uuid, norm)
          }
          // 清理已下线/删除节点的旧缓存状态
          if (entries.length) {
            for (const uuid of Object.keys(liveData)) {
              if (!(uuid in data)) delete liveData[uuid]
            }
          }
          saveSnapshot()
        }
      })
      .catch(() => {
        wsConnected.value = false
      })
  }

  let checkAttempts = 0
  const checkOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      wsConnected.value = true
      poll()
      pollTimer = setInterval(poll, 3000)
    } else if (checkAttempts < 30) {
      checkAttempts++
      setTimeout(checkOpen, 300)
    } else {
      connectAndPoll()
    }
  }
  checkOpen()
}

async function refreshPing() {
  if (pingBusy) return
  pingBusy = true
  try {
    const tasks = await rpcCall('public:getPublicPingTasks')
    if (!Array.isArray(tasks)) return
    const byClient = new Map()
    for (const t of tasks) {
      const clients = t.clients || []
      for (const c of clients) {
        if (!byClient.has(c)) byClient.set(c, [])
        byClient.get(c).push(t)
      }
    }
    const uuids = nodes.value.map(n => n.uuid)
    await Promise.all(
      uuids.map(async uuid => {
        const ts = byClient.get(uuid)
        if (!ts || !ts.length) return
        const recs = []
        await Promise.all(
          ts.map(async t => {
            try {
              const data = await rpcCall('public:getPingRecords', {
                uuid,
                task_id: String(t.id),
                hours: '1'
              })
              recs.push(...(data.records || []))
            } catch {}
          })
        )
        if (recs.length) {
          pingMap[uuid] = buildPingModel(recs)
        }
      })
    )
  } catch {}
  pingBusy = false
}

function startPing() {
  if (pingTimer) clearInterval(pingTimer)
  refreshPing()
  pingTimer = setInterval(refreshPing, 60000)
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
  }
}

// 只有大/小视图才轮询首页 ping（列表/迷你视图省请求，切回时立即刷新）
watch(mode, m => {
  if (m === 'large' || m === 'compact') startPing()
  else stopPing()
})

onMounted(() => {
  fetchNodes()
  connectAndPoll()
  // 重请求（汇率 / 首页 ping）延迟到首帧渲染之后，避免进页面瞬间的网络突发
  setTimeout(() => {
    loadRates()
    if (mode.value === 'large' || mode.value === 'compact') startPing()
  }, 1200)
})

const onPageHide = () => saveSnapshot(true)
window.addEventListener('pagehide', onPageHide)

onUnmounted(() => {
  window.removeEventListener('pagehide', onPageHide)
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)
  stopPing()
})
</script>

<style scoped>
.komari-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  padding: 24px;
  gap: 16px;
  border-radius: 16px;
}

.k-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.k-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--k-text);
}

.k-title i {
  color: var(--k-cpu);
}

.k-conn {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.k-conn.on {
  background: var(--k-online);
  box-shadow: 0 0 6px var(--k-online);
}

.k-conn.off {
  background: var(--k-offline);
}

.k-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 排序 */
.k-sort {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px 3px 9px;
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 10px;
  color: var(--k-text-2);
}

.k-sort > i {
  font-size: 12px;
}

.k-sort select {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--k-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 4px;
  max-width: 90px;
}

.k-sort select option {
  background: var(--k-surface);
  color: var(--k-text);
}

.k-sort-dir {
  border: none;
  background: transparent;
  color: var(--k-text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 5px;
  border-radius: 6px;
}

.k-sort-dir:hover {
  color: var(--k-text);
  background: var(--k-surface-hover);
}

/* 视图切换 */
.k-view {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 10px;
}

.k-view-btn,
.k-appearance-btn {
  border: none;
  background: transparent;
  color: var(--k-text-3);
  width: 28px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s ease, color 0.15s ease;
}

.k-view-btn:hover,
.k-appearance-btn:hover {
  color: var(--k-text);
  background: var(--k-surface-hover);
}

.k-view-btn.active,
.k-appearance-btn.active {
  background: var(--k-surface-hover);
  color: var(--k-cpu);
}

/* 外观切换 */
.k-appearance {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 10px;
}

.k-appearance-btn {
  width: 28px;
  height: 26px;
  font-size: 13px;
}

/* 概览 */
.k-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.k-overview-item {
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.k-overview-note {
  font-size: 10px;
  color: var(--k-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.k-overview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--k-text-2);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.k-overview-label i {
  font-size: 11px;
}

.k-overview-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--k-text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.k-overview-value small {
  font-size: 12px;
  font-weight: 600;
  color: var(--k-text-3);
}

/* 网格 */
.k-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--k-grid-min)), 1fr));
  gap: 14px;
  width: 100%;
}

@media (max-width: 700px) {
  .komari-page {
    padding: 14px;
  }

  .k-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .k-overview {
    grid-template-columns: 1fr 1fr;
  }

  .k-overview-item:first-child {
    grid-column: 1 / -1;
  }
}

/* 空状态 */
.k-empty {
  text-align: center;
  color: var(--k-text-3);
  padding: 3rem;
  font-size: 1.1rem;
}

.k-empty i {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}
</style>
