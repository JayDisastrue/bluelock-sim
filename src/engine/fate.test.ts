import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { applyEffects } from './effects'
import { rollFate } from './fate'
import { RARITY_INFO } from './schemas'
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
  it('rolls by rarity weight and never rolls mythic', () => {
    let seed = 7
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const n = 20000, count: Record<string, number> = {}
    for (let i = 0; i < n; i++) { const r = content.weapons[rollFate(weapons, rand).weapon]!.rarity; count[r] = (count[r] ?? 0) + 1 }
    expect(count.mythic ?? 0).toBe(0)
    // epic's only seedable-eligible weapons are rolled: expected tier shares from the weights of tiers that have eligible weapons
    const present = Object.entries(RARITY_INFO).filter(([r, i]) => i.startWeight > 0 && weapons.some((w) => w.rarity === r && w.seedable))
    const total = present.reduce((a, [, i]) => a + i.startWeight, 0)
    for (const [r, info] of present) expect((count[r] ?? 0) / n).toBeCloseTo(info.startWeight / total, 1)
    expect((count.common ?? 0)).toBeGreaterThan(count.uncommon ?? 0)
    expect((count.uncommon ?? 0)).toBeGreaterThan(count.rare ?? 0)
  })
  it('pins the weapon roll by value', () => {
    expect(content.weapons[rollFate(weapons, () => 0.0).weapon]?.rarity).toBe('common')
    expect(content.weapons[rollFate(weapons, () => 0.999).weapon]?.rarity).toBe('legendary')
  })
})

describe('weapon catalogue', () => {
  it('has ~40 weapons, unique ids, 3 levels each, all categories and the target rarity mix', () => {
    expect(new Set(weapons.map((w) => w.id)).size).toBe(weapons.length)
    for (const w of weapons) expect(w.levels).toHaveLength(3)
    const by = (r: string) => weapons.filter((w) => w.rarity === r).length
    expect([by('common'), by('uncommon'), by('rare'), by('epic'), by('legendary'), by('mythic')]).toEqual([10, 9, 8, 6, 5, 3])
    expect(new Set(weapons.map((w) => w.category)).size).toBe(8)
    expect(weapons.some((w) => w.source === 'original') && weapons.some((w) => w.source === 'inspired')).toBe(true)
  })
  it('no mythic is start-eligible and story-only weapons say how they are obtained', () => {
    for (const w of weapons.filter((w) => w.rarity === 'mythic')) expect(w.seedable).toBe(false)
    for (const w of weapons.filter((w) => !w.seedable || ['legendary', 'mythic'].includes(w.rarity))) expect(w.obtain, w.id).toBeTruthy()
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
