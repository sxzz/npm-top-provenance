import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GlobalFonts, type SvgCanvas } from '@napi-rs/canvas'

export type Provenance = boolean | 'trustedPublisher'
export type Result =
  | [
      version: string,
      provenance: Provenance,
      author: string | null,
      staged: boolean,
    ]
  | null
export interface Results {
  [name: string]: Result
}

export const COLORS = {
  trusted: '#59a14f',
  provenance: '#f28e2c',
  untrusted: '#e15759',
  staged: '#4e79a7',
  nonStaged: '#cecece',
  marker: '#888',
} as const

export interface Classified {
  trusted: string[]
  provenance: string[]
  untrusted: string[]
  staged: string[]
  count: number
}

export function classifyResults(results: Results): Classified {
  const trusted: string[] = []
  const provenance: string[] = []
  const untrusted: string[] = []
  const staged: string[] = []
  for (const [name, result] of Object.entries(results)) {
    if (!result) continue
    switch (result[1]) {
      case 'trustedPublisher':
        trusted.push(name)
        break
      case true:
        provenance.push(name)
        break
      case false:
        untrusted.push(name)
        break
    }
    if (result[3]) staged.push(name)
  }
  return {
    trusted,
    provenance,
    untrusted,
    staged,
    count: trusted.length + provenance.length + untrusted.length,
  }
}

export function registerInterFont(): void {
  GlobalFonts.registerFromPath(
    path.resolve(import.meta.dirname, '../fonts/Inter-Regular.ttf'),
    'Inter',
  )
}

export async function writeChartSvg(
  canvas: SvgCanvas,
  filename: string,
): Promise<void> {
  await writeFile(filename, canvas.getContent())
  console.log(`${filename} updated successfully`)
}
