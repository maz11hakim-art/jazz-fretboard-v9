import { useTransport } from '../stores/transport'
import { playSequence, stopAll, isLoaded, loadSampler, playNoteAt } from '../audio/sampler'
import { useState } from 'react'

export function TransportBar() {
  const {
    bpm,
    playing,
    setBpm,
    setPlaying,
    setCurrentNoteIdx,
    currentNotes,
    currentItemId,
    currentNoteIdx,
    stepNote,
  } = useTransport()
  const [loading, setLoading] = useState(false)

  const hasItem = !!currentItemId && currentNotes.length > 0

  const handlePlay = async () => {
    if (playing) {
      stopAll()
      setPlaying(false)
      setCurrentNoteIdx(-1)
      return
    }
    if (!hasItem) return
    if (!isLoaded()) {
      setLoading(true)
      await loadSampler()
      setLoading(false)
    }
    setPlaying(true)
    setCurrentNoteIdx(-1)
    await playSequence(currentNotes, bpm, (idx) => setCurrentNoteIdx(idx))
    const last = currentNotes[currentNotes.length - 1]
    const totalBeats = last[2] + last[3]
    const durMs = (totalBeats * 30) / bpm * 1000 + 200
    setTimeout(() => {
      setPlaying(false)
      setCurrentNoteIdx(-1)
    }, durMs)
  }

  const handleStep = (dir: 'prev' | 'next' | 'start') => {
    if (playing) {
      stopAll()
      setPlaying(false)
    }
    stepNote(dir)
    const { currentNoteIdx: idx, currentNotes: notes } = useTransport.getState()
    const n = notes[idx]
    if (n) playNoteAt(n[0], n[1], 0.5)
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 bg-panel border-t border-border">
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleStep('start')}
          disabled={!hasItem}
          className="w-8 h-8 rounded-md bg-panel-2 text-text-2 hover:text-text font-bold disabled:opacity-40"
          title="Début"
        >
          ⏮
        </button>
        <button
          onClick={() => handleStep('prev')}
          disabled={!hasItem}
          className="w-8 h-8 rounded-md bg-panel-2 text-text-2 hover:text-text font-bold disabled:opacity-40"
          title="Note précédente"
        >
          ◀
        </button>
        <button
          onClick={handlePlay}
          disabled={!hasItem || loading}
          className={`px-3 h-8 rounded-md font-semibold text-sm transition ${
            playing ? 'bg-root text-white' : 'bg-accent text-black'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={playing ? 'Stop' : 'Jouer'}
        >
          {loading ? '…' : playing ? '■' : '▶'}
        </button>
        <button
          onClick={() => handleStep('next')}
          disabled={!hasItem}
          className="w-8 h-8 rounded-md bg-panel-2 text-text-2 hover:text-text font-bold disabled:opacity-40"
          title="Note suivante"
        >
          ▶
        </button>
      </div>

      {hasItem && (
        <span className="font-mono text-[10px] text-text-3 shrink-0">
          {currentNoteIdx < 0 ? '–' : currentNoteIdx + 1}/{currentNotes.length}
        </span>
      )}

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-[10px] text-text-2 font-mono">BPM</span>
        <input
          type="range"
          min={40}
          max={280}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="flex-1 accent-accent min-w-0"
        />
        <span className="text-xs font-mono text-text w-8 text-right">{bpm}</span>
      </div>
    </div>
  )
}
