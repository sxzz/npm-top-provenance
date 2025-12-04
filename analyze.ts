import results from './full-results.json' with { type: 'json' }
import type { Results } from './index.ts'

export const provenance: string[] = []
export const trusted: string[] = []
export const untrusted: string[] = []
const items = Object.entries(results as any as Results)
export const count: number = items.length
for (const [name, result] of items) {
  const state = result?.[1]
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  } else {
    untrusted.push(name)
  }
}
