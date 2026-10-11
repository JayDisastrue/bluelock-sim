import { produce } from 'immer'
import { evalCond } from './conditions'
import { roll } from './rng'
import type { GameEvent, GameState } from './schemas'
import type { ContentDB } from './types'

const castAlive = (s: GameState, e: GameEvent) => e.cast.every((c) => !s.eliminated.includes(c))

/** Scheduled events whose time has come. Events whose cast includes an eliminated NPC are dropped: the story rewrote itself. */
export function dueEvents(s: GameState, content: ContentDB): string[] {
  return s.scheduled
    .filter((x) => x.due <= s.meta.turn)
    .sort((a, b) => a.due - b.due)
    .map((x) => x.eventId)
    .filter((id) => {
      const e = content.events[id]
      return !!e && castAlive(s, e)
    })
}

/** Ambient events that could fire right now. */
export function eligibleAmbient(s: GameState, content: ContentDB, exclude: string[] = []): GameEvent[] {
  return Object.values(content.events).filter((e) => {
    if (e.scheduledOnly || exclude.includes(e.id)) return false
    if (!castAlive(s, e)) return false
    const last = s.firedEvents[e.id]
    if (last !== undefined && !e.repeatable) return false
    if (last !== undefined && s.meta.turn - last < e.cooldown) return false
    if (s.scheduled.some((x) => x.eventId === e.id)) return false
    return evalCond(s, e.when)
  })
}

export interface TurnResult {
  state: GameState
  /** event ids to play, in order */
  queue: string[]
}

/**
 * Advances the calendar one week: refreshes AP, heals injuries, then collects due scheduled events
 * (removing them from the schedule) and at most one weighted ambient roll.
 */
export function advanceTurn(state: GameState, content: ContentDB, opts: { ambientChance?: number } = {}): TurnResult {
  const queue: string[] = []
  const next = produce(state, (d) => {
    d.meta.turn += 1
    d.life.week += 1
    d.life.ap = d.life.apMax
    d.life.stamina = Math.min(d.life.staminaMax, d.life.stamina + 25)
    d.life.injuries = d.life.injuries
      .map((i) => ({ ...i, weeksLeft: i.weeksLeft - 1 }))
      .filter((i) => i.weeksLeft > 0)

    // everything due leaves the schedule; ones whose cast was eliminated are simply dropped
    queue.push(...new Set(dueEvents(d as GameState, content)))
    d.scheduled = d.scheduled.filter((x) => x.due > d.meta.turn)

    if (roll(d as GameState) < (opts.ambientChance ?? 0.6)) {
      const pool = eligibleAmbient(d as GameState, content, queue)
      const total = pool.reduce((n, e) => n + e.weight, 0)
      if (total > 0) {
        let r = roll(d as GameState) * total
        for (const e of pool) {
          r -= e.weight
          if (r <= 0) {
            queue.push(e.id)
            break
          }
        }
      }
    }
    for (const id of queue) d.firedEvents[id] = d.meta.turn
  })
  return { state: next, queue }
}
