import fs from 'node:fs'
import results from './results.json' with { type: 'json' }
import type { Results } from './index.ts'

const provenance: string[] = []
const trusted: string[] = []
const untrusted: string[] = []
const items = Object.entries(results as Results)
for (const [name, state] of items) {
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  } else {
    untrusted.push(name)
  }
}

const content = `## Results

Generated time: ${new Date().toISOString()}

Total packages: ${items.length}

Full results in [results.json](./results.json)

### Trusted

<details>

<summary>Click to expand (${trusted.length} in total)</summary>

|  Package   | Downloads |
| ---------- | --------: |
${trusted.map(generatePackageItem).join('\n')}

</details>

### Provenance

<details>

<summary>Click to expand (${provenance.length} in total)</summary>

|  Package   | Downloads |
| ---------- | --------: |
${provenance.map(generatePackageItem).join('\n')}

</details>

### Untrusted

<details>

<summary>Click to show first 100 of ${untrusted.length}</summary>

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
