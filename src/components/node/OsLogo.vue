<template>
  <span class="k-os" :title="os || '系统'">
    <i :class="icon"></i>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { osIcon } from '@/utils/os'

const props = defineProps({
  os: { type: String, default: '' }
})

const icon = computed(() => osIcon(props.os))
</script>

<style scoped>
.k-os {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--k-surface-2);
  border: 1px solid var(--k-border-subtle);
  color: var(--k-text-2);
  font-size: 12px;
  flex-shrink: 0;
}
</style>
