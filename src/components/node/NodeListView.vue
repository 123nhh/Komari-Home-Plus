<template>
  <div class="k-list">
    <div class="k-list-head">
      <span class="col-node">节点</span>
      <span class="col-os">系统</span>
      <span class="col-cpu">CPU</span>
      <span class="col-mem">内存</span>
      <span class="col-disk">磁盘</span>
      <span class="col-net">带宽</span>
      <span class="col-ping">延迟</span>
      <span class="col-expire">到期</span>
      <span class="col-price">价格</span>
    </div>
    <div
      v-for="n in nodes"
      :key="n.uuid"
      class="k-list-row"
      :class="{ offline: !isOnline(n.uuid) }"
      @click="goInstance(n.uuid)"
    >
      <span class="col-node">
        <FlagIcon :region="n.region" />
        <span class="k-list-name" :title="n.name">{{ n.name }}</span>
        <span class="k-list-status" :class="isOnline(n.uuid) ? 'on' : 'off'"></span>
      </span>
      <span class="col-os k-list-sub" :title="n.os">{{ n.os || '未知' }}</span>
      <span class="col-cpu" style="color: var(--k-cpu)">{{ pct(cpu(n.uuid)) }}%</span>
      <span class="col-mem" style="color: var(--k-memory)">{{ pct(mem(n.uuid)) }}%</span>
      <span class="col-disk" style="color: var(--k-disk)">{{ pct(disk(n.uuid)) }}%</span>
      <span class="col-net k-list-sub">{{ rate(n.uuid) }}</span>
      <span class="col-ping" :style="{ color: latencyColor(n.uuid) }">{{ latency(n.uuid) }}</span>
      <span class="col-expire" :class="expireClass(n)">{{ expireLabel(n) }}</span>
      <span class="col-price">{{ priceLabel(n) }}</span>
    </div>
    <div v-if="!nodes.length" class="k-list-empty">暂无节点</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import FlagIcon from './FlagIcon.vue'
import { formatRate, formatBytes, expireMeta, priceMeta } from '@/utils/format'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  live: { type: Object, default: () => ({}) },
  ping: { type: Object, default: () => ({}) }
})

const router = useRouter()

function status(uuid) {
  return props.live[uuid] || null
}
function isOnline(uuid) {
  const s = status(uuid)
  return s ? s.online === true : false
}
function cpu(uuid) {
  const s = status(uuid)
  return s ? Math.min(100, s.cpu ?? 0) : 0
}
function mem(uuid) {
  const s = status(uuid)
  if (!s || !s.ram_total) return 0
  return Math.min(100, (s.ram / s.ram_total) * 100)
}
function disk(uuid) {
  const s = status(uuid)
  if (!s || !s.disk_total) return 0
  return Math.min(100, (s.disk / s.disk_total) * 100)
}
function pct(v) {
  return Math.round(v)
}
function rate(uuid) {
  const s = status(uuid)
  if (!s) return '-'
  return formatRate((s.net_in ?? 0) + (s.net_out ?? 0))
}
function latency(uuid) {
  const p = props.ping[uuid]
  if (p && p.lastValue !== null && p.lastValue !== undefined) return Math.round(p.lastValue) + 'ms'
  return '—'
}
function latencyColor(uuid) {
  const p = props.ping[uuid]
  const v = p ? p.lastValue : null
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 30) return 'var(--k-lat-1)'
  if (v <= 80) return 'var(--k-lat-2)'
  if (v <= 150) return 'var(--k-lat-3)'
  if (v <= 300) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
}
function expireLabel(n) {
  const e = expireMeta(n)
  return e ? e.label : '—'
}
function expireClass(n) {
  const e = expireMeta(n)
  return e ? e.tone : ''
}
function priceLabel(n) {
  const p = priceMeta(n)
  return p ? p.label : '—'
}
function goInstance(uuid) {
  router.push({ path: '/komari/instance', query: { uuid } })
}
</script>

<style scoped>
.k-list {
  width: 100%;
  background: var(--k-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--k-border);
  border-radius: 14px;
  overflow-x: auto;
  color: var(--k-text);
}

.k-list-head,
.k-list-row {
  display: grid;
  grid-template-columns: minmax(180px, 2.2fr) 1.2fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr 1fr 0.9fr;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  min-width: 780px;
}

.k-list-head {
  font-size: 11px;
  font-weight: 700;
  color: var(--k-text-3);
  border-bottom: 1px solid var(--k-border-subtle);
  letter-spacing: 0.03em;
}

.k-list-row {
  border-bottom: 1px solid var(--k-border-subtle);
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 12px;
  content-visibility: auto;
  contain-intrinsic-size: auto 42px;
}

.k-list-row:last-child {
  border-bottom: none;
}

.k-list-row:hover {
  background: var(--k-surface-hover);
}

.k-list-row.offline {
  opacity: 0.6;
}

.col-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.k-list-name {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.k-list-status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.k-list-status.on { background: var(--k-online); }
.k-list-status.off { background: var(--k-offline); }

.k-list-sub {
  color: var(--k-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-expire.ok { color: var(--k-expire-ok); }
.col-expire.urgent { color: var(--k-expire-urgent); }
.col-expire.expired { color: var(--k-expire-expired); }

.k-list-empty {
  padding: 24px;
  text-align: center;
  color: var(--k-text-3);
  font-size: 13px;
}
</style>
