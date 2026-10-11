import { create } from 'zustand'
import type { PortraitSpec } from '../engine/schemas'

export const DEFAULT_PORTRAIT: PortraitSpec = {
  skin: '#f0d0b0', hair: 'spiky', hairColor: '#1c1c26', eyes: 'sharp', eyeColor: '#2a3a6a', brow: 'straight',
  kit: '#1f6bff', accent: '#ffffff', build: 'mid', mark: 'none',
}

/** Portrait used when no game is in progress (test page, creation wizard preview). */
export const usePreviewPlayer = create<{ portrait: PortraitSpec; setPortrait: (p: PortraitSpec) => void }>((set) => ({
  portrait: DEFAULT_PORTRAIT,
  setPortrait: (portrait) => set({ portrait }),
}))
