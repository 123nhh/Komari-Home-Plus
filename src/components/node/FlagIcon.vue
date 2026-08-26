<template>
  <span v-if="emoji" class="k-flag" :title="region || ''">{{ emoji }}</span>
  <span v-else-if="region" class="k-flag k-flag-fallback" :title="region">{{ region }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { getFlagEmoji } from '@/utils/geo'

const props = defineProps({
  region: { type: String, default: '' }
})

const emoji = computed(() => getFlagEmoji(props.region))
</script>

<style scoped>
.k-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--k-surface-2);
  border: 1px solid var(--k-border-subtle);
}

.k-flag-fallback {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--k-text-3);
}
</style>
