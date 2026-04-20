import { useTransport } from '../stores/transport'
import { playSequence, stopAll, isLoaded, loadSampler } from '../audio/sampler'
import { useState } from 'react'

export function TransportBar() {
  const { bpm, playing, setBpm, setPlaying, setCurrentNoteIdx, currentNotes, currentItemId } = useTransport()
  const [loading, setLoading] = useState(false)

  const handlePlay = async () => {
    if (playing) {
      stopAll()
      setPlaying(false)
      setCurrentNoteIdx(-1)
      return
    }
    if (!currentItemId || currentNotes.length === 0) return
    if (!isLoaded()) {
      setLoading(true)
      await loadSampler()
      setLoading(false)
    }
    setPlaying(true)
    setCurrentNoteIdx(-1)
    await playSequence(currentNotes, bpm, (idx) => setCurrentNoteIdx(idx))
    // Estimate end time to auto-stop
    const last = currentNotes[currentNotes.length - 1]
    const totalBeats = last[2] + last[3]
    const durMs = (totalBeats * 30) / bpm * 1000 + 200
    setTimeout(() => {
      setPlaying(false)
      setCurrentNoteIdx(-1)
    }, durMs)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-panel border-t border-border sticky bottom-0">
      <button
        onClick={handlePlay}
        disabled={!currentItemId || loading}
        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
          playing ? 'bg-root text-white' : 'bg-accent text-black'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {loading ? 'Chargement…' : playing ? '■ Stop' : '▶ Jouer'}
      </button>
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs text-text-2 font-mono">BPM</span>
        <input
          type="range"
          min={40}
          max={280}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="text-sm font-mono text-text w-10 text-right">{bpm}</span>
      </div>
    </div>
  )
}
