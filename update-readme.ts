import fs from 'node:fs'
import results from './results.json' with { type: 'json' }
import type { Results } from './index.ts'

const provenance: string[] = []
const trusted: string[] = []
const untrusted: string[] = []
for (const [name, state] of Object.entries(results as Results)) {
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  } else {
    untrusted.push(name)
  }
}

const total = trusted.length + provenance.length + untrusted.length

const content = `## Results

Generated time: ${new Date().toISOString()}

Total packages: ${total}

Full results in [results.json](./results.json)

### Trusted (${trusted.length})

<details>

<summary>Click to expand</summary>

|  Package   | Downloads |
| ---------- | --------: |
${trusted.map(generatePackageItem).join('\n')}

</details>

### Provenance (${provenance.length})

<details>

<summary>Click to expand</summary>

|  Package   | Downloads |
| ---------- | --------: |
${provenance.map(generatePackageItem).join('\n')}

</details>

### Untrusted (${untrusted.length})

<details>

<summary>Click to show first 100</summary>

|  Package   | Downloads |
| ---------- | --------: |
${untrusted.slice(0, 100).map(generatePackageItem).join('\n')}

</details>`

const readme = fs
  .readFileSync('./README.md', 'utf8')
  .replace(
    /<!-- START -->[\s\S]*<!-- END -->/,
    `<!-- START -->\n\n${content}\n<!-- END -->`,
  )

fs.writeFileSync('./README.md', readme)
console.log('README.md updated successfully')

function generatePackageItem(name: string) {
  return `| [\`${name}\`](https://www.npmjs.com/package/${name}) | [![${name} downloads](https://img.shields.io/npm/dm/${name})](https://www.npmcharts.com/compare/${name}?interval=30) |`
}
