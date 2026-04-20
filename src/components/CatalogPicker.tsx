import { useState } from 'react'
import { catalog } from '../data/catalog'
import type { NoteTuple } from '../lib/notes'
import { useTransport } from '../stores/transport'

type Tab = 'licks' | 'arpeggios' | 'voicings'

type Entry = { id: string; name: string; subtitle?: string; notes: NoteTuple[] }

export function CatalogPicker() {
  const [tab, setTab] = useState<Tab>('licks')
  const loadItem = useTransport((s) => s.loadItem)
  const currentItemId = useTransport((s) => s.currentItemId)

  const entries: Entry[] =
    tab === 'licks'
      ? catalog.licks.map((l) => ({ id: l.id, name: l.name, subtitle: `${l.context} · ${l.inspiration}`, notes: l.notes }))
      : tab === 'arpeggios'
      ? catalog.arpeggios.map((a) => ({ id: a.id, name: a.name, subtitle: `${a.quality} · forme ${a.cagedShape}`, notes: a.notes }))
      : catalog.voicings.map((v) => ({ id: v.id, name: `${v.chord} — ${v.type}`, subtitle: `cordes ${v.stringSet.join('-')}`, notes: v.notes }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 p-2 border-b border-border bg-panel">
        {(['licks', 'arpeggios', 'voicings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              tab === t ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
            }`}
          >
            {t === 'licks' ? 'Licks ii-V-I' : t === 'arpeggios' ? 'Arpèges CAGED' : 'Voicings'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => loadItem(e.id, e.notes)}
            className={`w-full text-left px-4 py-2.5 border-b border-border transition ${
              currentItemId === e.id ? 'bg-accent/10 border-l-4 border-l-accent' : 'hover:bg-panel-2'
            }`}
          >
            <div className="text-sm font-semibold text-text">{e.name}</div>
            {e.subtitle && <div className="text-xs text-text-3 mt-0.5">{e.subtitle}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
