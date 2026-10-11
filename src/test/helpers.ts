import { content } from '../content'
import { createGame } from '../engine/newGame'
import type { GameState, OriginId } from '../engine/schemas'
import { P } from '../content/characters/helpers'

export const PORTRAIT = P('spiky', '#222', '#f0d0b0', 'sharp', '#333', 'straight', '#1f6bff', '#fff')

export function newState(origin: OriginId = 'fallen_ace', seed = 1234): GameState {
  return createGame(
    { name: 'Tester', portrait: PORTRAIT, position: 'ST', handedness: 'right', origin, egoType: 'predator', weaponSeed: 'direct_shot', seed },
    content,
  )
}
