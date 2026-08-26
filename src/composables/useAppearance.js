// 明暗主题偏好（全局生效，localStorage 持久化，默认跟随现有深色风格）
import { ref, watchEffect } from 'vue'

const KEY = 'komari_appearance'
const APPEARANCES = ['dark', 'light', 'system']

function readStored() {
  try {
    const v = localStorage.getItem(KEY)
    return APPEARANCES.includes(v) ? v : 'dark'
  } catch {
    return 'dark'
  }
}

function systemIsDark() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(value) {
  if (value === 'system') return systemIsDark() ? 'dark' : 'light'
  return value === 'light' ? 'light' : 'dark'
}

const appearance = ref(readStored())

function apply() {
  if (typeof document === 'undefined') return
  const resolved = resolve(appearance.value)
  document.documentElement.dataset.appearance = resolved
  document.documentElement.style.colorScheme = resolved
}

watchEffect(() => {
  try {
    localStorage.setItem(KEY, appearance.value)
  } catch {}
})

if (typeof matchMedia !== 'undefined') {
  const media = matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', () => {
    if (appearance.value === 'system') apply()
  })
}

apply()

export function useAppearance() {
  return {
    appearance,
    setAppearance(value) {
      if (APPEARANCES.includes(value)) {
        appearance.value = value
        apply()
      }
    }
  }
}
