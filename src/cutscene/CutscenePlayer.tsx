import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { content } from '../content'
import { music, play, voice } from '../audio'
import { useMeta } from '../engine/meta'
import { useSettings } from '../engine/settings'
import type { GameAPI } from '../engine/types'
import { parseEmphasis } from '../engine/text'
import { TONE_GLYPH } from '../engine/tones'
import { Background } from './Backgrounds'
import { Portrait } from './Portrait'
import { RippleCard } from './RippleCard'
import { CutsceneRunner, type Blocking, type ChoiceView } from './runner'
import { useGame } from '../engine/store'
import './cutscene.css'

const SPEED_CPS = { slow: 28, normal: 55, fast: 110, instant: Infinity } as const

/** Renders the typed part visibly and the rest invisibly, so the line keeps its final size from the first character. */
function Emphasized({ text, shown }: { text: string; shown: number }) {
  const runs = parseEmphasis(text)
  const starts = runs.reduce<number[]>((acc, _r, i) => [...acc, i === 0 ? 0 : acc[i - 1]! + runs[i - 1]!.text.length], [])
  return (
    <>
      {runs.map((r, i) => {
        const n = Math.max(0, Math.min(r.text.length, shown - starts[i]!))
        const inner = <>{r.text.slice(0, n)}{n < r.text.length && <span className="ghost">{r.text.slice(n)}</span>}</>
        return r.em ? <span className="em" key={i}>{inner}</span> : <span key={i}>{inner}</span>
      })}
    </>
  )
}

/** Typewriter. Callers key the component per line, so state starts fresh for every line. */
function useTypewriter(text: string, cps: number, active: boolean) {
  const total = parseEmphasis(text).reduce((n, r) => n + r.text.length, 0)
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    if (!active || cps === Infinity) return
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const n = Math.min(total, Math.floor(((performance.now() - t0) / 1000) * cps))
      setTyped(n)
      if (n >= total) window.clearInterval(id)
    }, 16)
    return () => window.clearInterval(id)
  }, [cps, total, active])
  const shown = cps === Infinity ? total : Math.min(typed, total)
  return { shown, total, complete: () => setTyped(total), done: shown >= total }
}

interface TypedProps {
  cps: number
  active: boolean
  onTypedChange: (done: boolean) => void
  completeRef: React.MutableRefObject<(() => void) | null>
}

/** Keyed per line by its parent so the typewriter restarts, while the box around it stays put. */
function TypedText({ text, cps, active, onTypedChange, completeRef }: TypedProps & { text: string }) {
  const tw = useTypewriter(text, cps, active)
  useEffect(() => { completeRef.current = tw.complete }, [tw.complete, completeRef])
  useEffect(() => { onTypedChange(tw.done) }, [tw.done, onTypedChange])
  return <Emphasized text={text} shown={tw.shown} />
}

function DialogueBox({ b, playerName, typed, ...rest }: TypedProps & { b: Extract<Blocking, { t: 'line' }>; playerName: string; typed: boolean }) {
  const name = b.who === 'player' ? playerName : (content.characters[b.who]?.short ?? b.who)
  return (
    <div className={`dialogue ${b.mono ? 'mono' : ''}`} role="log" aria-live="polite">
      <div className="nametag"><span>{b.mono ? `${name} · thinking` : name}</span></div>
      <div className="text"><TypedText key={b.id} text={b.text} {...rest} /></div>
      {typed && <div className="next" aria-hidden>▼</div>}
    </div>
  )
}

function NarrationBox({ text, typed, ...rest }: TypedProps & { text: string; typed: boolean }) {
  return (
    <div className="narration" role="log" aria-live="polite">
      <TypedText key={text} text={text} {...rest} />
      {typed && <span className="next" aria-hidden>▼</span>}
    </div>
  )
}

function ImpactCard({ b, fast, onDone }: { b: Extract<Blocking, { t: 'impact' }>; fast: boolean; onDone: () => void }) {
  useEffect(() => {
    void play('don')
    const id = window.setTimeout(onDone, fast ? 250 : b.style === 'quiet' ? 1400 : 1150)
    return () => window.clearTimeout(id)
  }, [b, fast, onDone])
  return (
    <div className={`impact ${b.style}`} data-testid="impact">
      <div className="rays" />
      <div className="big">{b.text}</div>
    </div>
  )
}

function PanelSequence({ b, bg, fast, revealed, setRevealed }: { b: Extract<Blocking, { t: 'panel' }>; bg: string; fast: boolean; revealed: number; setRevealed: (n: number) => void }) {
  const n = b.cells.length
  useEffect(() => {
    if (fast) { setRevealed(n); return }
    if (revealed >= n) return
    const id = window.setTimeout(() => setRevealed(revealed + 1), revealed === 0 ? 120 : 520)
    return () => window.clearTimeout(id)
  }, [revealed, n, fast, setRevealed])
  return (
    <div className={`panels ${b.layout} ${fast ? 'instant' : ''}`} data-testid="panels">
      {b.cells.slice(0, revealed).map((c, i) => (
        <div className="panel" key={i} style={{ ['--d' as string]: '0s' }}>
          <Background id={c.bg ?? (bg as never)} />
          {c.who && <div className="p-actor"><Portrait who={c.who} emotion={c.emotion} aura={c.aura} /></div>}
          {c.sfx && <div className="sfx">{c.sfx}</div>}
          {c.caption && <div className="caption">{c.caption}</div>}
        </div>
      ))}
    </div>
  )
}

function CutInCard({ b }: { b: Extract<Blocking, { t: 'cutIn' }> }) {
  return (
    <div className={`cutin ${b.right ? 'duel' : 'solo'}`} data-testid="cutin">
      <div className="half l"><div className="lines" /><div className="fig"><Portrait who={b.left.who} emotion={b.left.emotion} aura={b.left.aura} bust /></div></div>
      {b.right && <div className="half r"><div className="lines" /><div className="fig"><Portrait who={b.right.who} emotion={b.right.emotion} aura={b.right.aura} bust /></div></div>}
      {b.right && <div className="vs">VS</div>}
      {b.text && <div className="banner">{b.text}</div>}
    </div>
  )
}

function ChoiceMenu({ prompt, choices, onPick, timed, onTimeout }: {
  prompt?: string
  choices: ChoiceView[]
  onPick: (id: string) => void
  timed?: { seconds: number; defaultChoiceId: string }
  onTimeout?: () => void
}) {
  const timerScale = useSettings((s) => s.timerScale)
  const total = timed ? timed.seconds * (timerScale || 1) : 0
  const useTimer = !!timed && timerScale !== 0
  const [left, setLeft] = useState(total)
  const fired = useRef(false)
  useEffect(() => {
    if (!useTimer) return
    fired.current = false
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const l = Math.max(0, total - (performance.now() - t0) / 1000)
      setLeft(l)
      if (l <= 0 && !fired.current) { fired.current = true; window.clearInterval(id); onTimeout?.() }
    }, 50)
    return () => window.clearInterval(id)
  }, [useTimer, total, onTimeout])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      const v = choices[i]
      if (v?.available) { e.preventDefault(); e.stopPropagation(); onPick(v.choice.id) }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [choices, onPick])

  const C = 2 * Math.PI * 28
  return (
    <div className="choices" role="group" aria-label="Choices" onClick={(e) => e.stopPropagation()}>
      {(prompt || timed) && (
        <div className="ring-wrap">
          {prompt && <div className="prompt" style={{ marginRight: 'auto' }}>{prompt}</div>}
          {timed && useTimer && (
            <>
              <svg className="ring" viewBox="0 0 64 64" aria-hidden>
                <circle className="track" cx="32" cy="32" r="28" />
                <circle className="bar" cx="32" cy="32" r="28" strokeDasharray={C} strokeDashoffset={C * (1 - left / total)} />
              </svg>
              <div className="ring-num" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>{Math.ceil(left)}</div>
            </>
          )}
          {timed && !useTimer && <div className="timer-note">Timer off: take your time.</div>}
        </div>
      )}
      {choices.map((v, i) => (
        <button
          key={v.choice.id}
          className={`choice-btn ${v.choice.tone ? `tone-${v.choice.tone}` : ''}`}
          disabled={!v.available}
          onClick={() => onPick(v.choice.id)}
          data-testid={`choice-${v.choice.id}`}
        >
          <span className="key">{i + 1}</span>
          <span className="lbl">{v.choice.label}</span>
          {(v.costLabel || v.choice.tone) && (
            <span className="meta">
              {v.costLabel && <span className="chip">−{v.costLabel}</span>}
              {v.choice.tone && <span className="chip">{TONE_GLYPH[v.choice.tone]} {v.choice.tone}</span>}
            </span>
          )}
          {!v.available && v.reason && <span className="why">🔒 {v.reason}</span>}
        </button>
      ))}
    </div>
  )
}

function VisionOverlay() {
  return (
    <svg className="vision" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden>
      <g stroke="#6ea0ff" strokeWidth="1.5" opacity="0.7">
        {Array.from({ length: 24 }).map((_, i) => <path key={i} d={`M640 360 L${(i * 1280) / 23} 0`} />)}
        {Array.from({ length: 24 }).map((_, i) => <path key={`b${i}`} d={`M640 360 L${(i * 1280) / 23} 720`} />)}
      </g>
      <g fill="none" stroke="#e5233b" strokeWidth="2.4" opacity="0.8">
        <path d="M120 640 L420 520 L560 560 L760 380" /><path d="M1160 600 L900 500 L820 420" />
        <circle cx="760" cy="380" r="26" /><circle cx="640" cy="360" r="60" strokeDasharray="8 8" />
      </g>
    </svg>
  )
}

export interface CutscenePlayerProps {
  scriptId: string
  api: GameAPI
  onDone: () => void
  /** shows a Close button (dev/preview/replay) */
  onClose?: () => void
}

/** Plays a script. Click / Space / Enter advances; 1–9 pick choices; L backlog, A auto, F fast, S skip (seen scenes only). */
export function CutscenePlayer({ scriptId, api, onDone, onClose }: CutscenePlayerProps) {
  const settings = useSettings()
  const [wasSeen] = useState(() => useMeta.getState().seenScripts.includes(scriptId))
  const runner = useMemo(() => new CutsceneRunner(scriptId, api, content), [scriptId, api])
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [auto, setAuto] = useState(false)
  const [fast, setFast] = useState(false)
  const [skip, setSkip] = useState(false)
  const [backlog, setBacklog] = useState(false)
  const [typed, setTyped] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const innerRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const completeRef = useRef<(() => void) | null>(null)
  const lastFx = useRef(0)
  const doneFired = useRef(false)
  const playerName = useGame((s) => s.state?.player.name) ?? api.get().player.name
  const cur = runner.current
  const cps = fast || skip ? Infinity : SPEED_CPS[settings.textSpeed]

  // reflect settings on <html>
  useEffect(() => {
    const r = document.documentElement
    r.toggleAttribute('data-reduced', settings.reducedMotion)
    r.toggleAttribute('data-colorblind', settings.colorblind)
  }, [settings.reducedMotion, settings.colorblind])

  /** Plays any new shake/flash events via the Web Animations API (no React state involved). */
  const playFx = useCallback(() => {
    for (const e of runner.fx) {
      if (e.id <= lastFx.current) continue
      lastFx.current = e.id
      if (settings.reducedMotion) continue
      if (e.kind === 'shake' && settings.shake) {
        const px = 4 * Number(e.value)
        innerRef.current?.animate(
          [{ transform: 'none' }, { transform: `translate(${-px}px, ${px / 2}px)` }, { transform: `translate(${px}px, ${-px / 2}px)` }, { transform: `translate(${-px / 2}px, ${-px / 3}px)` }, { transform: 'none' }],
          { duration: 300 + 100 * Number(e.value) },
        )
      }
      if (e.kind === 'flash' && settings.flash && flashRef.current) {
        flashRef.current.style.background = { white: '#fff', red: '#e5233b', blue: '#1f6bff', black: '#000' }[String(e.value)] ?? '#fff'
        flashRef.current.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 450, easing: 'ease-out' })
      }
    }
  }, [runner, settings.reducedMotion, settings.shake, settings.flash])
  useEffect(() => { playFx() }, [playFx])
  useEffect(() => { void music(runner.music) }, [runner.music, runner.version])
  useEffect(() => { if (cur?.t === 'line' && !cur.mono) void voice(cur.id, api.get().player.origin, cur.who, cur.emotion) }, [cur, api])
  useEffect(() => () => void music(undefined), [])

  useEffect(() => {
    if (runner.done && !doneFired.current) {
      doneFired.current = true
      onDone()
    }
  }, [runner.done, runner.version, onDone])

  const refresh = useCallback(() => { setTyped(false); setRevealed(0); bump(); playFx() }, [playFx])
  const advance = useCallback(() => {
    if (runner.ripple) return
    const c = runner.current
    if (!c) return
    if (c.t === 'line' || c.t === 'narration') {
      if (!typed) { completeRef.current?.(); return }
    }
    if (c.t === 'panel' && revealed < c.cells.length) { setRevealed(c.cells.length); return }
    if (c.t === 'choice' || c.t === 'timedChoice') return
    runner.advance()
    refresh()
  }, [runner, typed, revealed, refresh])
  const pick = useCallback((id: string) => { if (runner.choose(id)) refresh() }, [runner, refresh])
  const timeout = useCallback(() => {
    const c = runner.current
    if (c?.t === 'timedChoice' && runner.choose(c.defaultChoiceId, true)) refresh()
  }, [runner, refresh])

  // wait beats
  useEffect(() => {
    if (cur?.t !== 'wait') return
    const id = window.setTimeout(advance, fast ? 0 : cur.ms)
    return () => window.clearTimeout(id)
  }, [cur, fast, advance])

  // auto-advance & skip
  useEffect(() => {
    if (!cur || runner.ripple || cur.t === 'choice' || cur.t === 'timedChoice' || cur.t === 'impact' || cur.t === 'wait') return
    const textual = cur.t === 'line' || cur.t === 'narration'
    if (textual && !typed) return
    const delay = skip ? 40 : fast ? 140 : auto ? settings.autoDelayMs : null
    if (delay === null) return
    const id = window.setTimeout(advance, delay)
    return () => window.clearTimeout(id)
  }, [cur, typed, auto, fast, skip, advance, runner.ripple, settings.autoDelayMs])

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advance() }
      else if (e.key === 'l' || e.key === 'L') setBacklog((b) => !b)
      else if (e.key === 'a' || e.key === 'A') setAuto((x) => !x)
      else if (e.key === 'f' || e.key === 'F') setFast((x) => !x)
      else if ((e.key === 's' || e.key === 'S') && wasSeen) setSkip((x) => !x)
      else if (e.key === 'Escape') { if (backlog) setBacklog(false); else onClose?.() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [advance, backlog, wasSeen, onClose])

  const monoLine = cur?.t === 'line' && cur.mono
  const hideActors = cur?.t === 'panel' || cur?.t === 'cutIn' || cur?.t === 'impact'

  return (
    <div className="stage-wrap" data-testid="cutscene">
      <div className="stage" style={{ ['--fs' as string]: settings.fontScale }} onClick={advance}>
        <div ref={innerRef} className="stage-inner">
          <Background id={runner.bg} />
          {runner.vision && <VisionOverlay />}
          {!hideActors && (
            <div className="actors">
              {runner.stage.map((a) => {
                const speaking = cur?.t === 'line' && cur.who === a.who && !cur.mono
                const someoneSpeaks = cur?.t === 'line' && !cur.mono
                return (
                  <div key={a.who} className={`actor ${a.side} ${speaking ? 'speaking' : ''} ${someoneSpeaks && !speaking ? 'dim' : ''}`} data-who={a.who}>
                    <Portrait who={a.who} emotion={speaking && cur?.t === 'line' ? cur.emotion : a.emotion} aura={speaking && cur?.t === 'line' ? cur.aura : a.aura} />
                  </div>
                )
              })}
            </div>
          )}
          {monoLine && <div className="mono-vignette" />}

          {cur?.t === 'line' && <DialogueBox b={cur} playerName={playerName} typed={typed} cps={cps} active={!runner.ripple} onTypedChange={setTyped} completeRef={completeRef} />}
          {cur?.t === 'narration' && <NarrationBox text={cur.text} typed={typed} cps={cps} active={!runner.ripple} onTypedChange={setTyped} completeRef={completeRef} />}
          {cur?.t === 'panel' && <PanelSequence b={cur} bg={runner.bg} fast={fast || skip} revealed={revealed} setRevealed={setRevealed} />}
          {cur?.t === 'impact' && <ImpactCard b={cur} fast={fast || skip} onDone={advance} />}
          {cur?.t === 'cutIn' && <CutInCard b={cur} />}
          {cur?.t === 'choice' && <ChoiceMenu prompt={cur.prompt} choices={cur.choices} onPick={pick} />}
          {cur?.t === 'timedChoice' && (
            <ChoiceMenu key={runner.version} prompt={cur.prompt} choices={cur.choices} onPick={pick} timed={{ seconds: cur.seconds, defaultChoiceId: cur.defaultChoiceId }} onTimeout={timeout} />
          )}
        </div>
        <div ref={flashRef} className="flash" style={{ opacity: 0 }} />
        {runner.ripple && <RippleCard ripple={runner.ripple} onDismiss={() => { runner.dismissRipple(); bump() }} />}
        {backlog && (
          <div className="backlog" onClick={(e) => { e.stopPropagation(); setBacklog(false) }} role="dialog" aria-label="Backlog">
            {runner.log.map((l, i) => (
              <p key={i} className={l.kind === 'narration' ? 'nar' : l.kind === 'choice' ? 'pick' : ''}>
                {l.kind === 'line' && <span className="who">{l.who === 'player' ? playerName : (content.characters[l.who!]?.short ?? l.who)}</span>}
                {l.kind === 'choice' && <span className="who">▶</span>}
                {l.text.replace(/\*/g, '')}
              </p>
            ))}
          </div>
        )}
        <div className="stage-title">{content.scripts[scriptId]?.title}</div>
        <div className="stage-top" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setBacklog((b) => !b)} aria-pressed={backlog} title="Backlog (L)">Log</button>
          <button onClick={() => setAuto((a) => !a)} aria-pressed={auto} title="Auto-advance (A)">Auto</button>
          <button onClick={() => setFast((f) => !f)} aria-pressed={fast} title="Fast (F)">Fast</button>
          <button onClick={() => setSkip((s) => !s)} aria-pressed={skip} disabled={!wasSeen} title={wasSeen ? 'Skip to next choice (S)' : 'Skip is available for scenes you have already seen'}>Skip</button>
          {onClose && <button onClick={onClose} title="Close (Esc)">✕</button>}
        </div>
      </div>
    </div>
  )
}
