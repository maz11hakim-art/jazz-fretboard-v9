# Jazz Fretboard v9.0

Application web (PWA) d'apprentissage du jazz à la guitare.

**App en ligne** : https://jazz-fretboard-v9-maz.netlify.app/

- **Fretboard SVG** interactif (horizontal/vertical auto selon orientation)
- **Audio** Tone.js Sampler + SoundFont jazz guitar (FluidR3 preset 26)
- **Catalogue** : licks ii-V-I, arpèges CAGED 7e (maj7/m7/7/m7b5/dim7), voicings drop-2/shell, standards, pentatoniques jazz
- **Stack** : Vite 8 + React 19 + Zustand + Tailwind v4 + vite-plugin-pwa

## Dev

```bash
npm install --legacy-peer-deps
npm run dev
npm run build
```

## Structure

```
src/
  audio/sampler.ts       Tone.Sampler + SoundFont CDN, playSequence, stopAll
  components/
    Fretboard.tsx        SVG horizontal + vertical layouts
    TransportBar.tsx     Play/stop + BPM slider
    CatalogPicker.tsx    Licks / arpeggios / voicings tabs
  data/
    seedCatalog.json     Source of truth for all playable items
    catalog.ts           Typed loader
  lib/notes.ts           string/fret ↔ MIDI ↔ Tone note name helpers
  stores/transport.ts    Zustand playback state
```

## Format note

`[string, fret, beat, duration, technique]` où :
- `string 1 = mi aigu, 6 = mi grave`
- `beat` en croches (1 temps = 2 unités)
- `technique ∈ {'h','p','s','b', null}` (hammer, pull, slide, bend)

## Deploy

Push vers `main` → Netlify build auto via `netlify.toml`.
Site déployé : https://jazz-fretboard-v9-maz.netlify.app/
