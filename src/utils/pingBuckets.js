// 将 ping 记录聚合成最近 1 小时的桶模型（延迟均值 / 丢包率）

export function buildPingModel(records, bucketCount = 24) {
  const windowMs = 60 * 60 * 1000
  const bucketMs = windowMs / bucketCount
  const now = Date.now()
  const start = now - windowMs
  const buckets = new Array(bucketCount).fill(null).map(() => ({ sum: 0, count: 0, lost: 0, total: 0 }))
  let lastValue = null

  for (const r of records || []) {
    const t = new Date(r.time || r.created_at || '').getTime()
    if (isNaN(t)) continue
    const v = typeof r.value === 'number' ? r.value : parseFloat(r.value)
    if (isNaN(v)) continue

    if (t >= start && t <= now) {
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((t - start) / bucketMs)))
      const b = buckets[idx]
      b.total++
      if (v >= 0) {
        b.sum += v
        b.count++
      } else {
        b.lost++
      }
    }
    if (v >= 0) lastValue = v
  }

  return {
    lastValue,
    buckets: buckets.map(b => ({
      latency: b.count ? b.sum / b.count : null,
      loss: b.total ? (b.lost / b.total) * 100 : null
    }))
  }
}
