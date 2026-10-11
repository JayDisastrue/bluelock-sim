import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../content'
import { Portrait } from '../cutscene/Portrait'
import { ORIGIN_NAMES } from '../engine/text'
import { REP_AXES, SKILLS } from '../engine/schemas'
import { useGame } from '../engine/store'
import { Meter } from './Screen'
import { useUi } from './uiStore'

const REP_LABEL = { egoAura: 'Ego Aura', teamPlayer: 'Team Player', mediaDarling: 'Media Darling', coachFavor: 'Coach Favor', mystery: 'Mystery' }

/**
 * PLACEHOLDER hub. The weekly AP planner, training and events inbox are milestone M3.
 * What is real here: the calendar turn (delayed events fire when due), status, relationships, ripples, saves.
 */
export function Hub() {
  const s = useGame((g) => g.state)!
  const queue = useGame((g) => g.eventQueue)
  const shift = useGame((g) => g.shiftQueue)
  const advance = useGame((g) => g.advanceTurn)
  const scene = useUi((u) => u.scene)
  const playLive = useUi((u) => u.playLive)

  // play queued events one by one
  useEffect(() => {
    if (scene || queue.length === 0) return
    const id = shift()
    const ev = id ? content.events[id] : undefined
    if (ev) playLive(ev.scenes)
  }, [scene, queue, shift, playLive])

  const opened = !!s.flags.OPENING_COMPLETE
  const pending = s.scheduled.length
  return (
    <div className="tone" style={{ minHeight: '100%', padding: '1.2rem 1.5rem 3rem' }} data-testid="hub">
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 className="slash-title" style={{ fontSize: '2rem', margin: 0, textShadow: '3px 3px 0 #e5233b' }}>Dorm · Week {s.life.week}</h1>
          {s.meta.sandboxUsed && <span className="chip" style={{ color: '#ffd98a' }} title="Sandbox was used in this run">SANDBOX USED</span>}
          <span style={{ flex: 1 }} />
          <Link className="btn small" to="/relationships">Relationships</Link>
          <Link className="btn small" to="/ripples">Ripple Log</Link>
          <Link className="btn small" to="/gallery">Gallery</Link>
          <Link className="btn small" to="/saves">Save / Load</Link>
          <Link className="btn small" to="/settings">Settings</Link>
          <Link className="btn small" to="/">Menu</Link>
        </div>

        <div className="panel-card hub-head" style={{ borderColor: '#e5233b' }}>
          <div style={{ height: 140 }}><Portrait who="player" /></div>
          <div>
            <div className="slash-title" style={{ fontSize: '1.5rem' }}>{s.player.name}</div>
            <div style={{ color: '#cfd6ee' }}>{ORIGIN_NAMES[s.player.origin]} · {s.player.position} · {s.player.handedness === 'both' ? 'two-footed' : `${s.player.handedness}-footed`} · age {s.life.age} · arc: {content.arcs[s.arc.id]?.name}</div>
            <div style={{ color: '#9fa6b8', fontSize: '.85rem', marginTop: 4 }}>
              ⚑ <b>PLACEHOLDER HUB</b>: the AP planner, training and event inbox arrive in M3. This week-advance is real: scheduled consequences fire when due.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
            <button className="btn primary" onClick={advance} data-testid="advance" disabled={!opened}>Advance week →</button>
            <div style={{ fontSize: '.8rem', color: '#9fa6b8' }}>{pending} consequence{pending === 1 ? '' : 's'} pending</div>
            {!opened && <div style={{ fontSize: '.8rem', color: '#ffd98a' }}>Finish the opening first</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <section className="panel-card" aria-label="Status">
            <h2 className="slash-title">Status</h2>
            <table style={{ width: '100%' }}><tbody>
              {([['AP', `${s.life.ap}/${s.life.apMax}`], ['Stamina', s.life.stamina], ['Composure', s.life.composure], ['Health', s.life.health], ['Mood', s.life.mood], ['Money', `¥${s.life.money.toLocaleString()}`], ['Tactical Intel', s.resources.tacticalIntel]] as const).map(([k, v]) => (
                <tr key={k}><td style={{ color: '#9fa6b8' }}>{k}</td><td>{v}</td></tr>
              ))}
            </tbody></table>
            {s.life.injuries.length > 0 && <div style={{ color: '#ff9aa6' }}>Injuries: {s.life.injuries.map((i) => `${i.part} (${i.severity}, ${i.weeksLeft}w)`).join(', ')}</div>}
          </section>
          <section className="panel-card" aria-label="Skills">
            <h2 className="slash-title">Skills</h2>
            {SKILLS.map((k) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 30px', gap: 8, alignItems: 'center', margin: '4px 0' }}>
                <span style={{ color: '#9fa6b8', textTransform: 'capitalize' }}>{k}</span><Meter value={s.skills[k]} /><span>{s.skills[k]}</span>
              </div>
            ))}
          </section>
          <section className="panel-card" aria-label="Reputation">
            <h2 className="slash-title">Reputation</h2>
            {REP_AXES.map((k) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 30px', gap: 8, alignItems: 'center', margin: '4px 0' }}>
                <span style={{ color: '#9fa6b8' }}>{REP_LABEL[k]}</span><Meter value={s.reputation[k]} /><span>{s.reputation[k]}</span>
              </div>
            ))}
            <h3 className="slash-title" style={{ marginTop: 12 }}>Weapons &amp; traits</h3>
            <div>{Object.entries(s.weapons).map(([id, w]) => <span key={id} className="chip" style={{ marginRight: 4, color: w.corrupted ? '#ff5a6e' : '#6ea0ff' }}>{content.weapons[id]?.levels[w.level - 1]?.name ?? id}{w.corrupted ? ' ☠' : ''}</span>)}</div>
            <div style={{ marginTop: 6 }}>{s.traits.map((t) => <span key={t} className="chip" style={{ marginRight: 4 }} title={content.traits[t]?.desc}>{content.traits[t]?.name ?? t}</span>)}</div>
          </section>
          <section className="panel-card" aria-label="Recent memory">
            <h2 className="slash-title">What they remember</h2>
            {s.memory.length === 0 && <div style={{ color: '#5a6280' }}>Nothing yet.</div>}
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{[...s.memory].reverse().slice(0, 6).map((m) => <li key={m.id}>{m.text}</li>)}</ul>
          </section>
        </div>
      </div>
    </div>
  )
}
