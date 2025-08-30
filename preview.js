import results from './results.json' with { type: 'json' }

const provenance = []
const trusted = []
for (const [name, state] of Object.entries(results)) {
  if (state === true) {
    provenance.push(name)
  } else if (state === 'trustedPublisher') {
    trusted.push(name)
  }
}

console.log('## Results\n')
console.log('Generated time:', new Date().toISOString())

console.log('\n### Trusted')
console.log('\n<details>\n')
console.log(trusted.map(generatePackageLink).join('\n'))
console.log('\n</details>')

console.log('\n### Provenance')
console.log('\n<details>\n')
console.log(provenance.map(generatePackageLink).join('\n'))
console.log('\n</details>')

function generatePackageLink(name) {
  return `- [\`${name}\`](https://www.npmjs.com/package/${name})`
}
