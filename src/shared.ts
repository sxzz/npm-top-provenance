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
  // Combo buckets (mutually exclusive)
  trustedAndProvenance: '#59a14f',
  trustedWithoutProvenance: '#edc949',
  provenanceOnly: '#f28e2c',
  none: '#e15759',
  // Independent metrics
  trusted: '#76b7b2',
  provenance: '#b07aa1',
  staged: '#4e79a7',
  trustedProvenanceStaged: '#9c755f',
  // Misc
  nonStaged: '#cecece',
  marker: '#888',
} as const

export interface DailyStat {
  date: string
  listSize: number
  total: number
  // Combo buckets (mutually exclusive, sum to total)
  trustedAndProvenance?: number
  trustedAndProvenancePercent?: number
  trustedWithoutProvenance?: number
  trustedWithoutProvenancePercent?: number
  provenanceOnly?: number
  provenanceOnlyPercent?: number
  none?: number
  nonePercent?: number
  // Independent metrics
  trusted?: number
  trustedPercent?: number
  provenance?: number
  provenancePercent?: number
  staged?: number
  stagedPercent?: number
  trustedProvenanceStaged?: number
  trustedProvenanceStagedPercent?: number
}

export interface Classified {
  // Combo buckets (mutually exclusive, sum to count)
  trustedAndProvenance: string[]
  trustedWithoutProvenance: string[]
  provenanceOnly: string[]
  none: string[]
  // Independent / overlapping metrics
  trusted: string[]
  provenance: string[]
  staged: string[]
  trustedProvenanceStaged: string[]
  count: number
}

export function classifyResults(results: Results): Classified {
  const trustedAndProvenance: string[] = []
  const trustedWithoutProvenance: string[] = []
  const provenanceOnly: string[] = []
  const none: string[] = []
  const trusted: string[] = []
  const provenance: string[] = []
  const staged: string[] = []
  const trustedProvenanceStaged: string[] = []
  for (const [name, result] of Object.entries(results)) {
    if (!result) continue
    const [, trustedPublisher, hasProvenance, , isStaged] = result
    if (trustedPublisher && hasProvenance) {
      trustedAndProvenance.push(name)
    } else if (trustedPublisher) {
      trustedWithoutProvenance.push(name)
    } else if (hasProvenance) {
      provenanceOnly.push(name)
    } else {
      none.push(name)
    }
    if (trustedPublisher) trusted.push(name)
    if (hasProvenance) provenance.push(name)
    if (isStaged) staged.push(name)
    if (trustedPublisher && hasProvenance && isStaged)
      trustedProvenanceStaged.push(name)
  }
  return {
    trustedAndProvenance,
    trustedWithoutProvenance,
    provenanceOnly,
    none,
    trusted,
    provenance,
    staged,
    trustedProvenanceStaged,
    count:
      trustedAndProvenance.length +
      trustedWithoutProvenance.length +
      provenanceOnly.length +
      none.length,
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
