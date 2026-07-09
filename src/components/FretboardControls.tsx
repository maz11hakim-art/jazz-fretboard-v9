import { useUi } from '../stores/ui'
import type { DisplayMode, FretCount } from '../stores/ui'
import type { ScaleId } from '../lib/scales'
import { PITCH_CLASSES, SCALES } from '../lib/scales'

const MODES: { id: DisplayMode; label: string; hint: string }[] = [
  { id: 'sequence', label: 'Séq.', hint: "Séquence de l'item" },
  { id: 'all', label: 'Toutes', hint: 'Toutes les notes de la gamme' },
  { id: 'degrees', label: 'Degrés', hint: 'Labels 1 b3 5 b7…' },
  { id: 'caged', label: 'CAGED', hint: 'Shape C/A/G/E/D seule' },
]

const FRET_OPTIONS: FretCount[] = [12, 15, 21, 24]
const CAGED_SHAPES: ('C' | 'A' | 'G' | 'E' | 'D')[] = ['C', 'A', 'G', 'E', 'D']

export function FretboardControls() {
  const ui = useUi()

  if (ui.controlsCollapsed) {
    return (
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-panel">
        <button
          onClick={() => ui.setControlsCollapsed(false)}
          className="px-2 py-0.5 text-[10px] text-text-2 hover:text-text flex items-center gap-1"
          title="Déplier les contrôles"
        >
          <span>▾</span>
          <span className="font-mono">
            {MODES.find((m) => m.id === ui.displayMode)?.label} · {PITCH_CLASSES[ui.rootPc]} {SCALES[ui.scale].label} · {ui.fretCount}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative border-b border-border bg-panel">
      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] overflow-x-auto whitespace-nowrap no-scrollbar">
        <div className="flex items-center gap-0.5 shrink-0">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => ui.setDisplayMode(m.id)}
              title={m.hint}
              className={`px-2 py-1 rounded-md font-semibold transition ${
                ui.displayMode === m.id ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-border shrink-0" />

        <label className="flex items-center gap-1 text-text-2 shrink-0">
          <select
            value={ui.rootPc}
            onChange={(e) => ui.setRootPc(parseInt(e.target.value))}
            className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent"
            title="Tonique"
          >
            {PITCH_CLASSES.map((pc, i) => (
              <option key={pc} value={i}>
                {pc}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-text-2 shrink-0">
          <select
            value={ui.scale}
            onChange={(e) => ui.setScale(e.target.value as ScaleId)}
            className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent max-w-[110px]"
            title="Gamme"
          >
            {Object.entries(SCALES).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {ui.displayMode === 'caged' && (
          <div className="flex items-center gap-0.5 shrink-0">
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

        <span className="w-px h-5 bg-border shrink-0" />

        <label className="flex items-center gap-1 text-text-2 shrink-0">
          <select
            value={ui.fretCount}
            onChange={(e) => ui.setFretCount(parseInt(e.target.value) as FretCount)}
            className="bg-panel-2 text-text px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-accent"
            title="Cases"
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
          className={`px-2 py-1 rounded-md font-semibold shrink-0 transition ${
            ui.fitToScreen ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
          }`}
          title="Ajuster à la largeur"
        >
          Fit
        </button>

        {!ui.fitToScreen && (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="range"
              min={0.6}
              max={2.5}
              step={0.05}
              value={ui.zoom}
              onChange={(e) => ui.setZoom(parseFloat(e.target.value))}
              className="accent-accent w-20"
              title="Zoom"
            />
            <span className="font-mono text-text-2 w-8 text-right">{ui.zoom.toFixed(2)}</span>
          </div>
        )}

        <span className="w-px h-5 bg-border shrink-0" />

        <button
          onClick={() => ui.setShowNoteNames(!ui.showNoteNames)}
          className={`px-2 py-1 rounded-md font-semibold shrink-0 transition ${
            ui.showNoteNames ? 'bg-accent text-black' : 'bg-panel-2 text-text-2 hover:text-text'
          }`}
          title="Afficher les noms de notes"
        >
          Noms
        </button>

        <button
          onClick={() => ui.setHandedness(ui.handedness === 'right' ? 'left' : 'right')}
          className="px-2 py-1 rounded-md font-semibold shrink-0 bg-panel-2 text-text-2 hover:text-text transition"
          title="Gaucher / Droitier"
        >
          {ui.handedness === 'right' ? 'D' : 'G'}
        </button>

        <button
          onClick={() => ui.setControlsCollapsed(true)}
          className="ml-auto px-2 py-1 rounded-md shrink-0 bg-panel-2 text-text-2 hover:text-text transition"
          title="Replier"
        >
          ▴
        </button>
      </div>
    </div>
  )
}
