import { create } from 'zustand'
import type { NoteTuple } from '../lib/notes'

export type CustomKind = 'lick' | 'voicing'

export type CustomItem = {
  id: string
  name: string
  kind: CustomKind
  notes: NoteTuple[]
  tempo?: number
  createdAt: number
}

type CustomState = {
  items: CustomItem[]
  add: (item: Omit<CustomItem, 'id' | 'createdAt'>) => CustomItem
  update: (id: string, patch: Partial<Omit<CustomItem, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
  replaceAll: (items: CustomItem[]) => void
}

const KEY = 'jfb.custom.v1'

const load = (): CustomItem[] => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CustomItem[]) : []
  } catch {
    return []
  }
}
const persist = (items: CustomItem[]) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // ignore quota errors
  }
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `cust-${crypto.randomUUID().slice(0, 8)}`
    : `cust-${Math.random().toString(36).slice(2, 10)}`

export const useCustom = create<CustomState>((set, get) => ({
  items: load(),
  add: (partial) => {
    const item: CustomItem = { ...partial, id: uid(), createdAt: Date.now() }
    const items = [item, ...get().items]
    set({ items })
    persist(items)
    return item
  },
  update: (id, patch) => {
    const items = get().items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    set({ items })
    persist(items)
  },
  remove: (id) => {
    const items = get().items.filter((it) => it.id !== id)
    set({ items })
    persist(items)
  },
  replaceAll: (items) => {
    set({ items })
    persist(items)
  },
}))
