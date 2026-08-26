<template>
  <div class="instance-info-item">
    <span class="instance-info-label">{{ label }}</span>
    <div class="instance-info-value">{{ value }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: String, default: '' }
})
</script>

<style scoped>
.instance-info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  font-size: 12px;
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
</style>