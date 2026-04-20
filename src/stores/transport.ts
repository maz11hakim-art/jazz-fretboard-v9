import { create } from 'zustand'
import type { NoteTuple } from '../lib/notes'

type TransportState = {
  bpm: number
  playing: boolean
  currentNoteIdx: number
  currentItemId: string | null
  currentNotes: NoteTuple[]
  setBpm: (bpm: number) => void
  setPlaying: (p: boolean) => void
  setCurrentNoteIdx: (i: number) => void
  loadItem: (id: string, notes: NoteTuple[]) => void
  reset: () => void
}

export const useTransport = create<TransportState>((set) => ({
  bpm: 120,
  playing: false,
  currentNoteIdx: -1,
  currentItemId: null,
  currentNotes: [],
  setBpm: (bpm) => set({ bpm }),
  setPlaying: (playing) => set({ playing }),
  setCurrentNoteIdx: (i) => set({ currentNoteIdx: i }),
  loadItem: (id, notes) => set({ currentItemId: id, currentNotes: notes, currentNoteIdx: -1 }),
  reset: () => set({ playing: false, currentNoteIdx: -1 }),
}))
