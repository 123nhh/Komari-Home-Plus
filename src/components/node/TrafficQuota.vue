<template>
  <div class="k-quota" :title="`流量阈值 · ${typeLabel}`">
    <div class="k-quota-head">
      <span class="k-quota-label">
        <i class="bi bi-database"></i>剩余流量
        <strong>{{ remainingLabel }}</strong>
      </span>
      <span class="k-quota-usage">{{ detail }}</span>
    </div>
    <div class="k-quota-track">
      <span
        v-for="(c, i) in SEGMENT_COLORS"
        :key="i"
        class="k-quota-seg"
        :class="{ lit: litCount === -1 ? i === 0 : i < litCount }"
        :style="{ background: litCount === -1 && i === 0 ? sliverBg(c) : (litCount === -1 ? 'var(--k-progress-bg)' : (i < litCount ? c : 'var(--k-progress-bg)')) }"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const SEGMENTS = 18

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  return `rgb(${r},${g},${b})`
}

const SEGMENT_COLORS = Array.from({ length: SEGMENTS }, (_, i) => {
  const t = (i + 0.5) / SEGMENTS
  const hue = 150 - t * 140
  return hslToRgb(hue, 70, 44)
})

const props = defineProps({
  fraction: { type: Number, default: 0 },
  remainingLabel: { type: String, default: '' },
  detail: { type: String, default: '' },
  typeLabel: { type: String, default: '流量' }
})

const litCount = computed(() => {
  const f = Math.max(0, Math.min(1, props.fraction))
  let count = 0
  for (let i = 0; i < SEGMENTS; i++) {
    if ((i + 0.5) / SEGMENTS <= f) count++
    else break
  }
  if (count === 0 && f > 0) return -1
  return count
})

function sliverBg(color) {
  return `linear-gradient(to right, ${color} 0, ${color} 22%, var(--k-progress-bg) 22%, var(--k-progress-bg) 100%)`
}
</script>

<style scoped>
.k-quota {
  min-width: 0;
}

.k-quota-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}

.k-quota-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--k-text-2);
  white-space: nowrap;
  min-width: 0;
}

.k-quota-label i {
  font-size: 11px;
}

.k-quota-label strong {
  font-size: 12px;
  color: var(--k-text);
  font-weight: 700;
  margin-left: 2px;
}

.k-quota-usage {
  font-size: 10px;
  color: var(--k-text-3);
  white-space: nowrap;
}

.k-quota-track {
  display: flex;
  gap: 2px;
  height: 8px;
}

.k-quota-seg {
  flex: 1;
  min-width: 1px;
  border-radius: 1.5px;
  transition: background 0.4s ease;
}
</style>
