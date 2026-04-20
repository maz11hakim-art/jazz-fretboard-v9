import { useEffect, useRef, useState } from 'react'
import type { NoteTuple } from '../lib/notes'
import { nameAt } from '../lib/notes'
import { playNoteAt } from '../audio/sampler'

type Props = {
  notes: NoteTuple[]
  activeIdx?: number
  frets?: number
  orientation?: 'horizontal' | 'vertical'
  showNoteNames?: boolean
}

const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const DOUBLE_INLAYS = new Set([12, 24])

// Classic Fender-like fret spacing (exponential)
const FRET_SCALE = 0.943874
const cumulativeWidths = (count: number) => {
  const w: number[] = []
  let acc = 0
  for (let f = 0; f <= count; f++) {
    const fw = f === 0 ? 1.2 : Math.pow(FRET_SCALE, f - 1)
    acc += fw
    w.push(acc)
  }
  return w
}

// Map note tuple index → color by position in sequence.
const PLAY_COLORS = ['#eab308', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#22c55e']
const colorForIdx = (i: number) => PLAY_COLORS[i % PLAY_COLORS.length]

export function Fretboard({
  notes,
  activeIdx = -1,
  frets = 15,
  orientation = 'horizontal',
  showNoteNames = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 700, h: 180 })

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      if (orientation === 'horizontal') {
        setSize({ w: Math.max(320, rect.width - 8), h: Math.min(220, Math.max(140, rect.height || 200)) })
      } else {
        setSize({ w: Math.min(320, Math.max(220, rect.width || 280)), h: Math.max(400, rect.height - 8) })
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [orientation])

  const strings = [1, 2, 3, 4, 5, 6]
  const widths = cumulativeWidths(frets)
  const totalUnits = widths[frets]

  // Layout
  const pad = 22 // label column
  const boardWidth = orientation === 'horizontal' ? size.w - pad - 8 : size.h - pad - 8
  const stringSpan = orientation === 'horizontal' ? size.h - 28 : size.w - 28
  const stringGap = stringSpan / 5
  const xOf = (f: number) => (widths[f] / totalUnits) * boardWidth
  const centerOf = (f: number) => (xOf(f) + xOf(Math.max(0, f - 1))) / 2

  // Build note lookup
  const noteAtPos = new Map<string, { n: NoteTuple; idx: number }>()
  notes.forEach((n, i) => {
    const key = `${n[0]}-${n[1]}`
    if (!noteAtPos.has(key)) noteAtPos.set(key, { n, idx: i })
  })

  const isActive = (i: number) => i === activeIdx
  const wasPlayed = (i: number) => activeIdx >= 0 && i < activeIdx

  // SVG horizontal layout: strings are horizontal rows, frets are vertical columns
  // Vertical layout: strings are vertical columns, frets are horizontal rows (transpose)
  const H = size.h
  const W = size.w

  const renderHorizontal = () => (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
    >
      {/* Background wood */}
      <defs>
        <linearGradient id="fb-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b2415" />
          <stop offset="50%" stopColor="#4d2f1d" />
          <stop offset="100%" stopColor="#2e1b10" />
        </linearGradient>
      </defs>
      <rect x={pad} y={14} width={boardWidth} height={stringSpan} fill="url(#fb-wood)" rx={4} />

      {/* Fret numbers */}
      {Array.from({ length: frets + 1 }, (_, f) => (
        <text
          key={`fn-${f}`}
          x={pad + (f === 0 ? xOf(0) / 2 : centerOf(f))}
          y={10}
          fill="#a3a3a3"
          fontSize={9}
          fontFamily="JetBrains Mono"
          textAnchor="middle"
        >
          {f}
        </text>
      ))}

      {/* Inlays */}
      {Array.from({ length: frets + 1 }, (_, f) => {
        if (!INLAYS.has(f) && !DOUBLE_INLAYS.has(f)) return null
        const x = pad + centerOf(f)
        if (DOUBLE_INLAYS.has(f)) {
          return (
            <g key={`inlay-${f}`}>
              <circle cx={x} cy={14 + stringGap * 1.3} r={3} fill="#d4a574" opacity={0.55} />
              <circle cx={x} cy={14 + stringGap * 3.7} r={3} fill="#d4a574" opacity={0.55} />
            </g>
          )
        }
        return <circle key={`inlay-${f}`} cx={x} cy={14 + stringGap * 2.5} r={3} fill="#d4a574" opacity={0.4} />
      })}

      {/* Frets (vertical lines) */}
      {Array.from({ length: frets + 1 }, (_, f) => (
        <line
          key={`fl-${f}`}
          x1={pad + xOf(f)}
          y1={14}
          x2={pad + xOf(f)}
          y2={14 + stringSpan}
          stroke={f === 0 ? '#f5f5f5' : '#8a8a8a'}
          strokeWidth={f === 0 ? 3 : 1.5}
        />
      ))}

      {/* Strings (horizontal lines) */}
      {strings.map((s, i) => {
        const y = 14 + stringGap * i
        const thickness = 1 + (s - 1) * 0.25
        return (
          <g key={`s-${s}`}>
            <text x={4} y={y + 3} fill="#a3a3a3" fontSize={10} fontFamily="JetBrains Mono">
              {['E', 'B', 'G', 'D', 'A', 'E'][s - 1]}
            </text>
            <line
              x1={pad}
              y1={y}
              x2={pad + boardWidth}
              y2={y}
              stroke="#d4d4d4"
              strokeWidth={thickness}
              opacity={0.85}
            />
          </g>
        )
      })}

      {/* Fret cells (invisible tap zones) */}
      {strings.map((s) =>
        Array.from({ length: frets + 1 }, (_, f) => (
          <rect
            key={`cell-${s}-${f}`}
            x={pad + (f === 0 ? 0 : xOf(f - 1))}
            y={14 + stringGap * (s - 1) - stringGap / 2}
            width={f === 0 ? xOf(0) : xOf(f) - xOf(f - 1)}
            height={stringGap}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => playNoteAt(s, f)}
          />
        )),
      )}

      {/* Notes */}
      {notes.map((n, i) => {
        const [s, f] = n
        const cx = pad + (f === 0 ? xOf(0) / 2 : centerOf(f))
        const cy = 14 + stringGap * (s - 1)
        const active = isActive(i)
        const played = wasPlayed(i)
        const r = active ? 12 : 9
        const opacity = active ? 1 : played ? 0.25 : 0.85
        return (
          <g key={`n-${i}`} opacity={opacity} style={{ transition: 'opacity .15s' }}>
            {active && <circle cx={cx} cy={cy} r={r + 6} fill={colorForIdx(i)} opacity={0.25} />}
            <circle cx={cx} cy={cy} r={r} fill={colorForIdx(i)} stroke="#0a0a0a" strokeWidth={1.5} />
            <text
              x={cx}
              y={cy + 3}
              fill="#0a0a0a"
              fontSize={9}
              fontWeight={700}
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              pointerEvents="none"
            >
              {showNoteNames ? nameAt(s, f) : i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )

  // Vertical: frets horizontal, strings vertical
  const renderVertical = () => {
    const innerH = H - pad - 8
    const innerW = W - 28
    const boardH = innerH
    const stringGapV = innerW / 5
    const xStr = (s: number) => 14 + stringGapV * (s - 1)
    const yFret = (f: number) => pad + (widths[f] / totalUnits) * boardH
    const yCenter = (f: number) => (yFret(f) + yFret(Math.max(0, f - 1))) / 2

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="fb-wood-v" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b2415" />
            <stop offset="50%" stopColor="#4d2f1d" />
            <stop offset="100%" stopColor="#2e1b10" />
          </linearGradient>
        </defs>
        <rect x={14 - 4} y={pad} width={innerW + 8} height={boardH} fill="url(#fb-wood-v)" rx={4} />

        {/* Fret numbers (left gutter) */}
        {Array.from({ length: frets + 1 }, (_, f) => (
          <text
            key={`fn-v-${f}`}
            x={2}
            y={(f === 0 ? pad + 8 : yCenter(f)) + 3}
            fill="#a3a3a3"
            fontSize={9}
            fontFamily="JetBrains Mono"
          >
            {f}
          </text>
        ))}

        {/* Inlays */}
        {Array.from({ length: frets + 1 }, (_, f) => {
          if (!INLAYS.has(f) && !DOUBLE_INLAYS.has(f)) return null
          const y = yCenter(f)
          if (DOUBLE_INLAYS.has(f)) {
            return (
              <g key={`inlay-v-${f}`}>
                <circle cx={14 + stringGapV * 1.3} cy={y} r={3} fill="#d4a574" opacity={0.55} />
                <circle cx={14 + stringGapV * 3.7} cy={y} r={3} fill="#d4a574" opacity={0.55} />
              </g>
            )
          }
          return <circle key={`inlay-v-${f}`} cx={14 + stringGapV * 2.5} cy={y} r={3} fill="#d4a574" opacity={0.4} />
        })}

        {/* Frets (horizontal lines) */}
        {Array.from({ length: frets + 1 }, (_, f) => (
          <line
            key={`fl-v-${f}`}
            x1={14}
            y1={yFret(f)}
            x2={14 + innerW}
            y2={yFret(f)}
            stroke={f === 0 ? '#f5f5f5' : '#8a8a8a'}
            strokeWidth={f === 0 ? 3 : 1.5}
          />
        ))}

        {/* Strings (vertical lines) */}
        {strings.map((s) => {
          const x = xStr(s)
          const thickness = 1 + (s - 1) * 0.25
          return (
            <g key={`s-v-${s}`}>
              <text x={x - 3} y={pad - 4} fill="#a3a3a3" fontSize={10} fontFamily="JetBrains Mono">
                {['E', 'B', 'G', 'D', 'A', 'E'][s - 1]}
              </text>
              <line x1={x} y1={pad} x2={x} y2={pad + boardH} stroke="#d4d4d4" strokeWidth={thickness} opacity={0.85} />
            </g>
          )
        })}

        {/* Tap zones */}
        {strings.map((s) =>
          Array.from({ length: frets + 1 }, (_, f) => (
            <rect
              key={`cell-v-${s}-${f}`}
              x={xStr(s) - stringGapV / 2}
              y={f === 0 ? pad : yFret(f - 1)}
              width={stringGapV}
              height={f === 0 ? yFret(0) - pad : yFret(f) - yFret(f - 1)}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => playNoteAt(s, f)}
            />
          )),
        )}

        {/* Notes */}
        {notes.map((n, i) => {
          const [s, f] = n
          const cx = xStr(s)
          const cy = f === 0 ? pad + 8 : yCenter(f)
          const active = isActive(i)
          const played = wasPlayed(i)
          const r = active ? 12 : 9
          const opacity = active ? 1 : played ? 0.25 : 0.85
          return (
            <g key={`n-v-${i}`} opacity={opacity} style={{ transition: 'opacity .15s' }}>
              {active && <circle cx={cx} cy={cy} r={r + 6} fill={colorForIdx(i)} opacity={0.25} />}
              <circle cx={cx} cy={cy} r={r} fill={colorForIdx(i)} stroke="#0a0a0a" strokeWidth={1.5} />
              <text
                x={cx}
                y={cy + 3}
                fill="#0a0a0a"
                fontSize={9}
                fontWeight={700}
                fontFamily="JetBrains Mono"
                textAnchor="middle"
                pointerEvents="none"
              >
                {showNoteNames ? nameAt(s, f) : i + 1}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="w-full h-full flex items-center justify-center"
      style={{ minHeight: orientation === 'horizontal' ? 180 : 420 }}
    >
      {orientation === 'horizontal' ? renderHorizontal() : renderVertical()}
    </div>
  )
}
