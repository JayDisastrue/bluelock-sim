import { useState } from 'react'
import { content } from '../content'
import { createPreviewApi } from '../engine/preview'
import { useMeta } from '../engine/meta'
import { ORIGIN_IDS, POSITIONS, RARITIES, REL_FIELDS, REL_STATUSES, SKILLS, type Position, type RelStatus } from '../engine/schemas'
import { DEFAULT_PORTRAIT } from '../cutscene/previewPlayer'
import { ensureRel, getRel } from '../engine/relationships'
import { useGame } from '../engine/store'
import { previewState } from '../ui/previewState'
import { useUi } from '../ui/uiStore'
import { RarityBadge } from '../ui/RarityBadge'
import { FlagInspector } from './FlagInspector'

const TABS = ['Skills', 'Weapons & Traits', 'Relationships', 'Flags', 'Time & Resources', 'Scenes & Arcs', 'Unlocks'] as const
type Tab = (typeof TABS)[number]

function Num({ value, onChange, min = -9999999, max = 9999999, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return <input type="number" aria-label={label} value={value} min={min} max={max} style={{ width: 90 }} onChange={(e) => onChange(Number(e.target.value))} />
}

/** Global god-mode panel (`~`). Any change flips SANDBOX_USED on the run. */
export function Sandbox() {
  const open = useUi((u) => u.sandboxOpen)
  const toggle = useUi((u) => u.toggleSandbox)
  const playLive = useUi((u) => u.playLive)
  const playPreview = useUi((u) => u.playPreview)
  const s = useGame((g) => g.state)
  const sandbox = useGame((g) => g.sandbox)
  const newGame = useGame((g) => g.newGame)
  const advance = useGame((g) => g.advanceTurn)
  const unlockOrigins = useMeta((m) => m.unlockOrigins)
  const [tab, setTab] = useState<Tab>('Skills')
  const [free, setFree] = useState(true)
  const [npc, setNpc] = useState('bachira')
  const [scriptId, setScriptId] = useState('opening.main')

  if (!open) return null
  const sandboxed = s?.meta.sandboxUsed

  return (
    <div role="region" aria-label="Sandbox" data-testid="sandbox" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(5,6,10,.97)', borderBottom: '4px solid #ffd98a', maxHeight: '62vh', overflow: 'auto', padding: '.6rem 1rem 1rem' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <b className="slash-title" style={{ color: '#ffd98a' }}>⚠ SANDBOX</b>
        <span style={{ fontSize: '.8rem', color: '#9fa6b8' }}>Changes flag this run as <code>SANDBOX_USED</code>{sandboxed ? ' (flagged)' : ''}. Press ~ to close.</span>
        <span style={{ flex: 1 }} />
        {TABS.map((t) => <button key={t} className={`btn small ${tab === t ? 'blue' : ''}`} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
        <button className="btn small" onClick={toggle} aria-label="Close sandbox">✕</button>
      </div>

      {!s && tab !== 'Unlocks' && tab !== 'Scenes & Arcs' && (
        <div className="panel-card">
          No game in progress. <button className="btn small primary" onClick={() => {
            newGame({ name: 'Sandbox', portrait: DEFAULT_PORTRAIT, position: 'ST', handedness: 'right', origin: 'fallen_ace', egoType: 'predator', weaponSeed: 'direct_shot' })
            sandbox(() => {})
          }}>Create quick test game</button>
        </div>
      )}

      {s && tab === 'Skills' && (
        <div>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} data-testid="free-points" /> Free Points (no unlocks required)
          </label>
          {!free && <div style={{ marginBottom: 6 }}>Skill points: <b>{s.skillPoints}</b> <button className="btn small" onClick={() => sandbox((d) => { d.skillPoints += 10 })}>+10 points</button></div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
            {SKILLS.map((k) => {
              const bump = (n: number) => sandbox((d) => {
                const next = Math.max(0, Math.min(100, d.skills[k] + n))
                const applied = next - d.skills[k]
                if (!free) { if (applied > d.skillPoints) return; d.skillPoints -= applied }
                d.skills[k] = next
              })
              return (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '80px 36px auto', gap: 6, alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize' }}>{k}</span><b data-testid={`skill-${k}`}>{s.skills[k]}</b>
                  <span style={{ display: 'flex', gap: 3 }}>
                    {[-5, -1, 1, 5].map((n) => <button key={n} className="btn small" aria-label={`${k} ${n > 0 ? '+' : ''}${n}`} onClick={() => bump(n)}>{n > 0 ? `+${n}` : n}</button>)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {s && tab === 'Weapons & Traits' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Object.values(content.weapons)].sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity)).map((w) => {
            const cur = s.weapons[w.id]
            return (
              <div key={w.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <b style={{ width: 170 }}>{w.name}</b><RarityBadge rarity={w.rarity} /><span style={{ color: '#9fa6b8', width: 80 }}>{w.category}</span>
                <select aria-label={`${w.name} level`} value={cur?.level ?? 0} onChange={(e) => sandbox((d) => { const l = Number(e.target.value); if (l === 0) delete d.weapons[w.id]; else d.weapons[w.id] = { level: l, corrupted: d.weapons[w.id]?.corrupted ?? false } })}>
                  <option value={0}>not owned</option>{w.levels.map((l, i) => <option key={l.name} value={i + 1}>Lv{i + 1} {l.name}</option>)}
                </select>
                <label><input type="checkbox" disabled={!cur} checked={!!cur?.corrupted} onChange={(e) => sandbox((d) => { if (d.weapons[w.id]) d.weapons[w.id]!.corrupted = e.target.checked })} /> corrupted</label>
              </div>
            )
          })}
          <div>{content.traits && Object.values(content.traits).map((t) => (
            <label key={t.id} style={{ marginRight: 12, display: 'inline-block' }} title={t.desc}>
              <input type="checkbox" checked={s.traits.includes(t.id)} onChange={(e) => sandbox((d) => { if (e.target.checked) { if (!d.traits.includes(t.id)) d.traits.push(t.id) } else d.traits = d.traits.filter((x) => x !== t.id) })} /> {t.name}
            </label>
          ))}</div>
        </div>
      )}

      {s && tab === 'Relationships' && (() => {
        const r = getRel(s, npc)
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={npc} onChange={(e) => setNpc(e.target.value)} aria-label="Character" data-testid="rel-npc">
                {Object.values(content.characters).map((c) => <option key={c.id} value={c.id}>{c.name}{c.kind === 'original' ? ' (OC)' : ''}</option>)}
              </select>
              <select value={r.status} aria-label="Status" data-testid="rel-status" onChange={(e) => sandbox((d) => { const rr = ensureRel(d, npc); rr.status = e.target.value as RelStatus; rr.pinned = true; if (e.target.value === 'Eliminated' && !d.eliminated.includes(npc)) d.eliminated.push(npc); if (e.target.value !== 'Eliminated') d.eliminated = d.eliminated.filter((x) => x !== npc) })}>
                {REL_STATUSES.map((x) => <option key={x}>{x}</option>)}
              </select>
              <label><input type="checkbox" checked={r.pinned} onChange={(e) => sandbox((d) => { ensureRel(d, npc).pinned = e.target.checked })} /> pin status</label>
              <button className="btn small" onClick={() => sandbox((d) => { delete d.relationships[npc]; d.eliminated = d.eliminated.filter((x) => x !== npc) })}>Reset</button>
            </div>
            {REL_FIELDS.map((f) => (
              <div key={f} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 50px', gap: 8, alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize' }}>{f}</span>
                <input type="range" aria-label={`${npc} ${f}`} min={f === 'fear' || f === 'rivalry' ? 0 : -100} max={100} value={r[f]} onChange={(e) => sandbox((d) => { ensureRel(d, npc)[f] = Number(e.target.value) })} />
                <span>{r[f]}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {s && tab === 'Flags' && <FlagInspector />}

      {s && tab === 'Time & Resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {([
            ['AP', s.life.ap, (d, n) => { d.life.ap = n }],
            ['Stamina', s.life.stamina, (d, n) => { d.life.stamina = n }],
            ['Composure', s.life.composure, (d, n) => { d.life.composure = n }],
            ['Health', s.life.health, (d, n) => { d.life.health = n }],
            ['Mood', s.life.mood, (d, n) => { d.life.mood = n }],
            ['Money ¥', s.life.money, (d, n) => { d.life.money = n }],
            ['Tactical Intel', s.resources.tacticalIntel, (d, n) => { d.resources.tacticalIntel = n }],
            ['Age', s.life.age, (d, n) => { d.life.age = n }],
            ['Week', s.meta.turn, (d, n) => { d.meta.turn = n; d.life.week = n + 1 }],
            ['NEL valuation (¥M)', s.auction.valueMillions, (d, n) => { d.auction.valueMillions = n }],
            ['XP', s.xp, (d, n) => { d.xp = n }],
            ['Skill points', s.skillPoints, (d, n) => { d.skillPoints = n }],
          ] as [string, number, (d: NonNullable<typeof s>, n: number) => void][]).map(([label, v, set]) => (
            <label key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>{label}<Num label={label} value={v} onChange={(n) => sandbox((d) => set(d, n))} /></label>
          ))}
          <label style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>Position
            <select aria-label="Position" value={s.player.position} data-testid="sandbox-position" onChange={(e) => sandbox((d) => { d.player.position = e.target.value as Position })}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>Strong foot
            <select aria-label="Strong foot" value={s.player.handedness} data-testid="sandbox-foot" onChange={(e) => sandbox((d) => { d.player.handedness = e.target.value as 'left' | 'right' | 'both' })}>{['left', 'right', 'both'].map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <div>
            Injuries: {s.life.injuries.map((i) => `${i.part} ${i.weeksLeft}w`).join(', ') || 'none'}{' '}
            <button className="btn small" onClick={() => sandbox((d) => { d.life.injuries.push({ part: 'knee', severity: 'moderate', weeksLeft: 4 }) })}>+ knee</button>{' '}
            <button className="btn small" onClick={() => sandbox((d) => { d.life.injuries = [] })}>Heal</button>
          </div>
        </div>
      )}

      {tab === 'Scenes & Arcs' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <b>Cutscene launcher</b>
            <select value={scriptId} onChange={(e) => setScriptId(e.target.value)} aria-label="Scene" data-testid="scene-select">
              {Object.values(content.scripts).map((x) => <option key={x.id} value={x.id}>{x.id} · {x.title}</option>)}
            </select>
            <button className="btn small primary" disabled={!s} onClick={() => { sandbox(() => {}); toggle(); playLive([scriptId]) }} data-testid="play-live">Play (affects save)</button>
            <button className="btn small" onClick={() => { toggle(); playPreview([scriptId], createPreviewApi(previewState(s?.player.origin ?? 'fallen_ace', true))) }}>Preview (throwaway)</button>
          </div>
          {s && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <b>Arc teleporter</b>
              <select value={s.arc.id} aria-label="Arc" onChange={(e) => sandbox((d) => { d.arc = { id: e.target.value, chapter: 1 } })}>
                {Object.values(content.arcs).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <span style={{ color: '#9fa6b8', fontSize: '.8rem' }}>Match/Tag-Test teleports arrive with M4/M5. Later arcs are labelled PLACEHOLDER.</span>
            </div>
          )}
          {s && (
            <div>
              <b>Scheduled consequences</b>{' '}
              <button className="btn small" onClick={() => { sandbox(() => {}); advance() }} data-testid="sandbox-advance">Advance one week</button>
              <ul style={{ margin: '4px 0', paddingLeft: '1.2rem' }}>
                {s.scheduled.map((x, i) => (
                  <li key={i}>{x.eventId} due week {x.due} <button className="btn small" onClick={() => sandbox((d) => { d.scheduled[i]!.due = d.meta.turn })}>make due</button> <button className="btn small" onClick={() => sandbox((d) => { d.scheduled.splice(i, 1) })}>remove</button></li>
                ))}
                {s.scheduled.length === 0 && <li style={{ color: '#5a6280' }}>none</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'Unlocks' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn small" onClick={() => unlockOrigins([...ORIGIN_IDS])} data-testid="unlock-origins">Unlock bonus origins (Prodigy’s Shadow, Late Starter)</button>
          <span style={{ color: '#9fa6b8', fontSize: '.85rem' }}>Normally unlocked after one full playthrough.</span>
        </div>
      )}
    </div>
  )
}
