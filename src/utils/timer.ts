/**
 * Simple operation timer for performance metrics.
 */

export interface TimingResult {
  label: string
  durationMs: number
}

export class Timer {
  private timings: TimingResult[] = []
  private current: { label: string; start: number } | null = null

  start(label: string) {
    this.current = { label, start: Date.now() }
  }

  stop(): TimingResult | null {
    if (!this.current) return null
    const result = {
      label: this.current.label,
      durationMs: Date.now() - this.current.start
    }
    this.timings.push(result)
    this.current = null
    return result
  }

  summary(): string {
    const total = this.timings.reduce((sum, t) => sum + t.durationMs, 0)
    const lines = [`Complete in ${(total / 1000).toFixed(1)}s`]
    for (const t of this.timings) {
      lines.push(`  ${t.label}: ${(t.durationMs / 1000).toFixed(1)}s`)
    }
    return lines.join('\n')
  }
}
