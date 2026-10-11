import type { Beat, Condition, Effect } from './schemas'
import type { ContentDB } from './types'

export interface Ref {
  kind: 'flag'
  name: string
  role: 'read' | 'write'
  where: string
}

function condRefs(c: Condition | undefined, where: string, out: Ref[]) {
  if (!c) return
  switch (c.t) {
    case 'flag': out.push({ kind: 'flag', name: c.flag, role: 'read', where }); break
    case 'noFlag': out.push({ kind: 'flag', name: c.flag, role: 'read', where }); break
    case 'and': c.all.forEach((x) => condRefs(x, where, out)); break
    case 'or': c.any.forEach((x) => condRefs(x, where, out)); break
    case 'not': condRefs(c.cond, where, out); break
  }
}

function effectRefs(es: Effect[], where: string, out: Ref[]) {
  for (const e of es) if (e.t === 'setFlag') out.push({ kind: 'flag', name: e.flag, role: 'write', where })
}

function beatRefs(b: Beat, where: string, out: Ref[]) {
  condRefs('when' in b ? b.when : undefined, where, out)
  switch (b.t) {
    case 'setFlag': out.push({ kind: 'flag', name: b.flag, role: 'write', where }); break
    case 'effects': effectRefs(b.effects, where, out); break
    case 'branch': b.cases.forEach((c) => condRefs(c.when, where, out)); break
    case 'choice':
    case 'timedChoice':
      for (const c of b.choices) {
        condRefs(c.requires, `${where} › ${c.id}`, out)
        effectRefs(c.effects, `${where} › ${c.id}`, out)
      }
      if (b.t === 'timedChoice') effectRefs(b.timeoutEffects, `${where} › timeout`, out)
      break
  }
}

/** Every flag read/write in authored content (events' preconditions, scripts, choices, origins). */
export function collectFlagRefs(content: ContentDB): Ref[] {
  const out: Ref[] = []
  for (const e of Object.values(content.events)) condRefs(e.when, `event ${e.id}`, out)
  for (const s of Object.values(content.scripts)) s.beats.forEach((b) => beatRefs(b, `scene ${s.id}`, out))
  for (const o of Object.values(content.origins)) for (const f of Object.keys(o.startFlags)) out.push({ kind: 'flag', name: f, role: 'write', where: `origin ${o.id}` })
  return out
}

export function flagUsage(content: ContentDB, flag: string) {
  const all = collectFlagRefs(content).filter((r) => r.name === flag)
  const events = Object.values(content.events).filter((e) => all.some((r) => r.role === 'read' && r.where === `event ${e.id}`)).map((e) => e.id)
  return { setBy: [...new Set(all.filter((r) => r.role === 'write').map((r) => r.where))], readBy: [...new Set(all.filter((r) => r.role === 'read').map((r) => r.where))], events }
}

// ── content validation (cross references) ──
function labels(beats: Beat[]): Set<string> {
  return new Set(beats.filter((b): b is Extract<Beat, { t: 'label' }> => b.t === 'label').map((b) => b.id))
}

/** Returns human-readable problems. Empty = content is internally consistent. */
export function validateContent(content: ContentDB): string[] {
  const errs: string[] = []
  const chars = content.characters
  const isActor = (id: string) => id === 'player' || !!chars[id]
  const checkActor = (id: string | undefined, where: string) => {
    if (id && !isActor(id)) errs.push(`${where}: unknown character "${id}"`)
  }
  const checkEffects = (es: Effect[], where: string) => {
    for (const e of es) {
      if ('npc' in e && typeof e.npc === 'string') checkActor(e.npc, where)
      if (e.t === 'scheduleEvent' && !content.events[e.eventId]) errs.push(`${where}: scheduleEvent → unknown event "${e.eventId}"`)
      if ((e.t === 'unlockWeapon' || e.t === 'evolveWeapon' || e.t === 'corruptWeapon') && !content.weapons[e.id]) errs.push(`${where}: unknown weapon "${e.id}"`)
      if ((e.t === 'addTrait' || e.t === 'removeTrait') && !content.traits[e.id]) errs.push(`${where}: unknown trait "${e.id}"`)
      if ((e.t === 'unlockScene' || e.t === 'lockScene') && !content.scripts[e.id]) errs.push(`${where}: unknown scene "${e.id}"`)
    }
  }
  const checkCond = (c: Condition | undefined, where: string) => {
    if (!c) return
    switch (c.t) {
      case 'rel': case 'status': case 'eliminated': checkActor(c.npc, where); break
      case 'trait': if (!content.traits[c.id]) errs.push(`${where}: unknown trait "${c.id}"`); break
      case 'weapon': if (!content.weapons[c.id]) errs.push(`${where}: unknown weapon "${c.id}"`); break
      case 'and': c.all.forEach((x) => checkCond(x, where)); break
      case 'or': c.any.forEach((x) => checkCond(x, where)); break
      case 'not': checkCond(c.cond, where); break
    }
  }

  for (const [id, ch] of Object.entries(chars)) {
    if (ch.id !== id) errs.push(`character key "${id}" ≠ id "${ch.id}"`)
  }
  for (const o of Object.values(content.origins)) {
    checkActor(o.approachedBy, `origin ${o.id}.approachedBy`)
    for (const t of o.startTraits) if (!content.traits[t]) errs.push(`origin ${o.id}: unknown trait "${t}"`)
  }
  for (const e of Object.values(content.events)) {
    checkCond(e.when, `event ${e.id}`)
    e.cast.forEach((c) => checkActor(c, `event ${e.id}.cast`))
    e.scenes.forEach((s) => { if (!content.scripts[s]) errs.push(`event ${e.id}: unknown scene "${s}"`) })
  }
  for (const s of Object.values(content.scripts)) {
    const where = `scene ${s.id}`
    const lab = labels(s.beats)
    const seenLabels = new Set<string>()
    for (const b of s.beats) {
      if (b.t === 'label') {
        if (seenLabels.has(b.id)) errs.push(`${where}: duplicate label "${b.id}"`)
        seenLabels.add(b.id)
      }
      checkCond('when' in b ? b.when : undefined, where)
      if (b.t === 'line') checkActor(b.who, `${where} line`)
      if (b.t === 'enter' || b.t === 'exit' || b.t === 'aura') checkActor(b.who, `${where} ${b.t}`)
      if (b.t === 'cutIn') { checkActor(b.left.who, `${where} cutIn`); checkActor(b.right?.who, `${where} cutIn`) }
      if (b.t === 'panel') b.cells.forEach((c) => checkActor(c.who, `${where} panel`))
      if (b.t === 'run' && !content.scripts[b.script]) errs.push(`${where}: run → unknown scene "${b.script}"`)
      if (b.t === 'goto' && !lab.has(b.label)) errs.push(`${where}: goto → missing label "${b.label}"`)
      if (b.t === 'branch') {
        b.cases.forEach((c) => { checkCond(c.when, where); if (!lab.has(c.goto)) errs.push(`${where}: branch → missing label "${c.goto}"`) })
        if (b.else && !lab.has(b.else)) errs.push(`${where}: branch else → missing label "${b.else}"`)
      }
      if (b.t === 'effects') checkEffects(b.effects, where)
      if (b.t === 'choice' || b.t === 'timedChoice') {
        const ids = new Set<string>()
        for (const c of b.choices) {
          if (ids.has(c.id)) errs.push(`${where}: duplicate choice id "${c.id}"`)
          ids.add(c.id)
          checkCond(c.requires, `${where} › ${c.id}`)
          checkActor(c.target, `${where} › ${c.id}.target`)
          checkEffects(c.effects, `${where} › ${c.id}`)
          if (c.goto && !lab.has(c.goto)) errs.push(`${where} › ${c.id}: goto → missing label "${c.goto}"`)
          for (const d of c.delayed) if (!content.events[d.eventId]) errs.push(`${where} › ${c.id}: delayed → unknown event "${d.eventId}"`)
        }
        if (b.t === 'timedChoice') {
          if (!ids.has(b.defaultChoiceId)) errs.push(`${where}: timedChoice defaultChoiceId "${b.defaultChoiceId}" is not one of its choices`)
          checkEffects(b.timeoutEffects, `${where} timeout`)
        }
      }
    }
  }
  return errs
}
