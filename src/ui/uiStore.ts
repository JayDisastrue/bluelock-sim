import { create } from 'zustand'
import type { GameAPI } from '../engine/types'

export interface ActiveScene {
  /** scripts played back to back (an event may have several scenes) */
  scripts: string[]
  index: number
  /** `live` mutates the real game; `preview` runs against a throwaway state */
  api: GameAPI | 'live'
  onFinish?: () => void
}

interface UiStore {
  scene: ActiveScene | null
  sandboxOpen: boolean
  /** bump to restart the player when the same script is replayed */
  sceneKey: number
  playLive: (scripts: string[], onFinish?: () => void) => void
  playPreview: (scripts: string[], api: GameAPI, onFinish?: () => void) => void
  nextScene: () => void
  closeScene: () => void
  toggleSandbox: () => void
}

export const useUi = create<UiStore>((set, get) => ({
  scene: null,
  sandboxOpen: false,
  sceneKey: 0,
  playLive: (scripts, onFinish) => set((s) => ({ scene: { scripts, index: 0, api: 'live', onFinish }, sceneKey: s.sceneKey + 1 })),
  playPreview: (scripts, api, onFinish) => set((s) => ({ scene: { scripts, index: 0, api, onFinish }, sceneKey: s.sceneKey + 1 })),
  nextScene: () => {
    const sc = get().scene
    if (!sc) return
    if (sc.index + 1 < sc.scripts.length) set((s) => ({ scene: { ...sc, index: sc.index + 1 }, sceneKey: s.sceneKey + 1 }))
    else {
      set({ scene: null })
      sc.onFinish?.()
    }
  },
  closeScene: () => set({ scene: null }),
  toggleSandbox: () => set((s) => ({ sandboxOpen: !s.sandboxOpen })),
}))
