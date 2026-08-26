<template>
  <span class="k-ip-badges" v-if="ipv4 || ipv6">
    <span v-if="ipv4" class="k-ip" title="IPv4">
      <i class="bi bi-globe2"></i>{{ ipv4 }}
    </span>
    <span v-if="ipv6" class="k-ip" title="IPv6">
      <i class="bi bi-globe"></i>{{ ipv6 }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  ipv4: { type: String, default: '' },
  ipv6: { type: String, default: '' }
})
</script>

<style scoped>
.k-ip-badges {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.k-ip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 130px;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--k-text-3);
  background: var(--k-surface-2);
  border: 1px solid var(--k-border-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.k-ip i {
  font-size: 9px;
}
</style>
