import fs from 'node:fs'
import { count, provenance, trusted, untrusted } from './analyze.ts'

const content = `## Results

Generated time: ${new Date().toISOString()}

Total packages: ${count}

Full results in [results.json](./results.json)

### Trusted

<details>

<summary>Click to show first 500 of ${trusted.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${trusted.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Provenance

<details>

<summary>Click to show first 500 of ${provenance.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${provenance.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Untrusted

<details>

<summary>Click to show first 200 of ${untrusted.length}</summary>

|  Package   | Downloads |
| ---------- | --------: |
${untrusted.slice(0, 200).map(generatePackageItem).join('\n')}

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
  return `| [\`${name}\`](https://www.npmjs.com/package/${name}) | <img src="https://img.shields.io/npm/dm/${name}" alt="${name} downloads" loading="lazy" /> |`
}
