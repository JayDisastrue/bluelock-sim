import { applyEffects } from './effects'
import type { Effect, GameState, RippleEntry } from './schemas'
import type { GameAPI } from './types'

/** In-memory GameAPI over a throwaway state. Used by the cutscene test page, replay gallery and unit tests. */
export function createPreviewApi(initial: GameState): GameAPI & { current: () => GameState } {
  let state = initial
  return {
    get: () => state,
    apply: (effects: Effect[], source: string) => {
      state = applyEffects(state, effects, source)
    },
    markSeen: () => {},
    pushRipple: (entry: RippleEntry) => {
      state = { ...state, ripples: [...state.ripples, entry], meta: { ...state.meta, nextId: state.meta.nextId + 1 } }
    },
    current: () => state,
  }
}
