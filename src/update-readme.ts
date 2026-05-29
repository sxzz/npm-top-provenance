import fs from 'node:fs'
import results from '../full-results.json' with { type: 'json' }
import { classifyResults, type Results } from './shared.ts'

const {
  count,
  provenanceOnly,
  staged,
  oidcProvenanceStaged,
  oidcAndProvenance,
  oidcWithoutProvenance,
  none,
} = classifyResults(results as unknown as Results)

const content = `## Results

Generated time: ${new Date().toISOString()}

Total packages: ${count}

Compact tuples in [results.json](./results.json) · Full data with version and author in [full-results.json](./full-results.json)

### OIDC + Provenance + Staged

Published via [trusted publishing](https://docs.npmjs.com/trusted-publishers) with a provenance attestation and [staged publishing](https://docs.npmjs.com/staged-publishing/). This is currently the most secure way to publish.

<details>

<summary>Click to show first 500 of ${oidcProvenanceStaged.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${oidcProvenanceStaged.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### OIDC + Provenance

Published via [trusted publishing](https://docs.npmjs.com/trusted-publishers) with a provenance attestation.

<details>

<summary>Click to show first 500 of ${oidcAndProvenance.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${oidcAndProvenance.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### OIDC without provenance

Published via OIDC but with provenance attestation disabled.

<details>

<summary>Click to show first 200 of ${oidcWithoutProvenance.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${oidcWithoutProvenance.slice(0, 200).map(generatePackageItem).join('\n')}

</details>

### Provenance only

Has a [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation, but not published via OIDC.

<details>

<summary>Click to show first 500 of ${provenanceOnly.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${provenanceOnly.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### Staged

Published via [staged publishing](https://docs.npmjs.com/staged-publishing/).

<details>

<summary>Click to show first 500 of ${staged.length} in total</summary>

|  Package   | Downloads |
| ---------- | --------: |
${staged.slice(0, 500).map(generatePackageItem).join('\n')}

</details>

### None

Neither published via OIDC nor with a provenance attestation.

<details>

<summary>Click to show first 200 of ${none.length}</summary>

|  Package   | Downloads |
| ---------- | --------: |
${none.slice(0, 200).map(generatePackageItem).join('\n')}

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
