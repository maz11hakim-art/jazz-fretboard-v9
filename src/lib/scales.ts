import { midiOf } from './notes'

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const PC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

export type PitchClass = (typeof PITCH_CLASSES)[number]

export function pcOf(name: string): number {
  const idx = PITCH_CLASSES.indexOf(name as PitchClass)
  if (idx >= 0) return idx
  const flatIdx = PC_FLATS.indexOf(name as (typeof PC_FLATS)[number])
  return flatIdx >= 0 ? flatIdx : 0
}

export type ScaleId =
  | 'major'
  | 'minor'
  | 'dorian'
  | 'mixolydian'
  | 'lydian'
  | 'phrygian'
  | 'locrian'
  | 'melodic_minor'
  | 'harmonic_minor'
  | 'pent_major'
  | 'pent_minor'
  | 'blues'
  | 'bebop_dom'
  | 'bebop_maj'
  | 'chord_maj7'
  | 'chord_m7'
  | 'chord_7'
  | 'chord_m7b5'
  | 'chord_dim7'
  | 'chromatic'

export const SCALES: Record<ScaleId, { label: string; intervals: number[] }> = {
  major: { label: 'Majeure', intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: 'Mineure nat.', intervals: [0, 2, 3, 5, 7, 8, 10] },
  dorian: { label: 'Dorien', intervals: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: { label: 'Mixolydien', intervals: [0, 2, 4, 5, 7, 9, 10] },
  lydian: { label: 'Lydien', intervals: [0, 2, 4, 6, 7, 9, 11] },
  phrygian: { label: 'Phrygien', intervals: [0, 1, 3, 5, 7, 8, 10] },
  locrian: { label: 'Locrien', intervals: [0, 1, 3, 5, 6, 8, 10] },
  melodic_minor: { label: 'Mineur mélo.', intervals: [0, 2, 3, 5, 7, 9, 11] },
  harmonic_minor: { label: 'Mineur harm.', intervals: [0, 2, 3, 5, 7, 8, 11] },
  pent_major: { label: 'Penta maj.', intervals: [0, 2, 4, 7, 9] },
  pent_minor: { label: 'Penta min.', intervals: [0, 3, 5, 7, 10] },
  blues: { label: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  bebop_dom: { label: 'Bebop dom.', intervals: [0, 2, 4, 5, 7, 9, 10, 11] },
  bebop_maj: { label: 'Bebop maj.', intervals: [0, 2, 4, 5, 7, 8, 9, 11] },
  chord_maj7: { label: 'Arpège maj7', intervals: [0, 4, 7, 11] },
  chord_m7: { label: 'Arpège m7', intervals: [0, 3, 7, 10] },
  chord_7: { label: 'Arpège 7', intervals: [0, 4, 7, 10] },
  chord_m7b5: { label: 'Arpège m7b5', intervals: [0, 3, 6, 10] },
  chord_dim7: { label: 'Arpège dim7', intervals: [0, 3, 6, 9] },
  chromatic: { label: 'Chromatique', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
}

const DEGREE_LABEL: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
}

export function degreeLabel(semitonesFromRoot: number): string {
  const s = ((semitonesFromRoot % 12) + 12) % 12
  return DEGREE_LABEL[s]
}

export type HighlightKind = 'root' | 'third' | 'fifth' | 'seventh' | 'scale'

export function highlightKindForInterval(semitones: number): HighlightKind {
  const s = ((semitones % 12) + 12) % 12
  if (s === 0) return 'root'
  if (s === 3 || s === 4) return 'third'
  if (s === 6 || s === 7) return 'fifth'
  if (s === 10 || s === 11) return 'seventh'
  return 'scale'
}

export type ScalePosition = { string: number; fret: number; semitones: number }

export function scalePositionsOnFretboard(
  rootPc: number,
  scale: ScaleId,
  maxFret: number,
): ScalePosition[] {
  const intervals = new Set(SCALES[scale].intervals)
  const out: ScalePosition[] = []
  for (let s = 1; s <= 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const rel = (((midiOf(s, f) % 12) - rootPc) % 12 + 12) % 12
      if (intervals.has(rel)) {
        out.push({ string: s, fret: f, semitones: rel })
      }
    }
  }
  return out
}

// CAGED shape root positions for major chord forms (low E relative root fret).
// Each shape = fret range relative to root. Box covers ~4-5 frets.
export const CAGED_BOXES: Record<'C' | 'A' | 'G' | 'E' | 'D', { lowE: number; span: number }> = {
  E: { lowE: 0, span: 4 },
  D: { lowE: 2, span: 3 },
  C: { lowE: 3, span: 4 },
  A: { lowE: 5, span: 4 },
  G: { lowE: 7, span: 4 },
}

// Given root pitch class and CAGED shape, return [startFret, endFret] box window on the fretboard
// for a chord rooted at that pc. Uses low E (string 6) reference.
export function cagedBoxRange(rootPc: number, shape: keyof typeof CAGED_BOXES, maxFret: number): [number, number] {
  const lowEPc = 4 // E
  const rootFretOnLowE = ((rootPc - lowEPc) % 12 + 12) % 12
  const box = CAGED_BOXES[shape]
  const start = (rootFretOnLowE + box.lowE) % 12
  const end = start + box.span
  return [Math.max(0, start - 1), Math.min(maxFret, end)]
}
