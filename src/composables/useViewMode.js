// 探针页卡片视图模式（large / compact / mini / list，localStorage 持久化）
import { ref } from 'vue'

const KEY = 'komari_view_mode'
const MODES = ['large', 'compact', 'mini', 'list']
const LABELS = { large: '大视图', compact: '小视图', mini: '迷你视图', list: '列表视图' }

function readStored() {
  try {
    const v = localStorage.getItem(KEY)
    return MODES.includes(v) ? v : 'large'
  } catch {
    return 'large'
  }
}

const mode = ref(readStored())

function persist() {
  try {
    localStorage.setItem(KEY, mode.value)
  } catch {}
}

export function useViewMode() {
  function setMode(m) {
    if (MODES.includes(m)) {
      mode.value = m
      persist()
    }
  }
  function cycle() {
    setMode(MODES[(MODES.indexOf(mode.value) + 1) % MODES.length])
  }
  return { mode, MODES, LABELS, setMode, cycle }
}
