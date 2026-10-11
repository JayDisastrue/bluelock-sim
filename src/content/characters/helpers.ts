import { CharacterSchema, type CharacterInput, type PortraitSpec } from '../../engine/schemas'

type Hair = PortraitSpec['hair']
type Eyes = PortraitSpec['eyes']
type Brow = PortraitSpec['brow']

/** Compact portrait spec builder: P(hair, hairColor, skin, eyes, eyeColor, brow, kit, accent, build?, mark?) */
export const P = (
  hair: Hair, hairColor: string, skin: string, eyes: Eyes, eyeColor: string, brow: Brow,
  kit: string, accent: string, build: PortraitSpec['build'] = 'mid', mark: PortraitSpec['mark'] = 'none',
): PortraitSpec => ({ hair, hairColor, skin, eyes, eyeColor, brow, kit, accent, build, mark })

export const defineChars = (defs: CharacterInput[]) => defs.map((d) => CharacterSchema.parse(d))
