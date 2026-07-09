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
  stepNote: (dir: 'prev' | 'next' | 'start') => void
}

export const useTransport = create<TransportState>((set, get) => ({
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
  stepNote: (dir) => {
    const { currentNotes, currentNoteIdx } = get()
    if (currentNotes.length === 0) return
    let next = currentNoteIdx
    if (dir === 'start') next = 0
    else if (dir === 'prev') next = Math.max(0, currentNoteIdx <= 0 ? 0 : currentNoteIdx - 1)
    else next = Math.min(currentNotes.length - 1, currentNoteIdx + 1)
    set({ currentNoteIdx: next, playing: false })
  },
}))
