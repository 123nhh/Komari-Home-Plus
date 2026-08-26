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
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
  /* Discord 式：纯国旗 emoji，不加边框/底色 */
  background: transparent;
  border: none;
  border-radius: 0;
}

.k-flag-fallback {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--k-text-3);
}
</style>
