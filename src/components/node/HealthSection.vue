<template>
  <div class="k-health">
    <div class="k-health-block">
      <div class="k-health-head">
        <span class="k-health-label"><i class="bi bi-activity"></i>延迟</span>
        <span v-if="ping.lastValue !== null && ping.lastValue !== undefined" class="k-health-value" :style="{ color: latencyColor }">
          {{ Math.round(ping.lastValue) }}<small>ms</small>
        </span>
        <span v-else class="k-health-value empty">—</span>
      </div>
      <BucketBars v-if="hasData" :buckets="ping.buckets" metric="latency" :max="300" />
      <div v-else class="k-health-empty">未配置 Ping</div>
    </div>
    <div class="k-health-block">
      <div class="k-health-head">
        <span class="k-health-label"><i class="bi bi-x-circle"></i>丢包率</span>
        <span v-if="ping.loss !== null && ping.loss !== undefined" class="k-health-value" :style="{ color: lossColor }">
          {{ ping.loss.toFixed(1) }}<small>%</small>
        </span>
        <span v-else class="k-health-value empty">—</span>
      </div>
      <BucketBars v-if="hasData" :buckets="ping.buckets" metric="loss" :max="100" />
      <div v-else class="k-health-empty">未配置 Ping</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BucketBars from './BucketBars.vue'

const props = defineProps({
  ping: { type: Object, default: () => ({ lastValue: null, loss: null, buckets: [] }) }
})

const hasData = computed(() => {
  const b = props.ping.buckets
  return Array.isArray(b) && b.some(x => x && (x.latency !== null || x.loss !== null))
})

function latencyColorFor(v) {
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 30) return 'var(--k-lat-1)'
  if (v <= 80) return 'var(--k-lat-2)'
  if (v <= 150) return 'var(--k-lat-3)'
  if (v <= 300) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
}

function lossColorFor(v) {
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 1) return 'var(--k-lat-1)'
  if (v <= 3) return 'var(--k-lat-2)'
  if (v <= 8) return 'var(--k-lat-3)'
  if (v <= 20) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
}

const latencyColor = computed(() => latencyColorFor(props.ping.lastValue))
const lossColor = computed(() => lossColorFor(props.ping.loss))
</script>

<style scoped>
.k-health {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.k-health-block {
  min-width: 0;
}

.k-health-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
}

.k-health-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--k-text-2);
}

.k-health-label i {
  font-size: 11px;
}

.k-health-value {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.k-health-value small {
  margin-left: 1px;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.8;
}

.k-health-value.empty {
  color: var(--k-text-3);
}

.k-health-empty {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--k-text-3);
  background: var(--k-surface-2);
  border: 1px dashed var(--k-border-subtle);
  border-radius: 6px;
}
</style>
