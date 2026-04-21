import { useEffect, useMemo, useRef, useState } from 'react'
import type { NoteTuple } from '../lib/notes'
import { nameAt, midiOf } from '../lib/notes'
import { playNoteAt } from '../audio/sampler'
import { useUi } from '../stores/ui'
import {
  SCALES,
  degreeLabel,
  cagedBoxRange,
  highlightKindForInterval,
} from '../lib/scales'

type Props = {
  notes: NoteTuple[]
  activeIdx?: number
  orientation?: 'horizontal' | 'vertical'
  editorMode?: boolean
  editorSelection?: Set<string>
  onCellClick?: (string: number, fret: number) => void
}

const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const DOUBLE_INLAYS = new Set([12, 24])

// Classic Fender-like fret spacing (exponential).
const FRET_SCALE = 0.943874
const cumulativeWidths = (count: number) => {
  const w: number[] = [0]
  let acc = 0
  for (let f = 1; f <= count; f++) {
    const fw = Math.pow(FRET_SCALE, f - 1)
    acc += fw
    w.push(acc)
  }
  return w
}

const SEQUENCE_COLORS = ['#fbbf24', '#fb923c', '#f87171', '#f472b6', '#c084fc', '#818cf8', '#38bdf8', '#4ade80']
const KIND_COLOR: Record<string, string> = {
  root: '#ef4444',
  third: '#22c55e',
  fifth: '#3b82f6',
  seventh: '#a855f7',
  scale: '#94a3b8',
}

export function Fretboard({
  notes,
  activeIdx = -1,
  orientation = 'horizontal',
  editorMode = false,
  editorSelection,
  onCellClick,
}: Props) {
  const { fretCount, zoom, fitToScreen, rootPc, scale, cagedShape, displayMode, showNoteNames, handedness } = useUi()

  const wrapRef = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState({ w: 800, h: 260 })

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      setContainer({ w: Math.max(280, rect.width), h: Math.max(160, rect.height) })
    }
    update()
    const ro = new ResizeObserver(update)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const isHorizontal = orientation === 'horizontal'
  const widths = useMemo(() => cumulativeWidths(fretCount), [fretCount])
  const totalUnits = widths[fretCount]

  // Geometry
  const gutter = 26
  const padBoard = 18 // vertical (or horizontal for vertical orient) padding for strings
  const containerMain = isHorizontal ? container.w : container.h
  const containerCross = isHorizontal ? container.h : container.w

  // Base width per fret unit when fit-to-screen.
  const availMain = Math.max(200, containerMain - gutter - 12)
  const fitUnit = availMain / totalUnits
  const unit = fitToScreen ? fitUnit : Math.max(14, fitUnit * zoom)

  const boardMain = unit * totalUnits
  const boardCross = Math.max(120, containerCross - padBoard * 2 - 12)
  const stringGap = boardCross / 5

  // SVG canvas size.
  const svgW = isHorizontal ? gutter + boardMain + 10 : padBoard * 2 + boardCross
  const svgH = isHorizontal ? padBoard * 2 + boardCross : gutter + boardMain + 10

  const mainAt = (f: number) => (widths[f] / totalUnits) * boardMain
  const centerAt = (f: number) => (mainAt(f) + mainAt(Math.max(0, f - 1))) / 2

  // Helpers: given visual string index i=0..5, return actual string id per handedness.
  // Strings: 1=high E, 6=low E. Right-handed horizontal = high E on top (i=0 → s=1).
  const visualStrings = handedness === 'left' ? [6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6]

  const stringCross = (s: number) => {
    const i = visualStrings.indexOf(s)
    return padBoard + stringGap * i
  }

  const isHighE = (s: number) => s === 1

  // Note lookup for sequence mode.
  const seqAt = useMemo(() => {
    const m = new Map<string, number>()
    notes.forEach((n, i) => {
      const key = `${n[0]}-${n[1]}`
      if (!m.has(key)) m.set(key, i)
    })
    return m
  }, [notes])

  // Scale overlay positions.
  const overlay = useMemo(() => {
    if (editorMode) return []
    if (displayMode === 'sequence') return []
    const intervals = new Set(SCALES[scale].intervals)
    const [cagedStart, cagedEnd] = displayMode === 'caged' ? cagedBoxRange(rootPc, cagedShape, fretCount) : [0, fretCount]
    const out: { s: number; f: number; rel: number }[] = []
    for (let s = 1; s <= 6; s++) {
      for (let f = 0; f <= fretCount; f++) {
        if (displayMode === 'caged' && (f < cagedStart || f > cagedEnd)) continue
        const rel = (((midiOf(s, f) % 12) - rootPc) % 12 + 12) % 12
        if (intervals.has(rel)) out.push({ s, f, rel })
      }
    }
    return out
  }, [editorMode, displayMode, scale, rootPc, cagedShape, fretCount])

  // Cell click handler (editor or simple tap-to-play).
  const handleCell = (s: number, f: number) => {
    if (onCellClick) onCellClick(s, f)
    else playNoteAt(s, f)
  }

  // Coordinate helpers.
  // For horizontal: main axis = x (frets), cross axis = y (strings).
  // For vertical: main axis = y (frets), cross axis = x (strings).
  const fretLine = (f: number) => {
    if (isHorizontal) {
      return { x1: gutter + mainAt(f), y1: padBoard, x2: gutter + mainAt(f), y2: padBoard + boardCross }
    }
    return { x1: padBoard, y1: gutter + mainAt(f), x2: padBoard + boardCross, y2: gutter + mainAt(f) }
  }

  const stringLine = (s: number) => {
    if (isHorizontal) {
      return { x1: gutter, y1: stringCross(s), x2: gutter + boardMain, y2: stringCross(s) }
    }
    return { x1: stringCross(s), y1: gutter, x2: stringCross(s), y2: gutter + boardMain }
  }

  const notePos = (s: number, f: number) => {
    const m = f === 0 ? mainAt(0) / 2 : centerAt(f)
    if (isHorizontal) return { cx: gutter + m, cy: stringCross(s) }
    return { cx: stringCross(s), cy: gutter + m }
  }

  const cellRect = (s: number, f: number) => {
    const mStart = f === 0 ? 0 : mainAt(f - 1)
    const mEnd = mainAt(f)
    const mW = Math.max(8, mEnd - mStart)
    const cStart = stringCross(s) - stringGap / 2
    const cW = stringGap
    if (isHorizontal) return { x: gutter + mStart, y: cStart, width: mW, height: cW }
    return { x: cStart, y: gutter + mStart, width: cW, height: mW }
  }

  const inlayPos = (f: number) => {
    const m = centerAt(f)
    if (isHorizontal) return { mainCoord: gutter + m, crossStart: padBoard, crossLen: boardCross }
    return { mainCoord: gutter + m, crossStart: padBoard, crossLen: boardCross }
  }

  // Zoom scrolling: when fit is off, main axis may exceed container. Wrap scroll container accordingly.
  const needsScroll = !fitToScreen && boardMain + gutter + 12 > containerMain

  return (
    <div
      ref={wrapRef}
      className="w-full h-full flex items-center justify-center"
      style={{ minHeight: 160 }}
    >
      <div
        className="w-full h-full"
        style={{
          overflowX: needsScroll && isHorizontal ? 'auto' : 'hidden',
          overflowY: needsScroll && !isHorizontal ? 'auto' : 'hidden',
        }}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="fb-flat" x1="0" y1="0" x2={isHorizontal ? '0' : '1'} y2={isHorizontal ? '1' : '0'}>
              <stop offset="0%" stopColor="#1e1e23" />
              <stop offset="100%" stopColor="#14141a" />
            </linearGradient>
          </defs>

          {/* Board background */}
          {isHorizontal ? (
            <rect x={gutter} y={padBoard - 6} width={boardMain} height={boardCross + 12} fill="url(#fb-flat)" rx={6} />
          ) : (
            <rect x={padBoard - 6} y={gutter} width={boardCross + 12} height={boardMain} fill="url(#fb-flat)" rx={6} />
          )}

          {/* Fret numbers */}
          {Array.from({ length: fretCount + 1 }, (_, f) => {
            if (f > 0 && !INLAYS.has(f) && !DOUBLE_INLAYS.has(f) && f % 12 !== 0) {
              // Only label inlay positions and nut for less clutter
            }
            const m = f === 0 ? mainAt(0) / 2 : centerAt(f)
            if (isHorizontal) {
              return (
                <text
                  key={`fn-${f}`}
                  x={gutter + m}
                  y={padBoard - 10}
                  fill="#6b7280"
                  fontSize={9}
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {f}
                </text>
              )
            }
            return (
              <text
                key={`fn-${f}`}
                x={padBoard - 10}
                y={gutter + m + 3}
                fill="#6b7280"
                fontSize={9}
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                {f}
              </text>
            )
          })}

          {/* Inlays */}
          {Array.from({ length: fretCount + 1 }, (_, f) => {
            if (!INLAYS.has(f) && !DOUBLE_INLAYS.has(f)) return null
            const { mainCoord, crossStart, crossLen } = inlayPos(f)
            const dots = DOUBLE_INLAYS.has(f)
              ? [crossStart + crossLen * 0.3, crossStart + crossLen * 0.7]
              : [crossStart + crossLen * 0.5]
            return (
              <g key={`inlay-${f}`}>
                {dots.map((d, i) =>
                  isHorizontal ? (
                    <circle key={i} cx={mainCoord} cy={d} r={3.5} fill="#3f3f46" />
                  ) : (
                    <circle key={i} cx={d} cy={mainCoord} r={3.5} fill="#3f3f46" />
                  ),
                )}
              </g>
            )
          })}

          {/* CAGED box shading */}
          {displayMode === 'caged' && !editorMode && (() => {
            const [a, b] = cagedBoxRange(rootPc, cagedShape, fretCount)
            const x1 = mainAt(Math.max(0, a - 1))
            const x2 = mainAt(b)
            if (isHorizontal) {
              return (
                <rect
                  x={gutter + x1}
                  y={padBoard - 4}
                  width={Math.max(0, x2 - x1)}
                  height={boardCross + 8}
                  fill="#fbbf24"
                  opacity={0.08}
                />
              )
            }
            return (
              <rect
                x={padBoard - 4}
                y={gutter + x1}
                width={boardCross + 8}
                height={Math.max(0, x2 - x1)}
                fill="#fbbf24"
                opacity={0.08}
              />
            )
          })()}

          {/* Frets */}
          {Array.from({ length: fretCount + 1 }, (_, f) => {
            const { x1, y1, x2, y2 } = fretLine(f)
            return (
              <line
                key={`fl-${f}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={f === 0 ? '#e5e7eb' : '#52525b'}
                strokeWidth={f === 0 ? 3 : 1}
                opacity={f === 0 ? 1 : 0.7}
              />
            )
          })}

          {/* Strings */}
          {visualStrings.map((s) => {
            const { x1, y1, x2, y2 } = stringLine(s)
            const thickness = isHighE(s) ? 0.9 : 0.8 + (s - 1) * 0.22
            return (
              <g key={`s-${s}`}>
                {isHorizontal ? (
                  <text x={4} y={stringCross(s) + 3} fill="#9ca3af" fontSize={10} fontFamily="JetBrains Mono">
                    {['E', 'B', 'G', 'D', 'A', 'E'][s - 1]}
                  </text>
                ) : (
                  <text
                    x={stringCross(s)}
                    y={gutter - 8}
                    fill="#9ca3af"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {['E', 'B', 'G', 'D', 'A', 'E'][s - 1]}
                  </text>
                )}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth={thickness} opacity={0.8} />
              </g>
            )
          })}

          {/* Tap zones */}
          {visualStrings.map((s) =>
            Array.from({ length: fretCount + 1 }, (_, f) => {
              const r = cellRect(s, f)
              return (
                <rect
                  key={`cell-${s}-${f}`}
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCell(s, f)}
                />
              )
            }),
          )}

          {/* Scale overlay (all / degrees / caged) */}
          {overlay.map(({ s, f, rel }) => {
            const { cx, cy } = notePos(s, f)
            const kind = highlightKindForInterval(rel)
            const color = KIND_COLOR[kind]
            const isRoot = kind === 'root'
            const r = isRoot ? 10 : 8
            const label = displayMode === 'degrees' ? degreeLabel(rel) : nameAt(s, f)
            return (
              <g key={`ov-${s}-${f}`} opacity={0.95} pointerEvents="none">
                <circle cx={cx} cy={cy} r={r} fill={color} stroke="#0a0a0a" strokeWidth={isRoot ? 1.5 : 1} />
                {showNoteNames && (
                  <text
                    x={cx}
                    y={cy + 3}
                    fill="#0a0a0a"
                    fontSize={isRoot ? 9 : 8}
                    fontWeight={700}
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Editor selection markers */}
          {editorMode &&
            editorSelection &&
            [...editorSelection].map((key) => {
              const [sStr, fStr] = key.split('-')
              const s = parseInt(sStr, 10)
              const f = parseInt(fStr, 10)
              const { cx, cy } = notePos(s, f)
              return (
                <g key={`sel-${key}`} pointerEvents="none">
                  <circle cx={cx} cy={cy} r={11} fill="#22c55e" opacity={0.85} stroke="#0a0a0a" strokeWidth={1.5} />
                  <text
                    x={cx}
                    y={cy + 3}
                    fill="#0a0a0a"
                    fontSize={9}
                    fontWeight={700}
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {nameAt(s, f)}
                  </text>
                </g>
              )
            })}

          {/* Sequence notes (catalog playback or 'sequence' mode) */}
          {displayMode === 'sequence' && !editorMode &&
            notes.map((n, i) => {
              const [s, f] = n
              const { cx, cy } = notePos(s, f)
              const active = i === activeIdx
              const played = activeIdx >= 0 && i < activeIdx
              const baseColor = SEQUENCE_COLORS[i % SEQUENCE_COLORS.length]
              const r = active ? 12 : 9
              const opacity = active ? 1 : played ? 0.28 : 0.9
              return (
                <g key={`n-${i}`} opacity={opacity} style={{ transition: 'opacity .15s' }} pointerEvents="none">
                  {active && <circle cx={cx} cy={cy} r={r + 7} fill={baseColor} opacity={0.3} />}
                  <circle cx={cx} cy={cy} r={r} fill={baseColor} stroke="#0a0a0a" strokeWidth={1.4} />
                  <text
                    x={cx}
                    y={cy + 3}
                    fill="#0a0a0a"
                    fontSize={9}
                    fontWeight={700}
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {showNoteNames ? nameAt(s, f) : i + 1}
                  </text>
                </g>
              )
            })}

          {/* Sequence markers on top of scale overlay when not in sequence mode */}
          {displayMode !== 'sequence' && !editorMode &&
            activeIdx >= 0 && notes[activeIdx] && (() => {
              const [s, f] = notes[activeIdx]
              const { cx, cy } = notePos(s, f)
              return (
                <g pointerEvents="none">
                  <circle cx={cx} cy={cy} r={14} fill="#fbbf24" opacity={0.45} />
                  <circle cx={cx} cy={cy} r={10} fill="#fbbf24" stroke="#0a0a0a" strokeWidth={1.5} />
                </g>
              )
            })()}

          {/* Sequence path trail in non-sequence modes: small numbered dots along sequence */}
          {displayMode !== 'sequence' && !editorMode &&
            notes.length > 0 && (() => {
              const seen = new Set<string>()
              return notes.map((n, i) => {
                const key = `${n[0]}-${n[1]}`
                if (seen.has(key)) return null
                seen.add(key)
                if (seqAt.get(key) !== i) return null
                const { cx, cy } = notePos(n[0], n[1])
                return (
                  <circle
                    key={`seq-${i}`}
                    cx={cx}
                    cy={cy - 14}
                    r={3}
                    fill="#fbbf24"
                    pointerEvents="none"
                  />
                )
              })
            })()}
        </svg>
      </div>
    </div>
  )
}
