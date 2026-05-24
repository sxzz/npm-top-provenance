import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import Chart from 'chart.js/auto'
import stats from '../daily-stats.json' with { type: 'json' }
import { COLORS, registerInterFont, writeChartSvg } from './shared.ts'

registerInterFont()

interface DailyStat {
  date: string
  listSize: number
  trusted: number
  trustedNoProvenance?: number
  provenance: number
  untrusted: number
  staged?: number
  total: number
  trustedPercent: number
  trustedNoProvenancePercent?: number
  provenancePercent: number
  untrustedPercent: number
  stagedPercent?: number
}

const data = stats as DailyStat[]

const updateIndices = new Set<number>()
for (let i = 1; i < data.length; i++) {
  if (data[i].listSize !== data[i - 1].listSize) {
    updateIndices.add(i)
  }
}

const pointRadius = (ctx: any) => (updateIndices.has(ctx.dataIndex) ? 6 : 0)
const pointStyle = (ctx: any) =>
  updateIndices.has(ctx.dataIndex) ? 'triangle' : 'circle'

const verticalLinePlugin = {
  id: 'listUpdateMarker',
  afterDatasetsDraw(chart: any) {
    const { ctx, chartArea, scales } = chart
    ctx.save()
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    for (const i of updateIndices) {
      const x = scales.x.getPixelForValue(i)
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
    }
    ctx.restore()
  },
}

interface SeriesSpec {
  label: string
  color: string
  values: (number | null)[]
  spanGaps?: boolean
}

const series: SeriesSpec[] = [
  {
    label: 'Trusted',
    color: COLORS.trusted,
    values: data.map((d) => d.trustedPercent),
  },
  {
    label: 'Trusted without provenance',
    color: COLORS.trustedNoProvenance,
    values: data.map((d) => d.trustedNoProvenancePercent ?? null),
    spanGaps: true,
  },
  {
    label: 'Provenance',
    color: COLORS.provenance,
    values: data.map((d) => d.provenancePercent),
  },
  {
    label: 'Untrusted',
    color: COLORS.untrusted,
    values: data.map((d) => d.untrustedPercent),
  },
  {
    label: 'Staged',
    color: COLORS.staged,
    values: data.map((d) => d.stagedPercent ?? null),
    spanGaps: true,
  },
]

const canvas = createCanvas(1000, 500, SvgExportFlag.ConvertTextToPaths)

const chart = new Chart(canvas as any, {
  type: 'line',
  plugins: [verticalLinePlugin],
  data: {
    labels: data.map((d) => d.date),
    datasets: series.map(({ label, color, values, spanGaps }) => ({
      label,
      data: values,
      borderColor: color,
      backgroundColor: color,
      tension: 0.2,
      pointRadius,
      pointStyle,
      pointBackgroundColor: COLORS.marker,
      pointBorderColor: COLORS.marker,
      borderWidth: 2,
      spanGaps,
    })),
  },
  options: {
    responsive: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 16, family: 'Inter' },
        },
      },
      title: {
        display: true,
        text: 'npm Top Packages — Provenance Status Over Time (%)',
        font: { size: 18, family: 'Inter' },
        padding: { top: 8, bottom: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12, family: 'Inter' },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          font: { size: 13, family: 'Inter' },
          callback: (v) => `${v}%`,
        },
      },
    },
  },
})

await writeChartSvg(canvas, 'chart-daily.svg')
chart.destroy()
