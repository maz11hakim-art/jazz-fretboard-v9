import { create } from 'zustand'
import type { ScaleId } from '../lib/scales'

export type DisplayMode = 'sequence' | 'all' | 'degrees' | 'caged'
export type FretCount = 12 | 15 | 21 | 24
export type Handedness = 'right' | 'left'

type UiState = {
  displayMode: DisplayMode
  fretCount: FretCount
  zoom: number
  fitToScreen: boolean
  rootPc: number
  scale: ScaleId
  cagedShape: 'C' | 'A' | 'G' | 'E' | 'D'
  handedness: Handedness
  showNoteNames: boolean
  sidebarCollapsed: boolean
  controlsCollapsed: boolean
  expandedView: boolean

  setDisplayMode: (m: DisplayMode) => void
  setFretCount: (n: FretCount) => void
  setZoom: (z: number) => void
  setFitToScreen: (b: boolean) => void
  setRootPc: (pc: number) => void
  setScale: (s: ScaleId) => void
  setCagedShape: (s: 'C' | 'A' | 'G' | 'E' | 'D') => void
  setHandedness: (h: Handedness) => void
  setShowNoteNames: (b: boolean) => void
  setSidebarCollapsed: (b: boolean) => void
  setControlsCollapsed: (b: boolean) => void
  setExpandedView: (b: boolean) => void
}

const KEY = 'jfb.ui.v1'
const load = (): Partial<UiState> => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<UiState>) : {}
  } catch {
    return {}
  }
}
const persist = (s: UiState) => {
  if (typeof localStorage === 'undefined') return
  try {
    const {
      displayMode, fretCount, zoom, fitToScreen, rootPc, scale, cagedShape, handedness, showNoteNames,
      sidebarCollapsed, controlsCollapsed, expandedView,
    } = s
    localStorage.setItem(
      KEY,
      JSON.stringify({
        displayMode, fretCount, zoom, fitToScreen, rootPc, scale, cagedShape, handedness, showNoteNames,
        sidebarCollapsed, controlsCollapsed, expandedView,
      }),
    )
  } catch {
    // ignore quota errors
  }
}

const initial = load()

export const useUi = create<UiState>((set, get) => ({
  displayMode: (initial.displayMode as DisplayMode) ?? 'sequence',
  fretCount: (initial.fretCount as FretCount) ?? 15,
  zoom: initial.zoom ?? 1,
  fitToScreen: initial.fitToScreen ?? true,
  rootPc: initial.rootPc ?? 0,
  scale: (initial.scale as ScaleId) ?? 'major',
  cagedShape: (initial.cagedShape as 'C' | 'A' | 'G' | 'E' | 'D') ?? 'E',
  handedness: (initial.handedness as Handedness) ?? 'right',
  showNoteNames: initial.showNoteNames ?? true,
  sidebarCollapsed: initial.sidebarCollapsed ?? false,
  controlsCollapsed: initial.controlsCollapsed ?? false,
  expandedView: initial.expandedView ?? false,

  setDisplayMode: (displayMode) => { set({ displayMode }); persist(get()) },
  setFretCount: (fretCount) => { set({ fretCount }); persist(get()) },
  setZoom: (zoom) => { set({ zoom }); persist(get()) },
  setFitToScreen: (fitToScreen) => { set({ fitToScreen }); persist(get()) },
  setRootPc: (rootPc) => { set({ rootPc }); persist(get()) },
  setScale: (scale) => { set({ scale }); persist(get()) },
  setCagedShape: (cagedShape) => { set({ cagedShape }); persist(get()) },
  setHandedness: (handedness) => { set({ handedness }); persist(get()) },
  setShowNoteNames: (showNoteNames) => { set({ showNoteNames }); persist(get()) },
  setSidebarCollapsed: (sidebarCollapsed) => { set({ sidebarCollapsed }); persist(get()) },
  setControlsCollapsed: (controlsCollapsed) => { set({ controlsCollapsed }); persist(get()) },
  setExpandedView: (expandedView) => { set({ expandedView }); persist(get()) },
}))
