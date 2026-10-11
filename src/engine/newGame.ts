import type { EgoType, GameState, OriginId, Position, PortraitSpec, SkillId } from './schemas'
import { SKILLS } from './schemas'
import type { ContentDB } from './types'

export interface NewGameConfig {
  name: string
  portrait: PortraitSpec
  position: Position
  handedness: 'left' | 'right' | 'both'
  origin: OriginId
  egoType: EgoType
  weaponSeed: string
  seed?: number
  romanceEnabled?: boolean
}

export const EGO_BIAS: Record<EgoType, Partial<Record<SkillId, number>>> = {
  predator: { finishing: 8, ego: 6 },
  architect: { metavision: 8, teamwork: 4 },
  wildcard: { dribbling: 8, speed: 4 },
  survivor: { stamina: 8, defense: 4 },
  monarch: { ego: 8, flow: 4 },
}

export function createGame(cfg: NewGameConfig, content: Pick<ContentDB, 'origins' | 'weapons'>): GameState {
  const origin = content.origins[cfg.origin]
  if (!origin) throw new Error(`Unknown origin ${cfg.origin}`)
  if (!content.weapons[cfg.weaponSeed]) throw new Error(`Unknown weapon seed ${cfg.weaponSeed}`)

  const skills = Object.fromEntries(SKILLS.map((k) => [k, 30])) as Record<SkillId, number>
  skills.stamina = 40
  const add = (m: Partial<Record<SkillId, number>>) => {
    for (const [k, v] of Object.entries(m) as [SkillId, number][]) skills[k] = Math.max(0, Math.min(100, skills[k] + v))
  }
  add(EGO_BIAS[cfg.egoType])
  add(origin.startSkills)

  const seed = cfg.seed ?? (Date.now() & 0x7fffffff)
  const reputation = { egoAura: 20, teamPlayer: 30, mediaDarling: 10, coachFavor: 30, mystery: 10 }
  for (const [k, v] of Object.entries(origin.startRep) as [keyof typeof reputation, number][]) reputation[k] = Math.max(0, Math.min(100, reputation[k] + v))

  return {
    meta: { turn: 0, seed, rng: seed, sandboxUsed: false, createdAt: new Date().toISOString(), nextId: 1 },
    player: {
      name: cfg.name.trim() || 'Player',
      origin: cfg.origin,
      portrait: cfg.portrait,
      position: cfg.position,
      handedness: cfg.handedness,
      egoType: cfg.egoType,
      weaponSeed: cfg.weaponSeed,
    },
    skills,
    skillPoints: 0,
    xp: 0,
    life: {
      age: 17, week: 1, ap: 6, apMax: 6, stamina: 100, staminaMax: 100, composure: 60, health: 100, mood: 55,
      money: 20000, injuries: [], hometownContact: 50, education: 'High school (final year)', sponsors: [],
      romanceEnabled: cfg.romanceEnabled ?? true,
    },
    resources: { tacticalIntel: 3 + (origin.startFlags['COACH_DISTRUST'] ? 2 : 0) },
    flags: { ...origin.startFlags, [`ORIGIN:${cfg.origin}`]: true },
    relationships: {},
    reputation,
    traits: [...origin.startTraits],
    weapons: { [cfg.weaponSeed]: { level: 1, corrupted: false } },
    memory: [],
    ripples: [],
    scheduled: [],
    firedEvents: {},
    scenes: { seen: [], unlocked: [], locked: [] },
    roster: {},
    formation: '4-4-2',
    eliminated: [],
    arc: { id: 'prologue', chapter: 1 },
    aiMods: [],
    matchPatches: [],
    auction: { valueMillions: 0 },
  }
}
