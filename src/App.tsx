import { useEffect, useState } from 'react'
import { Fretboard } from './components/Fretboard'
import { TransportBar } from './components/TransportBar'
import { CatalogPicker } from './components/CatalogPicker'
import { useTransport } from './stores/transport'

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

  return (
    <div className="h-full flex flex-col bg-bg text-text">
      <header className="px-4 py-2.5 border-b border-border bg-panel flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">Jazz Fretboard</h1>
          <p className="text-[10px] text-text-3 font-mono">v9.0 · Tone.js + SoundFont Jazz · {orientation}</p>
        </div>
        {currentItemId && <span className="text-xs text-accent font-mono">{currentItemId}</span>}
      </header>

      <main className={`flex-1 min-h-0 flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
        <section
          className={`bg-panel-2 ${
            orientation === 'horizontal' ? 'w-72 border-r border-border' : 'h-64 border-b border-border'
          }`}
        >
          <CatalogPicker />
        </section>

        <section className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-auto">
            {currentItemId ? (
              <Fretboard notes={currentNotes} activeIdx={currentNoteIdx} orientation={orientation} frets={15} />
            ) : (
              <div className="text-center text-text-3 text-sm px-6">
                Sélectionne un lick, arpège ou voicing dans le catalogue
                <br />
                <span className="text-xs font-mono text-text-3/60">
                  (Le son charge au premier Play · SoundFont Jazz Guitar)
                </span>
              </div>
            )}
          </div>
          <TransportBar />
        </section>
      </main>
    </div>
  )
}
