import type { GameState } from './schemas'

/** mulberry32 step: returns [value in [0,1), nextState]. Pure; state lives in GameState.meta.rng. */
export function step(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

/** Draws from a (draft) state's RNG and advances it. */
export function roll(draft: GameState): number {
  const [v, next] = step(draft.meta.rng)
  draft.meta.rng = next
  return v
}

export function rollInt(draft: GameState, min: number, max: number): number {
  return min + Math.floor(roll(draft) * (max - min + 1))
}
