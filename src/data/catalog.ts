import raw from './seedCatalog.json'
import type { NoteTuple } from '../lib/notes'

export type Arpeggio = {
  id: string
  name: string
  type: 'arpeggio'
  root: string
  quality: 'maj7' | 'm7' | '7' | 'm7b5' | 'dim7'
  cagedShape: 'C' | 'A' | 'G' | 'E' | 'D'
  bassString: number
  notes: NoteTuple[]
}

export type Lick = {
  id: string
  name: string
  context: string
  inspiration: string
  position: string
  notes: NoteTuple[]
}

export type Voicing = {
  id: string
  chord: string
  type: 'drop2' | 'drop3' | 'shell'
  stringSet: number[]
  notes: NoteTuple[]
}

export type Standard = {
  id: string
  title: string
  key: string
  tempo: number
  form: string
}

export type Pentatonic = {
  id: string
  name: string
  application: string
  position: string
}

export type OriginalFeature = {
  id: string
  name: string
  description: string
}

export type Catalog = {
  version: string
  locale: string
  meta: Record<string, unknown>
  arpeggios: Arpeggio[]
  licks: Lick[]
  voicings: Voicing[]
  standards: Standard[]
  pentatonics: Pentatonic[]
  original_features: OriginalFeature[]
}

export const catalog = raw as unknown as Catalog
