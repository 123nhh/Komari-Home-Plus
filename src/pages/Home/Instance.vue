<template>
  <div class="instance-page">
    <router-link to="/komari" class="instance-back">
      <i class="bi bi-arrow-left"></i>返回
    </router-link>

    <!-- ===== 实例信息面板 ===== -->
    <section class="k-panel">
      <header class="k-panel-head">
        <div class="k-panel-headings">
          <div class="k-panel-title-row">
            <h2 class="k-panel-title">{{ nodeName ? nodeName + ' 信息' : '实例信息' }}</h2>
            <span class="k-panel-status" :class="online ? 'on' : 'off'">
              <i class="bi bi-circle-fill"></i>{{ online ? '在线' : '离线' }}
            </span>
          </div>
          <p v-if="nodeInfo.cpu_name" class="k-panel-desc">
            {{ nodeInfo.cpu_name }} · {{ nodeInfo.cpu_cores || 0 }} 核
            <template v-if="nodeInfo.arch"> · {{ nodeInfo.arch }}</template>
          </p>
          <p v-if="!online" class="k-panel-desc">节点当前离线，以下展示最近一次上报的缓存数据。</p>
        </div>
        <div class="k-panel-aside">
          <button class="k-switch-btn" :disabled="!prevNode" @click="switchTo(prevNode)" title="上一台">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="k-switch-info">{{ currentIndex >= 0 ? currentIndex + 1 : '-' }} / {{ allNodes.length }}</span>
          <button class="k-switch-btn" :disabled="!nextNode" @click="switchTo(nextNode)" title="下一台">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </header>

      <div class="instance-info-groups">
        <div class="instance-info-group">
          <div class="instance-info-group-title">系统</div>
          <InfoRow label="状态" :value="online ? '在线' : '离线'" />
          <InfoRow label="操作系统" :value="nodeInfo.os || '—'" />
          <InfoRow label="架构" :value="nodeInfo.arch || '—'" />
          <InfoRow label="虚拟化" :value="nodeInfo.virtualization || '—'" />
          <InfoRow label="显卡" :value="nodeInfo.gpu_name || '—'" />
          <InfoRow label="地区" :value="nodeInfo.region || '—'" />
        </div>

        <div class="instance-info-group">
          <div class="instance-info-group-title">资源</div>
          <InfoRow label="内存" :value="memText" />
          <InfoRow label="磁盘" :value="diskText" />
          <InfoRow label="负载" :value="loadText" />
          <InfoRow label="进程" :value="processText" />
          <InfoRow label="运行时长" :value="uptimeText" />
          <InfoRow label="最近更新" :value="lastUpdated" />
        </div>

        <div class="instance-info-group">
          <div class="instance-info-group-title">网络</div>
          <InfoRow :label="online ? '实时网络' : '缓存网络'" :value="netText" />
          <div class="instance-info-item">
            <span class="instance-info-label">总流量</span>
            <div class="instance-info-traffic">
              <span class="instance-info-value">↑ {{ trafficUpText }} · ↓ {{ trafficDownText }}</span>
              <div v-if="quota" class="instance-progress-track" aria-hidden>
                <span class="instance-progress-fill" :style="{ width: quota.fraction * 100 + '%' }"></span>
              </div>
              <div v-else class="instance-progress-track is-unlimited" aria-hidden></div>
              <span class="instance-info-note">{{ quotaNote }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 图表控制条 ===== -->
    <div class="instance-chart-controls">
      <div class="instance-segmented">
        <button
          type="button"
          :class="{ active: chartType === 'load' }"
          @click="chartType = 'load'"
        >
          <i class="bi bi-graph-up"></i>负载
        </button>
        <button
          type="button"
          :class="{ active: chartType === 'ping' }"
          @click="chartType = 'ping'"
        >
          <i class="bi bi-activity"></i>Ping
        </button>
      </div>
      <div class="instance-segmented">
        <button
          v-for="r in activeRanges"
          :key="r.value"
          type="button"
          :class="{ active: activeRange === r.value }"
          @click="setRange(r.value)"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- ===== 负载图表 ===== -->
    <section v-if="chartType === 'load'" class="k-panel">
      <header class="k-panel-head">
        <div class="k-panel-headings">
          <div class="k-panel-title-row">
            <h2 class="k-panel-title">负载图表</h2>
          </div>
        </div>
        <div class="k-panel-aside k-headmeta">
          <span class="k-chart-meta">覆盖 <strong>{{ coverageLabel }}</strong></span>
          <span class="k-chart-meta">采样 <strong>{{ sampleLabel }}</strong></span>
          <button class="k-toggle-btn" :class="{ active: connectNulls }" @click="connectNulls = !connectNulls" title="跨过数据空缺连成完整曲线">断点连线</button>
          <button class="k-toggle-btn" @click="fetchRecent()" :disabled="refreshing">
            <i class="bi bi-arrow-clockwise" :class="{ spin: refreshing }"></i>{{ refreshing ? '刷新中' : '刷新' }}
          </button>
          <span class="k-range-chip">{{ rangeChip }}</span>
        </div>
      </header>

      <div class="instance-chart-grid">
        <InstanceChart
          icon="bi-cpu"
          title="CPU"
          :value="cpuHead"
          note="使用率"
          :points="loadPoints.cpu"
          :series="[{ key: 'v', label: 'CPU', color: 'var(--k-cpu)' }]"
          axis-kind="percent"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
        <InstanceChart
          icon="bi-memory"
          title="内存"
          :value="memHead"
          note="使用率"
          :points="loadPoints.mem"
          :series="[{ key: 'v', label: '内存', color: 'var(--k-memory)' }]"
          axis-kind="percent"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
        <InstanceChart
          icon="bi-hdd"
          title="磁盘"
          :value="diskHead"
          note="已用空间"
          :points="loadPoints.disk"
          :series="[{ key: 'v', label: '磁盘', color: 'var(--k-disk)' }]"
          axis-kind="percent"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
        <InstanceChart
          icon="bi-arrow-down-up"
          title="网络"
          :value="netHead"
          :note="netNoteHead"
          :points="loadPoints.net"
          :series="[
            { key: 'down', label: '↓ 下行', color: 'var(--k-down)' },
            { key: 'up', label: '↑ 上行', color: 'var(--k-up)' }
          ]"
          axis-kind="network"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
        <InstanceChart
          icon="bi-hdd-network"
          title="连接数"
          :value="connHead"
          note="连接"
          :points="loadPoints.conn"
          :series="[
            { key: 'tcp', label: 'TCP', color: 'var(--k-cpu)' },
            { key: 'udp', label: 'UDP', color: 'var(--k-memory)' }
          ]"
          axis-kind="count"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
        <InstanceChart
          icon="bi-speedometer2"
          title="进程"
          :value="procHead"
          :note="loadNote"
          :points="loadPoints.proc"
          :series="[{ key: 'v', label: '进程', color: 'var(--k-warn)' }]"
          axis-kind="count"
          :range-hours="loadHours"
          :connect-nulls="connectNulls"
        />
      </div>
    </section>

    <!-- ===== Ping 图表 ===== -->
    <section v-else class="k-panel">
      <header class="k-panel-head">
        <div class="k-panel-headings">
          <div class="k-panel-title-row">
            <h2 class="k-panel-title">Ping 图表</h2>
          </div>
          <p v-if="pingCoverage" class="k-panel-desc">覆盖 {{ pingCoverage }}</p>
        </div>
        <div class="k-panel-aside k-headmeta">
          <button class="k-toggle-btn" :class="{ active: pingConnectNulls }" @click="pingConnectNulls = !pingConnectNulls" title="关闭：如实显示中断/丢包断点；开启：跨过空缺连成完整曲线">断点连线</button>
          <button class="k-toggle-btn" @click="hideAllTasks" title="隐藏全部线路">
            <i class="bi bi-eye-slash"></i>{{ allHidden ? '显示全部' : '隐藏全部' }}
          </button>
          <button class="k-toggle-btn" @click="fetchPingData()" :disabled="pingLoading">
            <i class="bi bi-arrow-clockwise" :class="{ spin: pingLoading }"></i>{{ pingLoading ? '刷新中' : '刷新' }}
          </button>
        </div>
      </header>

      <div class="instance-ping-tasks">
        <button
          v-for="task in pingTasksMeta"
          :key="task.id"
          type="button"
          class="instance-ping-task"
          :class="{ hidden: hiddenTasks.includes(task.id) }"
          @click="toggleTask(task.id)"
          :title="task.title"
        >
          <span class="instance-ping-task-dot" :style="{ background: task.color }"></span>
          <span class="instance-ping-task-name">{{ task.name }}</span>
          <span class="instance-ping-task-primary" :style="{ color: latencyColor(task.latest) }">
            {{ task.latest !== null ? task.latest.toFixed(1) + ' ms' : '—' }}
          </span>
          <span class="instance-ping-task-loss" :style="{ color: lossColor(task.loss) }">
            {{ task.loss.toFixed(1) }}%
          </span>
        </button>
      </div>

      <div v-if="!pingTasks.length" class="instance-empty">该实例尚未绑定任何 Ping 任务</div>
      <div v-else-if="visibleTasks.length === 0" class="instance-empty">当前已隐藏全部线路，点击上方按钮可恢复显示</div>
      <InstanceChart
        v-else
        icon="bi-activity"
        title="Ping 延迟"
        :value="pingHeadValue"
        :note="pingHeadNote"
        :points="pingPoints"
        :series="visibleTasks.map(t => ({ key: String(t.id), label: t.name, color: t.color }))"
        axis-kind="ms"
        :range-hours="pingHours"
        :connect-nulls="pingConnectNulls"
        tall
      />
    </section>

    <div style="height: 40px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rpcCall, createRpcSocket } from '@/utils/rpc'
import { normalizeStatus } from '@/utils/status'
import { formatBytes, formatUptime } from '@/utils/format'
import InstanceChart from '@/components/instance/InstanceChart.vue'
import InfoRow from '@/components/instance/InfoRow.vue'

const route = useRoute()
const router = useRouter()

const uuid = computed(() => route.query.uuid || '')
const nodeName = ref('')
const nodeInfo = ref({})
const metrics = ref(null)
const online = ref(false)
const allNodes = ref([])
const history = ref([])

let socket = null
let pollTimer = null

// ===== 实例信息 =====
const memText = computed(() => (metrics.value ? `${formatBytes(metrics.value.ram ?? 0)} / ${formatBytes(metrics.value.ram_total ?? 0)}` : '—'))
const diskText = computed(() => (metrics.value ? `${formatBytes(metrics.value.disk ?? 0)} / ${formatBytes(metrics.value.disk_total ?? 0)}` : '—'))
const loadText = computed(() => {
  if (!metrics.value) return '—'
  const n = v => (Number(v) || 0).toFixed(2)
  return `${n(metrics.value.load)} | ${n(metrics.value.load5)} | ${n(metrics.value.load15)}`
})
const processText = computed(() => (metrics.value ? String(metrics.value.process ?? 0) : '—'))
const uptimeText = computed(() => (metrics.value ? formatUptime(metrics.value.uptime) : '—'))
const lastUpdated = ref('—')
const netText = computed(() => (metrics.value ? `↑ ${formatBytes(metrics.value.net_out ?? 0)}/s · ↓ ${formatBytes(metrics.value.net_in ?? 0)}/s` : '—'))
const trafficUpText = computed(() => formatBytes(metrics.value?.traffic_out ?? nodeInfo.value?.trafficUp ?? nodeInfo.value?.traffic_up ?? 0))
const trafficDownText = computed(() => formatBytes(metrics.value?.traffic_in ?? nodeInfo.value?.trafficDown ?? nodeInfo.value?.traffic_down ?? 0))

const trafficLimit = computed(() => Number(nodeInfo.value?.trafficLimit ?? nodeInfo.value?.traffic_limit ?? 0))
const quota = computed(() => {
  const limit = trafficLimit.value
  if (!limit || limit <= 0) return null
  const up = Number(metrics.value?.traffic_out ?? nodeInfo.value?.trafficUp ?? nodeInfo.value?.traffic_up ?? 0)
  const down = Number(metrics.value?.traffic_in ?? nodeInfo.value?.trafficDown ?? nodeInfo.value?.traffic_down ?? 0)
  let used = up + down
  const type = nodeInfo.value?.trafficLimitType || nodeInfo.value?.traffic_limit_type || 'sum'
  if (type === 'up') used = up
  else if (type === 'down') used = down
  else if (type === 'max') used = Math.max(up, down)
  else if (type === 'min') used = Math.min(up, down)
  return { fraction: Math.min(1, used / limit), used, limit }
})
const quotaNote = computed(() => {
  if (!quota.value) return `${trafficUpText.value} · ${trafficDownText.value} / ∞`
  return `${formatBytes(quota.value.used)} / ${formatBytes(quota.value.limit)}`
})

// ===== 上下台切换 =====
const currentIndex = computed(() => allNodes.value.findIndex(n => n.uuid === uuid.value))
const prevNode = computed(() => (currentIndex.value > 0 ? allNodes.value[currentIndex.value - 1] : null))
const nextNode = computed(() => (currentIndex.value >= 0 && currentIndex.value < allNodes.value.length - 1 ? allNodes.value[currentIndex.value + 1] : null))

function switchTo(node) {
  if (node) router.replace({ path: '/komari/instance', query: { uuid: node.uuid } })
}

// ===== 图表类型与时间范围 =====
const chartType = ref('load')
const HOUR = 1
const MIN = 1 / 60
const LOAD_RANGES = [
  { label: '10 分钟', value: 10 * MIN },
  { label: '1 小时', value: 1 * HOUR },
  { label: '6 小时', value: 6 * HOUR },
  { label: '24 小时', value: 24 * HOUR },
  { label: '7 天', value: 7 * 24 * HOUR }
]
const PING_RANGES = [
  { label: '10 分钟', value: 10 * MIN },
  { label: '1 小时', value: 1 * HOUR },
  { label: '6 小时', value: 6 * HOUR },
  { label: '24 小时', value: 24 * HOUR },
  { label: '7 天', value: 7 * 24 * HOUR }
]
const loadHours = ref(10 * MIN)
const pingHours = ref(6 * HOUR)
const connectNulls = ref(false)
const refreshing = ref(false)

const activeRanges = computed(() => (chartType.value === 'load' ? LOAD_RANGES : PING_RANGES))
const activeRange = computed(() => (chartType.value === 'load' ? loadHours.value : pingHours.value))
function setRange(v) {
  if (chartType.value === 'load') loadHours.value = v
  else pingHours.value = v
}
const rangeChip = computed(() => {
  const r = activeRanges.value.find(x => x.value === activeRange.value)
  return r ? r.label : ''
})

// ===== 历史数据（records + WS 快照合并） =====
const HISTORY_CAP = 5000

function parseTime(t) {
  if (!t) return 0
  const ms = typeof t === 'number' ? t : Date.parse(t)
  if (!isNaN(ms) && ms > 1e12) return ms
  if (!isNaN(ms) && ms > 0) return ms * 1000
  return 0
}

function toSnapshot(r) {
  return {
    t: parseTime(r.time || r.created_at || r.updated_at),
    cpu: r.cpu ?? null,
    ram: r.ram ?? null,
    ram_total: r.ram_total ?? null,
    disk: r.disk ?? null,
    disk_total: r.disk_total ?? null,
    net_in: r.net_in ?? null,
    net_out: r.net_out ?? null,
    tcp: r.connections ?? r.connections_tcp ?? null,
    udp: r.connections_udp ?? null,
    process: r.process ?? null,
    load: r.load ?? null
  }
}

function mergeSnapshots(list) {
  const merged = [...history.value, ...list].filter(p => p.t > 0)
  merged.sort((a, b) => a.t - b.t)
  const deduped = []
  for (const p of merged) {
    const last = deduped[deduped.length - 1]
    if (last && p.t - last.t < 1000) continue
    deduped.push(p)
  }
  if (deduped.length > HISTORY_CAP) {
    const step = Math.ceil(deduped.length / HISTORY_CAP)
    history.value = deduped.filter((_, i) => i % step === 0)
  } else {
    history.value = deduped
  }
}

async function fetchNodeInfo() {
  if (!uuid.value) return
  try {
    const node = await rpcCall('common:getNodes', { uuid: uuid.value })
    if (node) {
      nodeName.value = node.name || ''
      nodeInfo.value = node
    }
  } catch {}
}

async function fetchNodes() {
  try {
    const data = await rpcCall('common:getNodes')
    if (data && typeof data === 'object' && !Array.isArray(data)) allNodes.value = Object.values(data)
    else if (Array.isArray(data)) allNodes.value = data
  } catch {}
}

async function fetchRecent() {
  if (!uuid.value) return
  refreshing.value = true
  try {
    // 优先用 common:getRecords 拉取所选窗口的历史（生产上 getNodeRecentStatus 只返回最近 20 条）
    const hours = Math.max(1, Math.ceil(loadHours.value))
    let records = []
    try {
      const data = await rpcCall('common:getRecords', {
        uuid: uuid.value,
        hours,
        type: 'load',
        maxCount: 6000
      })
      const raw = data && data.records
      if (Array.isArray(raw)) records = raw
      else if (raw && typeof raw === 'object') records = Object.values(raw).flat()
    } catch {
      const data = await rpcCall('common:getNodeRecentStatus', { uuid: uuid.value })
      records = (data && data.records) || []
    }
    records = records.map(normalizeStatus)
    if (records.length) {
      const latest = records[records.length - 1]
      metrics.value = latest
      online.value = latest.online === true
      mergeSnapshots(records.map(toSnapshot))
      const t = parseTime(latest.updated_at || latest.time || latest.created_at)
      if (t) lastUpdated.value = new Date(t).toTimeString().slice(0, 8)
    }
  } catch {}
  refreshing.value = false
}

function connectAndPoll() {
  if (!uuid.value) return
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)

  socket = createRpcSocket()

  const poll = () => {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.call('common:getNodesLatestStatus', { uuid: uuid.value }, 8000)
      .then(data => {
        const status = data && data.online !== undefined ? data : (data && data[uuid.value])
        if (status) {
          const norm = normalizeStatus(status)
          metrics.value = norm
          online.value = norm.online
          lastUpdated.value = new Date().toTimeString().slice(0, 8)
          mergeSnapshots([toSnapshot({ ...norm, time: Date.now() })])
        }
      })
      .catch(() => {})
  }

  let checkAttempts = 0
  const checkOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
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

// ===== 负载图表数据 =====
// 窗口按所选小时数过滤；10 分钟档为 1/6 小时。
const windowStart = computed(() => Date.now() - loadHours.value * 3600000)

const inWindow = computed(() => history.value.filter(p => p.t >= windowStart.value))

function downsample(arr, max) {
  if (arr.length <= max) return arr
  const step = Math.ceil(arr.length / max)
  return arr.filter((_, i) => i % step === 0)
}

const downsampled = computed(() => downsample(inWindow.value, 600))

const loadPoints = computed(() => {
  // 历史记录的 ram_total/disk_total 可能为 0，回退到节点静态字段
  const memTotal = nodeInfo.value?.mem_total || 0
  const diskTotal = nodeInfo.value?.disk_total || 0
  return {
    cpu: downsampled.value.map(p => ({ t: p.t, v: p.cpu })),
    mem: downsampled.value.map(p => ({ t: p.t, v: (p.ram_total || memTotal) ? (p.ram / (p.ram_total || memTotal)) * 100 : null })),
    disk: downsampled.value.map(p => ({ t: p.t, v: (p.disk_total || diskTotal) ? (p.disk / (p.disk_total || diskTotal)) * 100 : null })),
    net: downsampled.value.map(p => ({ t: p.t, up: p.net_out, down: p.net_in })),
    conn: downsampled.value.map(p => ({ t: p.t, tcp: p.tcp, udp: p.udp })),
    proc: downsampled.value.map(p => ({ t: p.t, v: p.process }))
  }
})

const lastPoint = computed(() => downsampled.value[downsampled.value.length - 1] || null)

const cpuHead = computed(() => (lastPoint.value && lastPoint.value.cpu !== null ? lastPoint.value.cpu.toFixed(1) + '%' : '—'))
const memHead = computed(() => (lastPoint.value ? `${formatBytes(lastPoint.value.ram ?? 0)} / ${formatBytes(lastPoint.value.ram_total ?? 0)}` : '—'))
const diskHead = computed(() => (lastPoint.value ? `${formatBytes(lastPoint.value.disk ?? 0)} / ${formatBytes(lastPoint.value.disk_total ?? 0)}` : '—'))
const netHead = computed(() => (lastPoint.value ? `${formatBytes(lastPoint.value.net_in ?? 0)}/s / ${formatBytes(lastPoint.value.net_out ?? 0)}/s` : '—'))
const netNoteHead = computed(() => `↓ ${formatBytes(nodeInfo.value?.trafficDown ?? nodeInfo.value?.traffic_down ?? 0)} · ↑ ${formatBytes(nodeInfo.value?.trafficUp ?? nodeInfo.value?.traffic_up ?? 0)}`)
const connHead = computed(() => (lastPoint.value ? `TCP ${Math.round(lastPoint.value.tcp ?? 0)} / UDP ${Math.round(lastPoint.value.udp ?? 0)}` : '—'))
const procHead = computed(() => (lastPoint.value && lastPoint.value.process !== null ? String(Math.round(lastPoint.value.process)) : '—'))
const loadNote = computed(() => {
  if (!lastPoint.value || lastPoint.value.load === null) return '—'
  const n = v => (Number(v) || 0).toFixed(2)
  return `负载 ${n(lastPoint.value.load)} | ${n(metrics.value?.load5)} | ${n(metrics.value?.load15)}`
})

const sampleLabel = computed(() => `${downsampled.value.length} 个点`)

const coverageLabel = computed(() => {
  const pts = downsampled.value
  if (!pts.length) return '—'
  const fmt = t => {
    const d = new Date(t)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${fmt(pts[0].t)} - ${fmt(pts[pts.length - 1].t)}`
})

// ===== Ping 图表 =====
const pingTasks = ref([])
const pingLoading = ref(false)
const hiddenTasks = ref([])
const pingConnectNulls = ref(false)
const PING_PALETTE = ['#4878d0', '#ee854a', '#6acc64', '#d65f5f', '#956cb4', '#8c613c', '#dc7ec0', '#4aa7a0', '#c7b446', '#82c6e2']

async function fetchPingData() {
  if (!uuid.value || pingLoading.value) return
  pingLoading.value = true
  try {
    const tasks = await rpcCall('public:getPublicPingTasks')
    if (!Array.isArray(tasks)) return
    const relevant = tasks.filter(t => t.clients && t.clients.includes(uuid.value))
    if (!relevant.length) {
      pingTasks.value = []
      return
    }
    const results = await Promise.all(
      relevant.map(async (task, i) => {
        try {
          // 小于 1 小时的档位按 1 小时请求，再在前端按窗口过滤
          const data = await rpcCall('public:getPingRecords', {
            uuid: uuid.value,
            task_id: String(task.id),
            hours: String(Math.max(1, pingHours.value))
          })
          const windowStartMs = Date.now() - pingHours.value * 3600000
          const records = (data.records || [])
            .map(r => ({ t: parseTime(r.created_at || r.time), v: r.value }))
            .filter(p => p.t > 0 && p.t >= windowStartMs)
            .sort((a, b) => a.t - b.t)
          return { id: task.id, name: task.name || `任务 #${task.id}`, records, color: PING_PALETTE[i % PING_PALETTE.length] }
        } catch {
          return { id: task.id, name: task.name || `任务 #${task.id}`, records: [], color: PING_PALETTE[i % PING_PALETTE.length] }
        }
      })
    )
    pingTasks.value = results
  } catch {}
  pingLoading.value = false
}

function taskStats(task) {
  const valid = task.records.filter(p => p.v >= 0)
  const latest = valid.length ? valid[valid.length - 1].v : null
  const avg = valid.length ? valid.reduce((s, p) => s + p.v, 0) / valid.length : null
  const min = valid.length ? Math.min(...valid.map(p => p.v)) : null
  const max = valid.length ? Math.max(...valid.map(p => p.v)) : null
  const total = task.records.length
  const lost = total - valid.length
  const loss = total ? (lost / total) * 100 : 0
  return { latest, avg, min, max, loss }
}

const pingTasksMeta = computed(() =>
  pingTasks.value.map(t => ({ ...t, ...taskStats(t) }))
)

const visibleTasks = computed(() => pingTasksMeta.value.filter(t => !hiddenTasks.value.includes(t.id)))
const allHidden = computed(() => pingTasks.value.length > 0 && hiddenTasks.value.length === pingTasks.value.length)

function toggleTask(id) {
  hiddenTasks.value = hiddenTasks.value.includes(id)
    ? hiddenTasks.value.filter(x => x !== id)
    : [...hiddenTasks.value, id]
}

function hideAllTasks() {
  if (allHidden.value) hiddenTasks.value = []
  else hiddenTasks.value = pingTasks.value.map(t => t.id)
}

const pingPoints = computed(() => {
  const meta = pingTasksMeta.value
  if (!meta.length) return []
  const tolerance = 4000
  const samples = []
  for (const t of meta) {
    for (const p of t.records) samples.push({ task: t.id, t: p.t, v: p.v })
  }
  samples.sort((a, b) => a.t - b.t)
  const anchors = []
  let lastAnchor = null
  const perAnchor = new Map()
  for (const s of samples) {
    let anchor = lastAnchor !== null && s.t - lastAnchor <= tolerance ? lastAnchor : s.t
    if (anchor === s.t) lastAnchor = s.t
    if (!perAnchor.has(anchor)) perAnchor.set(anchor, {})
    perAnchor.get(anchor)[String(s.task)] = s.v >= 0 ? s.v : null
  }
  return [...perAnchor.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, values]) => ({ t, ...values }))
})

const pingHeadValue = computed(() => {
  const v = visibleTasks.value[0]
  return v && v.latest !== null ? v.latest.toFixed(1) + ' ms' : '—'
})
const pingHeadNote = computed(() => {
  const tasks = visibleTasks.value
  if (!tasks.length) return '—'
  return `${tasks.length} 条线路`
})

const pingCoverage = computed(() => {
  const pts = pingPoints.value
  if (!pts.length) return null
  const fmt = t => {
    const d = new Date(t)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${fmt(pts[0].t)} - ${fmt(pts[pts.length - 1].t)}`
})

function latencyColor(v) {
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 30) return 'var(--k-lat-1)'
  if (v <= 80) return 'var(--k-lat-2)'
  if (v <= 150) return 'var(--k-lat-3)'
  if (v <= 300) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
}

function lossColor(v) {
  if (v <= 1) return 'var(--k-lat-1)'
  if (v <= 3) return 'var(--k-lat-2)'
  if (v <= 8) return 'var(--k-lat-3)'
  if (v <= 20) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
}

// ===== 生命周期 =====
function reset() {
  nodeName.value = ''
  nodeInfo.value = {}
  metrics.value = null
  online.value = false
  history.value = []
  pingTasks.value = []
  hiddenTasks.value = []
  lastUpdated.value = '—'
  loadHours.value = 10 / 60
  pingHours.value = 6
}

watch(uuid, () => {
  if (!uuid.value) return
  reset()
  fetchNodeInfo()
  fetchRecent()
  connectAndPoll()
  fetchPingData()
})

watch(pingHours, () => {
  fetchPingData()
})

// 切换负载时间档位时重新拉取对应窗口的历史
watch(loadHours, () => {
  fetchRecent()
})

onMounted(() => {
  fetchNodes()
  if (uuid.value) {
    fetchNodeInfo()
    fetchRecent()
    connectAndPoll()
    fetchPingData()
  }
})

onUnmounted(() => {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.instance-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  padding: 24px;
  gap: 14px;
}

.instance-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--k-text-2);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  width: fit-content;
}

.instance-back:hover {
  color: var(--k-text);
}

/* ===== 通用面板 ===== */
.k-panel {
  background: var(--k-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--k-border);
  border-radius: 14px;
  padding: 16px 18px;
  color: var(--k-text);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.k-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.k-panel-headings {
  min-width: 0;
}

.k-panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.k-panel-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--k-text);
}

.k-panel-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
}

.k-panel-status i { font-size: 6px; }

.k-panel-status.on {
  background: color-mix(in srgb, var(--k-online) 16%, transparent);
  color: var(--k-online);
}

.k-panel-status.off {
  background: color-mix(in srgb, var(--k-offline) 16%, transparent);
  color: var(--k-offline);
}

.k-panel-desc {
  margin-top: 3px;
  font-size: 11px;
  color: var(--k-text-3);
}

.k-panel-aside {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.k-headmeta {
  font-size: 11px;
  color: var(--k-text-3);
}

.k-chart-meta strong {
  color: var(--k-text-2);
  font-weight: 600;
}

.k-range-chip {
  font-size: 11px;
  font-weight: 700;
  color: var(--k-cpu);
  background: color-mix(in srgb, var(--k-cpu) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--k-cpu) 30%, transparent);
  padding: 2px 9px;
  border-radius: 20px;
}

.k-switch-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--k-border);
  background: var(--k-surface-2);
  color: var(--k-text-2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.k-switch-btn:hover:not(:disabled) {
  background: var(--k-surface-hover);
  color: var(--k-text);
}

.k-switch-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.k-switch-info {
  font-size: 11px;
  color: var(--k-text-3);
  font-variant-numeric: tabular-nums;
}

.k-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--k-border);
  background: var(--k-surface-2);
  color: var(--k-text-2);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.k-toggle-btn:hover:not(:disabled) {
  background: var(--k-surface-hover);
  color: var(--k-text);
}

.k-toggle-btn.active {
  background: color-mix(in srgb, var(--k-cpu) 16%, transparent);
  border-color: color-mix(in srgb, var(--k-cpu) 35%, transparent);
  color: var(--k-cpu);
}

.k-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.k-toggle-btn i {
  font-size: 11px;
}

.k-toggle-btn i.spin {
  animation: k-spin 0.8s linear infinite;
}

@keyframes k-spin {
  to { transform: rotate(360deg); }
}

/* ===== 信息面板 ===== */
.instance-info-groups {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.instance-info-group {
  background: var(--k-surface-2);
  border: 1px solid var(--k-border-subtle);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.instance-info-group-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--k-text-3);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--k-border-subtle);
  margin-bottom: 2px;
}

.instance-info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  font-size: 12px;
}

.instance-info-item.is-stack {
  flex-direction: column;
  align-items: stretch;
}

.instance-info-label {
  color: var(--k-text-3);
  flex-shrink: 0;
}

.instance-info-value {
  color: var(--k-text);
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.instance-info-traffic {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.instance-info-traffic .instance-info-value {
  text-align: left;
  font-size: 11px;
}

.instance-progress-track {
  height: 5px;
  border-radius: 3px;
  background: var(--k-progress-bg);
  overflow: hidden;
}

.instance-progress-track.is-unlimited {
  background: var(--k-surface-2);
}

.instance-progress-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(to right, var(--k-lat-1), var(--k-lat-3), var(--k-lat-5));
  transition: width 0.4s ease;
}

.instance-info-note {
  font-size: 10px;
  color: var(--k-text-3);
  font-variant-numeric: tabular-nums;
}

/* ===== 图表控制条 ===== */
.instance-chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.instance-segmented {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 10px;
  overflow-x: auto;
}

.instance-segmented button {
  border: none;
  background: transparent;
  color: var(--k-text-3);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.instance-segmented button:hover {
  color: var(--k-text);
  background: var(--k-surface-hover);
}

.instance-segmented button.active {
  background: var(--k-surface-hover);
  color: var(--k-cpu);
}

/* ===== 负载图表网格 ===== */
.instance-chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  gap: 12px;
}

/* ===== Ping ===== */
.instance-ping-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.instance-ping-task {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--k-border);
  background: var(--k-surface-2);
  border-radius: 20px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.instance-ping-task:hover {
  background: var(--k-surface-hover);
}

.instance-ping-task.hidden {
  opacity: 0.45;
}

.instance-ping-task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.instance-ping-task-name {
  font-weight: 700;
  color: var(--k-text);
}

.instance-ping-task-primary {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.instance-ping-task-loss {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

.instance-empty {
  text-align: center;
  color: var(--k-text-3);
  padding: 28px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .instance-info-groups {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .instance-page {
    padding: 14px;
  }
}
</style>