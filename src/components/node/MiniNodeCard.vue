<template>
  <article class="k-mini" :class="{ offline: !model.online }" @click="goInstance" :title="model.subtitle">
    <div class="k-mini-head">
      <FlagIcon :region="model.region" />
      <span class="k-mini-name" :title="model.name">{{ model.name }}</span>
      <span class="k-mini-status" :class="model.online ? 'on' : 'off'"></span>
    </div>
    <div class="k-mini-stats">
      <span><i class="bi bi-cpu" style="color: var(--k-cpu)"></i>{{ model.cpuPct.toFixed(0) }}%</span>
      <span><i class="bi bi-memory" style="color: var(--k-memory)"></i>{{ model.memPct.toFixed(0) }}%</span>
      <span><i class="bi bi-hdd" style="color: var(--k-disk)"></i>{{ model.diskPct.toFixed(0) }}%</span>
      <span><i class="bi bi-arrow-down-up"></i>{{ rate }}</span>
    </div>
    <div v-if="model.expire" class="k-mini-foot" :class="model.expire.tone">
      {{ model.expire.label }}
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNodeCardModel } from '@/composables/useNodeCardModel'
import { formatRate } from '@/utils/format'
import FlagIcon from './FlagIcon.vue'

const props = defineProps({
  node: { type: Object, required: true },
  live: { type: Object, default: null }
})

const router = useRouter()
const model = useNodeCardModel(
  computed(() => props.node),
  computed(() => props.live)
)
const rate = computed(() => formatRate(model.netIn + model.netOut))

function goInstance() {
  router.push({ path: '/komari/instance', query: { uuid: props.node.uuid } })
}
</script>

<style scoped>
.k-mini {
  background: var(--k-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--k-border);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 110px;
}

.k-mini:hover {
  background: var(--k-surface-hover);
  transform: translateY(-2px);
}

.k-mini.offline {
  opacity: 0.72;
}

.k-mini-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.k-mini-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--k-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.k-mini-status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.k-mini-status.on { background: var(--k-online); box-shadow: 0 0 4px var(--k-online); }
.k-mini-status.off { background: var(--k-offline); }

.k-mini-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--k-text-2);
  min-width: 0;
}

.k-mini-stats span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.k-mini-stats span:last-child {
  margin-left: auto;
  flex-shrink: 1;
}

.k-mini-stats i {
  font-size: 10px;
  flex-shrink: 0;
}

.k-mini-foot {
  font-size: 9px;
}

.k-mini-foot.ok { color: var(--k-expire-ok); }
.k-mini-foot.urgent { color: var(--k-expire-urgent); }
.k-mini-foot.expired { color: var(--k-expire-expired); }
</style>
