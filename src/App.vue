<template>
  <div id="app">
    <!-- 背景 -->
    <div class="background" :style="bgStyle"></div>

    <!-- 遮罩层 -->
    <Mask />

    <!-- 顶栏导航 -->
    <NavBar />

    <!-- 主内容 -->
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 页脚 -->
    <footer>
      <Foot />
    </footer>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import Mask from '@/pages/Layout/Mask.vue'
import NavBar from '@/pages/Layout/NavBar.vue'
import Foot from '@/pages/Layout/Footer.vue'
import { useThemeSettings } from '@/composables/useThemeSettings'

const { settings } = useThemeSettings()

const bgStyle = computed(() => {
  const url = settings.value.backgroundImageUrl
  return url
    ? { backgroundImage: `url('${url}')` }
    : {}
})

// 主题 favicon：文件在主题专属路径 /komarihomeplus/ 下，避免覆盖 Komari 根路径的 /favicon.ico。
// 开关默认开启；关闭时移除 link，浏览器自动回退到 Komari 自带 favicon。
const FAVICON_ID = 'theme-favicon'
const FAVICON_HREF = import.meta.env.BASE_URL + 'komarihomeplus/favicon.ico'

watchEffect(() => {
  const enabled = settings.value.themeFaviconEnabled !== false
  let link = document.getElementById(FAVICON_ID)
  if (enabled) {
    if (!link) {
      link = document.createElement('link')
      link.id = FAVICON_ID
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = FAVICON_HREF
  } else if (link) {
    link.remove()
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 拉丁字符优先落到 Roboto/system-ui，避免安卓端用 CJK 字体渲染拉丁文本导致行宽异常膨胀 */
  font-family: "Segoe UI", system-ui, Roboto, "Noto Sans SC", sans-serif;
  position: relative;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a2e no-repeat center center fixed;
  background-size: cover;
  z-index: -2;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 20px;
  padding-top: 80px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

#app::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: -1;
}

footer {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

/* 路由过渡动画 */
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.3s ease;
}

.page-fade-enter-active {
  transition: transform 0.3s ease;
}

.page-fade-enter-from {
  transform: translateY(12px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
