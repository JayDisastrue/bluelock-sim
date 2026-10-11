import { describe, expect, it } from 'vitest'
import { newState } from '../test/helpers'
import { applyEffects } from './effects'
import { crc32, decodeSaveCode, encodeSaveCode, fromBase64Url, toBase64Url } from './savecode'

describe('save codes', () => {
  const played = applyEffects(newState('street_renegade'), [
    { t: 'shiftRelationship', npc: 'bachira', trust: 33, rivalry: 12 },
    { t: 'setFlag', flag: 'DEVOUR_TARGET:bachira', value: true },
    { t: 'logMemory', verb: 'devoured', target: 'bachira', text: 'You told Bachira that monsters get eaten.' },
    { t: 'scheduleEvent', eventId: 'evt.bachira.invitation', delay: 2 },
  ], 't')

  it('round-trips a game exactly through one pasteable string', async () => {
    const code = await encodeSaveCode(played, 'phone')
    expect(code).toMatch(/^BLEL1\.[0-9a-f]{8}\.[A-Za-z0-9_-]+$/)
    expect(code).not.toMatch(/\s/)
    const r = await decodeSaveCode(code)
    expect(r.ok).toBe(true)
    if (r.ok) { expect(r.save.data).toEqual(played); expect(r.save.label).toBe('phone') }
  })
  it('is compact enough to copy/paste', async () => {
    const code = await encodeSaveCode(played)
    expect(code.length).toBeLessThan(12_000)
  })
  it('tolerates wrapped / padded pastes', async () => {
    const code = await encodeSaveCode(played)
    const wrapped = '  ' + code.replace(/(.{60})/g, '$1\n') + '\n'
    expect((await decodeSaveCode(wrapped)).ok).toBe(true)
  })
  it('rejects truncated, edited and foreign codes with readable errors', async () => {
    const code = await encodeSaveCode(played)
    const cut = await decodeSaveCode(code.slice(0, code.length - 40))
    expect(cut).toMatchObject({ ok: false, error: expect.stringMatching(/Checksum|invalid|decompressed/) })
    const i = code.length - 20
    const edited = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1)
    expect(await decodeSaveCode(edited)).toMatchObject({ ok: false, error: expect.stringMatching(/Checksum/) })
    expect(await decodeSaveCode('hello world')).toMatchObject({ ok: false, error: expect.stringMatching(/not a Blue Lock/) })
    expect(await decodeSaveCode('')).toMatchObject({ ok: false })
  })
  it('helpers: base64url and crc32 are correct', () => {
    const bytes = Uint8Array.from([0, 250, 251, 252, 253, 254, 255, 1, 2])
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926) // standard CRC-32 check value
  })
})
