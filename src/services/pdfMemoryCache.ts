class PdfMemoryCache {
  private cache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>()
  private readonly maxAge = 5 * 60 * 1000

  get(key: string): ArrayBuffer | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return undefined
    }
    return entry.buffer
  }

  set(key: string, buffer: ArrayBuffer): void {
    this.cache.set(key, { buffer, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  clearEncounter(encounterId: string): void {
    const prefix = `${encounterId}::`
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }
}

export const pdfCache = new PdfMemoryCache()
