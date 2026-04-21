import { useMemo, useState } from 'react'
import { catalog } from '../data/catalog'
import type { NoteTuple } from '../lib/notes'
import { useTransport } from '../stores/transport'

type Tab = 'solos' | 'licks' | 'pentas' | 'arpeggios' | 'voicings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'solos', label: 'Solos jazz' },
  { id: 'licks', label: 'ii-V-I licks' },
  { id: 'pentas', label: 'Pentatoniques' },
  { id: 'arpeggios', label: 'Arpèges CAGED' },
  { id: 'voicings', label: 'Voicings' },
]

type Entry = { id: string; name: string; subtitle?: string; notes: NoteTuple[]; tempo?: number }

export function CatalogPicker() {
  const [tab, setTab] = useState<Tab>('solos')
  const [query, setQuery] = useState('')
  const loadItem = useTransport((s) => s.loadItem)
  const setBpm = useTransport((s) => s.setBpm)
  const currentItemId = useTransport((s) => s.currentItemId)

  const entries: Entry[] = useMemo(() => {
    const list: Entry[] =
      tab === 'solos'
        ? catalog.solos.map((s) => ({ id: s.id, name: s.name, subtitle: `${s.inspiration} · ${s.tempo}bpm`, notes: s.notes, tempo: s.tempo }))
        : tab === 'licks'
        ? catalog.licks.map((l) => ({ id: l.id, name: l.name, subtitle: `${l.context} · ${l.inspiration}`, notes: l.notes }))
        : tab === 'pentas'
        ? catalog.penta_licks.map((p) => ({ id: p.id, name: p.name, subtitle: `${p.key} · ${p.tempo}bpm`, notes: p.notes, tempo: p.tempo }))
        : tab === 'arpeggios'
        ? catalog.arpeggios.map((a) => ({ id: a.id, name: a.name, subtitle: `${a.quality} · forme ${a.cagedShape}`, notes: a.notes }))
        : catalog.voicings.map((v) => ({ id: v.id, name: `${v.chord} — ${v.type}`, subtitle: `cordes ${v.stringSet.join('-')}`, notes: v.notes }))

    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((e) => e.name.toLowerCase().includes(q) || (e.subtitle ?? '').toLowerCase().includes(q))
  }, [tab, query])

  const handlePick = (e: Entry) => {
    loadItem(e.id, e.notes)
    if (e.tempo) setBpm(e.tempo)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-panel">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              tab === t.id ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-3 py-2 border-b border-border bg-panel">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher…"
          className="w-full px-2.5 py-1.5 rounded-md bg-panel-2 text-text text-xs placeholder:text-text-3 outline-none focus:ring-1 focus:ring-accent border border-border"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && <div className="p-4 text-center text-text-3 text-xs">Aucun résultat</div>}
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => handlePick(e)}
            className={`w-full text-left px-4 py-2.5 border-b border-border transition ${
              currentItemId === e.id ? 'bg-accent/10 border-l-4 border-l-accent' : 'hover:bg-panel-2'
            }`}
          >
            <div className="text-sm font-semibold text-text leading-tight">{e.name}</div>
            {e.subtitle && <div className="text-[10px] text-text-3 mt-0.5 font-mono">{e.subtitle}</div>}
          </button>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border bg-panel text-[10px] text-text-3 font-mono text-center">
        {entries.length} / {tab === 'solos' ? catalog.solos.length : tab === 'licks' ? catalog.licks.length : tab === 'pentas' ? catalog.penta_licks.length : tab === 'arpeggios' ? catalog.arpeggios.length : catalog.voicings.length}
      </div>
    </div>
  )
}
