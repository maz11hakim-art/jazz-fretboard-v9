import { create } from 'zustand'
import type { NoteTuple } from '../lib/notes'
import type { CustomKind } from './custom'

type EditorState = {
  active: boolean
  kind: CustomKind
  name: string
  notes: NoteTuple[]
  tempo: number
  editingId: string | null

  setActive: (b: boolean) => void
  setKind: (k: CustomKind) => void
  setName: (n: string) => void
  setTempo: (t: number) => void
  setEditingId: (id: string | null) => void
  loadDraft: (draft: { name: string; kind: CustomKind; notes: NoteTuple[]; tempo?: number; id?: string }) => void
  toggleNoteAt: (string: number, fret: number) => void
  removeIndex: (i: number) => void
  moveIndex: (from: number, to: number) => void
  clear: () => void
}

export const useEditor = create<EditorState>((set, get) => ({
  active: false,
  kind: 'lick',
  name: '',
  notes: [],
  tempo: 120,
  editingId: null,

  setActive: (active) => set({ active }),
  setKind: (kind) => set({ kind }),
  setName: (name) => set({ name }),
  setTempo: (tempo) => set({ tempo }),
  setEditingId: (editingId) => set({ editingId }),

  loadDraft: ({ name, kind, notes, tempo, id }) =>
    set({ name, kind, notes: [...notes], tempo: tempo ?? 120, editingId: id ?? null, active: true }),

  toggleNoteAt: (s, f) => {
    const { kind, notes } = get()
    const idx = notes.findIndex((n) => n[0] === s && n[1] === f)
    if (idx >= 0) {
      const next = notes.filter((_, i) => i !== idx)
      if (kind === 'lick') {
        // Re-beat to keep sequence continuous.
        set({ notes: next.map((n, i) => [n[0], n[1], i * 2, 2, n[4]] as NoteTuple) })
      } else {
        set({ notes: next })
      }
      return
    }
    if (kind === 'lick') {
      const beat = notes.length * 2
      set({ notes: [...notes, [s, f, beat, 2, null]] })
    } else {
      // voicing: all notes strum together
      set({ notes: [...notes, [s, f, 1, 4, null]] })
    }
  },

  removeIndex: (i) => {
    const { kind, notes } = get()
    const next = notes.filter((_, j) => j !== i)
    if (kind === 'lick') {
      set({ notes: next.map((n, j) => [n[0], n[1], j * 2, 2, n[4]] as NoteTuple) })
    } else {
      set({ notes: next })
    }
  },

  moveIndex: (from, to) => {
    const { kind, notes } = get()
    if (from === to || from < 0 || to < 0 || from >= notes.length || to >= notes.length) return
    const next = [...notes]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    if (kind === 'lick') {
      set({ notes: next.map((n, j) => [n[0], n[1], j * 2, 2, n[4]] as NoteTuple) })
    } else {
      set({ notes: next })
    }
  },

  clear: () => set({ notes: [], name: '', editingId: null }),
}))
