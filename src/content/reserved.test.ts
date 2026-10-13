import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BG_IDS } from '../engine/schemas'
import { content } from '.'
import { AMBIENCE_IDS, BG_GROUPS, CANON_ARC_IDS, ITEM_IDS, MUSIC_IDS, ROSTER, ROSTER_GROUPS, SFX_IDS, TEAMS, TEAM_IDS, fillerIds, isFillerId } from './reserved'

describe('reserved roster', () => {
  it('ids are unique snake_case and cover every character in the game with the right kind', () => {
    const ids = ROSTER.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of ROSTER) { expect(r.id).toMatch(/^[a-z][a-z0-9_]*$/); expect(r.id).not.toMatch(/_fill_\d\d$/); expect(r.name.length).toBeGreaterThan(1) }
    for (const ch of Object.values(content.characters)) {
      const r = ROSTER.find((x) => x.id === ch.id)
      expect(r, `${ch.id} missing from roster.json`).toBeTruthy()
      expect(r!.group).toBe(ch.kind)
    }
  })
  it('is big enough for full squads, staff and officials', () => {
    expect(ROSTER.filter((r) => r.group === 'canon').length).toBeGreaterThanOrEqual(200)
    expect(ROSTER.filter((r) => r.group === 'original').length).toBeGreaterThanOrEqual(250)
    for (const reg of ['staff', 'officials', 'media', 'sponsor', 'family']) expect(ROSTER.some((r) => r.region === reg), reg).toBe(true)
    expect(TEAMS.length).toBeGreaterThanOrEqual(130)
  })
  it('teams and groups are consistent', () => {
    expect(new Set(TEAM_IDS).size).toBe(TEAM_IDS.length)
    const groups = new Set(ROSTER_GROUPS.map((g) => g.id))
    for (const r of ROSTER) {
      for (const t of r.teams) expect(TEAM_IDS, `${r.id} -> ${t}`).toContain(t)
      for (const g of r.groups ?? []) expect(groups.has(g), `${r.id} -> ${g}`).toBe(true)
    }
    for (const t of TEAMS) {
      const named = ROSTER.filter((r) => r.teams.includes(t.id) && !['staff', 'officials', 'media', 'sponsor', 'family'].includes(r.region)).length
      expect(t.named, t.id).toBe(named)
      expect(t.filler, t.id).toBe(Math.max(0, t.squad - named))
    }
    for (const id of ['team_z', 'team_v', 'team_w', 'team_x', 'team_y', 'bastard_munchen', 'ubers', 'manshine_city', 'fc_barcha', 'paris_x_gen', 'japan_u20']) {
      const t = TEAMS.find((x) => x.id === id)!
      expect(t.named, id).toBeGreaterThanOrEqual(t.squad)
    }
  })
  it('filler ids are generated per team and recognised', () => {
    const t = TEAMS.find((x) => x.filler > 0)!
    const ids = fillerIds(t.id)
    expect(ids).toHaveLength(t.filler)
    expect(ids[0]).toBe(`${t.id}_fill_01`)
    expect(isFillerId(ids[0]!)).toBe(true)
    expect(isFillerId(`${t.id}_fill_${String(t.filler + 1).padStart(2, '0')}`)).toBe(false)
    expect(isFillerId('isagi')).toBe(false)
  })
})

describe('reserved ids', () => {
  it('background ids are unique, grouped exactly once, and the asset scanner knows the same list', () => {
    expect(new Set(BG_IDS).size).toBe(BG_IDS.length)
    expect(BG_IDS.length).toBeGreaterThanOrEqual(120)
    expect(Object.values(BG_GROUPS).flat().sort()).toEqual([...BG_IDS].sort())
    const m = readFileSync('scripts/scan-assets.mjs', 'utf8').match(/const BG_IDS = \[([^\]]*)\]/)!
    expect([...m[1]!.matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1])).toEqual([...BG_IDS])
  })
  it('sound, arc and item ids are unique', () => {
    for (const list of [MUSIC_IDS, SFX_IDS, AMBIENCE_IDS, CANON_ARC_IDS, ITEM_IDS]) expect(new Set(list).size).toBe(list.length)
    expect(MUSIC_IDS.length).toBeGreaterThanOrEqual(60)
    expect(SFX_IDS.length).toBeGreaterThanOrEqual(85)
  })
})
