<template>
  <article class="k-card k-compact" :class="{ offline: !model.online }" @click="goInstance">
    <header class="k-compact-head">
      <div class="k-compact-title">
        <FlagIcon :region="model.region" />
        <span class="k-compact-name" :title="model.name">{{ model.name }}</span>
        <span class="k-card-status" :class="model.online ? 'on' : 'off'">
          <i class="bi bi-circle-fill"></i>
        </span>
      </div>
      <OsLogo :os="model.os" />
    </header>

    <div class="k-compact-metrics">
      <div class="k-compact-metric">
        <span class="k-compact-metric-label"><i class="bi bi-cpu"></i>CPU</span>
        <span class="k-compact-metric-val" style="color: var(--k-cpu)">{{ model.cpuPct.toFixed(0) }}%</span>
      </div>
      <div class="k-compact-metric">
        <span class="k-compact-metric-label"><i class="bi bi-memory"></i>内存</span>
        <span class="k-compact-metric-val" style="color: var(--k-memory)">{{ model.memPct.toFixed(0) }}%</span>
      </div>
      <div class="k-compact-metric">
        <span class="k-compact-metric-label"><i class="bi bi-hdd"></i>磁盘</span>
        <span class="k-compact-metric-val" style="color: var(--k-disk)">{{ model.diskPct.toFixed(0) }}%</span>
      </div>
      <div class="k-compact-metric">
        <span class="k-compact-metric-label"><i class="bi bi-speedometer2"></i>负载</span>
        <span class="k-compact-metric-val" style="color: var(--k-load)">{{ model.load.toFixed(1) }}</span>
      </div>
    </div>

    <div class="k-compact-health" v-if="ping.lastValue !== null || ping.loss !== null">
      <span :style="{ color: latencyColor }">
        <i class="bi bi-activity"></i>{{ ping.lastValue !== null ? Math.round(ping.lastValue) + 'ms' : '—' }}
      </span>
      <span :style="{ color: lossColor }">
        <i class="bi bi-x-circle"></i>{{ ping.loss !== null ? ping.loss.toFixed(1) + '%' : '—' }}
      </span>
      <span class="k-compact-net">
        <i class="bi bi-arrow-down-up"></i>{{ formatRate(model.netIn + model.netOut) }}
      </span>
    </div>
    <div class="k-compact-health" v-else>
      <span class="k-compact-net">
        <i class="bi bi-arrow-down-up"></i>{{ formatRate(model.netIn + model.netOut) }}
      </span>
    </div>

    <footer class="k-compact-foot">
      <span v-if="model.expire" class="k-foot-expire" :class="model.expire.tone">{{ model.expire.label }}</span>
      <span v-if="model.price" class="k-foot-price" :class="{ free: model.price.free }">{{ model.price.label }}</span>
      <span v-for="t in model.tags.slice(0, 3)" :key="t" class="k-foot-tag">{{ t }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNodeCardModel } from '@/composables/useNodeCardModel'
import { formatRate } from '@/utils/format'
import FlagIcon from './FlagIcon.vue'
import OsLogo from './OsLogo.vue'

const props = defineProps({
  node: { type: Object, required: true },
  live: { type: Object, default: null },
  ping: { type: Object, default: () => ({ lastValue: null, loss: null, buckets: [] }) }
})

const router = useRouter()
const model = useNodeCardModel(
  computed(() => props.node),
  computed(() => props.live)
)

const ping = computed(() => props.ping)
const latencyColor = computed(() => {
  const v = props.ping?.lastValue
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 30) return 'var(--k-lat-1)'
  if (v <= 80) return 'var(--k-lat-2)'
  if (v <= 150) return 'var(--k-lat-3)'
  if (v <= 300) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
})
const lossColor = computed(() => {
  const v = props.ping?.loss
  if (v === null || v === undefined) return 'var(--k-text-3)'
  if (v <= 1) return 'var(--k-lat-1)'
  if (v <= 3) return 'var(--k-lat-2)'
  if (v <= 8) return 'var(--k-lat-3)'
  if (v <= 20) return 'var(--k-lat-4)'
  return 'var(--k-lat-5)'
})

function goInstance() {
  router.push({ path: '/komari/instance', query: { uuid: props.node.uuid } })
}
</script>

<style scoped>
.k-card {
  background: var(--k-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--k-border);
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--k-text);
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 220px;
}

.k-card:hover {
  background: var(--k-surface-hover);
  transform: translateY(-2px);
}

.k-card.offline {
  opacity: 0.72;
}

.k-compact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.k-compact-title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.k-compact-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.k-card-status {
  display: inline-flex;
  flex-shrink: 0;
  font-size: 6px;
}

.k-card-status.on { color: var(--k-online); filter: drop-shadow(0 0 3px var(--k-online)); }
.k-card-status.off { color: var(--k-offline); }

.k-compact-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
}

.k-compact-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
}

.k-compact-metric-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--k-text-2);
  font-weight: 600;
}

.k-compact-metric-label i { font-size: 10px; }

.k-compact-metric-val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.k-compact-health {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--k-text-2);
  padding-top: 8px;
  border-top: 1px solid var(--k-border-subtle);
}

.k-compact-health i {
  margin-right: 3px;
  font-size: 10px;
}

.k-compact-net {
  color: var(--k-text-3);
  margin-left: auto;
  font-weight: 500;
}

.k-compact-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.k-foot-expire.ok { color: var(--k-expire-ok); }
.k-foot-expire.urgent { color: var(--k-expire-urgent); }
.k-foot-expire.expired { color: var(--k-expire-expired); }

.k-foot-price {
  padding: 1px 7px;
  border-radius: 8px;
  background: var(--k-price-bg);
  color: var(--k-price-fg);
  white-space: nowrap;
}

.k-foot-price.free {
  background: var(--k-tag-bg);
  color: var(--k-tag-fg);
}

.k-foot-tag {
  padding: 1px 7px;
  border-radius: 8px;
  background: var(--k-tag-bg);
  color: var(--k-tag-fg);
  white-space: nowrap;
}
</style>
