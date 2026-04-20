// Standard tuning, string 1 = high E (E4), string 6 = low E (E2)
// MIDI: E4 = 64, E2 = 40
export const STRING_MIDI: Record<number, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
}

export const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E'] // string 1..6

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_NAMES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export type Technique = 'h' | 'p' | 's' | 'b' | null
// [string, fret, beat, duration, technique]
export type NoteTuple = [number, number, number, number, Technique]

export function midiOf(string: number, fret: number): number {
  return STRING_MIDI[string] + fret
}

export function midiToName(midi: number, flats = false): string {
  const names = flats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP
  return names[midi % 12] + Math.floor(midi / 12 - 1)
}

// "E4" notation for Tone.js
export function toToneNote(string: number, fret: number): string {
  return midiToName(midiOf(string, fret))
}

export function nameAt(string: number, fret: number, flats = false): string {
  return midiToName(midiOf(string, fret), flats).replace(/\d+$/, '')
}
