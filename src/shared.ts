import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GlobalFonts, type SvgCanvas } from '@napi-rs/canvas'

export type Result =
  | [
      version: string,
      author: string | null,
      provenance: boolean,
      oidc: boolean,
      staged: boolean,
    ]
  | null
export interface Results {
  [name: string]: Result
}

export const COLORS = {
  // Combo buckets (mutually exclusive)
  oidcAndProvenance: '#59a14f',
  oidcWithoutProvenance: '#edc949',
  provenanceOnly: '#f28e2c',
  none: '#e15759',
  // Independent metrics
  oidc: '#76b7b2',
  provenance: '#b07aa1',
  staged: '#4e79a7',
  oidcProvenanceStaged: '#9c755f',
  // Misc
  nonStaged: '#cecece',
  marker: '#888',
} as const

export interface DailyStat {
  date: string
  sha?: string
  listSize: number
  total: number
  // Combo buckets (mutually exclusive, sum to total)
  oidcAndProvenance?: number
  oidcWithoutProvenance?: number
  provenanceOnly?: number
  none?: number
  // Independent metrics
  oidc?: number
  provenance?: number
  staged?: number
  oidcProvenanceStaged?: number
}

export interface Classified {
  // Combo buckets (mutually exclusive, sum to count)
  oidcAndProvenance: string[]
  oidcWithoutProvenance: string[]
  provenanceOnly: string[]
  none: string[]
  // Independent / overlapping metrics
  oidc: string[]
  provenance: string[]
  staged: string[]
  oidcProvenanceStaged: string[]
  count: number
}

export function classifyResults(results: Results): Classified {
  const oidcAndProvenance: string[] = []
  const oidcWithoutProvenance: string[] = []
  const provenanceOnly: string[] = []
  const none: string[] = []
  const oidc: string[] = []
  const provenance: string[] = []
  const staged: string[] = []
  const oidcProvenanceStaged: string[] = []
  for (const [name, result] of Object.entries(results)) {
    if (!result) continue
    const [, , hasProvenance, hasOidc, isStaged] = result
    if (hasOidc && hasProvenance) {
      oidcAndProvenance.push(name)
    } else if (hasOidc) {
      oidcWithoutProvenance.push(name)
    } else if (hasProvenance) {
      provenanceOnly.push(name)
    } else {
      none.push(name)
    }
    if (hasOidc) oidc.push(name)
    if (hasProvenance) provenance.push(name)
    if (isStaged) staged.push(name)
    if (hasOidc && hasProvenance && isStaged) oidcProvenanceStaged.push(name)
  }
  return {
    oidcAndProvenance,
    oidcWithoutProvenance,
    provenanceOnly,
    none,
    oidc,
    provenance,
    staged,
    oidcProvenanceStaged,
    count:
      oidcAndProvenance.length +
      oidcWithoutProvenance.length +
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
