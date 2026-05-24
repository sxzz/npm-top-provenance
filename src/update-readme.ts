import fs from 'node:fs'
import results from '../full-results.json' with { type: 'json' }
import { classifyResults, type Results } from './shared.ts'

const { count, provenance, staged, trusted, trustedNoProvenance, untrusted } =
  classifyResults(results as unknown as Results)

const content = `## Results

Generated time: ${new Date().toISOString()}

Total packages: ${count}

Full results in [results.json](./results.json)

### Trusted

> Published via [trusted publishing](https://docs.npmjs.com/trusted-publishers) with a provenance attestation.

<details>

<summary>Click to show first 500 of ${trusted.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${trusted.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Trusted without provenance

> Published via trusted publishing but with provenance attestation disabled.

<details>

<summary>Click to show first 200 of ${trustedNoProvenance.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${trustedNoProvenance.slice(0, 200).map(generatePackageItem).join('\n')}

</details>

### Provenance

> Has a [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation only — published with a regular token (not trusted publishing).

<details>

<summary>Click to show first 500 of ${provenance.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${provenance.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Staged

> Published via [staged publishing](https://docs.npmjs.com/staged-publishing/).

<details>

<summary>Click to show first 500 of ${staged.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${staged.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Untrusted

> Published with a regular token and without a provenance attestation.

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

function generatePackageItem(name: string, index: number): string {
  const withBadge = index < 50
  return `| [\`${name}\`](https://npmx.dev/package/${name}) | ${`<a href="http://npmcharts.com/compare/${name}">${withBadge ? `<img src="https://npmx.dev/api/registry/badge/downloads/${name}" alt="${name} downloads" loading="lazy" />` : 'View'}</a>`} |`
}
