import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BG_IDS } from '../engine/schemas'
import { content } from '.'
import { BG_GROUPS, MUSIC_IDS, ROSTER, SFX_IDS, TEAM_IDS } from './reserved'

describe('reserved ids', () => {
  it('roster ids are unique snake_case and cover every character in the game', () => {
    const ids = ROSTER.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of ROSTER) { expect(r.id).toMatch(/^[a-z][a-z0-9_]*$/); expect(r.name.length).toBeGreaterThan(1); expect(['canon', 'original']).toContain(r.group) }
    for (const id of Object.keys(content.characters)) expect(ids, `${id} missing from roster.json`).toContain(id)
    for (const ch of Object.values(content.characters)) expect(ROSTER.find((r) => r.id === ch.id)?.group).toBe(ch.kind)
    expect(ROSTER.filter((r) => r.group === 'canon').length).toBeGreaterThanOrEqual(40)
    expect(ROSTER.filter((r) => r.group === 'original').length).toBeGreaterThanOrEqual(30)
  })
  it('background ids are unique and the asset scanner knows exactly the same list', () => {
    expect(new Set(BG_IDS).size).toBe(BG_IDS.length)
    expect(BG_IDS.length).toBeGreaterThanOrEqual(60)
    const m = readFileSync('scripts/scan-assets.mjs', 'utf8').match(/const BG_IDS = \[([^\]]*)\]/)!
    expect([...m[1]!.matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1])).toEqual([...BG_IDS])
  })
  it('background groups cover every id exactly once', () => {
    const grouped = Object.values(BG_GROUPS).flat()
    expect(grouped.sort()).toEqual([...BG_IDS].sort())
  })
  it('sound and team ids are unique', () => {
    for (const list of [MUSIC_IDS, SFX_IDS, TEAM_IDS]) expect(new Set(list).size).toBe(list.length)
  })
})
