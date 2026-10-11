import { evalCond, describeCond } from '../engine/conditions'
import { canAfford, costEffects, describeCost } from '../engine/effects'
import { buildRipple } from '../engine/ripple'
import { step } from '../engine/rng'
import type { Aura, Beat, BgId, Choice, Effect, Emotion, RippleEntry, Side } from '../engine/schemas'
import { renderText } from '../engine/text'
import { effectiveCost, toneEffects } from '../engine/tones'
import type { ContentDB, GameAPI } from '../engine/types'

export interface StageActor {
  who: string
  side: Side
  emotion: Emotion
  aura: Aura | null
}

export interface ChoiceView {
  choice: Choice
  available: boolean
  /** why it's locked (shown on the button) */
  reason?: string
  costLabel?: string
}

export type Blocking =
  | { t: 'line'; id: string; who: string; text: string; emotion: Emotion; side: Side; aura: Aura | null; mono: boolean }
  | { t: 'narration'; text: string }
  | { t: 'panel'; layout: 'strip3' | 'grid4' | 'wideTop'; cells: Extract<Beat, { t: 'panel' }>['cells'] }
  | { t: 'impact'; text: string; style: 'don' | 'zzzt' | 'lock' | 'devour' | 'quiet' }
  | { t: 'choice'; prompt?: string; choices: ChoiceView[] }
  | { t: 'timedChoice'; prompt?: string; seconds: number; defaultChoiceId: string; choices: ChoiceView[] }
  | { t: 'cutIn'; left: { who: string; emotion: Emotion; aura: Aura | null }; right?: { who: string; emotion: Emotion; aura: Aura | null }; text?: string }
  | { t: 'wait'; ms: number }

export interface LogEntry {
  kind: 'line' | 'narration' | 'choice' | 'impact'
  who?: string
  text: string
  mono?: boolean
}

export interface FxEvent {
  id: number
  kind: 'shake' | 'flash'
  value: number | string
}

interface Frame {
  scriptId: string
  index: number
}

const TONE_VERB: Record<string, string> = { Provoke: 'provoked', Analyze: 'read', Ignore: 'ignored', Devour: 'devoured', Support: 'supported' }
const MAX_STEPS = 10_000

/**
 * Interprets a script against a GameAPI. Non-blocking beats (flags, labels, branches, stage changes) run
 * immediately; the runner stops on the next *blocking* beat (a line, panel, choice…) and exposes it as `current`.
 * The UI calls `advance()` to move on, or `choose()` for choice beats.
 */
export class CutsceneRunner {
  private stack: Frame[] = []
  stage: StageActor[] = []
  bg: BgId = 'black'
  music: string | undefined
  vision = false
  current: Blocking | null = null
  log: LogEntry[] = []
  done = false
  /** ripple produced by the last choice, waiting for the UI to show it */
  ripple: RippleEntry | null = null
  fx: FxEvent[] = []
  private fxSeq = 0
  /** bumps whenever anything visible changed, so the UI can re-render cheaply */
  version = 0
  private rawChoiceBeat: Extract<Beat, { t: 'choice' | 'timedChoice' }> | null = null

  constructor(
    readonly scriptId: string,
    private api: GameAPI,
    private content: ContentDB,
  ) {
    const script = content.scripts[scriptId]
    if (!script) throw new Error(`Unknown script "${scriptId}"`)
    if (script.bg) this.bg = script.bg
    if (script.music) this.music = script.music
    this.enterScript(scriptId)
    this.run()
  }

  // ── public controls ──
  advance(): void {
    if (this.done || !this.current) return
    if (this.current.t === 'choice' || this.current.t === 'timedChoice') return // must choose
    this.top().index++
    this.current = null
    this.run()
  }

  dismissRipple(): void {
    this.ripple = null
    this.version++
  }

  /** Resolve a choice (or the default of a timed choice when `timedOut`). Returns false if it can't be taken. */
  choose(choiceId: string, timedOut = false): boolean {
    const cur = this.current
    const beat = this.rawChoiceBeat
    if (!cur || !beat || (cur.t !== 'choice' && cur.t !== 'timedChoice')) return false
    let view = cur.choices.find((c) => c.choice.id === choiceId)
    if (!view || !view.available) {
      if (!timedOut) return false
      view = cur.choices.find((c) => c.available) // timed default isn't takeable: first available instead
      if (!view) return false
    }
    const choice = view.choice
    const before = this.api.get()
    const source = `scene:${this.currentScriptId()}:${choice.id}`

    const effects: Effect[] = [...costEffects(effectiveCost(choice))]
    if (timedOut && beat.t === 'timedChoice') effects.push(...beat.timeoutEffects)
    if (choice.tone) effects.push(...toneEffects(before, this.content, choice.tone, choice.target))
    effects.push(...choice.effects)
    for (const d of choice.delayed) effects.push({ t: 'scheduleEvent', eventId: d.eventId, delay: this.resolveDelay(d) })
    const mem = this.memoryFor(choice, timedOut)
    if (mem) effects.push({ t: 'logMemory', verb: mem.verb, target: choice.target, text: mem.text })

    this.api.apply(effects, source)
    const after = this.api.get()
    const ripple = buildRipple(before, after, this.content, {
      id: after.meta.nextId,
      source,
      choice,
      cast: [...this.stage.map((a) => a.who), ...(choice.target ? [choice.target] : [])].filter((w) => w !== 'player'),
    })
    if (ripple) {
      this.api.pushRipple(ripple)
      if (choice.major) this.ripple = ripple
    }

    this.log.push({ kind: 'choice', text: renderText(choice.label, after, this.content) })
    const frame = this.top()
    frame.index++
    if (choice.goto) frame.index = this.labelIndex(frame.scriptId, choice.goto)
    this.current = null
    this.rawChoiceBeat = null
    this.run()
    return true
  }

  // ── internals ──
  private top(): Frame {
    return this.stack[this.stack.length - 1]!
  }
  private currentScriptId(): string {
    return this.top()?.scriptId ?? this.scriptId
  }
  private beats(scriptId: string): Beat[] {
    return this.content.scripts[scriptId]!.beats
  }
  private enterScript(scriptId: string) {
    if (!this.content.scripts[scriptId]) throw new Error(`Unknown script "${scriptId}"`)
    this.stack.push({ scriptId, index: 0 })
    this.api.markSeen(scriptId)
  }
  private labelIndex(scriptId: string, label: string): number {
    const i = this.beats(scriptId).findIndex((b) => b.t === 'label' && b.id === label)
    if (i < 0) throw new Error(`Script ${scriptId}: missing label "${label}"`)
    return i
  }
  private pushFx(kind: FxEvent['kind'], value: number | string) {
    this.fx = [...this.fx, { id: ++this.fxSeq, kind, value }].slice(-8)
  }
  private resolveDelay(d: { eventId: string; delay: number | [number, number] }): number {
    if (typeof d.delay === 'number') return d.delay
    const [min, max] = d.delay
    // deterministic, derived from the state's RNG without consuming it
    let h = 0
    for (const ch of d.eventId) h = (h * 31 + ch.charCodeAt(0)) | 0
    const [r] = step((this.api.get().meta.rng ^ h) | 0)
    return min + Math.floor(r * (max - min + 1))
  }
  private memoryFor(choice: Choice, timedOut: boolean): { verb: string; text: string } | null {
    if (choice.memory) return choice.memory
    if (!choice.tone) return null
    const verb = TONE_VERB[choice.tone] ?? choice.tone.toLowerCase()
    const who = choice.target ? (this.content.characters[choice.target]?.short ?? choice.target) : 'the room'
    return { verb, text: `You ${timedOut ? 'froze, then ' : ''}${verb} ${who}.` }
  }
  private pick(variants: Partial<Record<string, string>> | undefined, text: string): string {
    const origin = this.api.get().player.origin
    return renderText(variants?.[origin] ?? text, this.api.get(), this.content)
  }
  private actorAt(who: string): StageActor | undefined {
    return this.stage.find((a) => a.who === who)
  }
  private place(who: string, side: Side, emotion?: Emotion, aura?: Aura | null) {
    this.stage = this.stage.filter((a) => a.who !== who && a.side !== side)
    this.stage.push({ who, side, emotion: emotion ?? 'neutral', aura: aura ?? null })
  }
  private view(c: Choice): ChoiceView {
    const state = this.api.get()
    const cost = effectiveCost(c)
    const reqOk = evalCond(state, c.requires)
    const afford = canAfford(state, cost)
    const costLabel = describeCost(cost)
    if (!reqOk) return { choice: c, available: false, reason: c.lockedHint ?? `Requires ${describeCond(c.requires!)}`, costLabel }
    if (!afford) return { choice: c, available: false, reason: `Not enough ${costLabel}`, costLabel }
    return { choice: c, available: true, costLabel }
  }
  private choiceViews(beat: Extract<Beat, { t: 'choice' | 'timedChoice' }>): ChoiceView[] {
    const state = this.api.get()
    return beat.choices
      .filter((c) => !(c.hideWhenLocked && !evalCond(state, c.requires)))
      .map((c) => this.view(c))
  }

  /** Runs non-blocking beats until a blocking one is reached or the script ends. */
  private run(): void {
    let guard = 0
    while (!this.done) {
      if (++guard > MAX_STEPS) throw new Error(`Script "${this.scriptId}" exceeded ${MAX_STEPS} steps (infinite goto loop?)`)
      const frame = this.stack[this.stack.length - 1]
      if (!frame) {
        this.done = true
        break
      }
      const beats = this.beats(frame.scriptId)
      const beat = beats[frame.index]
      if (!beat) {
        this.stack.pop()
        if (this.stack.length > 0) this.top().index++ // return past the `run` beat
        continue
      }
      if ('when' in beat && beat.when && !evalCond(this.api.get(), beat.when)) {
        frame.index++
        continue
      }
      if (this.exec(beat, frame)) break
    }
    this.version++
  }

  /** returns true when the beat blocks (becomes `current`) */
  private exec(beat: Beat, frame: Frame): boolean {
    const state = () => this.api.get()
    switch (beat.t) {
      case 'line': {
        const existing = this.actorAt(beat.who)
        const side: Side = beat.side ?? existing?.side ?? (beat.who === 'player' ? 'left' : 'right')
        const emotion: Emotion = beat.emotion ?? existing?.emotion ?? 'neutral'
        const aura = beat.aura !== undefined ? beat.aura : (existing?.aura ?? null)
        if (!beat.mono || beat.who !== 'player') this.place(beat.who, side, emotion, aura)
        const text = this.pick(beat.variants, beat.text)
        this.current = { t: 'line', id: `${frame.scriptId}:${frame.index}`, who: beat.who, text, emotion, side, aura, mono: !!beat.mono }
        this.log.push({ kind: 'line', who: beat.who, text, mono: beat.mono })
        return true
      }
      case 'narration': {
        const text = this.pick(beat.variants, beat.text)
        this.current = { t: 'narration', text }
        this.log.push({ kind: 'narration', text })
        return true
      }
      case 'panel':
        this.current = { t: 'panel', layout: beat.layout, cells: beat.cells }
        return true
      case 'impact':
        this.current = { t: 'impact', text: beat.text, style: beat.style }
        this.log.push({ kind: 'impact', text: beat.text })
        return true
      case 'choice':
        this.rawChoiceBeat = beat
        this.current = { t: 'choice', prompt: beat.prompt ? renderText(beat.prompt, state(), this.content) : undefined, choices: this.choiceViews(beat) }
        return true
      case 'timedChoice':
        this.rawChoiceBeat = beat
        this.current = {
          t: 'timedChoice',
          prompt: beat.prompt ? renderText(beat.prompt, state(), this.content) : undefined,
          seconds: beat.seconds,
          defaultChoiceId: beat.defaultChoiceId,
          choices: this.choiceViews(beat),
        }
        return true
      case 'cutIn':
        this.current = {
          t: 'cutIn',
          left: { who: beat.left.who, emotion: beat.left.emotion ?? 'neutral', aura: beat.left.aura ?? null },
          right: beat.right ? { who: beat.right.who, emotion: beat.right.emotion ?? 'neutral', aura: beat.right.aura ?? null } : undefined,
          text: beat.text ? renderText(beat.text, state(), this.content) : undefined,
        }
        return true
      case 'wait':
        this.current = { t: 'wait', ms: beat.ms }
        return true
      case 'shake':
        this.pushFx('shake', beat.intensity)
        break
      case 'flash':
        this.pushFx('flash', beat.color)
        break
      case 'bgChange':
        this.bg = beat.bg
        break
      case 'music':
        this.music = beat.track
        break
      case 'setFlag':
        this.api.apply([{ t: 'setFlag', flag: beat.flag, value: beat.value }], `scene:${frame.scriptId}`)
        break
      case 'effects':
        this.api.apply(beat.effects, `scene:${frame.scriptId}`)
        break
      case 'enter':
        this.place(beat.who, beat.side, beat.emotion, beat.aura)
        break
      case 'exit':
        this.stage = this.stage.filter((a) => a.who !== beat.who)
        break
      case 'aura': {
        const a = this.actorAt(beat.who)
        if (a) a.aura = beat.aura
        else this.stage.push({ who: beat.who, side: beat.who === 'player' ? 'left' : 'right', emotion: 'neutral', aura: beat.aura })
        break
      }
      case 'vision':
        this.vision = beat.on
        break
      case 'label':
        break
      case 'goto':
        frame.index = this.labelIndex(frame.scriptId, beat.label)
        return false
      case 'branch': {
        const hit = beat.cases.find((c) => evalCond(state(), c.when))
        const target = hit?.goto ?? beat.else
        if (target) {
          frame.index = this.labelIndex(frame.scriptId, target)
          return false
        }
        break
      }
      case 'run':
        this.enterScript(beat.script)
        return false
    }
    frame.index++
    return false
  }
}
