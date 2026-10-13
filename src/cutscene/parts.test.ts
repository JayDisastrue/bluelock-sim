import { describe, expect, it } from 'vitest'
import { PortraitSpec } from '../engine/schemas'
import { BUILTIN, PALETTES, PART_SLOTS, SKIN_NAMES, faceId, faceShapes, normalizePortrait, optionsFor, randomPortrait, randomSkin, randomSlot, setFaceShape, setSkin, skinIndex, usesToneFaces } from './parts'
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
  describe('faces imported per skin tone (<shape>__<tone>)', () => {
    const tones = Object.fromEntries(SKIN_NAMES.map((t) => [t, { default: 'x.png' }]))
    const parts = { face: Object.fromEntries(['oval', 'square'].flatMap((sh) => SKIN_NAMES.map((t) => [`${sh}__${t}`, { default: 'x.png' }]))) }
    it('has one palette tone per name and recognises tone faces', () => {
      expect(SKIN_NAMES).toHaveLength(PALETTES.skin.length)
      expect(usesToneFaces(parts)).toBe(true)
      expect(usesToneFaces({ face: { oval: { default: 'x.png' } } })).toBe(false)
      expect(Object.keys(tones)).toHaveLength(8)
      expect(faceShapes(parts)).toEqual(['oval', 'square'])
    })
    it('the skin swatch and the shape picker both drive the face file', () => {
      const a = setSkin(DEFAULT_PORTRAIT, PALETTES.skin[5]!, parts)
      expect(a.face).toBe(`oval__${SKIN_NAMES[5]}`)
      expect(setFaceShape(a, 'square', parts).face).toBe(`square__${SKIN_NAMES[5]}`)
      expect(faceId('oval', '#6b4630')).toBe('oval__ebony')
      expect(skinIndex('#fbe0c9')).toBe(1)
    })
    it('normalize maps the default look onto an offered tone face and keeps skin in the palette', () => {
      const n = normalizePortrait(DEFAULT_PORTRAIT, parts)
      expect(n.face).toBe('oval__light')
      expect(PALETTES.skin).toContain(n.skin)
      expect(normalizePortrait(n, parts)).toBe(n)
    })
    it('random looks and dice keep skin and face file in step', () => {
      const rand = seeded(11)
      for (let i = 0; i < 100; i++) {
        const p = randomPortrait(rand, parts)
        expect(p.face).toBe(faceId(p.face.split('__')[0]!, p.skin))
        const q = randomSkin(randomSlot(p, 'face', rand, parts), rand, parts)
        expect(q.face).toBe(faceId(q.face.split('__')[0]!, q.skin))
        expect(optionsFor('face', parts).some((o) => o.id === q.face)).toBe(true)
      }
    })
  })
})
