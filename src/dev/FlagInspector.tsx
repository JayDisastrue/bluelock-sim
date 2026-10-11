import { useMemo, useState } from 'react'
import { content } from '../content'
import { collectFlagRefs, flagUsage } from '../engine/refs'
import { useGame } from '../engine/store'
import { Screen } from '../ui/Screen'

/** View/toggle any story flag and see which events and scenes depend on it. */
export function FlagInspector() {
  const s = useGame((g) => g.state)
  const sandbox = useGame((g) => g.sandbox)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const authored = useMemo(() => [...new Set(collectFlagRefs(content).map((r) => r.name))].sort(), [])
  if (!s) return <p>No game in progress.</p>
  const all = [...new Set([...Object.keys(s.flags), ...authored])].filter((f) => f.toLowerCase().includes(q.toLowerCase())).sort()
  const usage = sel ? flagUsage(content, sel) : null
  const val = (f: string) => s.flags[f]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input type="text" placeholder="filter flags…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} aria-label="Filter flags" />
          <input type="text" placeholder="new flag" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New flag name" style={{ width: 140 }} />
          <button className="btn small" disabled={!newName.trim()} onClick={() => { sandbox((d) => { d.flags[newName.trim()] = true }); setNewName('') }}>Add</button>
        </div>
        <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #242a40' }}>
          <table style={{ width: '100%', fontSize: '.85rem' }}><tbody>
            {all.map((f) => {
              const v = val(f)
              const on = v !== undefined && v !== false && v !== 0 && v !== ''
              return (
                <tr key={f} onClick={() => setSel(f)} style={{ background: sel === f ? '#242a40' : 'transparent', cursor: 'pointer' }}>
                  <td><input type="checkbox" aria-label={`Toggle ${f}`} checked={on} onChange={(e) => sandbox((d) => { if (e.target.checked) d.flags[f] = typeof v === 'string' ? v : true; else delete d.flags[f] })} onClick={(e) => e.stopPropagation()} /></td>
                  <td style={{ fontFamily: 'monospace', color: on ? '#fff' : '#5a6280' }}>{f}</td>
                  <td style={{ color: '#6ea0ff' }}>{on && v !== true ? String(v) : ''}</td>
                </tr>
              )
            })}
          </tbody></table>
        </div>
      </div>
      <div style={{ fontSize: '.85rem' }}>
        {!sel && <div style={{ color: '#9fa6b8' }}>Select a flag to see what sets it and what reads it.</div>}
        {sel && usage && (
          <div style={{ display: 'grid', gap: 6 }}>
            <div className="slash-title" style={{ fontFamily: 'monospace' }}>{sel}</div>
            <div><b>Set by:</b> {usage.setBy.length ? usage.setBy.join(' · ') : <i style={{ color: '#5a6280' }}>nothing authored (dynamic or sandbox)</i>}</div>
            <div><b>Read by:</b> {usage.readBy.length ? usage.readBy.join(' · ') : <i style={{ color: '#5a6280' }}>nothing</i>}</div>
            {usage.events.length > 0 && <div><b>Gates events:</b> {usage.events.join(', ')}</div>}
            {content.flagLabels[sel] && <div style={{ color: '#cfd6ee' }}>“{content.flagLabels[sel]}”</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export function FlagInspectorPage() {
  return <Screen title="Flag Inspector"><div className="panel-card"><FlagInspector /></div></Screen>
}
