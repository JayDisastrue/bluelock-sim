import type { Choice, Cost, Effect, GameState } from './schemas'
import type { ContentDB } from './types'
import { getRel } from './relationships'

/**
 * Each dialogue tone is an effect model, not a number bump (design §5.4).
 * Generated effects run before a choice's own authored effects.
 */
export function toneEffects(s: GameState, content: Pick<ContentDB, 'characters'>, tone: NonNullable<Choice['tone']>, target?: string): Effect[] {
  const out: Effect[] = []
  const rel = target ? getRel(s, target) : undefined
  switch (tone) {
    case 'Provoke':
      out.push({ t: 'adjustRep', axis: 'egoAura', delta: 2 })
      if (target) {
        // Target is Tilted next match (aggressive, sloppy positioning) and the feud binds them to you.
        out.push({ t: 'modifyAI', npc: target, behavior: 'tilted', duration: 'match' })
        out.push({ t: 'shiftRelationship', npc: target, rivalry: 10, respect: s.reputation.egoAura >= 40 ? 3 : -2 })
      }
      break
    case 'Analyze':
      // Cost (1 Tactical Intel) is applied via effectiveCost. The read exposes a weakness for a one-time match option.
      if (target) {
        out.push({ t: 'modifyAI', npc: target, behavior: 'exposed', duration: 'match' })
        out.push({ t: 'setFlag', flag: `READ:${target}`, value: true })
        out.push({ t: 'shiftRelationship', npc: target, respect: 2 })
      }
      break
    case 'Ignore':
      out.push({ t: 'adjust', key: 'composure', delta: 3 })
      if (target && rel) {
        if (rel.rivalry >= 25) {
          // a live grudge isn't defused by silence: it festers
          out.push({ t: 'setFlag', flag: `GRUDGE:${target}`, value: true })
          out.push({ t: 'shiftRelationship', npc: target, rivalry: 4, respect: -2 })
        } else {
          out.push({ t: 'shiftRelationship', npc: target, rivalry: -4, respect: -2 })
        }
      }
      break
    case 'Devour':
      out.push({ t: 'adjustRep', axis: 'egoAura', delta: 4 })
      if (target) {
        out.push({ t: 'setFlag', flag: `DEVOUR_TARGET:${target}`, value: true })
        out.push({ t: 'shiftRelationship', npc: target, rivalry: 12, fear: 6 })
        // the next shared match must pay this off (or humiliate you)
        out.push({ t: 'modifyMatchScript', matchId: `next_shared:${target}`, patch: { obligation: 'devour', npc: target } })
      }
      break
    case 'Support':
      out.push({ t: 'adjustRep', axis: 'teamPlayer', delta: 3 })
      out.push({ t: 'adjustRep', axis: 'egoAura', delta: -1 })
      if (target) {
        out.push({ t: 'shiftRelationship', npc: target, trust: 10 })
        out.push({ t: 'setFlag', flag: `COMBO_ELIGIBLE:${target}`, value: true })
        if (content.characters[target]?.contemptForSoft) {
          out.push({ t: 'shiftRelationship', npc: target, respect: -5 })
          out.push({ t: 'setFlag', flag: `SEEN_AS_SOFT:${target}`, value: true })
        }
      }
      break
  }
  return out
}

/** Analyze defaults to 1 Tactical Intel unless the choice states its own cost. */
export function effectiveCost(choice: Pick<Choice, 'tone' | 'cost'>): Cost | undefined {
  if (choice.cost) return choice.cost
  if (choice.tone === 'Analyze') return { tacticalIntel: 1 }
  return undefined
}

export const TONE_GLYPH: Record<string, string> = { Provoke: '▲', Analyze: '◎', Ignore: '—', Devour: '✦', Support: '◆' }
