import { content } from '../content'
import { DEFAULT_PORTRAIT } from '../cutscene/previewPlayer'
import { createGame } from '../engine/newGame'
import type { GameState, OriginId } from '../engine/schemas'
import { useGame } from '../engine/store'

/** A throwaway state for previews/replays: a copy of the current game if one exists, else a fresh one. */
export function previewState(origin: OriginId = 'fallen_ace', useCurrent = false): GameState {
  const live = useGame.getState().state
  if (useCurrent && live) return structuredClone(live)
  return createGame(
    { name: live?.player.name ?? 'Player', portrait: live?.player.portrait ?? DEFAULT_PORTRAIT, position: 'ST', handedness: 'right', origin, egoType: 'predator', weaponSeed: 'direct_shot', seed: 42 },
    content,
  )
}
