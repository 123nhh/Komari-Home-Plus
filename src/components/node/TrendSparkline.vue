<template>
  <svg class="k-trend" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
    <path v-if="area" :d="area" fill="currentColor" fill-opacity="0.12" stroke="none"></path>
    <polyline
      v-if="points"
      :points="points"
      fill="none"
      vector-effect="non-scaling-stroke"
      stroke="currentColor"
      stroke-width="1.1"
      stroke-linejoin="round"
      stroke-linecap="round"
    ></polyline>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  samples: { type: Array, default: () => [] },
  max: { type: Number, default: 0 }
})

const W = 100
const H = 26

const series = computed(() => {
  const arr = props.samples
  const valid = arr.filter(v => Number.isFinite(v) && v >= 0)
  if (valid.length < 2) return null
  const peak = props.max > 0 ? props.max : Math.max(...valid)
  const step = W / (valid.length - 1)
  return valid.map((v, i) => {
    const x = i * step
    const y = H - Math.min(1, v / (peak || 1)) * H
    return [x, y]
  })
})

const points = computed(() => {
  const s = series.value
  return s ? s.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') : null
})

const area = computed(() => {
  const s = series.value
  if (!s) return null
  const line = s.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ').replace(/^L/, 'M')
  return `${line} L${W} ${H} L0 ${H} Z`
})
</script>

<style scoped>
.k-trend {
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
}
</style>
