import { CharacterSchema, type CharacterInput, type PortraitSpec } from '../../engine/schemas'

type Hair = string
type Eyes = string
type Brow = string

/** Compact portrait spec builder: P(hair, hairColor, skin, eyes, eyeColor, brow, kit, accent, build?, mark?) */
export const P = (
  hair: Hair, hairColor: string, skin: string, eyes: Eyes, eyeColor: string, brow: Brow,
  kit: string, accent: string, build: PortraitSpec['build'] = 'mid', mark = 'none',
): PortraitSpec => ({ hair, hairColor, skin, eyes, eyeColor, brow, kit, accent, build, mark, face: 'oval', nose: 'straight', accessory: 'none' })

export const defineChars = (defs: CharacterInput[]) => defs.map((d) => CharacterSchema.parse(d))
