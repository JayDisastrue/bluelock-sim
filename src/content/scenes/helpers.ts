import type { BeatInput, ChoiceInput, Condition, Emotion, EffectInput, Tone } from '../../engine/schemas'

type LineExtra = Partial<Extract<BeatInput, { t: 'line' }>>

/** Spoken line. */
export const say = (who: string, text: string, emotion?: Emotion, extra: LineExtra = {}): BeatInput => ({ t: 'line', who, text, emotion, ...extra })
/** Protagonist inner monologue. */
export const mono = (text: string, extra: LineExtra = {}): BeatInput => ({ t: 'line', who: 'player', text, mono: true, ...extra })
export const nar = (text: string, extra: Partial<Extract<BeatInput, { t: 'narration' }>> = {}): BeatInput => ({ t: 'narration', text, ...extra })
export const enter = (who: string, side: 'left' | 'center' | 'right', emotion?: Emotion): BeatInput => ({ t: 'enter', who, side, emotion })
export const exit = (who: string): BeatInput => ({ t: 'exit', who })
export const label = (id: string): BeatInput => ({ t: 'label', id })
export const go = (id: string): BeatInput => ({ t: 'goto', label: id })
export const impact = (text: string, style: 'don' | 'zzzt' | 'lock' | 'devour' | 'quiet' = 'don'): BeatInput => ({ t: 'impact', text, style })

export interface ToneOption {
  label: string
  reply: BeatInput[]
  effects?: EffectInput[]
  requires?: Condition
  lockedHint?: string
  hideWhenLocked?: boolean
  reveal?: string
  major?: boolean
  memory?: { verb: string; text: string }
}

/**
 * Builds a tone-driven confrontation: a `choice` beat whose options (keyed by tone) each jump to
 * their own reply block, then rejoin at `${id}_end`. Tone effect models come from engine/tones.ts;
 * `delayed` consequences are attached to every option.
 */
export function toneChoice(
  id: string,
  target: string,
  opts: Partial<Record<Tone, ToneOption>>,
  extra: { prompt?: string; delayed?: ChoiceInput['delayed'] } = {},
): BeatInput[] {
  const entries = Object.entries(opts) as [Tone, ToneOption][]
  const choices: ChoiceInput[] = entries.map(([tone, o]) => ({
    id: tone.toLowerCase(),
    label: o.label,
    tone,
    target,
    requires: o.requires,
    lockedHint: o.lockedHint,
    hideWhenLocked: o.hideWhenLocked,
    effects: o.effects ?? [],
    delayed: extra.delayed ?? [],
    reveal: o.reveal,
    major: o.major,
    memory: o.memory,
    goto: `${id}_${tone.toLowerCase()}`,
  }))
  return [
    { t: 'choice', prompt: extra.prompt, choices },
    ...entries.flatMap(([tone, o]) => [label(`${id}_${tone.toLowerCase()}`), ...o.reply, go(`${id}_end`)]),
    label(`${id}_end`),
  ]
}
