import type { Condition, GameState, Op, RelStatus } from './schemas'
import { getRel } from './relationships'

export function cmp(a: number, op: Op, b: number): boolean {
  switch (op) {
    case '>=': return a >= b
    case '>': return a > b
    case '<=': return a <= b
    case '<': return a < b
    case '==': return a === b
    case '!=': return a !== b
  }
}

export function resValue(s: GameState, key: string): number {
  switch (key) {
    case 'ap': return s.life.ap
    case 'stamina': return s.life.stamina
    case 'composure': return s.life.composure
    case 'money': return s.life.money
    case 'health': return s.life.health
    case 'mood': return s.life.mood
    case 'tacticalIntel': return s.resources.tacticalIntel
    default: return 0
  }
}

export function evalCond(s: GameState, c: Condition | undefined): boolean {
  if (!c) return true
  switch (c.t) {
    case 'flag': {
      const v = s.flags[c.flag]
      if (c.value === undefined) return v !== undefined && v !== false && v !== 0 && v !== ''
      return v === c.value
    }
    case 'noFlag': {
      const v = s.flags[c.flag]
      return v === undefined || v === false || v === 0 || v === ''
    }
    case 'origin': return c.in.includes(s.player.origin)
    case 'trait': return s.traits.includes(c.id) === (c.has ?? true)
    case 'rel': return cmp(getRel(s, c.npc)[c.field], c.op, c.value)
    case 'status': return (c.in as RelStatus[]).includes(getRel(s, c.npc).status)
    case 'rep': return cmp(s.reputation[c.axis], c.op, c.value)
    case 'skill': return cmp(s.skills[c.skill], c.op, c.value)
    case 'res': return cmp(resValue(s, c.key), c.op, c.value)
    case 'turn': return cmp(s.meta.turn, c.op, c.value)
    case 'arc': return s.arc.id === c.id
    case 'sceneSeen': return s.scenes.seen.includes(c.id) === (c.seen ?? true)
    case 'eliminated': return s.eliminated.includes(c.npc) === (c.is ?? true)
    case 'memory':
      return s.memory.some(
        (m) =>
          m.verb === c.verb &&
          (c.target === undefined || m.target === c.target) &&
          (c.withinTurns === undefined || s.meta.turn - m.turn <= c.withinTurns),
      )
    case 'weapon': return (s.weapons[c.id]?.level ?? 0) >= (c.minLevel ?? 1)
    case 'sandbox': return s.meta.sandboxUsed === c.used
    case 'and': return c.all.every((x) => evalCond(s, x))
    case 'or': return c.any.some((x) => evalCond(s, x))
    case 'not': return !evalCond(s, c.cond)
  }
}

/** Plain-English description, used for locked-choice hints. */
export function describeCond(c: Condition): string {
  switch (c.t) {
    case 'flag': return c.value === undefined ? `flag ${c.flag}` : `${c.flag} = ${String(c.value)}`
    case 'noFlag': return `not ${c.flag}`
    case 'origin': return `origin: ${c.in.map((o) => o.replace(/_/g, ' ')).join(' / ')}`
    case 'trait': return `${c.has === false ? 'without' : 'trait'} ${c.id}`
    case 'rel': return `${c.npc} ${c.field} ${c.op} ${c.value}`
    case 'status': return `${c.npc} is ${c.in.join(' / ')}`
    case 'rep': return `${c.axis} ${c.op} ${c.value}`
    case 'skill': return `${c.skill} ${c.op} ${c.value}`
    case 'res': return `${c.key} ${c.op} ${c.value}`
    case 'turn': return `week ${c.op} ${c.value}`
    case 'arc': return `arc ${c.id}`
    case 'sceneSeen': return `${c.seen === false ? 'unseen' : 'seen'} ${c.id}`
    case 'eliminated': return `${c.npc} ${c.is === false ? 'not ' : ''}eliminated`
    case 'memory': return `you ${c.verb}${c.target ? ' ' + c.target : ''}`
    case 'weapon': return `weapon ${c.id} Lv${c.minLevel ?? 1}`
    case 'sandbox': return c.used ? 'sandbox used' : 'no sandbox'
    case 'and': return c.all.map(describeCond).join(' AND ')
    case 'or': return c.any.map(describeCond).join(' OR ')
    case 'not': return `NOT (${describeCond(c.cond)})`
  }
}
