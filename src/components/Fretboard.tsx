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
  editorMode?: boolean
  editorSelection?: Set<string>
  onCellClick?: (string: number, fret: number) => void
}

const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const DOUBLE_INLAYS = new Set([12, 24])

// Classic exponential fret spacing.
const FRET_SCALE = 0.943874
const cumulativeWidths = (count: number) => {
  const w: number[] = [0]
  let acc = 0
  for (let f = 1; f <= count; f++) {
    acc += Math.pow(FRET_SCALE, f - 1)
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

export function Fretboard({ notes, activeIdx = -1, editorMode = false, editorSelection, onCellClick }: Props) {
  const { fretCount, zoom, fitToScreen, rootPc, scale, cagedShape, displayMode, showNoteNames, handedness } = useUi()

  const wrapRef = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState({ w: 800, h: 260 })

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      setContainer({ w: Math.max(280, rect.width), h: Math.max(140, rect.height) })
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

  const widths = useMemo(() => cumulativeWidths(fretCount), [fretCount])
  const totalUnits = widths[fretCount]

  const gutter = 22
  const padBoard = 14
  const availW = Math.max(200, container.w - gutter - 12)
  const fitUnit = availW / totalUnits
  const unit = fitToScreen ? fitUnit : Math.max(14, fitUnit * zoom)
  const boardW = unit * totalUnits
  const boardH = Math.max(100, container.h - padBoard * 2 - 12)
  const stringGap = boardH / 5

  const svgW = gutter + boardW + 10
  const svgH = padBoard * 2 + boardH

  const mainAt = (f: number) => (widths[f] / totalUnits) * boardW
  const centerAt = (f: number) => (mainAt(f) + mainAt(Math.max(0, f - 1))) / 2

  const visualStrings = handedness === 'left' ? [6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6]
  const stringY = (s: number) => padBoard + stringGap * visualStrings.indexOf(s)

  const seqSeen = useMemo(() => {
    const m = new Map<string, number>()
    notes.forEach((n, i) => {
      const key = `${n[0]}-${n[1]}`
      if (!m.has(key)) m.set(key, i)
    })
    return m
  }, [notes])

  const overlay = useMemo(() => {
    if (editorMode) return []
    if (displayMode === 'sequence') return []
    const intervals = new Set(SCALES[scale].intervals)
    const [a, b] =
      displayMode === 'caged' ? cagedBoxRange(rootPc, cagedShape, fretCount) : [0, fretCount]
    const out: { s: number; f: number; rel: number }[] = []
    for (let s = 1; s <= 6; s++) {
      for (let f = 0; f <= fretCount; f++) {
        if (displayMode === 'caged' && (f < a || f > b)) continue
        const rel = (((midiOf(s, f) % 12) - rootPc) % 12 + 12) % 12
        if (intervals.has(rel)) out.push({ s, f, rel })
      }
    }
    return out
  }, [editorMode, displayMode, scale, rootPc, cagedShape, fretCount])

  // Notes currently sounding: every note sharing the same beat as activeIdx.
  // Handles chords/voicings where several notes strike simultaneously.
  const activeKeys = useMemo(() => {
    if (activeIdx < 0 || !notes[activeIdx]) return new Set<string>()
    const beat = notes[activeIdx][2]
    return new Set(notes.filter((n) => n[2] === beat).map((n) => `${n[0]}-${n[1]}`))
  }, [notes, activeIdx])
  const playbackActive = activeIdx >= 0 && activeKeys.size > 0
  const overlaySet = useMemo(
    () => new Set(overlay.map((o) => `${o.s}-${o.f}`)),
    [overlay],
  )

  const handleCell = (s: number, f: number) => {
    if (onCellClick) onCellClick(s, f)
    else playNoteAt(s, f)
  }

  const notePos = (s: number, f: number) => ({
    cx: gutter + (f === 0 ? mainAt(0) / 2 : centerAt(f)),
    cy: stringY(s),
  })

  const cellRect = (s: number, f: number) => {
    const mStart = f === 0 ? 0 : mainAt(f - 1)
    const mEnd = mainAt(f)
    return {
      x: gutter + mStart,
      y: stringY(s) - stringGap / 2,
      width: Math.max(8, mEnd - mStart),
      height: stringGap,
    }
  }

  const needsScroll = !fitToScreen && svgW > container.w

  return (
    <div ref={wrapRef} className="w-full h-full flex items-stretch" style={{ minHeight: 120 }}>
      <div
        className="w-full h-full"
        style={{ overflowX: needsScroll ? 'auto' : 'hidden', overflowY: 'hidden' }}
      >
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="fb-flat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1e23" />
              <stop offset="100%" stopColor="#14141a" />
            </linearGradient>
          </defs>

          <rect x={gutter} y={padBoard - 6} width={boardW} height={boardH + 12} fill="url(#fb-flat)" rx={6} />

          {/* Fret numbers (compact) */}
          {Array.from({ length: fretCount + 1 }, (_, f) => {
            const m = f === 0 ? mainAt(0) / 2 : centerAt(f)
            return (
              <text
                key={`fn-${f}`}
                x={gutter + m}
                y={padBoard - 6}
                fill="#6b7280"
                fontSize={9}
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {f}
              </text>
            )
          })}

          {/* Inlays */}
          {Array.from({ length: fretCount + 1 }, (_, f) => {
            if (!INLAYS.has(f) && !DOUBLE_INLAYS.has(f)) return null
            const m = gutter + centerAt(f)
            const dots = DOUBLE_INLAYS.has(f)
              ? [padBoard + boardH * 0.3, padBoard + boardH * 0.7]
              : [padBoard + boardH * 0.5]
            return (
              <g key={`inlay-${f}`}>
                {dots.map((cy, i) => (
                  <circle key={i} cx={m} cy={cy} r={3.5} fill="#3f3f46" />
                ))}
              </g>
            )
          })}

          {/* CAGED box shading */}
          {displayMode === 'caged' && !editorMode && (() => {
            const [a, b] = cagedBoxRange(rootPc, cagedShape, fretCount)
            const x1 = mainAt(Math.max(0, a - 1))
            const x2 = mainAt(b)
            return (
              <rect
                x={gutter + x1}
                y={padBoard - 4}
                width={Math.max(0, x2 - x1)}
                height={boardH + 8}
                fill="#fbbf24"
                opacity={0.08}
              />
            )
          })()}

          {/* Frets */}
          {Array.from({ length: fretCount + 1 }, (_, f) => (
            <line
              key={`fl-${f}`}
              x1={gutter + mainAt(f)}
              y1={padBoard}
              x2={gutter + mainAt(f)}
              y2={padBoard + boardH}
              stroke={f === 0 ? '#e5e7eb' : '#52525b'}
              strokeWidth={f === 0 ? 3 : 1}
              opacity={f === 0 ? 1 : 0.7}
            />
          ))}

          {/* Strings */}
          {visualStrings.map((s) => (
            <g key={`s-${s}`}>
              <text x={4} y={stringY(s) + 3} fill="#9ca3af" fontSize={10} fontFamily="JetBrains Mono">
                {['E', 'B', 'G', 'D', 'A', 'E'][s - 1]}
              </text>
              <line
                x1={gutter}
                y1={stringY(s)}
                x2={gutter + boardW}
                y2={stringY(s)}
                stroke="#d1d5db"
                strokeWidth={0.8 + (s - 1) * 0.22}
                opacity={0.8}
              />
            </g>
          ))}

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

          {/* Scale overlay */}
          {overlay.map(({ s, f, rel }) => {
            const { cx, cy } = notePos(s, f)
            const kind = highlightKindForInterval(rel)
            const color = KIND_COLOR[kind]
            const isRoot = kind === 'root'
            const key = `${s}-${f}`
            const isActive = activeKeys.has(key)
            const groupOpacity = playbackActive ? (isActive ? 1 : 0.2) : 0.95
            const r = isActive ? 11 : isRoot ? 10 : 8
            const label = displayMode === 'degrees' ? degreeLabel(rel) : nameAt(s, f)
            return (
              <g
                key={`ov-${s}-${f}`}
                opacity={groupOpacity}
                style={{ transition: 'opacity .12s' }}
                pointerEvents="none"
              >
                {isActive && <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity={0.35} />}
                <circle cx={cx} cy={cy} r={r} fill={color} stroke="#0a0a0a" strokeWidth={isRoot || isActive ? 1.5 : 1} />
                {showNoteNames && (
                  <text
                    x={cx}
                    y={cy + 3}
                    fill="#0a0a0a"
                    fontSize={isRoot || isActive ? 9 : 8}
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

          {/* Editor selection */}
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

          {/* Sequence notes */}
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

          {/* Fallback active markers in non-sequence modes: highlight notes played
              but absent from the scale overlay (e.g. chromatic passing tones). */}
          {displayMode !== 'sequence' && !editorMode && playbackActive &&
            [...activeKeys].map((key) => {
              if (overlaySet.has(key)) return null
              const [sStr, fStr] = key.split('-')
              const s = parseInt(sStr, 10)
              const f = parseInt(fStr, 10)
              const { cx, cy } = notePos(s, f)
              return (
                <g key={`fb-${key}`} pointerEvents="none">
                  <circle cx={cx} cy={cy} r={14} fill="#fbbf24" opacity={0.4} />
                  <circle cx={cx} cy={cy} r={10} fill="#fbbf24" stroke="#0a0a0a" strokeWidth={1.5} />
                  {showNoteNames && (
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
                  )}
                </g>
              )
            })}

          {/* Path trail dots */}
          {displayMode !== 'sequence' && !editorMode && notes.length > 0 &&
            notes.map((n, i) => {
              const key = `${n[0]}-${n[1]}`
              if (seqSeen.get(key) !== i) return null
              const { cx, cy } = notePos(n[0], n[1])
              return <circle key={`seq-${i}`} cx={cx} cy={cy - 12} r={2.5} fill="#fbbf24" pointerEvents="none" />
            })}
        </svg>
      </div>
    </div>
  )
}
