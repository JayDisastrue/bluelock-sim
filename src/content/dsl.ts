import type { Condition, EffectInput, FlagValue, Op, OriginId, RelField, RelStatus, RepAxis, SkillId } from '../engine/schemas'

// ── conditions ──
export const flag = (f: string, value?: FlagValue): Condition => ({ t: 'flag', flag: f, value })
export const noFlag = (f: string): Condition => ({ t: 'noFlag', flag: f })
export const origin = (...ids: OriginId[]): Condition => ({ t: 'origin', in: ids })
export const trait = (id: string, has = true): Condition => ({ t: 'trait', id, has })
export const rel = (npc: string, field: RelField, op: Op, value: number): Condition => ({ t: 'rel', npc, field, op, value })
export const status = (npc: string, ...s: RelStatus[]): Condition => ({ t: 'status', npc, in: s })
export const rep = (axis: RepAxis, op: Op, value: number): Condition => ({ t: 'rep', axis, op, value })
export const skill = (s: SkillId, op: Op, value: number): Condition => ({ t: 'skill', skill: s, op, value })
export const turn = (op: Op, value: number): Condition => ({ t: 'turn', op, value })
export const arc = (id: string): Condition => ({ t: 'arc', id })
export const memory = (verb: string, target?: string, withinTurns?: number): Condition => ({ t: 'memory', verb, target, withinTurns })
export const and = (...all: Condition[]): Condition => ({ t: 'and', all })
export const or = (...any: Condition[]): Condition => ({ t: 'or', any })
export const not = (cond: Condition): Condition => ({ t: 'not', cond })

// ── effects ──
export const fx = {
  flag: (flag: string, value: FlagValue = true): EffectInput => ({ t: 'setFlag', flag, value }),
  rel: (npc: string, d: { trust?: number; respect?: number; fear?: number; rivalry?: number }): EffectInput => ({ t: 'shiftRelationship', npc, ...d }),
  status: (npc: string, status: RelStatus, pin?: boolean): EffectInput => ({ t: 'setStatus', npc, status, pin }),
  rep: (axis: RepAxis, delta: number): EffectInput => ({ t: 'adjustRep', axis, delta }),
  skill: (skill: SkillId, delta: number): EffectInput => ({ t: 'adjustSkill', skill, delta }),
  adjust: (key: 'ap' | 'stamina' | 'composure' | 'money' | 'tacticalIntel' | 'health' | 'mood', delta: number): EffectInput => ({ t: 'adjust', key, delta }),
  trait: (id: string): EffectInput => ({ t: 'addTrait', id }),
  dropTrait: (id: string): EffectInput => ({ t: 'removeTrait', id }),
  weapon: (id: string): EffectInput => ({ t: 'unlockWeapon', id }),
  evolve: (id: string): EffectInput => ({ t: 'evolveWeapon', id }),
  corrupt: (id: string): EffectInput => ({ t: 'corruptWeapon', id }),
  schedule: (eventId: string, delay: number): EffectInput => ({ t: 'scheduleEvent', eventId, delay }),
  unlock: (id: string): EffectInput => ({ t: 'unlockScene', id }),
  lock: (id: string): EffectInput => ({ t: 'lockScene', id }),
  ai: (npc: string, behavior: string, duration: 'match' | 'permanent' = 'match'): EffectInput => ({ t: 'modifyAI', npc, behavior, duration }),
  eliminate: (npc: string): EffectInput => ({ t: 'eliminate', npc }),
  memory: (verb: string, text: string, target?: string): EffectInput => ({ t: 'logMemory', verb, text, target }),
}
