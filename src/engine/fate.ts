import { RARITY_INFO, type Weapon } from './schemas'

export interface Fate {
  foot: 'left' | 'right' | 'both'
  weapon: string
}

/**
 * Traits you don't pick: strong foot and starting weapon are rolled (the position is always striker).
 * The weapon is rolled by rarity weight (common 50 … legendary 2, mythic never), then uniformly within the tier.
 * `rand` is injectable so rolls are testable.
 */
export function rollFate(weapons: Pick<Weapon, 'id' | 'seedable' | 'rarity'>[], rand: () => number = Math.random): Fate {
  const f = rand()
  const foot = f < 0.45 ? 'right' : f < 0.9 ? 'left' : 'both'
  return { foot, weapon: rollWeapon(weapons, rand) }
}

export function rollWeapon(weapons: Pick<Weapon, 'id' | 'seedable' | 'rarity'>[], rand: () => number = Math.random): string {
  const pool = weapons.filter((w) => w.seedable && RARITY_INFO[w.rarity].startWeight > 0)
  if (pool.length === 0) throw new Error('No seedable weapons')
  const tiers = [...new Set(pool.map((w) => w.rarity))]
  const total = tiers.reduce((n, r) => n + RARITY_INFO[r].startWeight, 0)
  let roll = rand() * total
  let tier = tiers[tiers.length - 1]!
  for (const r of tiers) { roll -= RARITY_INFO[r].startWeight; if (roll < 0) { tier = r; break } }
  const inTier = pool.filter((w) => w.rarity === tier)
  return inTier[Math.min(inTier.length - 1, Math.floor(rand() * inTier.length))]!.id
}
