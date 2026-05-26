import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import Chart from 'chart.js/auto'
import results from '../full-results.json' with { type: 'json' }
import {
  classifyResults,
  COLORS,
  registerInterFont,
  writeChartSvg,
  type Results,
} from './shared.ts'

const {
  count,
  provenanceOnly,
  staged,
  trustedAndProvenance,
  trustedWithoutProvenance,
  none,
} = classifyResults(results as unknown as Results)

registerInterFont()

const canvas = createCanvas(800, 800, SvgExportFlag.ConvertTextToPaths)

const nonStaged = count - staged.length

type PatternKind = 'dots' | 'forward' | 'backward' | 'cross'

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
    case 'cross':
      ctx.beginPath()
      ctx.moveTo(-1, size + 1)
      ctx.lineTo(size + 1, -1)
      ctx.moveTo(-1, -1)
      ctx.lineTo(size + 1, size + 1)
      ctx.stroke()
      break
  }
  return ctx.createPattern(pat as any, 'repeat')!
}

// Provenance state (inner pie) — Tableau-style desaturated palette
const provenanceLabels = [
  'Trusted + Provenance',
  'Trusted without provenance',
  'Provenance only',
  'None',
]
const provenanceBase = [
  COLORS.trustedAndProvenance,
  COLORS.trustedWithoutProvenance,
  COLORS.provenanceOnly,
  COLORS.none,
]
const provenanceFills = [
  makePattern(COLORS.trustedAndProvenance, '#2f5e2a', 'dots'),
  makePattern(COLORS.trustedWithoutProvenance, '#8a6f1e', 'cross'),
  makePattern(COLORS.provenanceOnly, '#a05c14', 'forward'),
  makePattern(COLORS.none, '#8a3133', 'backward'),
]

// Staged publishing (outer ring)
const stagedLabels = ['Staged', 'Non-staged']
const stagedColors = [COLORS.staged, COLORS.nonStaged]

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
        data: [
          trustedAndProvenance.length,
          trustedWithoutProvenance.length,
          provenanceOnly.length,
          none.length,
        ],
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
          font: { size: 20, family: 'Inter' },
          generateLabels() {
            return [
              ...provenanceLabels.map((text, i) => ({
                text,
                fillStyle: provenanceFills[i] as any,
                strokeStyle: provenanceBase[i],
                fontColor: COLORS.marker,
                lineWidth: 0,
                index: i,
                datasetIndex: 1,
              })),
              ...stagedLabels.map((text, i) => ({
                text,
                fillStyle: stagedColors[i],
                strokeStyle: stagedColors[i],
                fontColor: COLORS.marker,
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

await writeChartSvg(canvas, 'chart-pie.svg')
chart.destroy()
