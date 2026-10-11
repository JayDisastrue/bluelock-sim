import { describe, expect, it } from 'vitest'
import { newState } from '../test/helpers'
import { AUTOSAVE_KEY, SAVE_VERSION, listSlots, makeSave, memoryStorage, migrate, parseSave, readSave, slotKey, writeSave, deleteSave } from './save'
import { applyEffects } from './effects'

describe('saves', () => {
  it('round-trips a game exactly through JSON + schema validation', () => {
    let s = newState('street_renegade')
    s = applyEffects(s, [{ t: 'shiftRelationship', npc: 'bachira', trust: 33 }, { t: 'logMemory', verb: 'v', text: 't' }, { t: 'scheduleEvent', eventId: 'e', delay: 2 }], 't')
    const parsed = parseSave(JSON.stringify(makeSave(s, 'hello')))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.save.data).toEqual(s)
      expect(parsed.save.label).toBe('hello')
    }
  })
  it('rejects garbage, wrong format and invalid data with readable errors', () => {
    expect(parseSave('not json')).toMatchObject({ ok: false })
    expect(parseSave({ format: 'other' })).toMatchObject({ ok: false, error: expect.stringMatching(/Not a Blue Lock/) })
    const bad = { ...makeSave(newState()), data: { ...newState(), player: { ...newState().player, origin: 'nope' } } }
    const r = parseSave(bad)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/player\.origin/)
  })
  it('rejects saves from the future', () => {
    const r = parseSave({ ...makeSave(newState()), version: SAVE_VERSION + 1 })
    expect(r.ok).toBe(false)
  })
  it('migrates through a chain of versions (tested with synthetic migrations)', () => {
    const chain = {
      1: (d: Record<string, unknown>) => ({ ...d, a: 1 }),
      2: (d: Record<string, unknown>) => ({ ...d, b: (d.a as number) + 1 }),
    }
    expect(migrate({ version: 1, data: {} }, chain, 3)).toEqual({ ok: true, data: { a: 1, b: 2 } })
    expect(migrate({ version: 2, data: { a: 5 } }, chain, 3)).toEqual({ ok: true, data: { a: 5, b: 6 } })
    expect(migrate({ version: 1, data: {} }, { 1: (d) => d }, 3)).toMatchObject({ ok: false })
    expect(migrate({ version: 1, data: {} }, { 1: () => { throw new Error('boom') } }, 2)).toMatchObject({ ok: false, error: expect.stringMatching(/boom/) })
  })
  it('manages autosave and 3 manual slots, flags sandbox saves', () => {
    const st = memoryStorage()
    expect(listSlots(st).every((x) => x.empty)).toBe(true)
    const s = newState()
    expect(writeSave(AUTOSAVE_KEY, s, 'Autosave', st)).toBe(true)
    const sb = { ...s, meta: { ...s.meta, sandboxUsed: true } }
    writeSave(slotKey(2), sb, 'Slot', st)
    const slots = listSlots(st)
    expect(slots).toHaveLength(4)
    expect(slots[0]).toMatchObject({ slot: 'auto', empty: false, name: 'Tester' })
    expect(slots[2]).toMatchObject({ slot: 2, sandboxUsed: true })
    expect(readSave(slotKey(2), st).ok).toBe(true)
    deleteSave(slotKey(2), st)
    expect(listSlots(st)[2]!.empty).toBe(true)
    st.setItem(slotKey(1), '{broken')
    expect(listSlots(st)[1]!.corrupt).toBeTruthy()
  })
})
