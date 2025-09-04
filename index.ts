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
  const packages = await getLatestVersionBatch(chunk, {
    metadata: true,
    throw: false,
  })
  for (const pkg of packages) {
    if ('error' in pkg) {
      console.log(pkg.error)
      results[pkg.name] = null
    } else {
      results[pkg.name] = pkg.provenance || false
    }
  }
  console.log('done:', Object.keys(results).length)
}

const json = JSON.stringify(results, undefined, 2)
fs.writeFileSync('results.json', `${json}\n`)
