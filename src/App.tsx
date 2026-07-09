import { useMemo } from 'react'
import { Fretboard } from './components/Fretboard'
import { TransportBar } from './components/TransportBar'
import { CatalogPicker } from './components/CatalogPicker'
import { FretboardControls } from './components/FretboardControls'
import { EditorPanel } from './components/Editor'
import { useTransport } from './stores/transport'
import { useEditor } from './stores/editor'
import { useUi } from './stores/ui'

export default function App() {
  const { currentNotes, currentNoteIdx, currentItemId } = useTransport()
  const editor = useEditor()
  const ui = useUi()

  const editorSelection = useMemo(
    () => new Set(editor.notes.map((n) => `${n[0]}-${n[1]}`)),
    [editor.notes],
  )

  const displayedNotes = editor.active ? editor.notes : currentNotes
  const sidebarCollapsed = ui.sidebarCollapsed

  return (
    <div className="h-full flex flex-col bg-bg text-text">
      {!ui.expandedView && (
        <header className="px-3 py-2 border-b border-border bg-panel flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight leading-tight">Jazz Fretboard</h1>
            <p className="text-[9px] text-text-3 font-mono truncate">
              v9.2
              {currentItemId && !editor.active ? ` · ${currentItemId}` : ''}
              {editor.active ? ` · éditeur (${editor.kind})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => editor.setActive(!editor.active)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition ${
                editor.active ? 'bg-root text-white' : 'bg-accent text-black'
              }`}
              title="Éditeur de licks / voicings"
            >
              {editor.active ? '✕ Éditeur' : '✎ Éditeur'}
            </button>
            <button
              onClick={() => {
                ui.setExpandedView(true)
                ui.setSidebarCollapsed(true)
                ui.setControlsCollapsed(true)
              }}
              className="px-2 py-1.5 rounded-md text-[11px] font-semibold bg-panel-2 text-text-2 hover:text-text"
              title="Vue manche élargie"
            >
              ⛶
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 min-h-0 flex flex-row">
        {sidebarCollapsed ? (
          <button
            onClick={() => ui.setSidebarCollapsed(false)}
            className="w-6 border-r border-border bg-panel hover:bg-panel-2 text-text-2 hover:text-text flex items-center justify-center text-sm"
            title="Ouvrir le catalogue"
          >
            ▶
          </button>
        ) : (
          <section className="w-60 sm:w-64 md:w-72 bg-panel-2 border-r border-border flex flex-col min-h-0">
            <div className="flex justify-end px-1.5 pt-1.5">
              <button
                onClick={() => ui.setSidebarCollapsed(true)}
                className="w-6 h-6 rounded-md text-text-3 hover:text-text text-sm"
                title="Replier"
              >
                ◀
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {editor.active ? <EditorPanel /> : <CatalogPicker />}
            </div>
          </section>
        )}

        <section className="flex-1 min-h-0 flex flex-col">
          <FretboardControls />
          <div className="flex-1 min-h-0 flex items-stretch justify-stretch px-2 py-2 overflow-hidden">
            {editor.active ? (
              <Fretboard
                notes={displayedNotes}
                activeIdx={currentNoteIdx}
                editorMode
                editorSelection={editorSelection}
                onCellClick={(s, f) => editor.toggleNoteAt(s, f)}
              />
            ) : (
              <Fretboard notes={displayedNotes} activeIdx={currentNoteIdx} />
            )}
          </div>
          <TransportBar />
        </section>
      </main>

      {ui.expandedView && (
        <button
          onClick={() => {
            ui.setExpandedView(false)
            ui.setSidebarCollapsed(false)
            ui.setControlsCollapsed(false)
          }}
          className="fixed top-2 right-2 z-50 px-2 py-1 rounded-md text-[11px] font-semibold bg-panel-2/90 backdrop-blur text-text border border-border hover:bg-panel"
          title="Quitter la vue élargie"
        >
          ⛶ Fermer
        </button>
      )}
    </div>
  )
}
