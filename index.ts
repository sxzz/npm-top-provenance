import fs from 'node:fs'
import ky, { HTTPError } from 'ky'
import { createSpinner } from 'nanospinner'
import { npmHighImpact } from 'npm-high-impact'
import pLimit from 'p-limit'

type Provenance = boolean | 'trustedPublisher'
type Result =
  | [
      version: string,
      provenance: Provenance,
      author: string | null,
      staged: boolean,
    ]
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

updateDailyStats(fullResults)

interface DailyStat {
  date: string
  listSize: number
  trusted: number
  provenance: number
  untrusted: number
  staged: number
  total: number
  trustedPercent: number
  provenancePercent: number
  untrustedPercent: number
  stagedPercent: number
}

function updateDailyStats(fullResults: Results): void {
  const listSize = Object.keys(fullResults).length
  let trusted = 0
  let provenance = 0
  let untrusted = 0
  let staged = 0
  for (const result of Object.values(fullResults)) {
    if (!result) continue
    switch (result[1]) {
      case 'trustedPublisher':
        trusted++
        break
      case true:
        provenance++
        break
      case false:
        untrusted++
        break
    }
    if (result[3]) staged++
  }
  const total = trusted + provenance + untrusted
  const pct = (n: number): number => Math.round((n / total) * 10000) / 100

  const date = new Date().toISOString().slice(0, 10)
  const entry: DailyStat = {
    date,
    listSize,
    trusted,
    provenance,
    untrusted,
    staged,
    total,
    trustedPercent: pct(trusted),
    provenancePercent: pct(provenance),
    untrustedPercent: pct(untrusted),
    stagedPercent: pct(staged),
  }

  const path = 'daily-stats.json'
  const existing: DailyStat[] = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path, 'utf8'))
    : []
  const next = existing.filter((s) => s.date !== date)
  next.push(entry)
  next.sort((a, b) => a.date.localeCompare(b.date))
  fs.writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`daily-stats.json updated for ${date}`)
}

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
  const staged = Object.keys(response)[0] === '_id'
  return [version, provenance, author, staged]
}
