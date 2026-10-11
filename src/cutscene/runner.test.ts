import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { createPreviewApi } from '../engine/preview'
import { ORIGIN_IDS, ScriptSchema, type OriginId, type ScriptInput } from '../engine/schemas'
import type { ContentDB } from '../engine/types'
import { newState } from '../test/helpers'
import { CutsceneRunner } from './runner'

/** Content with extra ad-hoc scripts layered on the real database. */
function withScripts(...scripts: ScriptInput[]): ContentDB {
  return { ...content, scripts: { ...content.scripts, ...Object.fromEntries(scripts.map((s) => [s.id, ScriptSchema.parse(s)])) } }
}

function drain(r: CutsceneRunner, pick: (r: CutsceneRunner) => string = (x) => (x.current as { choices: { choice: { id: string }; available: boolean }[] }).choices.find((c) => c.available)!.choice.id) {
  let n = 0
  while (!r.done) {
    if (++n > 500) throw new Error('did not terminate')
    const c = r.current
    if (!c) break
    if (c.t === 'choice' || c.t === 'timedChoice') r.choose(pick(r))
    else r.advance()
  }
}

describe('cutscene runner', () => {
  it('stops on blocking beats, runs non-blocking ones, and finishes', () => {
    const c = withScripts({ id: 't1', title: 't', beats: [
      { t: 'setFlag', flag: 'X', value: true },
      { t: 'line', who: 'ego', text: 'hello {player}' },
      { t: 'narration', text: 'n' },
    ] })
    const api = createPreviewApi(newState())
    const r = new CutsceneRunner('t1', api, c)
    expect(api.current().flags.X).toBe(true)
    expect(r.current).toMatchObject({ t: 'line', text: 'hello Tester' })
    r.advance()
    expect(r.current).toMatchObject({ t: 'narration' })
    r.advance()
    expect(r.done).toBe(true)
  })

  it('honours `when` guards, per-origin variants, branch/labels and goto', () => {
    const script: ScriptInput = { id: 't2', title: 't', beats: [
      { t: 'line', who: 'ego', text: 'default', variants: { fallen_ace: 'wound' } },
      { t: 'branch', cases: [{ when: { t: 'origin', in: ['fallen_ace'] }, goto: 'A' }], else: 'B' },
      { t: 'label', id: 'A' }, { t: 'narration', text: 'at A' }, { t: 'goto', label: 'END' },
      { t: 'label', id: 'B' }, { t: 'narration', text: 'at B' },
      { t: 'label', id: 'END' },
      { t: 'narration', text: 'guarded', when: { t: 'flag', flag: 'NOPE' } },
    ] }
    const seen = (o: OriginId) => {
      const r = new CutsceneRunner('t2', createPreviewApi(newState(o)), withScripts(script))
      const out: string[] = []
      while (!r.done) { out.push((r.current as { text: string }).text); r.advance() }
      return out
    }
    expect(seen('fallen_ace')).toEqual(['wound', 'at A'])
    expect(seen('street_renegade')).toEqual(['default', 'at B'])
  })

  it('subroutines (`run`) return to the caller', () => {
    const c = withScripts(
      { id: 'sub', title: 's', beats: [{ t: 'narration', text: 'inside' }] },
      { id: 'main', title: 'm', beats: [{ t: 'narration', text: 'before' }, { t: 'run', script: 'sub' }, { t: 'narration', text: 'after' }] },
    )
    const r = new CutsceneRunner('main', createPreviewApi(newState()), c)
    const out: string[] = []
    while (!r.done) { out.push((r.current as { text: string }).text); r.advance() }
    expect(out).toEqual(['before', 'inside', 'after'])
  })

  it('choices apply tone effects, costs, memory, delayed events and produce a ripple', () => {
    const c = withScripts({ id: 't3', title: 't', beats: [
      { t: 'choice', choices: [
        { id: 'a', label: 'Devour him', tone: 'Devour', target: 'barou', major: true, delayed: [{ eventId: 'evt.barou.feed_me', delay: 2 }], effects: [{ t: 'shiftRelationship', npc: 'barou', respect: 10 }] },
        { id: 'b', label: 'Read him', tone: 'Analyze', target: 'barou' },
      ] },
      { t: 'narration', text: 'after' },
    ] })
    const api = createPreviewApi(newState())
    const r = new CutsceneRunner('t3', api, c)
    expect(r.choose('a')).toBe(true)
    const s = api.current()
    expect(s.flags['DEVOUR_TARGET:barou']).toBe(true)
    expect(s.scheduled).toHaveLength(1)
    expect(s.scheduled[0]).toMatchObject({ eventId: 'evt.barou.feed_me', due: 2 })
    expect(s.memory.at(-1)).toMatchObject({ verb: 'devoured', target: 'barou' })
    expect(r.ripple).toBeTruthy()
    expect(s.ripples).toHaveLength(1)
    expect(r.current).toMatchObject({ t: 'narration', text: 'after' })
  })

  it('Analyze spends 1 Tactical Intel and is locked when you have none', () => {
    const c = withScripts({ id: 't4', title: 't', beats: [{ t: 'choice', choices: [{ id: 'b', label: 'Read', tone: 'Analyze', target: 'barou' }, { id: 'z', label: 'Skip' }] }] })
    const s0 = newState()
    const api = createPreviewApi(s0)
    const r = new CutsceneRunner('t4', api, c)
    r.choose('b')
    expect(api.current().resources.tacticalIntel).toBe(s0.resources.tacticalIntel - 1)
    const poor = createPreviewApi({ ...s0, resources: { tacticalIntel: 0 } })
    const r2 = new CutsceneRunner('t4', poor, c)
    const view = (r2.current as { choices: { choice: { id: string }; available: boolean; reason?: string }[] }).choices
    expect(view.find((v) => v.choice.id === 'b')).toMatchObject({ available: false })
    expect(r2.choose('b')).toBe(false)
  })

  it('requirement-gated choices are locked with a hint or hidden', () => {
    const c = withScripts({ id: 't5', title: 't', beats: [{ t: 'choice', choices: [
      { id: 'open', label: 'ok' },
      { id: 'locked', label: 'L', requires: { t: 'origin', in: ['late_starter'] }, lockedHint: 'Late starters only' },
      { id: 'hidden', label: 'H', requires: { t: 'origin', in: ['late_starter'] }, hideWhenLocked: true },
    ] }] })
    const r = new CutsceneRunner('t5', createPreviewApi(newState('fallen_ace')), c)
    const ch = (r.current as { choices: { choice: { id: string }; available: boolean; reason?: string }[] }).choices
    expect(ch.map((x) => x.choice.id)).toEqual(['open', 'locked'])
    expect(ch[1]).toMatchObject({ available: false, reason: 'Late starters only' })
    expect(r.choose('locked')).toBe(false)
  })

  it('timed choice timeout takes the default WITH consequences (never a soft fail)', () => {
    const c = withScripts({ id: 't6', title: 't', beats: [
      { t: 'timedChoice', seconds: 3, defaultChoiceId: 'quiet', timeoutEffects: [{ t: 'adjust', key: 'composure', delta: -8 }, { t: 'setFlag', flag: 'FROZE', value: true }],
        choices: [{ id: 'bold', label: 'Bold', tone: 'Devour' }, { id: 'quiet', label: 'Quiet', tone: 'Ignore' }] },
      { t: 'narration', text: 'next' },
    ] })
    const s0 = newState()
    const api = createPreviewApi(s0)
    const r = new CutsceneRunner('t6', api, c)
    r.choose('quiet', true)
    const s = api.current()
    expect(s.flags.FROZE).toBe(true)
    expect(s.life.composure).toBe(s0.life.composure - 8 + 3) // timeout penalty, then Ignore's +3
    expect(s.memory.at(-1)?.text).toMatch(/froze/)
  })

  it('goto after a choice jumps to its reply block', () => {
    const c = withScripts({ id: 't7', title: 't', beats: [
      { t: 'choice', choices: [{ id: 'x', label: 'X', goto: 'X' }, { id: 'y', label: 'Y', goto: 'Y' }] },
      { t: 'label', id: 'X' }, { t: 'narration', text: 'x-reply' }, { t: 'goto', label: 'E' },
      { t: 'label', id: 'Y' }, { t: 'narration', text: 'y-reply' },
      { t: 'label', id: 'E' },
    ] })
    const r = new CutsceneRunner('t7', createPreviewApi(newState()), c)
    r.choose('y')
    expect((r.current as { text: string }).text).toBe('y-reply')
  })

  it('tracks the stage: enter, emotion changes, aura, exit', () => {
    const c = withScripts({ id: 't8', title: 't', beats: [
      { t: 'enter', who: 'ego', side: 'center', emotion: 'smirk' },
      { t: 'aura', who: 'ego', aura: 'flow' },
      { t: 'line', who: 'ego', text: 'a', emotion: 'furious' },
      { t: 'exit', who: 'ego' },
      { t: 'narration', text: 'gone' },
    ] })
    const r = new CutsceneRunner('t8', createPreviewApi(newState()), c)
    expect(r.stage).toEqual([{ who: 'ego', side: 'center', emotion: 'furious', aura: 'flow' }])
    r.advance()
    expect(r.stage).toEqual([])
  })
})

describe('the opening plays end to end for every origin', () => {
  for (const origin of ORIGIN_IDS) {
    it(`${origin}: always terminates, whichever options are chosen`, () => {
      // first available / last available / pseudo-random picks
      const policies: ((r: CutsceneRunner) => string)[] = [
        (r) => (r.current as { choices: { choice: { id: string }; available: boolean }[] }).choices.find((c) => c.available)!.choice.id,
        (r) => [...(r.current as { choices: { choice: { id: string }; available: boolean }[] }).choices].reverse().find((c) => c.available)!.choice.id,
        (r) => { const a = (r.current as { choices: { choice: { id: string }; available: boolean }[] }).choices.filter((c) => c.available); return a[(r.log.length * 7) % a.length]!.choice.id },
      ]
      for (const pick of policies) {
        const api = createPreviewApi(newState(origin))
        const r = new CutsceneRunner('opening.main', api, content)
        drain(r, pick)
        expect(r.done).toBe(true)
        expect(api.current().flags.OPENING_COMPLETE).toBe(true)
        expect(api.current().scheduled.length).toBeGreaterThan(0) // delayed consequences were queued
        expect(r.log.length).toBeGreaterThan(15)
      }
    })
  }

  it('the opening diverges by origin: different cold open, different Ego callout, different approacher', () => {
    const transcripts = ORIGIN_IDS.map((o) => {
      const r = new CutsceneRunner('opening.main', createPreviewApi(newState(o)), content)
      drain(r)
      return r.log.map((l) => l.text).join('\n')
    })
    expect(new Set(transcripts).size).toBe(ORIGIN_IDS.length)
    const t = (o: OriginId) => transcripts[ORIGIN_IDS.indexOf(o)]!
    expect(t('fallen_ace')).toMatch(/Sora/)
    expect(t('academy_exile')).toMatch(/Reiji/)
    expect(t('street_renegade')).toMatch(/monster/)
    expect(t('overlooked_playmaker')).toMatch(/king/i)
    expect(t('fallen_ace')).not.toMatch(/Reiji Hasegawa/)
  })

  it('the Ego question is a timed choice and timing out has consequences', () => {
    const api = createPreviewApi(newState('street_renegade'))
    const r = new CutsceneRunner('opening.main', api, content)
    let guard = 0
    while (r.current && r.current.t !== 'timedChoice' && guard++ < 200) r.advance()
    expect(r.current?.t).toBe('timedChoice')
    const before = api.current().life.composure
    r.choose((r.current as { defaultChoiceId: string }).defaultChoiceId, true)
    expect(api.current().flags.FROZE_AT_ENTRY).toBe(true)
    expect(api.current().life.composure).toBeLessThan(before)
  })

  it('origin-gated options: academy insider gets its own line, others do not see it', () => {
    const labels = (o: OriginId) => {
      const r = new CutsceneRunner('opening.main', createPreviewApi(newState(o)), content)
      let g = 0
      while (r.current && r.current.t !== 'timedChoice' && g++ < 200) r.advance()
      return (r.current as { choices: { choice: { id: string } }[] }).choices.map((c) => c.choice.id)
    }
    expect(labels('fallen_ace')).toContain('fear')
    expect(labels('academy_exile')).toContain('jargon')
    expect(labels('academy_exile')).not.toContain('fear')
    expect(labels('overlooked_playmaker')).toContain('bait')
    expect(labels('street_renegade')).toContain('juggle')
  })

  it('choices in the opening change what happens later (Barou event branches on your answer)', () => {
    const play = (supportBarou: boolean) => {
      const api = createPreviewApi(newState('overlooked_playmaker'))
      const r = new CutsceneRunner('opening.main', api, content)
      drain(r, (x) => {
        const cs = (x.current as { choices: { choice: { id: string }; available: boolean }[] }).choices
        const want = supportBarou ? 'support' : 'devour'
        return (cs.find((c) => c.choice.id === want && c.available) ?? cs.find((c) => c.available)!).choice.id
      })
      return api.current()
    }
    const soft = play(true)
    const hard = play(false)
    expect(soft.flags['SEEN_AS_SOFT:barou']).toBe(true)
    expect(hard.flags['SEEN_AS_SOFT:barou']).toBeUndefined()
    expect(hard.flags['DEVOUR_TARGET:barou']).toBe(true)
  })
})
