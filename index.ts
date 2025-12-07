import fs from 'node:fs'
import ky, { HTTPError } from 'ky'
import { createSpinner } from 'nanospinner'
import { npmHighImpact } from 'npm-high-impact'
import pLimit from 'p-limit'

type Provenance = boolean | 'trustedPublisher'
type Result =
  | [version: string, provenance: Provenance, author: string | null]
  | null
export interface Results {
  [name: string]: Result
}

const limit = pLimit(16)

;(globalThis as any)[Symbol.for('undici.globalDispatcher.1')] = new (
  globalThis as any
)[Symbol.for('undici.globalDispatcher.1')].constructor({
  allowH2: true,
})

console.log('total:', npmHighImpact.length)
const spinner = createSpinner('Fetching...')
spinner.start()

const fullResults: Results = Object.fromEntries(
  await Promise.all(
    npmHighImpact.map(async (name) => {
      const result = await limit(() => getMetadata(name))
      spinner.update(`Fetching ${name} (${limit.pendingCount} pending)`)
      return [name, result]
    }),
  ),
)
spinner.success()
fs.writeFileSync('full-results.json', `${JSON.stringify(fullResults)}\n`)

const results = Object.fromEntries(
  Object.entries(fullResults).map(([name, result]) => {
    if (!result) return [name, null]
    const [, provenance] = result
    return [name, provenance]
  }),
)
fs.writeFileSync('results.json', `${JSON.stringify(results)}\n`)

async function getMetadata(name: string): Promise<Result> {
  const response = await ky<any>(
    // `https://registry.npmjs.org/${name}/latest`
    `https://registry.npmmirror.com/${name}/latest`, // no rate limit
    {
      retry: {
        limit: 10,
        jitter: (delay) => delay * (0.8 + Math.random() * 0.4),
        retryOnTimeout: true,
      },
    },
  )
    .json()
    .catch((error) => {
      if (error instanceof HTTPError && error.response.status === 404) {
        return null
      }

      console.warn(`\nFailed to get metadata for ${name}: ${error}`)
      return null
    })
  if (!response) return response

  const version = response.version as string
  const author =
    typeof response.author === 'string'
      ? response.author
      : typeof response.author === 'object' && response.author
        ? `${response.author.name}${response.author.email ? ` <${response.author.email}>` : ''}`
        : null
  const provenance: Provenance = response._npmUser?.trustedPublisher
    ? 'trustedPublisher'
    : !!response.dist?.attestations?.provenance
  return [version, provenance, author]
}
