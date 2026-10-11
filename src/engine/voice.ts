/**
 * Voice-over convention. Every spoken line has a stable id, `<scriptId>:<beatIndex>`.
 * To voice a line, drop an audio file at  public/assets/voice/<id with ":" → "_">.mp3
 * e.g. opening.main:23  →  public/assets/voice/opening.main_23.mp3
 * Origin-specific wording has its own slot:  …_23@fallen_ace.mp3 (checked before the generic file).
 * Files can also be mapped explicitly under "voice" in manifest.json (id → path), any format the browser plays.
 * `npm run voice:export` writes docs/voice-script.csv listing every id, speaker and text.
 */
export const voiceFile = (lineId: string, origin?: string): string =>
  `voice/${lineId.replace(/[:/\\]/g, '_')}${origin ? `@${origin}` : ''}.mp3`
