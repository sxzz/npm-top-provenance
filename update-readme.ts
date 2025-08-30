import fs from 'node:fs'
import results from './results.json' with { type: 'json' }
import type { Results } from './index'

const provenance: string[] = []
const trusted: string[] = []
for (const [name, state] of Object.entries(results as Results)) {
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  }
}

let string = '## Results\n\n'
string += 'Generated time: ' + new Date().toISOString() + '\n\n'

string += '### Trusted\n\n'
string += '<details>\n\n'
string += trusted.map(generatePackageLink).join('\n')
string += '\n\n</details>\n\n'

string += '### Provenance\n\n'
string += '<details>\n\n'
string += provenance.map(generatePackageLink).join('\n')
string += '\n</details>'

let readme = fs
  .readFileSync('./README.md', 'utf8')
  .replace(
    /<!-- START -->[\s\S]*<!-- END -->/,
    `<!-- START -->\n\n${string}\n<!-- END -->`,
  )

fs.writeFileSync('./README.md', readme)
console.log('README.md updated successfully')

function generatePackageLink(name) {
  return `- [\`${name}\`](https://www.npmjs.com/package/${name})`
}
