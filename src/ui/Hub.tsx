import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../content'
import { Portrait } from '../cutscene/Portrait'
import { ORIGIN_NAMES } from '../engine/text'
import { RARITY_INFO, REP_AXES, SKILLS } from '../engine/schemas'
import { useGame } from '../engine/store'
import { Meter } from './Screen'
import { useUi } from './uiStore'
import './hub.css'

const REP_LABEL = { egoAura: 'Ego Aura', teamPlayer: 'Team Player', mediaDarling: 'Media Darling', coachFavor: 'Coach Favor', mystery: 'Mystery' }

/** Overall rating = mean of the nine skills, and the tier name the number falls in. */
export function overallOf(skills: Record<string, number>): { value: number; tier: string } {
  const vals = SKILLS.map((k) => skills[k] ?? 0)
  const value = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const tier = value >= 85 ? 'World class' : value >= 70 ? 'Elite' : value >= 55 ? 'Rising' : value >= 40 ? 'Promising' : 'Raw'
  return { value, tier }
}

interface LogLine { key: string; turn: number; text: string; sub?: string; tone: string }

/**
 * Life Hub shell. Real: status, skills, reputation, weapons, career log (ripples + memories), the calendar turn.
 * PLACEHOLDER: Train, Squad, Stats, League and the ranking are milestone M3 to M5 and are shown disabled.
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
  const { value: overall, tier } = overallOf(s.skills)
  const log = useMemo<LogLine[]>(() => {
    const lines: LogLine[] = [
      ...s.ripples.map((r) => ({ key: `r${r.id}`, turn: r.turn, text: r.headline, sub: r.choiceLabel ? `You: ${r.choiceLabel}` : undefined, tone: '#e5233b' })),
      ...s.memory.map((m) => ({ key: `m${m.id}`, turn: m.turn, text: m.text, tone: '#6ea0ff' })),
    ]
    return lines.sort((a, b) => b.turn - a.turn || b.key.localeCompare(a.key)).slice(0, 40)
  }, [s.ripples, s.memory])
  const arcName = content.arcs[s.arc.id]?.name ?? s.arc.id
  const foot = s.player.handedness === 'both' ? 'two-footed' : `${s.player.handedness}-footed`
  const energyPct = Math.round((s.life.stamina / Math.max(1, s.life.staminaMax)) * 100)

  return (
    <div className="tone hub" data-testid="hub">
      <div className="hub-wrap">
        <header className="hud">
          <div className="hud-logo"><b>EGOIST LIFE</b><span>{s.player.position} · CAREER</span></div>
          <div className="hud-nav">
            <Link className="nav-tile" style={{ ['--tone' as string]: '#a97bff' }} to="/relationships">Relationships</Link>
            <Link className="nav-tile" style={{ ['--tone' as string]: '#56d3ff' }} to="/ripples">Ripple Log</Link>
            <Link className="nav-tile" style={{ ['--tone' as string]: '#ffd24a' }} to="/gallery">Gallery</Link>
            <Link className="nav-tile" style={{ ['--tone' as string]: '#ff8a3b' }} to="/saves">Save / Load</Link>
            <Link className="nav-tile" style={{ ['--tone' as string]: '#6ea0ff' }} to="/settings">Settings</Link>
            <Link className="nav-tile" style={{ ['--tone' as string]: '#9fa6b8' }} to="/">Menu</Link>
          </div>
          <div className="hud-stats">
            <div className="stat-chip" style={{ ['--tone' as string]: '#ffd24a' }} title="Ranking arrives with the Tag Test (M5): PLACEHOLDER">
              <small>Ranking</small><strong>#— <span style={{ color: '#7e869c', fontSize: '.85rem' }}>/ 300</span></strong>
            </div>
            <div className="stat-chip" style={{ ['--tone' as string]: '#4fd18b' }}>
              <small>Funds</small><strong>¥{s.life.money.toLocaleString()}</strong>
            </div>
            <div className="stat-chip" style={{ ['--tone' as string]: '#e5233b' }}>
              <small>Timeline</small><strong>Week {s.life.week}</strong>
            </div>
            {s.meta.sandboxUsed && <span className="chip" style={{ color: '#ffd98a', alignSelf: 'center' }} title="Sandbox was used in this run">SANDBOX USED</span>}
          </div>
        </header>

        <div className="hub-main">
          <aside className="player-card" aria-label="Player">
            <div className="portrait-box"><Portrait who="player" /></div>
            <h2>{s.player.name}</h2>
            <div className="sub">{s.player.position} · {tier}</div>
            <div className="meta">AGE {s.life.age} · {ORIGIN_NAMES[s.player.origin]} · {arcName}</div>
            <hr className="rule" />
            <div className="overall"><small>Overall</small><div className="big" data-testid="overall">{overall}</div><div className="tier">{tier}</div></div>
            <hr className="rule" />
            <div className="kv"><small>Strong foot</small><strong>{foot}</strong></div>
            <hr className="rule" />
            <div className="bar-row">
              <div className="top"><span>Energy</span><b>{s.life.stamina} / {s.life.staminaMax}</b></div>
              <div className="bar" role="progressbar" aria-label="Energy" aria-valuenow={s.life.stamina} aria-valuemax={s.life.staminaMax}><i style={{ width: `${energyPct}%` }} /></div>
              <div className="top"><span>Action points</span><b style={{ color: '#ffd98a' }}>{s.life.ap} / {s.life.apMax}</b></div>
              <div className="ap-pips" aria-hidden>{Array.from({ length: s.life.apMax }, (_, i) => <i key={i} className={i < s.life.ap ? 'on' : ''} />)}</div>
            </div>
            <div className="bar-row">
              <div className="top"><span>Composure</span><b style={{ color: '#6ea0ff' }}>{s.life.composure}</b></div>
              <div className="bar blue"><i style={{ width: `${Math.min(100, s.life.composure)}%` }} /></div>
              <div className="top"><span>Health</span><b style={{ color: '#ff9aa6' }}>{s.life.health}</b></div>
              <div className="bar red"><i style={{ width: `${Math.min(100, s.life.health)}%` }} /></div>
            </div>
            {s.life.injuries.length > 0 && <div style={{ color: '#ff9aa6', fontSize: '.8rem' }}>Injuries: {s.life.injuries.map((i) => `${i.part} (${i.severity}, ${i.weeksLeft}w)`).join(', ')}</div>}
            <div className="chips" aria-label="Weapons">
              {Object.entries(s.weapons).map(([id, w]) => <span key={id} className="chip" style={{ color: w.corrupted ? '#ff5a6e' : '#6ea0ff' }} title={content.weapons[id] ? RARITY_INFO[content.weapons[id]!.rarity].label : ''}>{content.weapons[id] ? RARITY_INFO[content.weapons[id]!.rarity].glyph + ' ' : ''}{content.weapons[id]?.levels[w.level - 1]?.name ?? id}{w.corrupted ? ' ☠' : ''}</span>)}
            </div>
            <div className="chips" aria-label="Traits">{s.traits.map((t) => <span key={t} className="chip" title={content.traits[t]?.desc}>{content.traits[t]?.name ?? t}</span>)}</div>
            <div className="card-note">{pending} consequence{pending === 1 ? '' : 's'} pending · Mood {s.life.mood} · Intel {s.resources.tacticalIntel}</div>
          </aside>

          <div className="center-col">
            <section className="hub-panel" aria-label="Career log">
              <h3>Career log</h3>
              <div className="log">
                {!opened && <div className="log-row" style={{ ['--tone' as string]: '#ffd98a' }}><i /><small>NOW</small><div className="t">Finish the opening first: the hub unlocks once the first scene ends.</div></div>}
                {log.length === 0 && opened && <div className="log-row"><i /><small>W{s.life.week}</small><div className="t">Welcome back. Current arc: {arcName}.</div></div>}
                {log.map((l) => (
                  <div key={l.key} className="log-row" style={{ ['--tone' as string]: l.tone }}>
                    <i /><small>W{l.turn + 1}</small>
                    <div className="t">{l.text}{l.sub && <em>{l.sub}</em>}</div>
                  </div>
                ))}
              </div>
            </section>
            <div className="two-col">
              <section className="hub-panel" aria-label="Skills">
                <h3>Skills</h3>
                {SKILLS.map((k) => (
                  <div key={k} className="stat-line"><span>{k}</span><Meter value={s.skills[k]} /><span>{s.skills[k]}</span></div>
                ))}
              </section>
              <section className="hub-panel" aria-label="Reputation">
                <h3>Reputation</h3>
                {REP_AXES.map((k) => (
                  <div key={k} className="stat-line"><span>{REP_LABEL[k]}</span><Meter value={s.reputation[k]} /><span>{s.reputation[k]}</span></div>
                ))}
              </section>
            </div>
          </div>
        </div>

        <nav className="action-row" aria-label="Actions">
          <button className="action-tile" style={{ ['--tone' as string]: '#56d3ff' }} disabled title="Weekly training planner: milestone M3 (PLACEHOLDER)"><span className="soon">M3</span>Train<small>spend action points</small></button>
          <button className="action-tile" style={{ ['--tone' as string]: '#a97bff' }} disabled title="Squad and roster: milestone M4 (PLACEHOLDER)"><span className="soon">M4</span>Squad<small>roster · formation</small></button>
          <button className="action-tile go" onClick={advance} data-testid="advance" disabled={!opened}>Next week →<small>{opened ? `${pending} pending` : 'finish the opening first'}</small></button>
          <Link className="action-tile" style={{ ['--tone' as string]: '#9fa6b8' }} to="/relationships">Stats<small>bonds · memory</small></Link>
          <button className="action-tile" style={{ ['--tone' as string]: '#4fd18b' }} disabled title="League and ranking: milestone M5 (PLACEHOLDER)"><span className="soon">M5</span>League<small>ranking · fixtures</small></button>
        </nav>
      </div>
    </div>
  )
}
