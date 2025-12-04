import fs from 'node:fs'
import { chunk } from 'es-toolkit'
import { getLatestVersionBatch } from 'fast-npm-meta'
import { npmHighImpact } from 'npm-high-impact'

export interface Results {
  [name: string]: boolean | null | 'trustedPublisher'
}

console.log('total:', npmHighImpact.length)

const chunks = chunk(npmHighImpact, 500)
const results: Results = {}
for (const chunk of chunks) {
  const packages = await retry(() =>
    getLatestVersionBatch(chunk, {
      metadata: true,
      throw: false,
    }),
  )
  for (const pkg of packages) {
    if ('error' in pkg) {
      console.log(pkg.name, pkg.error)
      results[pkg.name] = null
    } else {
      results[pkg.name] = pkg.provenance || false
    }
  }
  console.log('done:', Object.keys(results).length)
}

const json = JSON.stringify(results, undefined, 2)
fs.writeFileSync('results.json', `${json}\n`)

function retry(fn: () => Promise<any>, retries = 3): Promise<any> {
  return fn().catch(async (error) => {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log(`Retrying... (${retries} left)`)
      return retry(fn, retries - 1)
    }
    throw error
  })
}
