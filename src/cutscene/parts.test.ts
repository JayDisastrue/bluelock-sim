import { describe, expect, it } from 'vitest'
import { PortraitSpec } from '../engine/schemas'
import { BUILTIN, PART_SLOTS, normalizePortrait, optionsFor, randomPortrait, randomSlot } from './parts'
import { DEFAULT_PORTRAIT } from './previewPlayer'

const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }

describe('player parts catalog', () => {
  it('offers a large, duplicate-free selection per slot', () => {
    for (const slot of PART_SLOTS) expect(new Set(BUILTIN[slot]).size).toBe(BUILTIN[slot].length)
    expect(BUILTIN.hair.length).toBeGreaterThanOrEqual(16)
    expect(BUILTIN.eyes.length).toBeGreaterThanOrEqual(8)
    expect(BUILTIN.face.length).toBeGreaterThanOrEqual(6)
  })
  it('randomPortrait always produces a schema-valid spec built from real options', () => {
    const rand = seeded(7)
    for (let i = 0; i < 200; i++) {
      const p = randomPortrait(rand)
      expect(PortraitSpec.safeParse(p).success).toBe(true)
      for (const slot of PART_SLOTS) expect(BUILTIN[slot]).toContain(p[slot])
    }
  })
  it('the dice actually vary the result', () => {
    const rand = seeded(3)
    const hairs = new Set(Array.from({ length: 60 }, () => randomSlot(DEFAULT_PORTRAIT, 'hair', rand).hair))
    expect(hairs.size).toBeGreaterThan(8)
  })
  it('image-first: importing any image for a slot hides the drawn options for that slot only', () => {
    const parts = { hair: { spiky: { default: 'player/hair/spiky.png' }, mohican_red: { default: 'player/hair/mohican_red.png' } } }
    const hair = optionsFor('hair', parts)
    expect(hair.map((o) => o.id)).toEqual(['spiky', 'mohican_red'])
    expect(hair.find((o) => o.id === 'spiky')).toMatchObject({ builtin: true, image: true })
    expect(hair.find((o) => o.id === 'mohican_red')).toMatchObject({ builtin: false, image: true })
    expect(optionsFor('eyes', parts).length).toBe(BUILTIN.eyes.length) // no eye images yet: drawn fallback
    const seen = new Set(Array.from({ length: 200 }, (_, i) => randomPortrait(seeded(i + 1), parts).hair))
    expect([...seen].sort()).toEqual(['mohican_red', 'spiky'])
  })
  it('normalizePortrait swaps ids that are no longer offered', () => {
    const parts = { hair: { mohican_red: { default: 'x.png' } }, mark: { scar_a: { default: 'y.png' } } }
    const n = normalizePortrait(DEFAULT_PORTRAIT, parts)
    expect(n.hair).toBe('mohican_red')
    expect(n.mark).toBe('scar_a')
    expect(n.eyes).toBe(DEFAULT_PORTRAIT.eyes)
    expect(normalizePortrait(n, parts)).toEqual(n)
  })
  it('older saves without the new part fields still load (defaults fill in)', () => {
    const old = { skin: '#f0d0b0', hair: 'spiky', hairColor: '#111', eyes: 'sharp', eyeColor: '#222', brow: 'straight', kit: '#1f6bff', accent: '#fff', build: 'mid', mark: 'none' }
    expect(PortraitSpec.parse(old)).toMatchObject({ face: 'oval', nose: 'straight', accessory: 'none' })
  })
})
