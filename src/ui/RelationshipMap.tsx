import { useState } from 'react'
import { content } from '../content'
import { Portrait } from '../cutscene/Portrait'
import { blankRel } from '../engine/relationships'
import { REL_FIELDS } from '../engine/schemas'
import { useGame } from '../engine/store'
import { Meter, Screen } from './Screen'

const STATUS_GLYPH: Record<string, string> = { Stranger: '○', Ally: '◆', Devoted: '★', Subordinate: '▼', Rival: '⚔', Hostile: '✖', Devoured: '☠', Eliminated: '∅' }
const STATUS_COLOR: Record<string, string> = { Stranger: '#9fa6b8', Ally: '#4fd18b', Devoted: '#ffd98a', Subordinate: '#c08aff', Rival: '#ff7a3b', Hostile: '#ff3b52', Devoured: '#e5233b', Eliminated: '#5a6280' }

export function RelationshipMap() {
  const s = useGame((g) => g.state)
  const [sel, setSel] = useState<string | null>(null)
  if (!s) return <Screen title="Relationships"><p>Start or load a game first.</p></Screen>
  const ids = Object.keys(s.relationships)
  const R = 230
  const cx = 300, cy = 270
  const pos = (i: number) => ({ x: cx + R * Math.cos((i / Math.max(1, ids.length)) * 2 * Math.PI - Math.PI / 2), y: cy + R * Math.sin((i / Math.max(1, ids.length)) * 2 * Math.PI - Math.PI / 2) })
  const selId = sel && s.relationships[sel] ? sel : null
  const r = selId ? s.relationships[selId]! : blankRel()
  return (
    <Screen title="Relationship Map" back={s ? '/hub' : '/'}>
      {ids.length === 0 ? <div className="panel-card">You haven’t met anyone yet.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,620px) minmax(260px,1fr)', gap: '1rem' }}>
          <svg viewBox="0 0 600 540" className="panel-card" style={{ padding: 0, width: '100%' }} role="img" aria-label="Relationship graph">
            {ids.map((id, i) => {
              const p = pos(i)
              const rel = s.relationships[id]!
              const w = 1 + Math.max(Math.abs(rel.trust), rel.rivalry) / 20
              return <line key={`l${id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={STATUS_COLOR[rel.status]} strokeWidth={w} strokeDasharray={rel.status === 'Eliminated' ? '4 6' : undefined} opacity="0.7" />
            })}
            <circle cx={cx} cy={cy} r="34" fill="#1f6bff" stroke="#fff" strokeWidth="3" />
            <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff" fontFamily="Impact" fontSize="14">{s.player.name.slice(0, 10)}</text>
            {ids.map((id, i) => {
              const p = pos(i)
              const rel = s.relationships[id]!
              const active = id === selId
              return (
                <g key={id} transform={`translate(${p.x} ${p.y})`} onClick={() => setSel(id)} style={{ cursor: 'pointer' }} tabIndex={0} role="button" aria-label={`${content.characters[id]?.short ?? id}: ${rel.status}`} onKeyDown={(e) => { if (e.key === 'Enter') setSel(id) }}>
                  <circle r="28" fill="#10131f" stroke={STATUS_COLOR[rel.status]} strokeWidth={active ? 5 : 3} />
                  <text y="5" textAnchor="middle" fill="#f2efe6" fontSize="12" fontWeight="700">{(content.characters[id]?.short ?? id).slice(0, 8)}</text>
                  <text y="46" textAnchor="middle" fill={STATUS_COLOR[rel.status]} fontSize="12" fontWeight="700">{STATUS_GLYPH[rel.status]} {rel.status}</text>
                </g>
              )
            })}
          </svg>
          <div className="panel-card">
            {!selId && <div style={{ color: '#9fa6b8' }}>Select someone on the map.</div>}
            {selId && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 70, height: 90 }}><Portrait who={selId} /></div>
                  <div>
                    <div className="slash-title" style={{ fontSize: '1.4rem' }}>{content.characters[selId]?.name ?? selId}</div>
                    <span className="chip" style={{ color: STATUS_COLOR[r.status] }}>{STATUS_GLYPH[r.status]} {r.status}{r.pinned ? ' · pinned' : ''}</span>
                  </div>
                </div>
                {REL_FIELDS.map((f) => (
                  <div key={f} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: 8, alignItems: 'center' }}>
                    <span style={{ textTransform: 'capitalize', color: '#9fa6b8' }}>{f}</span><Meter value={r[f]} /><span>{r[f]}</span>
                  </div>
                ))}
                <div style={{ color: '#cfd6ee', fontStyle: 'italic' }}>{content.characters[selId]?.originVariants[s.player.origin]}</div>
                <h3 className="slash-title">Memory</h3>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {s.memory.filter((m) => m.target === selId).map((m) => <li key={m.id}>{m.text}</li>)}
                  {s.memory.every((m) => m.target !== selId) && <li style={{ color: '#5a6280' }}>Nothing yet.</li>}
                </ul>
                <div>{Object.keys(s.flags).filter((f) => f.endsWith(`:${selId}`)).map((f) => <span key={f} className="chip" style={{ marginRight: 4 }}>{f.split(':')[0]}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </Screen>
  )
}
