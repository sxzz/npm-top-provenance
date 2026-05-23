import { writeFile } from 'node:fs/promises'
import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import Chart from 'chart.js/auto'
import { count, provenance, staged, trusted, untrusted } from './analyze.ts'

const canvas = createCanvas(800, 800, SvgExportFlag.NoPrettyXML)

const nonStaged = count - staged.length

type PatternKind = 'dots' | 'forward' | 'backward'

function makePattern(base: string, line: string, kind: PatternKind) {
  const size = 18
  const pat = createCanvas(size, size)
  const ctx = pat.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = line
  ctx.fillStyle = line
  ctx.lineWidth = 2.5
  switch (kind) {
    case 'dots':
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'forward':
      ctx.beginPath()
      ctx.moveTo(-1, size + 1)
      ctx.lineTo(size + 1, -1)
      ctx.stroke()
      break
    case 'backward':
      ctx.beginPath()
      ctx.moveTo(-1, -1)
      ctx.lineTo(size + 1, size + 1)
      ctx.stroke()
      break
  }
  return ctx.createPattern(pat as any, 'repeat')!
}

// Provenance state (inner pie) — Tableau-style desaturated palette
const provenanceLabels = ['Trusted', 'Provenance', 'Untrusted']
const provenanceBase = ['#59a14f', '#f28e2c', '#e15759']
const provenanceFills = [
  makePattern('#59a14f', '#2f5e2a', 'dots'),
  makePattern('#f28e2c', '#a05c14', 'forward'),
  makePattern('#e15759', '#8a3133', 'backward'),
]

// Staged publishing (outer ring)
const stagedLabels = ['Staged', 'Non-staged']
const stagedColors = ['#4e79a7', '#cecece']

const chart = new Chart(canvas as any, {
  type: 'doughnut',
  data: {
    labels: [...stagedLabels, ...provenanceLabels],
    datasets: [
      // Outer ring: staged publishing
      {
        label: 'Staged publishing',
        data: [staged.length, nonStaged],
        backgroundColor: stagedColors,
        weight: 1,
      },
      // Inner solid pie: provenance state
      {
        label: 'Provenance state',
        data: [trusted.length, provenance.length, untrusted.length],
        backgroundColor: provenanceFills as any,
        weight: 6,
      },
    ],
  },
  options: {
    cutout: 0,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 24,
          font: { size: 20, family: 'Arial' },
          generateLabels() {
            return [
              ...provenanceLabels.map((text, i) => ({
                text,
                fillStyle: provenanceFills[i] as any,
                strokeStyle: provenanceBase[i],
                lineWidth: 0,
                index: i,
                datasetIndex: 1,
              })),
              ...stagedLabels.map((text, i) => ({
                text,
                fillStyle: stagedColors[i],
                strokeStyle: stagedColors[i],
                lineWidth: 0,
                index: i,
                datasetIndex: 0,
              })),
            ]
          },
        },
      },
    },
  },
})

await writeFile('chart-pie.svg', canvas.getContent())
console.log('chart-pie.svg updated successfully')
chart.destroy()
