import type { Weapon } from './schemas'

export interface Fate {
  foot: 'left' | 'right' | 'both'
  weapon: string
}

/**
 * Traits you don't pick: strong foot and starting weapon are rolled (the position is always striker).
 * `rand` is injectable so rolls are testable.
 */
export function rollFate(weapons: Pick<Weapon, 'id' | 'seedable'>[], rand: () => number = Math.random): Fate {
  const f = rand()
  const foot = f < 0.45 ? 'right' : f < 0.9 ? 'left' : 'both'
  const pool = weapons.filter((w) => w.seedable)
  if (pool.length === 0) throw new Error('No seedable weapons')
  return { foot, weapon: pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]!.id }
}
