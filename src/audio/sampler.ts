import * as Tone from 'tone'
import { toToneNote } from '../lib/notes'
import type { NoteTuple } from '../lib/notes'

// Jazz guitar samples from gleitz/midi-js-soundfonts (FluidR3 electric_guitar_jazz).
// Mp3 format keeps bundle lean; Tone.Sampler pitch-shifts between pitches.
const CDN = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3'

// Subset of samples hosted on the CDN; Tone.Sampler interpolates for missing pitches.
const SAMPLES: Record<string, string> = {
  E2: 'E2.mp3',
  A2: 'A2.mp3',
  D3: 'D3.mp3',
  G3: 'G3.mp3',
  B3: 'B3.mp3',
  E4: 'E4.mp3',
  A4: 'A4.mp3',
  D5: 'D5.mp3',
  G5: 'G5.mp3',
}

let _sampler: Tone.Sampler | null = null
let _reverb: Tone.Reverb | null = null
let _loaded = false
let _loading: Promise<void> | null = null

export function isLoaded() {
  return _loaded
}

export function loadSampler(): Promise<void> {
  if (_loaded) return Promise.resolve()
  if (_loading) return _loading

  _loading = new Promise((resolve, reject) => {
    _reverb = new Tone.Reverb({ decay: 1.4, wet: 0.18 }).toDestination()
    _sampler = new Tone.Sampler({
      urls: SAMPLES,
      baseUrl: CDN + '/',
      release: 0.9,
      onload: () => {
        _loaded = true
        resolve()
      },
      onerror: (err) => reject(err),
    }).connect(_reverb)
  })
  return _loading
}

export async function ensureAudio(): Promise<void> {
  if (Tone.getContext().state !== 'running') {
    await Tone.start()
  }
  await loadSampler()
}

export async function playNoteAt(string: number, fret: number, duration = 0.4, velocity = 0.8) {
  await ensureAudio()
  if (!_sampler) return
  _sampler.triggerAttackRelease(toToneNote(string, fret), duration, undefined, velocity)
}

// Play a noteOrder sequence (array of NoteTuple) starting now.
// beat unit = 1/8 (eighth note). Tempo is BPM (quarter notes).
export async function playSequence(notes: NoteTuple[], bpm = 120, onNoteStart?: (idx: number) => void) {
  await ensureAudio()
  if (!_sampler) return
  Tone.getTransport().bpm.value = bpm
  const eighth = 30 / bpm // seconds per 1/8 note (60 / bpm / 2)
  const now = Tone.now() + 0.05

  notes.forEach((n, i) => {
    const [string, fret, beat, duration, tech] = n
    const t = now + beat * eighth
    const durSec = Math.max(0.12, duration * eighth * 0.92)
    // Slight velocity variation by technique
    const vel = tech === 'h' ? 0.65 : tech === 'p' ? 0.55 : tech === 'b' ? 0.85 : tech === 's' ? 0.7 : 0.8
    _sampler!.triggerAttackRelease(toToneNote(string, fret), durSec, t, vel)
    if (onNoteStart) {
      const ms = Math.max(0, (t - Tone.now()) * 1000)
      setTimeout(() => onNoteStart(i), ms)
    }
  })
}

export function stopAll() {
  if (_sampler) _sampler.releaseAll()
}
