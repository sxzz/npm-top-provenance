import fs from 'node:fs'
import { npmHighImpact } from 'npm-high-impact'
import { getLatestVersionBatch } from 'fast-npm-meta'
import { chunk } from 'es-toolkit'

console.log('total:', npmHighImpact.length)

const chunks = chunk(npmHighImpact, 500)
const results = {}
for (const chunk of chunks) {
  const packages = await getLatestVersionBatch(chunk, {
    metadata: true,
    throw: false,
  })
  for (const pkg of packages) {
    if ('error' in pkg) {
      console.log(pkg.error)
    } else {
      results[pkg.name] = pkg.provenance || false
    }
  }
  console.log('done:', Object.keys(results).length)
}

const json = JSON.stringify(results, undefined, 2)
fs.writeFileSync('results.json', json)
