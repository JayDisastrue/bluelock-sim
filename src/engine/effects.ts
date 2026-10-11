import { produce } from 'immer'
import type { Cost, Effect, GameState } from './schemas'
import { clampRel, ensureRel, recomputeStatus } from './relationships'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const SEVERITY_HIT = { minor: 5, moderate: 15, severe: 30 } as const

/** Mutates an immer draft. All game-state changes in the game funnel through here. */
export function applyEffect(d: GameState, e: Effect, source: string): void {
  switch (e.t) {
    case 'setFlag':
      d.flags[e.flag] = e.value
      return
    case 'shiftRelationship': {
      const r = ensureRel(d, e.npc)
      for (const f of ['trust', 'respect', 'fear', 'rivalry'] as const) {
        const delta = e[f]
        if (delta) r[f] = clampRel(f, r[f] + delta)
      }
      recomputeStatus(d, e.npc)
      return
    }
    case 'setStatus': {
      const r = ensureRel(d, e.npc)
      r.status = e.status
      r.pinned = e.pin ?? true
      if (!r.pinned) recomputeStatus(d, e.npc)
      return
    }
    case 'unlockScene':
      d.scenes.locked = d.scenes.locked.filter((x) => x !== e.id)
      if (!d.scenes.unlocked.includes(e.id)) d.scenes.unlocked.push(e.id)
      return
    case 'lockScene':
      d.scenes.unlocked = d.scenes.unlocked.filter((x) => x !== e.id)
      if (!d.scenes.locked.includes(e.id)) d.scenes.locked.push(e.id)
      return
    case 'unlockWeapon':
      d.weapons[e.id] ??= { level: 1, corrupted: false }
      return
    case 'evolveWeapon': {
      const w = (d.weapons[e.id] ??= { level: 0, corrupted: false })
      w.level = Math.min(3, w.level + 1)
      return
    }
    case 'corruptWeapon': {
      const w = (d.weapons[e.id] ??= { level: 1, corrupted: false })
      w.corrupted = true
      return
    }
    case 'addTrait':
      if (!d.traits.includes(e.id)) d.traits.push(e.id)
      return
    case 'removeTrait':
      d.traits = d.traits.filter((t) => t !== e.id)
      return
    case 'changeRosterSlot':
      d.roster[e.slot] = e.npc
      return
    case 'changeFormation':
      d.formation = e.formation
      return
    case 'scheduleEvent':
      d.scheduled.push({ eventId: e.eventId, due: d.meta.turn + e.delay, source })
      return
    case 'injure':
      d.life.injuries.push({ part: e.part, severity: e.severity, weeksLeft: e.weeks })
      d.life.health = clamp(d.life.health - SEVERITY_HIT[e.severity], 0, 100)
      return
    case 'eliminate': {
      if (!d.eliminated.includes(e.npc)) d.eliminated.push(e.npc)
      const r = ensureRel(d, e.npc)
      r.status = 'Eliminated'
      r.pinned = true
      for (const slot of Object.keys(d.roster)) if (d.roster[slot] === e.npc) d.roster[slot] = null
      return
    }
    case 'modifyAI':
      d.aiMods.push({ npc: e.npc, behavior: e.behavior, duration: e.duration, source })
      return
    case 'modifyMatchScript':
      d.matchPatches.push({ matchId: e.matchId, patch: e.patch, source })
      return
    case 'adjust':
      switch (e.key) {
        case 'ap': d.life.ap = clamp(d.life.ap + e.delta, 0, d.life.apMax); return
        case 'stamina': d.life.stamina = clamp(d.life.stamina + e.delta, 0, d.life.staminaMax); return
        case 'composure': d.life.composure = clamp(d.life.composure + e.delta, 0, 100); return
        case 'health': d.life.health = clamp(d.life.health + e.delta, 0, 100); return
        case 'mood': d.life.mood = clamp(d.life.mood + e.delta, 0, 100); return
        case 'money': d.life.money += e.delta; return
        case 'tacticalIntel': d.resources.tacticalIntel = clamp(d.resources.tacticalIntel + e.delta, 0, 99); return
      }
      return
    case 'adjustRep':
      d.reputation[e.axis] = clamp(d.reputation[e.axis] + e.delta, 0, 100)
      return
    case 'adjustSkill':
      d.skills[e.skill] = clamp(d.skills[e.skill] + e.delta, 0, 100)
      return
    case 'logMemory':
      d.memory.push({
        id: d.meta.nextId++,
        turn: d.meta.turn,
        verb: e.verb,
        target: e.target,
        text: e.text,
        tags: e.tags ?? [],
        source,
      })
      return
    case 'setArc':
      d.arc = { id: e.id, chapter: e.chapter }
      return
  }
}

export function applyEffects(state: GameState, effects: Effect[], source: string): GameState {
  if (effects.length === 0) return state
  return produce(state, (d) => {
    for (const e of effects) applyEffect(d as GameState, e, source)
  })
}

const COST_KEYS = ['ap', 'stamina', 'composure', 'money', 'tacticalIntel'] as const

export function canAfford(s: GameState, cost: Cost | undefined): boolean {
  if (!cost) return true
  const have = { ap: s.life.ap, stamina: s.life.stamina, composure: s.life.composure, money: s.life.money, tacticalIntel: s.resources.tacticalIntel }
  return COST_KEYS.every((k) => (cost[k] ?? 0) <= have[k])
}

export function costEffects(cost: Cost | undefined): Effect[] {
  if (!cost) return []
  return COST_KEYS.filter((k) => cost[k]).map((k) => ({ t: 'adjust', key: k, delta: -(cost[k] as number) }))
}

export function describeCost(cost: Cost | undefined): string {
  if (!cost) return ''
  const label = { ap: 'AP', stamina: 'Stamina', composure: 'Composure', money: '¥', tacticalIntel: 'Intel' }
  return COST_KEYS.filter((k) => cost[k]).map((k) => `${cost[k]} ${label[k]}`).join(', ')
}
