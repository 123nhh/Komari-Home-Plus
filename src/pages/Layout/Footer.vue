<template>
  <div class="footer-container">
    <div class="footer-bar">
      <span>Powered by <a href="https://github.com/komari-monitor/komari" target="_blank">Komari Monitor</a>{{ version ? ' v' + version : '' }}</span>
      <span> With <a href="https://github.com/123nhh/Komari-Home-Plus" target="_blank">Komari Home Plus</a></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { rpcCall } from '@/utils/rpc'

const version = ref('')

onMounted(() => {
  rpcCall('public:getVersion')
    .then(data => {
      version.value = data.version || ''
    })
    .catch(() => {})
})
</script>

<style scoped>
.footer-container {
  width: 100%;
  max-width: 1200px;
  padding: 1rem 2rem;
}

.footer-bar {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255, 0.1);
  padding: 0.8rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.footer-bar a {
  color: #fff;
  text-decoration: none;
}

.footer-bar a:hover {
  color: #66ccff;
}
</style>