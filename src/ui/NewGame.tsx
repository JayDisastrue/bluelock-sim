import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPENING_SCRIPT, content } from '../content'
import { useManifest } from '../assets'
import { Portrait } from '../cutscene/Portrait'
import { PALETTES, PART_SLOTS, SLOT_LABEL, normalizePortrait, optionLabel, optionsFor, randomPortrait, randomSlot, type PartSlot } from '../cutscene/parts'
import { DEFAULT_PORTRAIT, usePreviewPlayer } from '../cutscene/previewPlayer'
import { SvgPortrait } from '../cutscene/SvgPortrait'
import { rollFate, type Fate } from '../engine/fate'
import { useMeta } from '../engine/meta'
import { EGO_BIAS } from '../engine/newGame'
import { EGO_TYPES, type EgoType, type OriginId, type PortraitSpec } from '../engine/schemas'
import { useSettings } from '../engine/settings'
import { useGame } from '../engine/store'
import { Screen } from './Screen'
import { useUi } from './uiStore'

const STEPS = ['Identity', 'Appearance', 'Origin', 'Ego & Weapon', 'Confirm'] as const

const EGO_INFO: Record<EgoType, { name: string; desc: string }> = {
  predator: { name: 'Predator', desc: '“I eat the goal.” Finishing and Ego lead.' },
  architect: { name: 'Architect', desc: '“The pitch is my instrument.” Metavision and teamwork lead.' },
  wildcard: { name: 'Wildcard', desc: '“Joy is unpredictable.” Dribbling and speed lead.' },
  survivor: { name: 'Survivor', desc: '“I never get cut.” Stamina and defence lead.' },
  monarch: { name: 'Monarch', desc: '“Everyone orbits me.” Ego and Flow lead.' },
}

/** Which part of the portrait each slot's thumbnail zooms into. */
const CROP: Record<PartSlot, string> = {
  face: '40 40 120 150', hair: '30 14 140 150', eyes: '52 92 96 50', brow: '52 88 96 44', nose: '68 104 64 52', mark: '48 90 104 76', accessory: '30 20 140 170',
}

function Swatches({ colors, value, onPick, label }: { colors: readonly string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {colors.map((c) => (
        <button key={c} role="radio" aria-checked={value === c} aria-label={`${label} ${c}`} onClick={() => onPick(c)}
          style={{ width: 28, height: 28, background: c, border: value === c ? '3px solid #fff' : '2px solid #3a4468', cursor: 'pointer', outline: value === c ? '2px solid #e5233b' : 'none' }} />
      ))}
    </div>
  )
}

function Dice({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="btn small" onClick={onClick} aria-label={label} title={label} data-testid={`dice-${label}`}>🎲</button>
}

export function NewGame() {
  const nav = useNavigate()
  const manifest = useManifest()
  const parts = manifest.playerParts
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const portrait = usePreviewPlayer((s) => s.portrait)
  const setPortrait = usePreviewPlayer((s) => s.setPortrait)
  const [origin, setOrigin] = useState<OriginId>('fallen_ace')
  const [ego, setEgo] = useState<EgoType>('predator')
  const seedable = useMemo(() => Object.values(content.weapons).filter((w) => w.seedable), [])
  const [fate, setFate] = useState<Fate>(() => rollFate(seedable))
  const romance = useSettings((s) => s.romance)
  const setSettings = useSettings((s) => s.set)
  const unlocked = useMeta((s) => s.unlockedOrigins)
  const newGame = useGame((s) => s.newGame)
  const playLive = useUi((u) => u.playLive)
  const set = <K extends keyof PortraitSpec>(k: K, v: PortraitSpec[K]) => setPortrait({ ...portrait, [k]: v })
  // once images are imported for a slot, the drawn defaults are no longer offered: snap the current look onto offered parts
  useEffect(() => {
    const n = normalizePortrait(portrait, parts)
    if (n !== portrait) setPortrait(n)
  }, [parts, portrait, setPortrait])
  const o = content.origins[origin]!
  const canNext = step === 0 ? name.trim().length > 0 : true

  const start = () => {
    // position is always striker; strong foot and starting weapon are the rolled fate
    newGame({ name, portrait, handedness: fate.foot, origin, egoType: ego, weaponSeed: fate.weapon, romanceEnabled: romance })
    nav('/hub')
    playLive([OPENING_SCRIPT])
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
              <div className="panel-card" data-testid="position-locked">
                <div className="slash-title">Position: Striker (ST)</div>
                <div style={{ color: '#9fa6b8', fontSize: '.9rem' }}>Everyone enters Blue Lock as a striker. Your position can change later through the story and your choices.</div>
              </div>
              <div className="panel-card" data-testid="fate-foot">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div className="slash-title">Strong foot: <span data-testid="foot-value">{fate.foot === 'both' ? 'Both (ambidextrous)' : fate.foot}</span></div>
                    <div style={{ color: '#9fa6b8', fontSize: '.9rem' }}>Rolled by fate. It can change with the story.</div></div>
                  <Dice label="Re-roll foot" onClick={() => setFate({ ...fate, foot: rollFate(seedable).foot })} />
                </div>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={romance} onChange={(e) => setSettings({ romance: e.target.checked })} /> Enable romance &amp; friendships subplots
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn primary" onClick={() => setPortrait(randomPortrait(Math.random, parts))} data-testid="randomize-all">🎲 Randomize everything</button>
                <button className="btn small" onClick={() => setPortrait(DEFAULT_PORTRAIT)}>Reset</button>
                <span style={{ color: '#9fa6b8', fontSize: '.85rem' }}>Mix and match every part. Your imported part images (public/assets/player/) replace the drawn options for their slot automatically.</span>
              </div>
              {PART_SLOTS.map((slot) => (
                <section key={slot} aria-label={SLOT_LABEL[slot]}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <b className="slash-title">{SLOT_LABEL[slot]}</b>
                    <Dice label={`Random ${SLOT_LABEL[slot]}`} onClick={() => setPortrait(randomSlot(portrait, slot, Math.random, parts))} />
                  </div>
                  <div role="radiogroup" aria-label={SLOT_LABEL[slot]} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 6 }}>
                    {optionsFor(slot, parts).map((opt) => {
                      const on = portrait[slot] === opt.id
                      return (
                        <button key={opt.id} role="radio" aria-checked={on} onClick={() => set(slot, opt.id)} data-testid={`part-${slot}-${opt.id}`}
                          title={optionLabel(opt.id) + (opt.image ? ' (imported image)' : '')}
                          style={{ padding: 2, background: '#0a0c14', border: on ? '3px solid #e5233b' : '2px solid #3a4468', cursor: 'pointer', color: '#cfd6ee', fontSize: '.7rem', display: 'grid', gap: 2 }}>
                          <div className="thumb"><SvgPortrait spec={{ ...portrait, [slot]: opt.id }} crop={CROP[slot]} parts={parts} label={`${SLOT_LABEL[slot]} ${optionLabel(opt.id)}`} /></div>
                          <span style={{ textTransform: 'capitalize' }}>{optionLabel(opt.id)}{opt.image ? ' ◆' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
              <div>Skin<Swatches colors={PALETTES.skin} value={portrait.skin} onPick={(c) => set('skin', c)} label="Skin" /></div>
              <div>Hair colour<Swatches colors={PALETTES.hairColor} value={portrait.hairColor} onPick={(c) => set('hairColor', c)} label="Hair colour" /></div>
              <div>Eye colour<Swatches colors={PALETTES.eyeColor} value={portrait.eyeColor} onPick={(c) => set('eyeColor', c)} label="Eye colour" /></div>
              <div>Kit<Swatches colors={PALETTES.kit} value={portrait.kit} onPick={(c) => set('kit', c)} label="Kit" /></div>
              <div>Accent<Swatches colors={PALETTES.accent} value={portrait.accent} onPick={(c) => set('accent', c)} label="Accent" /></div>
              <div role="radiogroup" aria-label="Build" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Build
                {(['lean', 'mid', 'broad'] as const).map((b) => <button key={b} role="radio" aria-checked={portrait.build === b} className={`btn small ${portrait.build === b ? 'blue' : ''}`} onClick={() => set('build', b)}>{b}</button>)}
              </div>
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
              <div className="panel-card" data-testid="fate-weapon">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="slash-title">Starting weapon (rolled): <span data-testid="weapon-value">{content.weapons[fate.weapon]?.name}</span></div>
                  <Dice label="Re-roll weapon" onClick={() => setFate({ ...fate, weapon: rollFate(seedable).weapon })} />
                </div>
                <div style={{ color: '#cfd6ee' }}>{content.weapons[fate.weapon]?.summary}</div>
                <div style={{ color: '#9fa6b8', fontSize: '.85rem' }}>{content.weapons[fate.weapon]?.levels.map((l) => l.name).join(' → ')} · weapons can be gained, evolved and corrupted by the story.</div>
              </div>
            </>
          )}
          {step === 4 && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div className="slash-title" style={{ fontSize: '1.4rem' }}>{name}</div>
              <div>{o.name} · Striker (ST) · {fate.foot === 'both' ? 'two-footed' : `${fate.foot}-footed`} · {EGO_INFO[ego].name}</div>
              <div style={{ color: '#cfd6ee', fontStyle: 'italic' }}>{o.past}</div>
              <div>Starting weapon: <b>{content.weapons[fate.weapon]?.name}</b></div>
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
