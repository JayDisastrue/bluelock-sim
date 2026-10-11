import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AUTOSAVE_KEY, SLOT_COUNT, deleteSave, listSlots, parseSave, readSave, slotKey, writeSave, type SlotSummary } from '../engine/save'
import { ORIGIN_NAMES } from '../engine/text'
import type { OriginId } from '../engine/schemas'
import { useGame } from '../engine/store'
import { Screen } from './Screen'

export function SaveLoad() {
  const nav = useNavigate()
  const state = useGame((g) => g.state)
  const load = useGame((g) => g.load)
  const [slots, setSlots] = useState<SlotSummary[]>(() => listSlots())
  const [msg, setMsg] = useState<string>('')
  const file = useRef<HTMLInputElement>(null)
  const refresh = () => setSlots(listSlots())

  const doLoad = (key: string) => {
    const r = readSave(key)
    if (!r.ok) return setMsg(`Could not load: ${r.error}`)
    load(r.save.data)
    nav('/hub')
  }
  const exportJson = () => {
    if (!state) return
    const blob = new Blob([JSON.stringify({ format: 'bluelock-egoist-life', version: 1, savedAt: new Date().toISOString(), label: 'Export', data: state }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `egoist-life-${state.player.name}-week${state.meta.turn}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (f: File) => {
    const r = parseSave(await f.text())
    if (!r.ok) return setMsg(`Import failed: ${r.error}`)
    load(r.save.data)
    setMsg('Imported.')
    nav('/hub')
  }
  return (
    <Screen title="Save / Load" back={state ? '/hub' : '/'}>
      <div style={{ display: 'grid', gap: 10 }}>
        {slots.map((s) => (
          <div key={s.key} className="panel-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }} data-testid={`slot-${s.slot}`}>
            <div>
              <div className="slash-title">{s.slot === 'auto' ? 'Autosave' : `Slot ${s.slot}`}</div>
              {s.empty ? <span style={{ color: '#5a6280' }}>Empty</span> : s.corrupt ? <span style={{ color: '#ff9aa6' }}>Unreadable: {s.corrupt}</span> : (
                <span>
                  {s.name} · {ORIGIN_NAMES[s.origin as OriginId] ?? s.origin} · week {s.week} · {new Date(s.savedAt!).toLocaleString()}
                  {s.sandboxUsed && <span className="chip" style={{ marginLeft: 8, color: '#ffd98a' }}>SANDBOX_USED</span>}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {s.slot !== 'auto' && <button className="btn small" disabled={!state} onClick={() => { writeSave(slotKey(s.slot as number), state!, 'Manual'); refresh(); setMsg(`Saved to slot ${s.slot}.`) }}>Save</button>}
              <button className="btn small" disabled={s.empty || !!s.corrupt} onClick={() => doLoad(s.key)}>Load</button>
              <button className="btn small" disabled={s.empty} onClick={() => { deleteSave(s.key); refresh() }}>Delete</button>
            </div>
          </div>
        ))}
        <div className="panel-card" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn small" disabled={!state} onClick={exportJson}>Export current game (JSON)</button>
          <button className="btn small" onClick={() => file.current?.click()}>Import save (JSON)</button>
          <input ref={file} type="file" accept="application/json,.json" hidden data-testid="import-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = '' }} />
          <span style={{ color: '#9fa6b8', fontSize: '.85rem' }}>{SLOT_COUNT} manual slots + autosave ({AUTOSAVE_KEY}). Saves are validated and versioned.</span>
        </div>
        {msg && <div role="status" className="panel-card" style={{ borderColor: '#e5233b' }}>{msg}</div>}
      </div>
    </Screen>
  )
}
