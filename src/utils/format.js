// 通用格式化工具（探针页 / 实例详情页共用）

export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes < 1099511627776) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes < 1125899906842624) return (bytes / 1099511627776).toFixed(2) + ' TB'
  return (bytes / 1125899906842624).toFixed(2) + ' PB'
}

export function formatRate(bytes) {
  return formatBytes(bytes) + '/s'
}

export function formatUptime(sec) {
  const up = sec || 0
  if (!up) return '-'
  const days = Math.floor(up / 86400)
  const hours = Math.floor((up % 86400) / 3600)
  const mins = Math.floor((up % 3600) / 60)
  if (days > 0) return `${days}天${hours}时`
  if (hours > 0) return `${hours}时${mins}分`
  return `${mins}分`
}

export function remainingDays(expireStr) {
  if (!expireStr) return null
  const d = new Date(expireStr)
  if (isNaN(d.getTime())) return null
  return Math.ceil((d - Date.now()) / 86400000)
}

// 返回到期展示信息，无法解析时返回 null
export function expireMeta(node) {
  const days = remainingDays(node && node.expired_at)
  if (days === null || days === undefined) return null
  if (days === -1 || days > 36500) return { label: '长期有效', tone: 'ok' }
  if (days <= 0) return { label: `已过期 ${Math.abs(days)} 天`, tone: 'expired' }
  if (days <= 7) return { label: `${days} 天`, tone: 'urgent' }
  return { label: `${days} 天`, tone: 'ok' }
}

export function formatCycle(days) {
  if (days <= 0) return ''
  const checks = [
    [365, '年'],
    [92, '季'],
    [30, '月']
  ]
  for (const [base, label] of checks) {
    if (days % base === 0) {
      const n = days / base
      return n === 1 ? `/${label}` : `/${n}${label}`
    }
  }
  return `/${days}天`
}

// 返回价格展示信息，无价格时返回 null
export function priceMeta(node) {
  const p = node && node.price
  if (p === undefined || p === null) return null
  const cur = node.currency || '￥'
  if (p <= 0) return { label: '免费', free: true }
  return { label: `${cur}${p}${formatCycle(node.billing_cycle || 30)}`, free: false }
}

export function monthlyPrice(node) {
  const p = node && node.price
  const days = (node && node.billing_cycle) || 30
  if (!p || p <= 0 || days <= 0) return 0
  return +(p / days * 30).toFixed(2)
}

export function parseTags(node) {
  return (node && node.tags ? String(node.tags) : '').split(';').map(t => t.trim()).filter(Boolean)
}
