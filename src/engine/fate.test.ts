import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { applyEffects } from './effects'
import { rollFate } from './fate'
import { buildRipple } from './ripple'
import { newState } from '../test/helpers'
import { createGame } from './newGame'
import { PORTRAIT } from '../test/helpers'

const weapons = Object.values(content.weapons)

describe('rolled fate', () => {
  it('rolls a strong foot and a seedable weapon only', () => {
    let seed = 1
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const feet = new Set<string>(), picked = new Set<string>()
    for (let i = 0; i < 300; i++) { const f = rollFate(weapons, rand); feet.add(f.foot); picked.add(f.weapon) }
    expect([...feet].sort()).toEqual(['both', 'left', 'right'])
    expect(picked.size).toBeGreaterThan(3)
    for (const id of picked) expect(content.weapons[id]?.seedable).toBe(true) // hunter_press is not seedable
    expect(picked.has('hunter_press')).toBe(false)
  })
  it('foot odds: left and right each ~45%, ambidextrous ~10%', () => {
    expect(rollFate(weapons, () => 0.1).foot).toBe('right')
    expect(rollFate(weapons, () => 0.6).foot).toBe('left')
    expect(rollFate(weapons, () => 0.95).foot).toBe('both')
  })
})

describe('position is always striker, but story can change it', () => {
  it('every new game starts as ST even if no position is given', () => {
    const s = createGame({ name: 'X', portrait: PORTRAIT, handedness: 'left', origin: 'fallen_ace', egoType: 'predator', weaponSeed: 'direct_shot', seed: 1 }, content)
    expect(s.player.position).toBe('ST')
    expect(s.player.handedness).toBe('left')
  })
  it('changePosition / changeFoot effects work and show up on the Ripple card', () => {
    const before = newState()
    const after = applyEffects(before, [{ t: 'changePosition', position: 'LW' }, { t: 'changeFoot', foot: 'both' }], 'story')
    expect(after.player.position).toBe('LW')
    expect(after.player.handedness).toBe('both')
    const r = buildRipple(before, after, content, { id: 1, source: 's' })!
    expect(r.changes.map((c) => c.text)).toEqual(expect.arrayContaining(['Position changed: ST → LW', 'Strong foot is now both']))
  })
})
