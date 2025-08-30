import fs from 'fs'
import { npmHighImpact } from 'npm-high-impact'
import { getLatestVersionBatch } from 'fast-npm-meta'
import { chunk } from 'es-toolkit'

console.log(npmHighImpact.length)

const chunks = chunk(npmHighImpact, 500)
const results = {}
for (const chunk of chunks) {
  console.log(Object.keys(results).length)

  const packages = await getLatestVersionBatch(chunk, {
    metadata: true,
    throw: false,
  })
  if ('error' in packages) {
    console.log(packages.error)
  } else {
    for (const pkg of packages) {
      results[pkg.name] = pkg.provenance || false
    }
  }
}

const json = JSON.stringify(results, undefined, 2)
fs.writeFileSync('results.json', json)
