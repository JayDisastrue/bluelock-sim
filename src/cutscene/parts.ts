import type { Manifest } from '../assets'
import { ACCESSORY_IDS, BROW_IDS, EYE_IDS, FACE_IDS, HAIR_IDS, MARK_IDS, NOSE_IDS, type PortraitSpec } from '../engine/schemas'

export const PART_SLOTS = ['face', 'hair', 'eyes', 'brow', 'nose', 'mark', 'accessory'] as const
export type PartSlot = (typeof PART_SLOTS)[number]

export const SLOT_LABEL: Record<PartSlot, string> = {
  face: 'Face shape', hair: 'Hair', eyes: 'Eyes', brow: 'Eyebrows', nose: 'Nose', mark: 'Marks', accessory: 'Accessory',
}

export const BUILTIN: Record<PartSlot, readonly string[]> = {
  face: FACE_IDS, hair: HAIR_IDS, eyes: EYE_IDS, brow: BROW_IDS, nose: NOSE_IDS, mark: MARK_IDS, accessory: ACCESSORY_IDS,
}

export const PALETTES = {
  skin: ['#fde3cf', '#fbe0c8', '#f0d0b0', '#e5bd96', '#d6a07a', '#c08a63', '#9a6a48', '#6b4630'],
  hairColor: ['#14141a', '#2a2420', '#3b2a1f', '#6a4a2a', '#a8743a', '#c9a64a', '#e9d27a', '#d9d9e3', '#b0463c', '#8a1f3a', '#8a5aa8', '#1f6bff', '#2a8a5a', '#e5233b'],
  eyeColor: ['#14141a', '#4a3a2a', '#6a4a2a', '#2a6a4a', '#2a4a8a', '#6aa0ff', '#c9a227', '#7a1f1f', '#8a5aa8', '#9fa6b8'],
  kit: ['#1f6bff', '#e5233b', '#2a8a5a', '#101014', '#f2efe6', '#8a5aa8', '#e5a23b', '#1fa2a2', '#ff7a3b', '#3a4468'],
  accent: ['#ffffff', '#f5d142', '#e5233b', '#6ea0ff', '#101014', '#4fd18b'],
} as const

export const optionLabel = (id: string) => id.replace(/_/g, ' ')

export interface PartOption {
  id: string
  /** this id also exists as a drawn fallback */
  builtin: boolean
  /** has an imported image */
  image: boolean
}

/**
 * Image-first: once ANY image is imported for a slot (public/assets/player/<slot>/<id>.png), only the imported images are
 * offered for that slot and the drawn fallbacks disappear. A slot with no images yet falls back to the drawn built-ins.
 */
export function optionsFor(slot: PartSlot, parts: Manifest['playerParts']): PartOption[] {
  const imported = Object.keys(parts?.[slot] ?? {})
  if (imported.length > 0) return imported.map((id) => ({ id, builtin: BUILTIN[slot].includes(id), image: true }))
  return BUILTIN[slot].map((id) => ({ id, builtin: true, image: false }))
}

/** Replaces any part id that isn't offered any more (e.g. the default drawn hair once hair images exist) with the first offered one. */
export function normalizePortrait(spec: PortraitSpec, parts: Manifest['playerParts']): PortraitSpec {
  let out = spec
  for (const slot of PART_SLOTS) {
    const opts = optionsFor(slot, parts)
    if (!opts.some((o) => o.id === spec[slot])) out = { ...out, [slot]: (opts.find((o) => o.id === 'none') ?? opts[0])!.id }
  }
  return out
}

const pick = <T,>(xs: readonly T[], rand: () => number): T => xs[Math.min(xs.length - 1, Math.floor(rand() * xs.length))]!

/** A fully random look, mixing every slot (imported ids included). */
export function randomPortrait(rand: () => number = Math.random, parts?: Manifest['playerParts']): PortraitSpec {
  const one = (slot: PartSlot) => pick(optionsFor(slot, parts), rand).id
  return {
    skin: pick(PALETTES.skin, rand),
    face: one('face'),
    hair: one('hair'),
    hairColor: pick(PALETTES.hairColor, rand),
    eyes: one('eyes'),
    eyeColor: pick(PALETTES.eyeColor, rand),
    brow: one('brow'),
    nose: one('nose'),
    kit: pick(PALETTES.kit, rand),
    accent: pick(PALETTES.accent, rand),
    build: pick(['lean', 'mid', 'broad'] as const, rand),
    // most players have no special mark/accessory: keep the dice from cluttering every face
    mark: rand() < 0.6 ? 'none' : one('mark'),
    accessory: rand() < 0.7 ? 'none' : one('accessory'),
  }
}

export function randomSlot(spec: PortraitSpec, slot: PartSlot, rand: () => number = Math.random, parts?: Manifest['playerParts']): PortraitSpec {
  return { ...spec, [slot]: pick(optionsFor(slot, parts), rand).id }
}
