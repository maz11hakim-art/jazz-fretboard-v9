import { useUi } from '../stores/ui'
import type { DisplayMode, FretCount } from '../stores/ui'
import type { ScaleId } from '../lib/scales'
import { PITCH_CLASSES, SCALES } from '../lib/scales'

const MODES: { id: DisplayMode; label: string; hint: string }[] = [
  { id: 'sequence', label: 'Séquence', hint: 'Notes de l\'item sélectionné' },
  { id: 'all', label: 'Toutes', hint: 'Toutes les notes de la gamme/accord' },
  { id: 'degrees', label: 'Degrés', hint: 'Labels 1 b3 5 b7…' },
  { id: 'caged', label: 'CAGED', hint: 'Shape C/A/G/E/D seule' },
]

const FRET_OPTIONS: FretCount[] = [12, 15, 21, 24]

const CAGED_SHAPES: ('C' | 'A' | 'G' | 'E' | 'D')[] = ['C', 'A', 'G', 'E', 'D']

export function FretboardControls() {
  const ui = useUi()

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-panel border-b border-border text-[11px]">
      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => ui.setDisplayMode(m.id)}
            title={m.hint}
            className={`px-2 py-1 rounded-md font-semibold transition ${
              ui.displayMode === m.id
                ? 'bg-accent text-black'
                : 'bg-panel-2 text-text-2 hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      <label className="flex items-center gap-1 text-text-2">
        <span>Tonique</span>
        <select
          value={ui.rootPc}
          onChange={(e) => ui.setRootPc(parseInt(e.target.value))}
          className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent"
        >
          {PITCH_CLASSES.map((pc, i) => (
            <option key={pc} value={i}>
              {pc}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-text-2">
        <span>Gamme</span>
        <select
          value={ui.scale}
          onChange={(e) => ui.setScale(e.target.value as ScaleId)}
          className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent"
        >
          {Object.entries(SCALES).map(([id, s]) => (
            <option key={id} value={id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {ui.displayMode === 'caged' && (
        <div className="flex items-center gap-0.5">
          {CAGED_SHAPES.map((sh) => (
            <button
              key={sh}
              onClick={() => ui.setCagedShape(sh)}
              className={`w-6 h-6 rounded font-bold transition ${
                ui.cagedShape === sh ? 'bg-accent text-black' : 'bg-panel-2 text-text-2'
              }`}
            >
              {sh}
            </button>
          ))}
        </div>
      )}

      <div className="w-px h-5 bg-border mx-1" />

      <label className="flex items-center gap-1 text-text-2">
        <span>Cases</span>
        <select
          value={ui.fretCount}
          onChange={(e) => ui.setFretCount(parseInt(e.target.value) as FretCount)}
          className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent"
        >
          {FRET_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={() => ui.setFitToScreen(!ui.fitToScreen)}
        className={`px-2 py-1 rounded-md font-semibold transition ${
          ui.fitToScreen ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
        }`}
        title="Ajuster à la largeur"
      >
        Fit
      </button>

      {!ui.fitToScreen && (
        <div className="flex items-center gap-1">
          <span className="text-text-3">Zoom</span>
          <input
            type="range"
            min={0.6}
            max={2.5}
            step={0.05}
            value={ui.zoom}
            onChange={(e) => ui.setZoom(parseFloat(e.target.value))}
            className="accent-accent w-24"
          />
          <span className="font-mono text-text-2 w-8 text-right">{ui.zoom.toFixed(2)}</span>
        </div>
      )}

      <div className="w-px h-5 bg-border mx-1" />

      <button
        onClick={() => ui.setShowNoteNames(!ui.showNoteNames)}
        className={`px-2 py-1 rounded-md font-semibold transition ${
          ui.showNoteNames ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
        }`}
        title="Afficher les noms de notes"
      >
        Noms
      </button>

      <button
        onClick={() => ui.setHandedness(ui.handedness === 'right' ? 'left' : 'right')}
        className="px-2 py-1 rounded-md font-semibold bg-panel-2 text-text-2 hover:text-text transition"
        title="Droitier / Gaucher"
      >
        {ui.handedness === 'right' ? 'Droitier' : 'Gaucher'}
      </button>
    </div>
  )
}
