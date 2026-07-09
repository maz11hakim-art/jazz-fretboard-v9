import { useRef } from 'react'
import { useEditor } from '../stores/editor'
import { useCustom } from '../stores/custom'
import { useTransport } from '../stores/transport'
import { nameAt } from '../lib/notes'
import type { CustomItem } from '../stores/custom'

export function EditorPanel() {
  const ed = useEditor()
  const custom = useCustom()
  const loadItem = useTransport((s) => s.loadItem)
  const setBpm = useTransport((s) => s.setBpm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const save = () => {
    if (ed.notes.length === 0) return
    const name = ed.name.trim() || (ed.kind === 'lick' ? 'Lick sans nom' : 'Voicing sans nom')
    if (ed.editingId) {
      custom.update(ed.editingId, { name, kind: ed.kind, notes: ed.notes, tempo: ed.tempo })
    } else {
      custom.add({ name, kind: ed.kind, notes: ed.notes, tempo: ed.tempo })
    }
    ed.clear()
  }

  const preview = () => {
    if (ed.notes.length === 0) return
    loadItem('editor-preview', ed.notes)
    if (ed.tempo) setBpm(ed.tempo)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(custom.items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jazz-fretboard-custom-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as CustomItem[]
      if (!Array.isArray(parsed)) return
      custom.replaceAll(parsed)
    } catch {
      alert('Import : fichier invalide')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border bg-panel">
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => ed.setKind('lick')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              ed.kind === 'lick' ? 'bg-accent text-black' : 'bg-panel-2 text-text-2'
            }`}
          >
            Lick
          </button>
          <button
            onClick={() => ed.setKind('voicing')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              ed.kind === 'voicing' ? 'bg-accent text-black' : 'bg-panel-2 text-text-2'
            }`}
          >
            Voicing
          </button>
          <button
            onClick={() => ed.setActive(false)}
            className="ml-auto px-2 py-1 rounded-md text-[11px] font-semibold bg-panel-2 text-text-2 hover:text-text"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={ed.name}
          onChange={(e) => ed.setName(e.target.value)}
          placeholder={ed.kind === 'lick' ? 'Nom du lick…' : 'Nom du voicing…'}
          className="w-full px-2 py-1.5 rounded-md bg-panel-2 text-text text-xs placeholder:text-text-3 outline-none focus:ring-1 focus:ring-accent border border-border"
        />

        {ed.kind === 'lick' && (
          <label className="flex items-center gap-2 mt-2 text-[11px] text-text-2">
            <span>Tempo</span>
            <input
              type="range"
              min={40}
              max={280}
              value={ed.tempo}
              onChange={(e) => ed.setTempo(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="font-mono text-text w-10 text-right">{ed.tempo}</span>
          </label>
        )}
      </div>

      <div className="px-3 py-2 text-[11px] text-text-3 border-b border-border bg-panel">
        {ed.kind === 'lick'
          ? "Clique sur le manche pour poser une note après l'autre. Re-clique pour la retirer."
          : "Clique sur les cases pour former l'accord. Re-clique pour retirer."}
      </div>

      <div className="flex-1 overflow-y-auto">
        {ed.notes.length === 0 && (
          <div className="p-4 text-center text-text-3 text-xs">Aucune note pour l'instant</div>
        )}
        {ed.notes.map((n, i) => {
          const [s, f] = n
          return (
            <div
              key={`${s}-${f}-${i}`}
              className="flex items-center gap-2 px-3 py-1.5 border-b border-border hover:bg-panel-2/50"
            >
              <span className="text-[10px] font-mono text-text-3 w-4">{i + 1}</span>
              <span className="text-xs font-semibold text-text">{nameAt(s, f)}</span>
              <span className="text-[10px] font-mono text-text-3">
                s{s}·c{f}
              </span>
              {ed.kind === 'lick' && (
                <>
                  <button
                    onClick={() => ed.moveIndex(i, i - 1)}
                    disabled={i === 0}
                    className="ml-auto text-text-3 hover:text-text disabled:opacity-30"
                    title="Monter"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => ed.moveIndex(i, i + 1)}
                    disabled={i === ed.notes.length - 1}
                    className="text-text-3 hover:text-text disabled:opacity-30"
                    title="Descendre"
                  >
                    ▼
                  </button>
                </>
              )}
              <button
                onClick={() => ed.removeIndex(i)}
                className={`${ed.kind === 'voicing' ? 'ml-auto' : ''} text-root hover:opacity-80`}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <div className="p-2 border-t border-border bg-panel flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={preview}
            disabled={ed.notes.length === 0}
            className="flex-1 px-2 py-1.5 rounded-md bg-panel-2 hover:bg-panel-2/70 text-text text-[11px] font-semibold disabled:opacity-40"
          >
            ▶ Aperçu
          </button>
          <button
            onClick={ed.clear}
            disabled={ed.notes.length === 0}
            className="px-2 py-1.5 rounded-md bg-panel-2 hover:bg-panel-2/70 text-text-2 text-[11px] font-semibold disabled:opacity-40"
          >
            Vider
          </button>
        </div>
        <button
          onClick={save}
          disabled={ed.notes.length === 0}
          className="px-2 py-1.5 rounded-md bg-accent text-black text-[11px] font-semibold disabled:opacity-40"
        >
          {ed.editingId ? 'Mettre à jour' : 'Enregistrer'}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={exportJSON}
            disabled={custom.items.length === 0}
            className="flex-1 px-2 py-1 rounded-md bg-panel-2 text-text-2 hover:text-text text-[10px] font-mono disabled:opacity-40"
          >
            ⬇ Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-2 py-1 rounded-md bg-panel-2 text-text-2 hover:text-text text-[10px] font-mono"
          >
            ⬆ Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJSON(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
