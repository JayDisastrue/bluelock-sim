import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useManifest } from '../assets'
import { Portrait } from '../cutscene/Portrait'
import { PALETTES, SKIN_NAMES, SLOT_LABEL, faceShape, faceShapes, optionLabel, optionsFor, randomPortrait, randomSkin, randomSlot, setFaceShape, setSkin, skinIndex, usesToneFaces, type PartSlot } from '../cutscene/parts'
import { DEFAULT_PORTRAIT, usePreviewPlayer } from '../cutscene/previewPlayer'
import { SvgPortrait } from '../cutscene/SvgPortrait'
import { isDarkHair } from '../cutscene/SvgPortrait'
import type { Emotion, PortraitSpec } from '../engine/schemas'
import './appearance.css'

type Tab = PartSlot | 'skin' | 'colours' | 'kit'
const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'face', label: 'Head', glyph: '◐' }, { id: 'skin', label: 'Skin', glyph: '●' }, { id: 'hair', label: 'Hair', glyph: '≋' },
  { id: 'eyes', label: 'Eyes', glyph: '◉' }, { id: 'brow', label: 'Brows', glyph: '⌒' }, { id: 'nose', label: 'Nose', glyph: '△' },
  { id: 'mark', label: 'Marks', glyph: '✕' }, { id: 'accessory', label: 'Extras', glyph: '◇' }, { id: 'colours', label: 'Colours', glyph: '◈' }, { id: 'kit', label: 'Kit', glyph: '▤' },
]
const PART_TITLE: Record<PartSlot, string> = { face: 'Head shape', hair: 'Hair', eyes: 'Eyes', brow: 'Eyebrows', nose: 'Nose', mark: 'Marks', accessory: 'Extras' }
/** Square-ish (5:4) crops of the 200×260 portrait that frame each slot on its card. */
const CROP: Record<PartSlot, string> = {
  face: '25 48 150 120', hair: '10 14 180 144', eyes: '45 100 110 88', brow: '45 96 110 88', nose: '58 108 84 67', mark: '52 98 96 77', accessory: '20 20 160 128',
}
const EMOTES: Emotion[] = ['neutral', 'smirk', 'furious', 'shocked', 'flow', 'metavision']
const SKIN_LABEL = (i: number) => SKIN_NAMES[i]

function Dice({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="btn small" onClick={onClick} aria-label={label} title={label} data-testid={`dice-${label}`}>🎲</button>
}

function Swatch({ colors, value, onPick, label }: { colors: readonly string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div className="sw-row" role="radiogroup" aria-label={label}>
      {colors.map((c) => <button key={c} className="sw" style={{ ['--c' as string]: c }} role="radio" aria-checked={value.toLowerCase() === c.toLowerCase()} aria-label={`${label} ${c}`} title={c} onClick={() => onPick(c)} />)}
    </div>
  )
}

/** The Appearance step: category rail, big part cards, live preview with expressions. */
export function Appearance({ footer }: { footer: ReactNode }) {
  const parts = useManifest().playerParts
  const portrait = usePreviewPlayer((s) => s.portrait)
  const setPortrait = usePreviewPlayer((s) => s.setPortrait)
  const [tab, setTab] = useState<Tab>('face')
  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const history = useRef<PortraitSpec[]>([])
  const [canUndo, setCanUndo] = useState(false)

  const change = (next: PortraitSpec) => {
    history.current = [...history.current.slice(-30), portrait]
    setCanUndo(true)
    setPortrait(next)
  }
  const undo = () => {
    const prev = history.current.pop()
    if (prev) setPortrait(prev)
    setCanUndo(history.current.length > 0)
  }
  useEffect(() => () => { history.current = [] }, [])

  const toneFaces = usesToneFaces(parts)
  const hairImported = optionsFor('hair', parts).some((o) => o.image)
  const eyesImported = optionsFor('eyes', parts).some((o) => o.image)
  const current = (slot: PartSlot) => (slot === 'face' && toneFaces ? faceShape(portrait.face) : portrait[slot])
  const summary = (t: Tab): string => t === 'skin' ? SKIN_LABEL(skinIndex(portrait.skin)) ?? '' : t === 'colours' ? 'hair · eyes' : t === 'kit' ? portrait.build : optionLabel(current(t))
  const cards = (slot: PartSlot) => {
    if (slot === 'face' && toneFaces) return faceShapes(parts).map((id) => ({ id, image: true, spec: setFaceShape(portrait, id, parts) }))
    return optionsFor(slot, parts).map((o) => ({ id: o.id, image: o.image, spec: { ...portrait, [slot]: o.id } as PortraitSpec }))
  }
  const pick = (slot: PartSlot, id: string) => change(slot === 'face' ? setFaceShape(portrait, id, parts) : { ...portrait, [slot]: id })

  const slot = TABS.find((t) => t.id === tab)!
  const isPart = tab !== 'skin' && tab !== 'colours' && tab !== 'kit'

  return (
    <div className="ap">
      <div>
        <div className="ap-main">
          <div className="ap-rail" role="tablist" aria-label="Appearance categories" aria-orientation="vertical">
            {TABS.map((t) => (
              <button key={t.id} role="tab" className="ap-tab" aria-selected={tab === t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}>
                <span className="gl" aria-hidden>{t.glyph}</span><b>{t.label}</b><small>{summary(t.id)}</small>
              </button>
            ))}
          </div>
          <div className="ap-pane" role="tabpanel" aria-label={slot.label}>
            <div className="ap-head">
              <h3>{isPart ? PART_TITLE[tab as PartSlot] : slot.label}</h3>
              {isPart && <span className="count">{cards(tab as PartSlot).length} options</span>}
              <span className="sp" />
              {isPart && <Dice label={`Random ${SLOT_LABEL[tab as PartSlot]}`} onClick={() => change(randomSlot(portrait, tab as PartSlot, Math.random, parts))} />}
              {tab === 'skin' && <Dice label="Random Skin" onClick={() => change(randomSkin(portrait, Math.random, parts))} />}
            </div>

            {isPart && (
              <div className="cards" role="radiogroup" aria-label={PART_TITLE[tab as PartSlot]}>
                {cards(tab as PartSlot).map((c) => {
                  const on = current(tab as PartSlot) === c.id
                  return (
                    <button key={c.id} className="card" role="radio" aria-checked={on} onClick={() => pick(tab as PartSlot, c.id)} data-testid={`part-${tab}-${c.id}`} title={optionLabel(c.id) + (c.image ? ' (imported art)' : ' (drawn placeholder)')}>
                      <div className="pic"><SvgPortrait spec={c.spec} crop={CROP[tab as PartSlot]} parts={parts} label={`${PART_TITLE[tab as PartSlot]} ${optionLabel(c.id)}`} /></div>
                      <span>{optionLabel(c.id)} {c.image && <span className="own" aria-hidden>◆</span>}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {tab === 'nose' && !optionsFor('nose', parts).some((o) => o.image) && <p className="ap-hint">Nose art is still drawn placeholders: the imported heads already include a small nose.</p>}

            {tab === 'skin' && (
              <>
                <div className="skin-tones" role="radiogroup" aria-label="Skin tone">
                  {PALETTES.skin.map((c, i) => (
                    <button key={c} className="skin-tone" style={{ ['--c' as string]: c }} role="radio" aria-checked={skinIndex(portrait.skin) === i && portrait.skin.toLowerCase() === c} aria-label={`Skin ${SKIN_NAMES[i]}`} data-testid={`skin-${SKIN_NAMES[i]}`} onClick={() => change(setSkin(portrait, c, parts))}>
                      <i /><span>{SKIN_NAMES[i]}</span>
                    </button>
                  ))}
                </div>
                <p className="ap-hint">{toneFaces ? 'Each head shape is drawn in all eight tones; the body and neck follow your choice.' : 'The drawn placeholder head is tinted with this colour.'}</p>
              </>
            )}

            {tab === 'colours' && (
              <>
                <div className="sw-block"><b>Hair colour</b><Swatch colors={PALETTES.hairColor} value={portrait.hairColor} onPick={(c) => change({ ...portrait, hairColor: c })} label="Hair colour" />
                  {hairImported && <p className="ap-hint">{isDarkHair(portrait.hairColor) ? 'Dark choices keep the art as drawn.' : 'Imported hair art is recoloured with a gradient map, so highlights and shadows are kept.'}</p>}</div>
                <div className="sw-block"><b>Eye colour</b><Swatch colors={PALETTES.eyeColor} value={portrait.eyeColor} onPick={(c) => change({ ...portrait, eyeColor: c })} label="Eye colour" />
                  {eyesImported && <p className="ap-hint">Imported eye art keeps its own iris colour for now.</p>}</div>
              </>
            )}

            {tab === 'kit' && (
              <>
                <div className="sw-block"><b>Kit</b><Swatch colors={PALETTES.kit} value={portrait.kit} onPick={(c) => change({ ...portrait, kit: c })} label="Kit" /></div>
                <div className="sw-block"><b>Accent</b><Swatch colors={PALETTES.accent} value={portrait.accent} onPick={(c) => change({ ...portrait, accent: c })} label="Accent" /></div>
                <div className="sw-block"><b>Build</b>
                  <div className="seg" role="radiogroup" aria-label="Build">{(['lean', 'mid', 'broad'] as const).map((b) => <button key={b} role="radio" aria-checked={portrait.build === b} onClick={() => change({ ...portrait, build: b })}>{b}</button>)}</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="ap-footer">{footer}</div>
      </div>

      <aside className="ap-side" aria-label="Portrait preview">
        <div className="ap-stage">
          <div className="who"><Portrait who="player" emotion={emotion} /></div>
          <span className="name">{emotion}</span>
        </div>
        <div className="ap-emotes" role="group" aria-label="Preview expression">
          {EMOTES.map((e) => <button key={e} aria-pressed={emotion === e} onClick={() => setEmotion(e)}>{e}</button>)}
        </div>
        <div className="ap-actions">
          <button className="btn primary" onClick={() => change(randomPortrait(Math.random, parts))} data-testid="randomize-all">🎲 Randomize all</button>
          <button className="btn small" onClick={undo} disabled={!canUndo} data-testid="undo">↶ Undo</button>
          <button className="btn small" onClick={() => change(DEFAULT_PORTRAIT)}>Reset</button>
        </div>
      </aside>
    </div>
  )
}
