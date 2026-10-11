import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { content } from '../content'
import { Portrait } from '../cutscene/Portrait'
import { DEFAULT_PORTRAIT, usePreviewPlayer } from '../cutscene/previewPlayer'
import { useMeta } from '../engine/meta'
import { EGO_BIAS } from '../engine/newGame'
import { BROW_IDS, EGO_TYPES, EYE_IDS, HAIR_IDS, MARK_IDS, POSITIONS, type EgoType, type OriginId, type PortraitSpec, type Position } from '../engine/schemas'
import { useSettings } from '../engine/settings'
import { useGame, liveApi } from '../engine/store'
import { OPENING_SCRIPT } from '../content'
import { Screen } from './Screen'
import { useUi } from './uiStore'

const SKIN = ['#fbe0c8', '#f0d0b0', '#e0b896', '#c99572', '#9a6a48', '#6b4630']
const HAIR_C = ['#14141a', '#3b2a1f', '#6a4a2a', '#c9a64a', '#d9d9e3', '#b0463c', '#1f6bff', '#8a5aa8']
const EYE_C = ['#2a2a30', '#4a3a2a', '#2a6a4a', '#2a4a8a', '#c9a227', '#7a1f1f', '#6aa0ff']
const KIT = ['#1f6bff', '#e5233b', '#2a8a5a', '#101014', '#f2efe6', '#8a5aa8', '#e5a23b']
const STEPS = ['Identity', 'Appearance', 'Origin', 'Ego & Weapon', 'Confirm'] as const

const EGO_INFO: Record<EgoType, { name: string; desc: string }> = {
  predator: { name: 'Predator', desc: '“I eat the goal.” Finishing and Ego lead.' },
  architect: { name: 'Architect', desc: '“The pitch is my instrument.” Metavision and teamwork lead.' },
  wildcard: { name: 'Wildcard', desc: '“Joy is unpredictable.” Dribbling and speed lead.' },
  survivor: { name: 'Survivor', desc: '“I never get cut.” Stamina and defence lead.' },
  monarch: { name: 'Monarch', desc: '“Everyone orbits me.” Ego and Flow lead.' },
}

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {colors.map((c) => (
        <button key={c} role="radio" aria-checked={value === c} aria-label={`${label} ${c}`} onClick={() => onPick(c)}
          style={{ width: 28, height: 28, background: c, border: value === c ? '3px solid #fff' : '2px solid #3a4468', cursor: 'pointer', outline: value === c ? '2px solid #e5233b' : 'none' }} />
      ))}
    </div>
  )
}

function Choices<T extends string>({ items, value, onPick, label }: { items: readonly T[]; value: T; onPick: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((i) => (
        <button key={i} role="radio" aria-checked={value === i} className={`btn small ${value === i ? 'blue' : ''}`} onClick={() => onPick(i)}>{i}</button>
      ))}
    </div>
  )
}

export function NewGame() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [position, setPosition] = useState<Position>('ST')
  const [hand, setHand] = useState<'left' | 'right' | 'both'>('right')
  const portrait = usePreviewPlayer((s) => s.portrait)
  const setPortrait = usePreviewPlayer((s) => s.setPortrait)
  const [origin, setOrigin] = useState<OriginId>('fallen_ace')
  const [ego, setEgo] = useState<EgoType>('predator')
  const [weapon, setWeapon] = useState('direct_shot')
  const romance = useSettings((s) => s.romance)
  const setSettings = useSettings((s) => s.set)
  const unlocked = useMeta((s) => s.unlockedOrigins)
  const newGame = useGame((s) => s.newGame)
  const playLive = useUi((s) => s.playLive)
  const set = <K extends keyof PortraitSpec>(k: K, v: PortraitSpec[K]) => setPortrait({ ...portrait, [k]: v })
  const o = content.origins[origin]!
  const seedable = useMemo(() => Object.values(content.weapons).filter((w) => w.seedable), [])
  const canNext = step === 0 ? name.trim().length > 0 : true

  const start = () => {
    newGame({ name, portrait, position, handedness: hand, origin, egoType: ego, weaponSeed: weapon, romanceEnabled: romance })
    nav('/hub')
    playLive([OPENING_SCRIPT])
    void liveApi
  }

  return (
    <Screen title="New Game">
      <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: '0 0 1rem', flexWrap: 'wrap' }} aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="chip" style={{ color: i === step ? '#fff' : i < step ? '#6ea0ff' : '#5a6280', background: i === step ? '#e5233b' : 'transparent' }} aria-current={i === step ? 'step' : undefined}>{i + 1}. {s}</li>
        ))}
      </ol>
      <div className="wizard-grid">
        <div className="panel-card" style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          {step === 0 && (
            <>
              <label style={{ display: 'grid', gap: 4 }}>Name
                <input type="text" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus data-testid="name-input" />
              </label>
              <div><div>Position</div><Choices items={POSITIONS} value={position} onPick={setPosition} label="Position" /></div>
              <div><div>Strong foot</div><Choices items={['left', 'right', 'both'] as const} value={hand} onPick={setHand} label="Handedness" /></div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={romance} onChange={(e) => setSettings({ romance: e.target.checked })} /> Enable romance &amp; friendships subplots
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <div>Skin<Swatches colors={SKIN} value={portrait.skin} onPick={(c) => set('skin', c)} label="Skin" /></div>
              <div>Hair style<Choices items={HAIR_IDS} value={portrait.hair} onPick={(v) => set('hair', v)} label="Hair style" /></div>
              <div>Hair colour<Swatches colors={HAIR_C} value={portrait.hairColor} onPick={(c) => set('hairColor', c)} label="Hair colour" /></div>
              <div>Eyes<Choices items={EYE_IDS} value={portrait.eyes} onPick={(v) => set('eyes', v)} label="Eye shape" /></div>
              <div>Eye colour<Swatches colors={EYE_C} value={portrait.eyeColor} onPick={(c) => set('eyeColor', c)} label="Eye colour" /></div>
              <div>Brows<Choices items={BROW_IDS} value={portrait.brow} onPick={(v) => set('brow', v)} label="Brows" /></div>
              <div>Kit<Swatches colors={KIT} value={portrait.kit} onPick={(c) => set('kit', c)} label="Kit" /></div>
              <div>Build<Choices items={['lean', 'mid', 'broad'] as const} value={portrait.build} onPick={(v) => set('build', v)} label="Build" /></div>
              <div>Mark<Choices items={MARK_IDS} value={portrait.mark} onPick={(v) => set('mark', v)} label="Mark" /></div>
              <button className="btn small" onClick={() => setPortrait(DEFAULT_PORTRAIT)}>Reset</button>
            </>
          )}
          {step === 2 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {Object.values(content.origins).map((x) => {
                const locked = x.locked && !unlocked.includes(x.id)
                return (
                  <button key={x.id} disabled={locked} onClick={() => setOrigin(x.id)} aria-pressed={origin === x.id} data-testid={`origin-${x.id}`}
                    className="panel-card" style={{ textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1, borderColor: origin === x.id ? '#e5233b' : '#242a40', color: 'inherit' }}>
                    <div className="slash-title" style={{ fontSize: '1.2rem' }}>{x.name} {locked && '🔒'}</div>
                    <div style={{ color: '#cfd6ee', fontStyle: 'italic' }}>{x.tagline}</div>
                    {locked ? <div style={{ color: '#ffd98a', fontSize: '.85rem' }}>{x.unlockHint}</div> : (
                      <div style={{ color: '#9fa6b8', fontSize: '.85rem', marginTop: 4 }}>Approached by {content.characters[x.approachedBy]?.name} · {x.branches[0]}</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {step === 3 && (
            <>
              <div>
                <div className="slash-title">Ego type</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                  {EGO_TYPES.map((t) => (
                    <button key={t} aria-pressed={ego === t} onClick={() => setEgo(t)} className="panel-card" style={{ textAlign: 'left', color: 'inherit', cursor: 'pointer', borderColor: ego === t ? '#e5233b' : '#242a40' }}>
                      <b>{EGO_INFO[t].name}</b> · {EGO_INFO[t].desc} <span style={{ color: '#6ea0ff' }}>{Object.entries(EGO_BIAS[t]).map(([k, v]) => `${k} +${v}`).join(', ')}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="slash-title">Starting weapon</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                  {seedable.map((w) => (
                    <button key={w.id} aria-pressed={weapon === w.id} onClick={() => setWeapon(w.id)} className="panel-card" style={{ textAlign: 'left', color: 'inherit', cursor: 'pointer', borderColor: weapon === w.id ? '#e5233b' : '#242a40' }}>
                      <b>{w.name}</b> · {w.summary}<div style={{ color: '#9fa6b8', fontSize: '.85rem' }}>{w.levels.map((l) => l.name).join(' → ')}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div className="slash-title" style={{ fontSize: '1.4rem' }}>{name}</div>
              <div>{o.name} · {position} · {hand}-footed · {EGO_INFO[ego].name}</div>
              <div style={{ color: '#cfd6ee', fontStyle: 'italic' }}>{o.past}</div>
              <div>Starting weapon: <b>{content.weapons[weapon]?.name}</b></div>
              <div>Tags: {o.tags.map((t) => <span key={t} className="chip" style={{ marginRight: 4 }}>{t}</span>)}</div>
              <div style={{ color: '#9fa6b8' }}>Your opening scene will diverge: you’ll be approached by <b>{content.characters[o.approachedBy]?.name}</b>, and Ego will aim at your wound.</div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < STEPS.length - 1
              ? <button className="btn blue" disabled={!canNext} onClick={() => setStep(step + 1)} data-testid="next">Next</button>
              : <button className="btn primary" onClick={start} data-testid="start">Enter Blue Lock</button>}
          </div>
        </div>
        <div className="panel-card preview" style={{ height: 360, padding: 0, background: 'linear-gradient(180deg,#181c2c,#05060a)', position: 'sticky', top: 12 }} aria-label="Portrait preview">
          <div style={{ height: '100%', padding: '1rem 2rem 0' }}><Portrait who="player" emotion={step === 4 ? 'smirk' : 'neutral'} /></div>
        </div>
      </div>
    </Screen>
  )
}
