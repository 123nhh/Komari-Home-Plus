// 操作系统字符串 → Bootstrap 图标

const OS_RULES = [
  { re: /windows|winnt|\bwin\b|microsoft|ms|windows server/i, icon: 'bi-windows' },
  { re: /macos|mac os|osx|darwin|apple/i, icon: 'bi-apple' },
  { re: /ubuntu|elementary/i, icon: 'bi-ubuntu' },
  { re: /android/i, icon: 'bi-android' },
  { re: /debian|ubuntu/i, icon: 'bi-terminal-fill' }
]

const DEFAULT_ICON = 'bi-terminal-fill'

export function osIcon(os) {
  const value = (os || '').trim()
  if (!value) return DEFAULT_ICON
  for (const rule of OS_RULES) {
    if (rule.re.test(value)) return rule.icon
  }
  return DEFAULT_ICON
}
