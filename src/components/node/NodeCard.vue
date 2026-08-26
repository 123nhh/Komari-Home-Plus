<template>
  <article class="k-card" :class="{ offline: !model.online }" @click="goInstance">
    <header class="k-card-head">
      <div class="k-card-title-block">
        <div class="k-card-title-row">
          <span class="k-card-name" :title="model.name">{{ model.name }}</span>
          <span class="k-card-status" :class="model.online ? 'on' : 'off'">
            <i class="bi bi-circle-fill"></i>
          </span>
        </div>
        <div v-if="model.subtitle || showIpBadges" class="k-card-subtitle-row">
          <span v-if="model.subtitle" class="k-card-subtitle" :title="model.subtitle">{{ model.subtitle }}</span>
          <IpStackBadges v-if="showIpBadges" :ipv4="model.ipv4" :ipv6="model.ipv6" />
        </div>
      </div>
      <div class="k-card-actions">
        <OsLogo :os="model.os" />
      </div>
    </header>

    <div class="k-card-stack">
      <div class="k-metric-grid">
        <MetricBar
          icon="bi-cpu"
          label="CPU"
          :value-text="model.cpuPct.toFixed(0)"
          unit="%"
          :detail-text="(model.cores || 0) + ' 核'"
          :fraction="model.cpuPct / 100"
          paint="var(--k-cpu)"
        />
        <MetricBar
          icon="bi-memory"
          label="内存"
          :value-text="model.memPct.toFixed(0)"
          unit="%"
          :detail-text="formatBytes(model.memUsed) + ' / ' + formatBytes(model.memTotal)"
          :fraction="model.memPct / 100"
          paint="var(--k-memory)"
        />
        <MetricBar
          icon="bi-hdd"
          label="磁盘"
          :value-text="model.diskPct.toFixed(0)"
          unit="%"
          :detail-text="formatBytes(model.diskUsed) + ' / ' + formatBytes(model.diskTotal)"
          :fraction="model.diskPct / 100"
          paint="var(--k-disk)"
        />
        <MetricBar
          icon="bi-speedometer2"
          label="负载"
          :value-text="model.load.toFixed(2)"
          :fraction="model.loadFraction"
          paint="var(--k-load)"
        />
      </div>

      <TrafficSection
        :net-out="model.netOut"
        :net-in="model.netIn"
        :traffic-up="model.trafficUp"
        :traffic-down="model.trafficDown"
        :trend-up="trendUp"
        :trend-down="trendDown"
      />

      <TrafficQuota
        v-if="model.quota"
        :fraction="model.quota.fraction"
        :remaining-label="model.quota.remainingLabel"
        :detail="model.quota.detail"
        :type-label="model.quota.typeLabel"
      />

      <HealthSection :ping="ping" />
    </div>

    <footer class="k-card-foot">
      <span v-if="model.expire" class="k-foot-expire" :class="model.expire.tone">
        <i class="bi bi-calendar3"></i>{{ model.expire.label }}
      </span>
      <span class="k-foot-uptime" :title="'运行时间'">
        <i class="bi bi-clock-history"></i>{{ model.uptime }}
      </span>
      <span v-if="model.price" class="k-foot-price" :class="{ free: model.price.free }" :title="'续费价格'">
        <i class="bi bi-tag"></i>{{ model.price.label }}
      </span>
      <span v-for="t in model.tags" :key="t" class="k-foot-tag" :title="model.tags.join(' · ')">{{ t }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNodeCardModel } from '@/composables/useNodeCardModel'
import { useThemeSettings } from '@/composables/useThemeSettings'
import { formatBytes } from '@/utils/format'
import OsLogo from './OsLogo.vue'
import IpStackBadges from './IpStackBadges.vue'
import MetricBar from './MetricBar.vue'
import TrafficSection from './TrafficSection.vue'
import TrafficQuota from './TrafficQuota.vue'
import HealthSection from './HealthSection.vue'

const props = defineProps({
  node: { type: Object, required: true },
  live: { type: Object, default: null },
  trend: { type: Object, default: () => ({ up: [], down: [] }) },
  ping: { type: Object, default: () => ({ lastValue: null, loss: null, buckets: [] }) }
})

const router = useRouter()
const { settings } = useThemeSettings()
const showIpBadges = computed(() => settings.value.enableIpBadges === true)
const model = useNodeCardModel(
  computed(() => props.node),
  computed(() => props.live)
)

const trendUp = computed(() => props.trend?.up || [])
const trendDown = computed(() => props.trend?.down || [])

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
  padding: 14px 16px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--k-text);
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 420px;
}

.k-card:hover {
  background: var(--k-surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.k-card.offline {
  opacity: 0.72;
}

.k-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.k-card-title-block {
  min-width: 0;
  flex: 1;
}

.k-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.k-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--k-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.k-card-status {
  display: inline-flex;
  flex-shrink: 0;
  font-size: 7px;
}

.k-card-status.on {
  color: var(--k-online);
  filter: drop-shadow(0 0 3px var(--k-online));
}

.k-card-status.off {
  color: var(--k-offline);
}

.k-card-subtitle-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  min-width: 0;
}

.k-card-subtitle {
  font-size: 11px;
  color: var(--k-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.k-card-actions {
  flex-shrink: 0;
}

.k-card-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.k-metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.k-card-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  padding-top: 10px;
  border-top: 1px solid var(--k-border-subtle);
  font-size: 10px;
  color: var(--k-text-3);
}

.k-card-foot i {
  margin-right: 3px;
  font-size: 9px;
}

.k-foot-expire {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.k-foot-expire.ok { color: var(--k-expire-ok); }
.k-foot-expire.urgent { color: var(--k-expire-urgent); }
.k-foot-expire.expired { color: var(--k-expire-expired); }

.k-foot-uptime {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.k-foot-price {
  display: inline-flex;
  align-items: center;
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
