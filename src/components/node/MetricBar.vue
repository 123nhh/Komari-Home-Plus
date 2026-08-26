<template>
  <div class="k-metric">
    <div class="k-metric-head">
      <span class="k-metric-label">
        <i :class="icon"></i>{{ label }}
      </span>
      <span class="k-metric-value">
        <strong>{{ valueText }}</strong>
        <small v-if="unit">{{ unit }}</small>
      </span>
    </div>
    <div v-if="detailText" class="k-metric-detail" :title="detailText">{{ detailText }}</div>
    <div class="k-metric-track" :style="{ '--k-seg-paint': paint }">
      <span
        v-for="i in SEGMENTS"
        :key="i"
        class="k-metric-seg"
        :class="{ active: i <= activeSegments }"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, default: 'bi-circle-fill' },
  label: { type: String, default: '' },
  valueText: { type: String, default: '0' },
  unit: { type: String, default: '' },
  detailText: { type: String, default: '' },
  fraction: { type: Number, default: 0 },
  paint: { type: String, default: 'var(--k-cpu)' }
})

const SEGMENTS = 18
const clamped = computed(() => Math.max(0, Math.min(1, props.fraction)))
const activeSegments = computed(() => Math.round(clamped.value * SEGMENTS))
</script>

<style scoped>
.k-metric {
  min-width: 0;
}

.k-metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.k-metric-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--k-text-2);
  white-space: nowrap;
}

.k-metric-label i {
  font-size: 12px;
}

.k-metric-value {
  font-size: 13px;
  color: var(--k-text);
  white-space: nowrap;
  text-align: right;
}

.k-metric-value strong {
  font-weight: 700;
}

.k-metric-value small {
  margin-left: 1px;
  font-size: 11px;
  color: var(--k-text-3);
}

.k-metric-detail {
  margin-top: 2px;
  font-size: 10px;
  color: var(--k-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.k-metric-track {
  display: flex;
  gap: 2px;
  height: 6px;
  margin-top: 4px;
}

.k-metric-seg {
  flex: 1;
  min-width: 1px;
  border-radius: 1.5px;
  background: var(--k-progress-bg);
  transition: background 0.4s ease;
}

.k-metric-seg.active {
  background: var(--k-seg-paint);
}
</style>
