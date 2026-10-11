import type { Choice, GameState, RippleChange, RippleEntry } from './schemas'
import type { ContentDB } from './types'
import { BAD_STATUSES, GOOD_STATUSES, blankRel } from './relationships'

const nameOf = (content: Pick<ContentDB, 'characters'>, id: string) => content.characters[id]?.short ?? id
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`)

/**
 * Diffs two states and describes what a choice rippled into: who noticed, what changed in the
 * relationship graph, and a teaser of what may come back. Returns null when nothing visible changed.
 * `id` comes from the caller (state.meta.nextId) so entries stay deterministic.
 */
export function buildRipple(
  before: GameState,
  after: GameState,
  content: ContentDB,
  opts: { id: number; source: string; choice?: Pick<Choice, 'label' | 'reveal' | 'tone'>; cast?: string[] },
): RippleEntry | null {
  const changes: RippleChange[] = []
  const noticed = new Set<string>()

  // relationships
  for (const npc of Object.keys(after.relationships)) {
    const a = after.relationships[npc]!
    const b = before.relationships[npc] ?? blankRel()
    if (a.status !== b.status) {
      noticed.add(npc)
      const tone = GOOD_STATUSES.includes(a.status) ? 'good' : BAD_STATUSES.includes(a.status) ? 'bad' : 'neutral'
      changes.push({ kind: a.status === 'Eliminated' ? 'eliminated' : 'status', npc, tone, text: `${nameOf(content, npc)} is now ${a.status}${b.status !== 'Stranger' ? ` (was ${b.status})` : ''}` })
    }
    const parts: string[] = []
    for (const f of ['trust', 'respect', 'fear', 'rivalry'] as const) {
      const d = a[f] - b[f]
      if (Math.abs(d) >= 5) parts.push(`${f} ${sign(d)}`)
    }
    if (parts.length) {
      noticed.add(npc)
      const good = a.trust - b.trust + (a.respect - b.respect) - (a.rivalry - b.rivalry) >= 0
      changes.push({ kind: 'relationship', npc, tone: good ? 'good' : 'bad', text: `${nameOf(content, npc)}: ${parts.join(', ')}` })
    }
  }

  // eliminations (those without a status change entry already)
  for (const npc of after.eliminated) {
    if (!before.eliminated.includes(npc) && !changes.some((c) => c.kind === 'eliminated' && c.npc === npc)) {
      changes.push({ kind: 'eliminated', npc, tone: 'bad', text: `${nameOf(content, npc)} is eliminated for good` })
    }
  }

  // labelled flags
  for (const [flag, v] of Object.entries(after.flags)) {
    if (before.flags[flag] === v) continue
    const key = flag.includes(':') ? `${flag.split(':')[0]}:*` : flag
    const label = content.flagLabels[flag] ?? content.flagLabels[key]
    if (!label) continue
    const who = flag.includes(':') ? flag.split(':')[1]! : undefined
    if (who) noticed.add(who)
    changes.push({ kind: 'flag', npc: who, tone: 'neutral', text: label.replace('{npc}', who ? nameOf(content, who) : '') })
  }

  for (const id of after.scenes.unlocked) if (!before.scenes.unlocked.includes(id)) changes.push({ kind: 'scene', tone: 'good', text: `Scene unlocked: ${content.scripts[id]?.title ?? id}` })
  for (const id of after.scenes.locked) if (!before.scenes.locked.includes(id)) changes.push({ kind: 'scene', tone: 'bad', text: `Scene locked out: ${content.scripts[id]?.title ?? id}` })

  for (const [id, w] of Object.entries(after.weapons)) {
    const b = before.weapons[id]
    const name = content.weapons[id]?.name ?? id
    if (!b) changes.push({ kind: 'weapon', tone: 'good', text: `Weapon gained: ${name}` })
    else if (w.level > b.level) changes.push({ kind: 'weapon', tone: 'good', text: `${name} evolved to ${content.weapons[id]?.levels[w.level - 1]?.name ?? `Lv${w.level}`}` })
    else if (w.corrupted && !b.corrupted) changes.push({ kind: 'weapon', tone: 'bad', text: `${name} is corrupted` })
  }
  for (const t of after.traits) if (!before.traits.includes(t)) changes.push({ kind: 'trait', tone: 'good', text: `Trait gained: ${content.traits[t]?.name ?? t}` })
  for (const t of before.traits) if (!after.traits.includes(t)) changes.push({ kind: 'trait', tone: 'neutral', text: `Trait lost: ${content.traits[t]?.name ?? t}` })

  for (const slot of Object.keys(after.roster)) {
    if (after.roster[slot] !== before.roster[slot]) {
      const n = after.roster[slot]
      changes.push({ kind: 'roster', npc: n ?? undefined, tone: 'neutral', text: n ? `${nameOf(content, n)} takes the ${slot} slot` : `The ${slot} slot is vacated` })
    }
  }

  const repLabel: Record<string, string> = { egoAura: 'Ego Aura', teamPlayer: 'Team Player', mediaDarling: 'Media Darling', coachFavor: 'Coach Favor', mystery: 'Mystery' }
  for (const axis of Object.keys(after.reputation) as (keyof typeof after.reputation)[]) {
    const d = after.reputation[axis] - before.reputation[axis]
    if (Math.abs(d) >= 3) changes.push({ kind: 'rep', tone: d > 0 ? 'good' : 'bad', text: `${repLabel[axis]} ${sign(d)}` })
  }
  const dI = after.resources.tacticalIntel - before.resources.tacticalIntel
  if (dI) changes.push({ kind: 'resource', tone: dI > 0 ? 'good' : 'neutral', text: `Tactical Intel ${sign(dI)}` })
  const dC = after.life.composure - before.life.composure
  if (Math.abs(dC) >= 5) changes.push({ kind: 'resource', tone: dC > 0 ? 'good' : 'bad', text: `Composure ${sign(dC)}` })

  // something scheduled to come back
  const newlyScheduled = after.scheduled.slice(before.scheduled.length)
  let hint = opts.choice?.reveal
  if (!hint && newlyScheduled.length) {
    hint = newlyScheduled.map((s) => content.events[s.eventId]?.hint).find(Boolean) ?? 'This isn’t over. Something you did here will come back.'
  }

  if (changes.length === 0 && !hint) return null
  for (const c of opts.cast ?? []) if (changes.some((x) => x.npc === c)) noticed.add(c)
  return {
    id: opts.id,
    turn: after.meta.turn,
    source: opts.source,
    headline: opts.choice?.tone ? `${opts.choice.tone.toUpperCase()}` : 'RIPPLE',
    choiceLabel: opts.choice?.label,
    noticed: [...noticed],
    changes,
    hint,
  }
}
