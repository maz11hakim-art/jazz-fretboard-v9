import { useMemo, useState } from 'react'
import { catalog } from '../data/catalog'
import type { NoteTuple } from '../lib/notes'
import { useTransport } from '../stores/transport'
import { useCustom } from '../stores/custom'
import { useEditor } from '../stores/editor'

type Tab = 'solos' | 'licks' | 'pentas' | 'arpeggios' | 'voicings' | 'mine'

const TABS: { id: Tab; label: string }[] = [
  { id: 'mine', label: 'Mes créations' },
  { id: 'solos', label: 'Solos' },
  { id: 'licks', label: 'ii-V-I' },
  { id: 'pentas', label: 'Pentas' },
  { id: 'arpeggios', label: 'Arpèges' },
  { id: 'voicings', label: 'Voicings' },
]

type Entry = { id: string; name: string; subtitle?: string; notes: NoteTuple[]; tempo?: number; custom?: boolean; kind?: 'lick' | 'voicing' }

export function CatalogPicker() {
  const [tab, setTab] = useState<Tab>('solos')
  const [query, setQuery] = useState('')
  const loadItem = useTransport((s) => s.loadItem)
  const setBpm = useTransport((s) => s.setBpm)
  const currentItemId = useTransport((s) => s.currentItemId)
  const custom = useCustom()
  const editor = useEditor()

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
        : tab === 'voicings'
        ? catalog.voicings.map((v) => ({ id: v.id, name: `${v.chord} — ${v.type}`, subtitle: `cordes ${v.stringSet.join('-')}`, notes: v.notes }))
        : custom.items.map((c) => ({
            id: c.id,
            name: c.name,
            subtitle: `${c.kind === 'lick' ? 'Lick' : 'Voicing'} · ${new Date(c.createdAt).toLocaleDateString()}`,
            notes: c.notes,
            tempo: c.tempo,
            custom: true,
            kind: c.kind,
          }))

    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((e) => e.name.toLowerCase().includes(q) || (e.subtitle ?? '').toLowerCase().includes(q))
  }, [tab, query, custom.items])

  const handlePick = (e: Entry) => {
    loadItem(e.id, e.notes)
    if (e.tempo) setBpm(e.tempo)
  }

  const handleEditCustom = (e: Entry) => {
    if (!e.custom || !e.kind) return
    editor.loadDraft({ id: e.id, name: e.name, kind: e.kind, notes: e.notes, tempo: e.tempo })
  }

  const handleDeleteCustom = (e: Entry) => {
    if (!e.custom) return
    if (confirm(`Supprimer « ${e.name} » ?`)) custom.remove(e.id)
  }

  const handleNewCustom = (kind: 'lick' | 'voicing') => {
    editor.loadDraft({ name: '', kind, notes: [], tempo: 120 })
  }

  const total =
    tab === 'solos'
      ? catalog.solos.length
      : tab === 'licks'
      ? catalog.licks.length
      : tab === 'pentas'
      ? catalog.penta_licks.length
      : tab === 'arpeggios'
      ? catalog.arpeggios.length
      : tab === 'voicings'
      ? catalog.voicings.length
      : custom.items.length

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

      {tab === 'mine' && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-panel">
          <button
            onClick={() => handleNewCustom('lick')}
            className="flex-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-accent text-black hover:opacity-90"
          >
            + Nouveau lick
          </button>
          <button
            onClick={() => handleNewCustom('voicing')}
            className="flex-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-accent text-black hover:opacity-90"
          >
            + Nouveau voicing
          </button>
        </div>
      )}

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
        {entries.length === 0 && (
          <div className="p-4 text-center text-text-3 text-xs">
            {tab === 'mine' ? 'Aucune création. Clique « + Nouveau lick » pour commencer.' : 'Aucun résultat'}
          </div>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            className={`group w-full flex items-stretch border-b border-border transition ${
              currentItemId === e.id ? 'bg-accent/10 border-l-4 border-l-accent' : 'hover:bg-panel-2'
            }`}
          >
            <button onClick={() => handlePick(e)} className="flex-1 text-left px-4 py-2.5 min-w-0">
              <div className="text-sm font-semibold text-text leading-tight truncate">{e.name}</div>
              {e.subtitle && <div className="text-[10px] text-text-3 mt-0.5 font-mono truncate">{e.subtitle}</div>}
            </button>
            {e.custom && (
              <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleEditCustom(e)}
                  className="px-1.5 py-1 text-[10px] text-text-2 hover:text-text"
                  title="Modifier"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteCustom(e)}
                  className="px-1.5 py-1 text-[10px] text-root hover:opacity-80"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border bg-panel text-[10px] text-text-3 font-mono text-center">
        {entries.length} / {total}
      </div>
    </div>
  )
}
