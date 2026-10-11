import type { GameState, RelField, Relationship, RelStatus } from './schemas'

export const blankRel = (): Relationship => ({ trust: 0, respect: 0, fear: 0, rivalry: 0, status: 'Stranger', pinned: false })

/** Read-only view; unknown NPCs are Strangers with zeroed values. */
export function getRel(s: GameState, npc: string): Relationship {
  return s.relationships[npc] ?? blankRel()
}

export function ensureRel(draft: GameState, npc: string): Relationship {
  return (draft.relationships[npc] ??= blankRel())
}

const clampRange = (field: RelField, v: number) =>
  field === 'fear' || field === 'rivalry' ? Math.max(0, Math.min(100, v)) : Math.max(-100, Math.min(100, v))
export const clampRel = (field: RelField, v: number) => clampRange(field, Math.round(v))

/** Statuses only an explicit effect can set or clear. */
export const STICKY: readonly RelStatus[] = ['Devoured', 'Eliminated', 'Subordinate']

/**
 * Rule-driven status from relationship values. Evaluated in priority order, with hysteresis so
 * a relationship doesn't flicker around a threshold:
 *   Hostile  trust <= -40
 *   Devoted  trust >= 60 and respect >= 40
 *   Rival    rivalry >= 40 (stays Rival until rivalry < 30)
 *   Ally     trust >= 25   (stays Ally until trust < 15)
 *   otherwise Stranger
 */
export function autoStatus(r: Relationship): RelStatus {
  if (r.trust <= -40) return 'Hostile'
  if (r.trust >= 60 && r.respect >= 40) return 'Devoted'
  if (r.rivalry >= 40 || (r.status === 'Rival' && r.rivalry >= 30)) return 'Rival'
  if (r.trust >= 25 || (r.status === 'Ally' && r.trust >= 15)) return 'Ally'
  return 'Stranger'
}

/** Re-evaluate one NPC's status; no-op for pinned/sticky relationships. */
export function recomputeStatus(draft: GameState, npc: string): void {
  const r = draft.relationships[npc]
  if (!r || r.pinned || STICKY.includes(r.status)) return
  r.status = autoStatus(r)
}

export const GOOD_STATUSES: readonly RelStatus[] = ['Ally', 'Devoted', 'Subordinate', 'Devoured']
export const BAD_STATUSES: readonly RelStatus[] = ['Rival', 'Hostile', 'Eliminated']
