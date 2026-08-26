<template>
  <div class="k-bars" @mousemove="onMove" @mouseleave="onLeave">
    <div class="k-bars-row">
      <span
        v-for="(b, i) in cells"
        :key="i"
        class="k-bar-wrap"
      >
        <span
          class="k-bar"
          :style="{ height: b.height + '%', background: b.color }"
        ></span>
      </span>
    </div>
    <div v-if="tooltip.show" class="k-bars-tip" :style="{ left: tooltip.x + '%' }">
      <div class="k-bars-tip-time">{{ tooltip.time }}</div>
      <div class="k-bars-tip-val">{{ tooltip.text }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  buckets: { type: Array, default: () => [] },
  metric: { type: String, default: 'latency' },
  max: { type: Number, default: 300 }
})

const BUCKET_MS = 150000 // 1 小时 / 24 桶

function latencyColor(v) {
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

const cells = computed(() => {
  return props.buckets.map(b => {
    const raw = props.metric === 'loss' ? b.loss : b.latency
    if (raw === null || raw === undefined) {
      return { value: null, height: 3, color: 'var(--k-progress-bg)' }
    }
    const cap = props.metric === 'loss' ? 100 : props.max
    const h = Math.min(100, Math.max(4, (raw / cap) * 100))
    const color = props.metric === 'loss' ? lossColor(raw) : latencyColor(raw)
    return { value: raw, height: h, color }
  })
})

const tooltip = ref({ show: false, x: 0, time: '', text: '' })

function onMove(e) {
  const row = e.currentTarget
  const rect = row.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const idx = Math.max(0, Math.min(cells.value.length - 1, Math.floor(ratio * cells.value.length)))
  const b = cells.value[idx]
  if (b.value === null) {
    tooltip.value = { show: false, x: 0, time: '', text: '' }
    return
  }
  const bucketStart = Date.now() - 60 * 60 * 1000 + idx * BUCKET_MS
  const bucketEnd = bucketStart + BUCKET_MS
  const fmt = ts => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const time = `${fmt(bucketStart)} - ${fmt(bucketEnd)}`
  const text = props.metric === 'loss'
    ? `丢包 ${b.value.toFixed(1)}%`
    : `${Math.round(b.value)} ms`
  tooltip.value = { show: true, x: (idx + 0.5) / cells.value.length * 100, time, text }
}

function onLeave() {
  tooltip.value = { show: false, x: 0, time: '', text: '' }
}
</script>

<style scoped>
.k-bars {
  position: relative;
}

.k-bars-row {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 34px;
}

.k-bar-wrap {
  flex: 1;
  min-width: 1px;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.k-bar {
  width: 100%;
  border-radius: 1px 1px 0 0;
  min-height: 2px;
}

.k-bars-tip {
  position: absolute;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  z-index: 20;
  background: var(--k-tip-bg);
  color: var(--k-tip-fg);
  font-size: 10px;
  line-height: 1.5;
  padding: 3px 7px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
}

.k-bars-tip-time {
  font-weight: 600;
}

.k-bars-tip-val {
  opacity: 0.85;
}
</style>
