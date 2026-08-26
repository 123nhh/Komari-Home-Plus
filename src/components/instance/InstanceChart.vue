<template>
  <div class="k-chart" :style="{ '--chart-accent': accent }">
    <header class="k-chart-head">
      <div class="k-chart-subhead">
        <i :class="icon"></i>
        <span>{{ title }}</span>
      </div>
      <div class="k-chart-stats">
        <span class="k-chart-value">{{ value }}</span>
        <span v-if="note" class="k-chart-note">{{ note }}</span>
      </div>
    </header>
    <div class="k-chart-body" :class="{ tall }" @mousemove="onMove" @mouseleave="onLeave">
      <div class="k-chart-y">
        <span v-for="l in yLabels" :key="l">{{ l }}</span>
      </div>
      <div class="k-chart-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <line v-for="i in 4" :key="i" x1="0" :y1="i * 25" x2="100" :y2="i * 25" class="k-gridline"></line>
          <template v-for="(s, si) in renderedSeries" :key="s.key">
            <path
              v-if="si === 0 && areaPath(s.points)"
              :d="areaPath(s.points)"
              fill="currentColor"
              fill-opacity="0.1"
              class="k-area"
              :style="{ color: s.color }"
            ></path>
            <path
              v-for="(seg, i) in segPaths(s.points)"
              :key="i"
              :d="seg"
              fill="none"
              vector-effect="non-scaling-stroke"
              class="k-line"
              :style="{ stroke: s.color }"
            ></path>
          </template>
        </svg>
        <div class="k-chart-x">
          <span v-for="l in xLabels" :key="l.text" :style="{ left: l.x + '%' }">{{ l.text }}</span>
        </div>
        <div v-if="tooltip.show" class="k-chart-tip" :style="{ left: tooltip.x + '%', top: tooltip.y + '%' }">
          <div class="k-tip-time">{{ tooltip.time }}</div>
          <div v-for="r in tooltip.rows" :key="r.label" class="k-tip-row">
            <span class="k-tip-dot" :style="{ background: r.color }"></span>
            <span class="k-tip-label">{{ r.label }}</span>
            <strong>{{ r.value }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatBytes } from '@/utils/format'

const props = defineProps({
  icon: { type: String, default: 'bi-activity' },
  title: { type: String, default: '' },
  value: { type: String, default: '—' },
  note: { type: String, default: '' },
  series: { type: Array, default: () => [] },
  points: { type: Array, default: () => [] },
  axisKind: { type: String, default: 'percent' },
  rangeHours: { type: Number, default: 0 },
  connectNulls: { type: Boolean, default: true },
  tall: { type: Boolean, default: false }
})

const accent = computed(() => (props.series[0] ? props.series[0].color : 'var(--k-cpu)'))

function fmtTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtAxis(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  switch (props.axisKind) {
    case 'percent':
      return Math.round(v) + '%'
    case 'network':
      return formatBytes(v) + '/s'
    case 'ms':
      return Math.round(v) + ' ms'
    case 'count':
      return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v))
    default:
      return String(Math.round(v))
  }
}

function fmtTooltip(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  switch (props.axisKind) {
    case 'percent':
      return v.toFixed(1) + '%'
    case 'network':
      return formatBytes(v) + '/s'
    case 'ms':
      return v.toFixed(1) + ' ms'
    default:
      return String(Math.round(v))
  }
}

const renderedSeries = computed(() => {
  return props.series.map(s => ({
    key: s.key,
    label: s.label || s.key,
    color: s.color || 'var(--k-cpu)',
    points: props.points
      .map(p => {
        const v = p[s.key]
        return { t: p.t, v: v === undefined || v === null || !Number.isFinite(v) ? null : v }
      })
      .filter(p => p.t > 0)
  }))
})

const maxV = computed(() => {
  if (props.axisKind === 'percent') return 100
  let max = 0
  for (const s of renderedSeries.value) {
    for (const p of s.points) {
      if (p.v !== null && p.v > max) max = p.v
    }
  }
  return max > 0 ? max * 1.15 : 1
})

const yLabels = computed(() => {
  const m = maxV.value
  return [0, 1, 2, 3].map(i => fmtAxis((m * (3 - i)) / 3))
})

const xLabels = computed(() => {
  const pts = renderedSeries.value[0]?.points || []
  if (!pts.length) return []
  const picks = [pts[0].t, pts[Math.floor(pts.length / 2)]?.t, pts[pts.length - 1].t].filter(Boolean)
  const isLong = props.rangeHours >= 24
  return picks.map((t, i) => {
    const d = new Date(t)
    const pad = n => String(n).padStart(2, '0')
    const text = isLong ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`
    return { text, x: (i * 50) }
  })
})

function segPaths(points) {
  if (!points.length) return []
  const n = points.length
  const toXY = (i, v) => {
    const x = n > 1 ? (i / (n - 1)) * 100 : 50
    const y = 100 - (v / maxV.value) * 100
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }
  const build = run => {
    let d = ''
    run.forEach((p, i) => {
      d += (i === 0 ? 'M' : 'L') + toXY(run[i].idx, p.v)
    })
    return d
  }
  if (props.connectNulls) {
    const run = points.map((p, idx) => ({ v: p.v ?? 0, idx }))
    return [build(run)]
  }
  const runs = []
  let cur = []
  points.forEach((p, idx) => {
    if (p.v === null) {
      if (cur.length >= 2) runs.push(build(cur))
      cur = []
    } else {
      cur.push({ v: p.v, idx })
    }
  })
  if (cur.length >= 2) runs.push(build(cur))
  return runs
}

function areaPath(points) {
  if (props.connectNulls) {
    const n = points.length
    if (n < 2) return ''
    let d = ''
    points.forEach((p, i) => {
      const x = n > 1 ? (i / (n - 1)) * 100 : 50
      const y = 100 - ((p.v ?? 0) / maxV.value) * 100
      d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`
    })
    return `${d} L100,100 L0,100 Z`
  }
  return ''
}

const tooltip = ref({ show: false, x: 0, y: 0, time: '', rows: [] })

const rawPts = computed(() => props.points.filter(p => p.t > 0))

function onMove(e) {
  const plot = e.currentTarget.querySelector('.k-chart-plot')
  if (!plot) return
  const rect = plot.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const ratio = (e.clientX - rect.left) / rect.width
  const pts = rawPts.value
  if (pts.length < 2) return
  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(ratio * (pts.length - 1))))
  const t = pts[idx].t
  if (!Number.isFinite(t)) return
  const rows = renderedSeries.value.map(s => ({
    label: s.label,
    value: fmtTooltip(pts[idx][s.key] ?? null),
    color: s.color
  }))
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  tooltip.value = {
    show: true,
    x: Math.min(92, Math.max(8, (idx / Math.max(1, pts.length - 1)) * 100)),
    y: 15,
    time,
    rows
  }
}

function onLeave() {
  tooltip.value = { show: false, x: 0, y: 0, time: '', rows: [] }
}
</script>

<style scoped>
.k-chart {
  background: var(--k-surface);
  border: 1px solid var(--k-border);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--k-text);
}

.k-chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.k-chart-subhead {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--k-text-2);
}

.k-chart-subhead i {
  font-size: 13px;
  color: var(--chart-accent);
}

.k-chart-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
}

.k-chart-value {
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.k-chart-note {
  font-size: 10px;
  color: var(--k-text-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.k-chart-body {
  display: flex;
  gap: 6px;
  height: 118px;
  position: relative;
  min-width: 0;
}

.k-chart-body.tall {
  height: 300px;
}

.k-chart-y {
  width: 44px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 9px;
  color: var(--k-text-3);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.k-chart-plot {
  flex: 1;
  min-width: 0;
  position: relative;
}

.k-chart-plot svg {
  width: 100%;
  height: 100%;
  display: block;
}

.k-gridline {
  stroke: var(--k-border-subtle);
  stroke-width: 1;
}

.k-line {
  stroke-width: 0.8;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.k-area {
  color: var(--chart-accent);
}

.k-chart-x {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -14px;
  height: 12px;
  font-size: 9px;
  color: var(--k-text-3);
}

.k-chart-x span {
  position: absolute;
  transform: translateX(-50%);
  font-variant-numeric: tabular-nums;
}

.k-chart-tip {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 20;
  background: var(--k-tip-bg);
  color: var(--k-tip-fg);
  font-size: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.k-tip-time {
  font-weight: 700;
  margin-bottom: 3px;
}

.k-tip-row {
  display: flex;
  align-items: center;
  gap: 5px;
  line-height: 1.6;
}

.k-tip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.k-tip-label {
  opacity: 0.85;
}

.k-tip-row strong {
  margin-left: auto;
  padding-left: 8px;
  font-variant-numeric: tabular-nums;
}
</style>