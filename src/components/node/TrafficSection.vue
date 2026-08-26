<template>
  <div class="k-traffic">
    <div class="k-traffic-row">
      <span class="k-traffic-label up">
        <i class="bi bi-arrow-up"></i>上行
      </span>
      <div class="k-traffic-chart" style="color: var(--k-up)">
        <TrendSparkline :samples="trendUp" />
      </div>
      <span class="k-traffic-rate" style="color: var(--k-up)">
        {{ rateUp }}
      </span>
      <span class="k-traffic-total" :title="'累计 ' + totalUp">{{ totalUp }}</span>
    </div>
    <div class="k-traffic-row">
      <span class="k-traffic-label down">
        <i class="bi bi-arrow-down"></i>下行
      </span>
      <div class="k-traffic-chart" style="color: var(--k-down)">
        <TrendSparkline :samples="trendDown" />
      </div>
      <span class="k-traffic-rate" style="color: var(--k-down)">
        {{ rateDown }}
      </span>
      <span class="k-traffic-total" :title="'累计 ' + totalDown">{{ totalDown }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TrendSparkline from './TrendSparkline.vue'
import { formatRate, formatBytes } from '@/utils/format'

const props = defineProps({
  netOut: { type: Number, default: 0 },
  netIn: { type: Number, default: 0 },
  trafficUp: { type: Number, default: 0 },
  trafficDown: { type: Number, default: 0 },
  trendUp: { type: Array, default: () => [] },
  trendDown: { type: Array, default: () => [] }
})

const rateUp = computed(() => formatRate(props.netOut))
const rateDown = computed(() => formatRate(props.netIn))
const totalUp = computed(() => formatBytes(props.trafficUp))
const totalDown = computed(() => formatBytes(props.trafficDown))
</script>

<style scoped>
.k-traffic {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.k-traffic-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.k-traffic-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--k-text-2);
  flex-shrink: 0;
}

.k-traffic-label i {
  font-size: 11px;
}

.k-traffic-chart {
  flex: 1;
  height: 26px;
  min-width: 40px;
}

.k-traffic-rate {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.k-traffic-total {
  font-size: 10px;
  color: var(--k-text-3);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 42px;
  text-align: right;
}
</style>
