import { useEffect, useMemo, useState } from 'react'
import { Fretboard } from './components/Fretboard'
import { TransportBar } from './components/TransportBar'
import { CatalogPicker } from './components/CatalogPicker'
import { FretboardControls } from './components/FretboardControls'
import { EditorPanel } from './components/Editor'
import { useTransport } from './stores/transport'
import { useEditor } from './stores/editor'

function useOrientation(): 'horizontal' | 'vertical' {
  const [o, setO] = useState<'horizontal' | 'vertical'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= window.innerHeight ? 'horizontal' : 'vertical',
  )
  useEffect(() => {
    const update = () => setO(window.innerWidth >= window.innerHeight ? 'horizontal' : 'vertical')
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return o
}

export default function App() {
  const orientation = useOrientation()
  const { currentNotes, currentNoteIdx, currentItemId } = useTransport()
  const editor = useEditor()

  const editorSelection = useMemo(
    () => new Set(editor.notes.map((n) => `${n[0]}-${n[1]}`)),
    [editor.notes],
  )

  const displayedNotes = editor.active ? editor.notes : currentNotes

  return (
    <div className="h-full flex flex-col bg-bg text-text">
      <header className="px-4 py-2.5 border-b border-border bg-panel flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight">Jazz Fretboard</h1>
          <p className="text-[10px] text-text-3 font-mono truncate">
            v9.1 · {orientation}
            {currentItemId && !editor.active ? ` · ${currentItemId}` : ''}
            {editor.active ? ` · éditeur (${editor.kind})` : ''}
          </p>
        </div>
        <button
          onClick={() => editor.setActive(!editor.active)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
            editor.active ? 'bg-root text-white' : 'bg-accent text-black'
          }`}
        >
          {editor.active ? 'Fermer éditeur' : '✎ Éditeur'}
        </button>
      </header>

      <main className={`flex-1 min-h-0 flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
        <section
          className={`bg-panel-2 ${
            orientation === 'horizontal' ? 'w-72 border-r border-border' : 'h-64 border-b border-border'
          }`}
        >
          {editor.active ? <EditorPanel /> : <CatalogPicker />}
        </section>

        <section className="flex-1 min-h-0 flex flex-col">
          <FretboardControls />
          <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-hidden">
            {editor.active ? (
              <Fretboard
                notes={displayedNotes}
                activeIdx={currentNoteIdx}
                orientation={orientation}
                editorMode
                editorSelection={editorSelection}
                onCellClick={(s, f) => editor.toggleNoteAt(s, f)}
              />
            ) : currentItemId ? (
              <Fretboard notes={displayedNotes} activeIdx={currentNoteIdx} orientation={orientation} />
            ) : (
              <Fretboard notes={[]} activeIdx={-1} orientation={orientation} />
            )}
          </div>
          <TransportBar />
        </section>
      </main>
    </div>
  )
}
