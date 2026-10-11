import { create } from 'zustand'
import { safeStorage } from './save'

export interface Settings {
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  reducedMotion: boolean
  shake: boolean
  flash: boolean
  /** multiplier for timed-choice windows; 0 disables the timer entirely */
  timerScale: 0 | 1 | 1.5 | 2
  fontScale: 1 | 1.15 | 1.3
  colorblind: boolean
  romance: boolean
  autoDelayMs: number
  music: boolean
  sfx: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  textSpeed: 'normal', reducedMotion: false, shake: true, flash: true, timerScale: 1, fontScale: 1,
  colorblind: false, romance: true, autoDelayMs: 1800, music: true, sfx: true,
}

const KEY = 'blel.settings'

function load(): Settings {
  try {
    const raw = safeStorage().getItem(KEY)
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return { ...DEFAULT_SETTINGS, reducedMotion: !!prefersReduced, ...(raw ? JSON.parse(raw) : {}) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const useSettings = create<Settings & { set: (p: Partial<Settings>) => void }>((set, get) => ({
  ...load(),
  set: (p) => {
    set(p)
    const { set: _s, ...rest } = get()
    try { safeStorage().setItem(KEY, JSON.stringify(rest)) } catch { /* storage unavailable: setting still applies this session */ }
  },
}))
