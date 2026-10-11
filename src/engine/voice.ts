/**
 * Voice-over convention. Every spoken line has a stable id, `<scriptId>:<beatIndex>`.
 * To voice a line, drop an audio file at  public/assets/voice/<id with ":" → "_">.mp3
 * e.g. opening.main:23  →  public/assets/voice/opening.main_23.mp3
 * Origin-specific wording has its own slot:  …_23@fallen_ace.mp3 (checked before the generic file).
 * Files can also be mapped explicitly under "voice" in manifest.json (id → path), any format the browser plays.
 * Run `npm run assets:scan` after adding files: it indexes public/assets/voice into manifest.json (the game only plays
 * indexed files, so nothing is probed and a public host logs no 404s).
 * `npm run voice:export` writes docs/voice-script.csv listing every id, speaker and text.
 */
export const voiceFile = (lineId: string, origin?: string): string =>
  `voice/${lineId.replace(/[:/\\]/g, '_')}${origin ? `@${origin}` : ''}.mp3`

/** Manifest key for a voice file: its file name without extension. */
export const voiceKey = (lineId: string, origin?: string): string => voiceFile(lineId, origin).replace(/^voice\//, '').replace(/\.mp3$/, '')

export interface VoiceBanks {
  [character: string]: { default?: string[] } & Partial<Record<string, string[]>>
}

/**
 * Picks a random clip from a character's voice bank (grunts, laughs, "hm"...). Prefers the bank for the line's emotion,
 * falls back to the character's default bank. Never repeats `last` when there is an alternative.
 */
export function pickBankClip(banks: VoiceBanks | undefined, who: string, emotion: string | undefined, last: string | undefined, rand: () => number): string | undefined {
  const bank = banks?.[who]
  const pool = (emotion && bank?.[emotion]?.length ? bank[emotion] : bank?.default) ?? []
  if (pool.length === 0) return undefined
  const options = pool.length > 1 ? pool.filter((f) => f !== last) : pool
  return options[Math.floor(rand() * options.length)]
}
