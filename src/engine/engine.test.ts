import { describe, expect, it } from 'vitest'
import { content, contentProblems } from '../content'
import { and, flag, memory, not, noFlag, or, origin, rel, skill, status, trait } from '../content/dsl'
import { describeCond, evalCond } from './conditions'
import { applyEffects, canAfford, costEffects } from './effects'
import { buildRipple } from './ripple'
import { getRel, autoStatus, blankRel } from './relationships'
import { advanceTurn, dueEvents } from './scheduler'
import { ORIGIN_IDS, GameStateSchema, type Effect } from './schemas'
import { collectFlagRefs, flagUsage } from './refs'
import { effectiveCost, toneEffects } from './tones'
import { renderText, parseEmphasis } from './text'
import { newState } from '../test/helpers'

describe('content', () => {
  it('is internally consistent (every reference resolves)', () => {
    expect(contentProblems).toEqual([])
  })
  it('has 12+ original characters or placeholders flagged as such', () => {
    const originals = Object.values(content.characters).filter((c) => c.kind === 'original')
    expect(originals.length).toBeGreaterThanOrEqual(8)
    expect(Object.values(content.characters).filter((c) => c.kind === 'canon').length).toBeGreaterThanOrEqual(12)
    for (const c of originals) if (c.placeholder) expect(c.hooks.length).toBeGreaterThan(0)
  })
  it('every origin is startable and produces a schema-valid state', () => {
    for (const o of ORIGIN_IDS) expect(GameStateSchema.safeParse(newState(o)).success).toBe(true)
  })
  it('origin start state differs and sets its tag flag', () => {
    expect(newState('fallen_ace').flags.HAUNTED_PASS).toBe(true)
    expect(newState('academy_exile').flags.COACH_DISTRUST).toBe(true)
    expect(newState('street_renegade').flags.UNSTRUCTURED).toBe(true)
    expect(newState('overlooked_playmaker').flags.HABITUAL_PASSER).toBe(true)
    expect(newState('fallen_ace').skills.teamwork).toBeGreaterThan(newState('street_renegade').skills.teamwork)
    expect(newState('street_renegade').skills.dribbling).toBeGreaterThan(newState('fallen_ace').skills.dribbling)
  })
})

describe('conditions', () => {
  const s = applyEffects(newState('overlooked_playmaker'), [
    { t: 'setFlag', flag: 'A', value: true },
    { t: 'setFlag', flag: 'MODE', value: 'devour' },
    { t: 'shiftRelationship', npc: 'barou', trust: 30 },
    { t: 'addTrait', id: 'bait' },
  ], 't')
  it('evaluates flags, enums, origin, traits, relationships and combinators', () => {
    expect(evalCond(s, flag('A'))).toBe(true)
    expect(evalCond(s, flag('MODE', 'devour'))).toBe(true)
    expect(evalCond(s, flag('MODE', 'support'))).toBe(false)
    expect(evalCond(s, noFlag('NOPE'))).toBe(true)
    expect(evalCond(s, origin('overlooked_playmaker'))).toBe(true)
    expect(evalCond(s, origin('fallen_ace', 'academy_exile'))).toBe(false)
    expect(evalCond(s, trait('bait'))).toBe(true)
    expect(evalCond(s, rel('barou', 'trust', '>=', 25))).toBe(true)
    expect(evalCond(s, status('barou', 'Ally'))).toBe(true)
    expect(evalCond(s, and(flag('A'), not(flag('NOPE'))))).toBe(true)
    expect(evalCond(s, or(flag('NOPE'), skill('metavision', '>=', 40)))).toBe(true)
    expect(evalCond(s, undefined)).toBe(true)
  })
  it('memory conditions respect time windows', () => {
    const m = applyEffects(s, [{ t: 'logMemory', verb: 'devoured', target: 'barou', text: 'x' }], 't')
    expect(evalCond(m, memory('devoured', 'barou'))).toBe(true)
    expect(evalCond(m, memory('devoured', 'sora'))).toBe(false)
    const later = { ...m, meta: { ...m.meta, turn: m.meta.turn + 10 } }
    expect(evalCond(later, memory('devoured', 'barou', 3))).toBe(false)
  })
  it('describes conditions in plain English for lock hints', () => {
    expect(describeCond(or(skill('metavision', '>=', 35), origin('academy_exile')))).toContain('metavision >= 35')
  })
})

describe('relationship status rules', () => {
  const r = (o: Partial<ReturnType<typeof blankRel>>) => ({ ...blankRel(), ...o })
  it('derives statuses from values', () => {
    expect(autoStatus(r({}))).toBe('Stranger')
    expect(autoStatus(r({ trust: 30 }))).toBe('Ally')
    expect(autoStatus(r({ trust: 70, respect: 50 }))).toBe('Devoted')
    expect(autoStatus(r({ rivalry: 45 }))).toBe('Rival')
    expect(autoStatus(r({ trust: -50 }))).toBe('Hostile')
  })
  it('has hysteresis so statuses do not flicker', () => {
    expect(autoStatus(r({ trust: 18, status: 'Ally' }))).toBe('Ally')
    expect(autoStatus(r({ trust: 18, status: 'Stranger' }))).toBe('Stranger')
    expect(autoStatus(r({ rivalry: 33, status: 'Rival' }))).toBe('Rival')
  })
  it('transitions via shiftRelationship; sticky/pinned statuses are not overridden', () => {
    let s = newState()
    s = applyEffects(s, [{ t: 'shiftRelationship', npc: 'bachira', trust: 30 }], 't')
    expect(getRel(s, 'bachira').status).toBe('Ally')
    s = applyEffects(s, [{ t: 'shiftRelationship', npc: 'bachira', rivalry: 50 }], 't')
    expect(getRel(s, 'bachira').status).toBe('Rival')
    s = applyEffects(s, [{ t: 'setStatus', npc: 'bachira', status: 'Devoured' }, { t: 'shiftRelationship', npc: 'bachira', trust: 80, respect: 80 }], 't')
    expect(getRel(s, 'bachira').status).toBe('Devoured')
  })
  it('clamps values', () => {
    const s = applyEffects(newState(), [{ t: 'shiftRelationship', npc: 'x', trust: 999, fear: -50 }], 't')
    expect(getRel(s, 'x').trust).toBe(100)
    expect(getRel(s, 'x').fear).toBe(0)
  })
})

describe('effects', () => {
  const run = (es: Effect[]) => applyEffects(newState(), es, 'test')
  it('does not mutate the previous state', () => {
    const a = newState()
    const b = applyEffects(a, [{ t: 'setFlag', flag: 'Z', value: true }], 't')
    expect(a.flags.Z).toBeUndefined()
    expect(b.flags.Z).toBe(true)
  })
  it('elimination is permanent: status pinned, roster cleared, scheduled cast dropped by scheduler', () => {
    let s = run([{ t: 'changeRosterSlot', slot: 'ST', npc: 'sora' }, { t: 'scheduleEvent', eventId: 'evt.sora.reunion', delay: 0 }])
    s = applyEffects(s, [{ t: 'eliminate', npc: 'sora' }, { t: 'shiftRelationship', npc: 'sora', trust: 90, respect: 90 }], 't')
    expect(s.eliminated).toContain('sora')
    expect(s.roster.ST).toBeNull()
    expect(getRel(s, 'sora').status).toBe('Eliminated')
    expect(dueEvents(s, content)).toEqual([])
  })
  it('weapons: unlock, evolve (cap 3), corrupt', () => {
    let s = run([{ t: 'unlockWeapon', id: 'cage_feint' }, { t: 'evolveWeapon', id: 'cage_feint' }, { t: 'evolveWeapon', id: 'cage_feint' }, { t: 'evolveWeapon', id: 'cage_feint' }, { t: 'corruptWeapon', id: 'cage_feint' }])
    expect(s.weapons.cage_feint).toEqual({ level: 3, corrupted: true })
    s = applyEffects(s, [{ t: 'unlockWeapon', id: 'cage_feint' }], 't')
    expect(s.weapons.cage_feint?.level).toBe(3) // unlocking again doesn't reset
  })
  it('scenes lock/unlock are exclusive; traits add/remove; injure lowers health', () => {
    let s = run([{ t: 'unlockScene', id: 'a' }, { t: 'lockScene', id: 'a' }, { t: 'addTrait', id: 'clutch' }, { t: 'injure', part: 'knee', severity: 'severe', weeks: 3 }])
    expect(s.scenes.locked).toContain('a')
    expect(s.scenes.unlocked).not.toContain('a')
    expect(s.traits).toContain('clutch')
    expect(s.life.health).toBe(70)
    s = applyEffects(s, [{ t: 'removeTrait', id: 'clutch' }], 't')
    expect(s.traits).not.toContain('clutch')
  })
  it('costs: canAfford and costEffects', () => {
    const s = newState()
    expect(canAfford(s, { tacticalIntel: 99 })).toBe(false)
    const after = applyEffects(s, costEffects({ tacticalIntel: 1, composure: 5 }), 't')
    expect(after.resources.tacticalIntel).toBe(s.resources.tacticalIntel - 1)
    expect(after.life.composure).toBe(s.life.composure - 5)
  })
  it('stores AI mods and match patches for the match engine', () => {
    const s = run([{ t: 'modifyAI', npc: 'barou', behavior: 'tilted', duration: 'match' }, { t: 'modifyMatchScript', matchId: 'm1', patch: { x: 1 } }])
    expect(s.aiMods[0]).toMatchObject({ npc: 'barou', behavior: 'tilted' })
    expect(s.matchPatches[0]).toMatchObject({ matchId: 'm1', patch: { x: 1 } })
  })
})

describe('dialogue tone effect models', () => {
  const s0 = newState()
  const E = (tone: Parameters<typeof toneEffects>[2], target: string, s = s0) => toneEffects(s, content, tone, target)
  it('Provoke tilts the target and builds rivalry', () => {
    const e = E('Provoke', 'raichi')
    expect(e).toContainEqual({ t: 'modifyAI', npc: 'raichi', behavior: 'tilted', duration: 'match' })
    expect(e.some((x) => x.t === 'shiftRelationship' && (x.rivalry ?? 0) > 0)).toBe(true)
  })
  it('Analyze costs 1 Tactical Intel and exposes a weakness', () => {
    expect(effectiveCost({ tone: 'Analyze' })).toEqual({ tacticalIntel: 1 })
    expect(effectiveCost({ tone: 'Support' })).toBeUndefined()
    expect(E('Analyze', 'reiji').some((x) => x.t === 'modifyAI' && x.behavior === 'exposed')).toBe(true)
  })
  it('Ignore defuses a cold relationship but lets a live grudge fester', () => {
    const cold = E('Ignore', 'sora')
    expect(cold.some((x) => x.t === 'shiftRelationship' && (x.rivalry ?? 0) < 0)).toBe(true)
    const hot = applyEffects(s0, [{ t: 'shiftRelationship', npc: 'sora', rivalry: 30 }], 't')
    const fester = E('Ignore', 'sora', hot)
    expect(fester).toContainEqual({ t: 'setFlag', flag: 'GRUDGE:sora', value: true })
  })
  it('Devour sets DEVOUR_TARGET and a match obligation', () => {
    const e = E('Devour', 'barou')
    expect(e).toContainEqual({ t: 'setFlag', flag: 'DEVOUR_TARGET:barou', value: true })
    expect(e.some((x) => x.t === 'modifyMatchScript' && x.matchId === 'next_shared:barou')).toBe(true)
  })
  it('Support builds trust, unlocks combos, and reads as soft to contemptuous NPCs only', () => {
    const soft = E('Support', 'barou')
    expect(soft).toContainEqual({ t: 'setFlag', flag: 'SEEN_AS_SOFT:barou', value: true })
    const kind = E('Support', 'bachira')
    expect(kind).toContainEqual({ t: 'setFlag', flag: 'COMBO_ELIGIBLE:bachira', value: true })
    expect(kind.some((x) => x.t === 'setFlag' && x.flag.startsWith('SEEN_AS_SOFT'))).toBe(false)
  })
})

describe('ripple builder', () => {
  it('reports status changes, labelled flags, hints for scheduled events, and noticed NPCs', () => {
    const before = newState()
    const after = applyEffects(before, [
      { t: 'shiftRelationship', npc: 'bachira', rivalry: 45, trust: -10 },
      { t: 'setFlag', flag: 'DEVOUR_TARGET:bachira', value: true },
      { t: 'scheduleEvent', eventId: 'evt.bachira.invitation', delay: 2 },
    ], 't')
    const r = buildRipple(before, after, content, { id: 1, source: 's', choice: { label: 'x', tone: 'Devour' } })!
    expect(r).toBeTruthy()
    expect(r.noticed).toContain('bachira')
    expect(r.changes.some((c) => c.kind === 'status' && /Rival/.test(c.text))).toBe(true)
    expect(r.changes.some((c) => c.kind === 'flag' && /prey/.test(c.text))).toBe(true)
    expect(r.hint).toMatch(/monster/i)
  })
  it('returns null when nothing visible changed', () => {
    const s = newState()
    expect(buildRipple(s, s, content, { id: 1, source: 's' })).toBeNull()
  })
})

describe('scheduler / delayed consequences', () => {
  it('fires scheduled events exactly when due, then removes them', () => {
    let s = applyEffects(newState(), [{ t: 'scheduleEvent', eventId: 'evt.sora.reunion', delay: 2 }], 't')
    let r = advanceTurn(s, content)
    expect(r.queue).toEqual([])
    expect(r.state.scheduled).toHaveLength(1)
    r = advanceTurn(r.state, content)
    expect(r.queue).toEqual(['evt.sora.reunion'])
    expect(r.state.scheduled).toHaveLength(0)
    expect(r.state.firedEvents['evt.sora.reunion']).toBe(r.state.meta.turn)
    s = r.state
    expect(advanceTurn(s, content).queue).toEqual([])
  })
  it('advancing the turn refreshes AP and heals injuries', () => {
    let s = applyEffects(newState(), [{ t: 'adjust', key: 'ap', delta: -6 }, { t: 'injure', part: 'ankle', severity: 'minor', weeks: 2 }], 't')
    expect(s.life.ap).toBe(0)
    s = advanceTurn(s, content).state
    expect(s.life.ap).toBe(s.life.apMax)
    expect(s.life.injuries[0]?.weeksLeft).toBe(1)
    s = advanceTurn(s, content).state
    expect(s.life.injuries).toHaveLength(0)
  })
  it('is deterministic for a given seed', () => {
    const strip = (s: ReturnType<typeof newState>) => ({ ...s, meta: { ...s.meta, createdAt: '' } })
    const a = advanceTurn(newState('fallen_ace', 7), content).state
    const b = advanceTurn(newState('fallen_ace', 7), content).state
    expect(strip(a)).toEqual(strip(b))
  })
})

describe('flag usage analysis', () => {
  it('finds which events/scenes read and write a flag', () => {
    const u = flagUsage(content, 'COMBO_ELIGIBLE:sora')
    expect(u.readBy.some((x) => x.includes('evt.sora.reunion'))).toBe(true)
    expect(collectFlagRefs(content).some((r) => r.name === 'OPENING_COMPLETE' && r.role === 'write')).toBe(true)
    expect(flagUsage(content, 'HAUNTED_PASS').setBy).toContain('origin fallen_ace')
  })
})

describe('text', () => {
  it('renders templates and emphasis', () => {
    const s = newState()
    expect(renderText('Hi {player} the {origin}', s)).toBe('Hi Tester the Fallen High School Ace')
    expect(parseEmphasis('a *b* c')).toEqual([{ text: 'a ', em: false }, { text: 'b', em: true }, { text: ' c', em: false }])
  })
})
