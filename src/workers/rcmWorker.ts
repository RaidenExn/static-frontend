// Web Worker for offloading RCM activity calculations and repeat tracker processing

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data

  if (type === 'CALCULATE_RCM_FINANCES') {
    const { activities } = payload || {}
    let totalGross = 0
    let totalDisputed = 0
    let totalNet = 0

    if (Array.isArray(activities)) {
      for (const row of activities) {
        const gross = Number(row?.grossAmount || row?.amount || row?.netAmount || 0)
        const disputed = Number(row?.disputedAmount || row?.deniedAmount || 0)
        totalGross += isNaN(gross) ? 0 : gross
        totalDisputed += isNaN(disputed) ? 0 : disputed
      }
      totalNet = totalGross - totalDisputed
    }

    self.postMessage({
      type: 'CALCULATE_RCM_FINANCES_RESULT',
      result: {
        totalGross,
        totalDisputed,
        totalNet
      }
    })
  }

  if (type === 'FILTER_ACTIVITIES') {
    const { activities, query, statusFilter } = payload || {}
    if (!Array.isArray(activities)) {
      self.postMessage({ type: 'FILTER_ACTIVITIES_RESULT', result: [] })
      return
    }

    const q = (query || '').toLowerCase().trim()
    const sf = (statusFilter || '').toLowerCase().trim()

    const filtered = activities.filter((row: any) => {
      const code = String(row?.activityCode || row?.code || '').toLowerCase()
      const desc = String(row?.activityDescription || row?.description || '').toLowerCase()
      const status = String(row?.status || '').toLowerCase()

      const matchesQuery = !q || code.includes(q) || desc.includes(q)
      const matchesStatus = !sf || status.includes(sf)

      return matchesQuery && matchesStatus
    })

    self.postMessage({ type: 'FILTER_ACTIVITIES_RESULT', result: filtered })
  }
}

export {}
