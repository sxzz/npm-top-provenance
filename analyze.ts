import results from './full-results.json' with { type: 'json' }
import type { Results } from './index.ts'

export const provenance: string[] = []
export const trusted: string[] = []
export const untrusted: string[] = []
const items = Object.entries(results as any as Results)
for (const [name, result] of items) {
  const state = result?.[1]
  switch (state) {
    case 'trustedPublisher':
      trusted.push(name)
      break
    case true:
      provenance.push(name)
      break
    case false:
      untrusted.push(name)
      break
  }
}
export const count: number =
  provenance.length + trusted.length + untrusted.length
