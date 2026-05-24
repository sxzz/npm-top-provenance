import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GlobalFonts, type SvgCanvas } from '@napi-rs/canvas'

export type Result =
  | [
      version: string,
      trustedPublisher: boolean,
      provenance: boolean,
      author: string | null,
      staged: boolean,
    ]
  | null
export interface Results {
  [name: string]: Result
}

export const COLORS = {
  trusted: '#59a14f',
  trustedNoProvenance: '#edc949',
  provenance: '#f28e2c',
  untrusted: '#e15759',
  staged: '#4e79a7',
  nonStaged: '#cecece',
  marker: '#888',
} as const

export interface Classified {
  trusted: string[]
  trustedNoProvenance: string[]
  provenance: string[]
  untrusted: string[]
  staged: string[]
  count: number
}

export function classifyResults(results: Results): Classified {
  const trusted: string[] = []
  const trustedNoProvenance: string[] = []
  const provenance: string[] = []
  const untrusted: string[] = []
  const staged: string[] = []
  for (const [name, result] of Object.entries(results)) {
    if (!result) continue
    const [, trustedPublisher, hasProvenance, , isStaged] = result
    if (trustedPublisher && hasProvenance) {
      trusted.push(name)
    } else if (trustedPublisher) {
      trustedNoProvenance.push(name)
    } else if (hasProvenance) {
      provenance.push(name)
    } else {
      untrusted.push(name)
    }
    if (isStaged) staged.push(name)
  }
  return {
    trusted,
    trustedNoProvenance,
    provenance,
    untrusted,
    staged,
    count:
      trusted.length +
      trustedNoProvenance.length +
      provenance.length +
      untrusted.length,
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
