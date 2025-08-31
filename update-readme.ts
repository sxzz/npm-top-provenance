import fs from 'node:fs'
import results from './results.json' with { type: 'json' }
import type { Results } from './index.ts'

const provenance: string[] = []
const trusted: string[] = []
for (const [name, state] of Object.entries(results as Results)) {
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  }
}

let string = `## Results

Generated time: ${new Date().toISOString()}

### Trusted

<details>

<summary>Click to expand</summary>

|  Package   | Downloads |
| ---------- | --------: |
`
string += trusted.map(generatePackageItem).join('\n')
string += `

</details>

### Provenance

<details>

<summary>Click to expand</summary>

|  Package   | Downloads |
| ---------- | --------: |
`
string += provenance.map(generatePackageItem).join('\n')
string += `
</details>`

const readme = fs
  .readFileSync('./README.md', 'utf8')
  .replace(
    /<!-- START -->[\s\S]*<!-- END -->/,
    `<!-- START -->\n\n${string}\n<!-- END -->`,
  )

fs.writeFileSync('./README.md', readme)
console.log('README.md updated successfully')

function generatePackageItem(name: string) {
  return `| [\`${name}\`](https://www.npmjs.com/package/${name}) | [![${name} downloads](https://img.shields.io/npm/dm/${name})](https://www.npmcharts.com/compare/${name}?interval=30) |`
}
