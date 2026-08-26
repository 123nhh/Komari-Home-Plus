// 资产概览：币种换算 + 剩余预付价值计算（移植自 LuminaPlus utils/cost.ts，去掉溢价/忽略名单）
import { remainingDays } from '@/utils/format'

const COST_TARGET_CURRENCY = 'CNY'
export const DEFAULT_COST_RATE_API_URL = 'https://api.frankfurter.dev/v2/rates?base=USD'
const RATE_CACHE_TTL_MS = 60 * 60 * 1000
const RATE_CACHE_KEY_PREFIX = 'komari_cost_rates_'
const RATE_REQUEST_TIMEOUT_MS = 10000

const CURRENCY_ALIASES = {
  '$': 'USD', 'US$': 'USD', '$US': 'USD', USD: 'USD', '美元': 'USD', '美金': 'USD',
  '€': 'EUR', EUR: 'EUR', '欧元': 'EUR',
  '￥': 'CNY', '¥': 'CNY', CNY: 'CNY', RMB: 'CNY', 'CN¥': 'CNY', '人民币': 'CNY', '元': 'CNY',
  'HK$': 'HKD', HKD: 'HKD', '港币': 'HKD', '港元': 'HKD',
  'NT$': 'TWD', TWD: 'TWD', '台币': 'TWD', '新台币': 'TWD',
  JPY: 'JPY', 'JP¥': 'JPY', '日元': 'JPY', '円': 'JPY',
  '£': 'GBP', GBP: 'GBP', '英镑': 'GBP',
  'S$': 'SGD', SGD: 'SGD', '新币': 'SGD', '新加坡元': 'SGD',
  'A$': 'AUD', 'AU$': 'AUD', AUD: 'AUD', '澳元': 'AUD',
  'C$': 'CAD', 'CA$': 'CAD', CAD: 'CAD', '加元': 'CAD'
}

function currencyCode(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return COST_TARGET_CURRENCY
  const key = raw.toUpperCase().replace(/\s+/g, '')
  return CURRENCY_ALIASES[key] || (/^[A-Z]{3}$/.test(key) ? key : '')
}

export function convertToCny(amount, currency, rates) {
  const code = currencyCode(currency)
  if (!code) return null
  if (code === COST_TARGET_CURRENCY) return amount
  if (!rates[code] || !rates[COST_TARGET_CURRENCY]) return null
  return (amount / rates[code]) * rates[COST_TARGET_CURRENCY]
}

function parseRatePayload(payload) {
  const rates = { USD: 1 }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const rate = Number(item?.rate)
      if (typeof item?.quote === 'string' && Number.isFinite(rate) && rate > 0) {
        rates[item.quote.toUpperCase()] = rate
      }
    }
  } else if (payload && typeof payload === 'object' && payload.rates) {
    for (const [key, value] of Object.entries(payload.rates)) {
      const rate = Number(value)
      if (Number.isFinite(rate) && rate > 0) rates[key.toUpperCase()] = rate
    }
  }
  if (!rates[COST_TARGET_CURRENCY]) throw new Error('target rate missing')
  return { rates }
}

function readRateCache(cacheKey, allowExpired = false) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null')
    if (!cached || typeof cached !== 'object') return null
    const age = Date.now() - cached.time
    if (!Number.isFinite(cached.time) || age < 0 || (!allowExpired && age >= RATE_CACHE_TTL_MS)) {
      return null
    }
    return cached
  } catch {
    return null
  }
}

export async function getExchangeRates(rateApiUrl = DEFAULT_COST_RATE_API_URL) {
  const cacheKey = RATE_CACHE_KEY_PREFIX + rateApiUrl
  const cached = readRateCache(cacheKey)
  if (cached) return cached.rates

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RATE_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(rateApiUrl, { cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error(`rate http ${response.status}`)
    const { rates } = parseRatePayload(await response.json())
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ rates, time: Date.now() }))
    } catch {}
    return rates
  } catch (e) {
    if (e.name === 'AbortError') throw e
    const old = readRateCache(cacheKey, true)
    if (old) return old.rates
    throw e
  } finally {
    clearTimeout(timer)
  }
}

function cycleMonths(days) {
  if (days === 365 || days === 360) return 12
  if (days === 30) return 1
  if (days > 0 && days % 365 === 0) return (days / 365) * 12
  if (days > 0) return days / 30
  return 0
}

function remainingCycleValue(price, cycleDays, expiredAt, atMs = Date.now()) {
  const expiresMs = expiredAt ? new Date(expiredAt).getTime() : NaN
  if (isNaN(expiresMs)) return price
  const diffMs = expiresMs - atMs
  if (diffMs <= 0) return 0
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365)
  if (diffYears > 100) return price
  if (cycleDays > 0) {
    return price * (diffMs / (cycleDays * 24 * 60 * 60 * 1000))
  }
  return price
}

// 忽略名单：与节点身份匹配（大小写无关，UUID / 名称任一命中即忽略）
// 移植自 LuminaPlus utils/nodeIdentity.ts
export function normalizeNodeIdentityList(value) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,，;；]+/)
      : []
  return Array.from(
    new Set(
      rawValues
        .map(item =>
          typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''
        )
        .filter(Boolean)
    )
  )
}

const IDENTITY_FIELDS = [
  'id',
  'uuid',
  'name',
  'display_name',
  'remark',
  'alias',
  'public_remark'
]

export function buildNodeIdentitySet(values) {
  return new Set(values.map(v => String(v == null ? '' : v).trim().toLowerCase()).filter(Boolean))
}

export function nodeMatchesIdentitySet(node, identitySet) {
  if (identitySet.size === 0) return false
  for (const field of IDENTITY_FIELDS) {
    const normalized = String(node?.[field] ?? '').trim().toLowerCase()
    if (normalized && identitySet.has(normalized)) return true
  }
  return false
}

export function calculateCostSummary(nodes, rates, ignoredNodes = [], now = Date.now()) {
  let totalCny = 0
  let monthlyCny = 0
  let remainingCny = 0
  let ignoredCny = 0
  const details = []
  const ignored = buildNodeIdentitySet(normalizeNodeIdentityList(ignoredNodes))

  for (const node of nodes || []) {
    const price = Number(node.price) || 0
    const cycleDays = Number(node.billing_cycle) || 30

    if (nodeMatchesIdentitySet(node, ignored)) {
      ignoredCny += price
      details.push({ uuid: node.uuid, name: node.name, monthlyCny: 0, remainingCny: 0, ignored: true })
      continue
    }
    if (price <= 0) continue

    const converted = convertToCny(price, node.currency, rates)
    if (converted == null || !Number.isFinite(converted)) continue

    const months = cycleMonths(cycleDays)
    const monthly = months > 0 ? converted / months : 0
    const remaining = remainingCycleValue(converted, cycleDays, node.expired_at, now)

    totalCny += monthly * 12
    monthlyCny += monthly
    remainingCny += remaining
    details.push({ uuid: node.uuid, name: node.name, monthlyCny: monthly, remainingCny: remaining })
  }

  details.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
  return { totalCny, monthlyCny, remainingCny, ignoredCny, details }
}

const CNY_MONEY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatCnyMoney(value) {
  return `¥ ${CNY_MONEY_FORMATTER.format(value || 0)}`
}

// 复用：到期剩余天数辅助
export { remainingDays }