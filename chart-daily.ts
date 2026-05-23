import { writeFile } from 'node:fs/promises'
import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import Chart from 'chart.js/auto'
import stats from './daily-stats.json' with { type: 'json' }

interface DailyStat {
  date: string
  listSize: number
  trusted: number
  provenance: number
  untrusted: number
  total: number
  trustedPercent: number
  provenancePercent: number
  untrustedPercent: number
}

const data = stats as DailyStat[]

const updateIndices = new Set<number>()
for (let i = 1; i < data.length; i++) {
  if (data[i].listSize !== data[i - 1].listSize) {
    updateIndices.add(i)
  }
}

const pointRadius = (ctx: any) =>
  updateIndices.has(ctx.dataIndex) ? 6 : 0
const pointStyle = (ctx: any) =>
  updateIndices.has(ctx.dataIndex) ? 'triangle' : 'circle'

const verticalLinePlugin = {
  id: 'listUpdateMarker',
  afterDatasetsDraw(chart: any) {
    const { ctx, chartArea, scales } = chart
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
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

const canvas = createCanvas(1000, 500, SvgExportFlag.NoPrettyXML)

const chart = new Chart(canvas as any, {
  type: 'line',
  plugins: [verticalLinePlugin],
  data: {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Trusted',
        data: data.map((d) => d.trustedPercent),
        borderColor: '#4caf50',
        backgroundColor: '#4caf50',
        tension: 0.2,
        pointRadius,
        pointStyle,
        pointBackgroundColor: '#000',
        pointBorderColor: '#000',
        borderWidth: 2,
      },
      {
        label: 'Provenance',
        data: data.map((d) => d.provenancePercent),
        borderColor: '#ff9800',
        backgroundColor: '#ff9800',
        tension: 0.2,
        pointRadius,
        pointStyle,
        pointBackgroundColor: '#000',
        pointBorderColor: '#000',
        borderWidth: 2,
      },
      {
        label: 'Untrusted',
        data: data.map((d) => d.untrustedPercent),
        borderColor: '#f44336',
        backgroundColor: '#f44336',
        tension: 0.2,
        pointRadius,
        pointStyle,
        pointBackgroundColor: '#000',
        pointBorderColor: '#000',
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 16 },
        },
      },
      title: {
        display: true,
        text: 'npm Top Packages — Provenance Status Over Time (%)',
        font: { size: 18 },
        padding: { top: 8, bottom: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
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
          font: { size: 13 },
          callback: (v) => `${v}%`,
        },
      },
    },
  },
})

await writeFile('chart-daily.svg', canvas.getContent())
console.log('chart-daily.svg updated successfully')
chart.destroy()
