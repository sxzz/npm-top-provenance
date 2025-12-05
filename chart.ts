import { writeFile } from 'node:fs/promises'
import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import Chart from 'chart.js/auto'
import { provenance, trusted, untrusted } from './analyze.ts'

const canvas = createCanvas(800, 800, SvgExportFlag.NoPrettyXML)

const data = {
  labels: ['Trusted', 'Provenance', 'Untrusted'],
  datasets: [
    {
      data: [trusted.length, provenance.length, untrusted.length],
      backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
    },
  ],
}
const chart = new Chart(canvas as any, {
  type: 'pie',
  data,
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 30,
          font: { size: 20 },
        },
      },
    },
  },
})

await writeFile('chart.svg', canvas.getContent())

chart.destroy()
