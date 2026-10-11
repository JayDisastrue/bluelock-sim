import { useState } from 'react'
import { content, contentProblems } from '../content'
import { createPreviewApi } from '../engine/preview'
import { ORIGIN_IDS, type GameState, type OriginId } from '../engine/schemas'
import { useGame } from '../engine/store'
import { Screen } from '../ui/Screen'
import { previewState } from '../ui/previewState'
import { useUi } from '../ui/uiStore'

function delta(a: GameState, b: GameState) {
  const flags = Object.entries(b.flags).filter(([k, v]) => a.flags[k] !== v).map(([k, v]) => `${k}=${String(v)}`)
  const rels = Object.entries(b.relationships).map(([k, r]) => `${k}: ${r.status} (t${r.trust} r${r.respect} f${r.fear} v${r.rivalry})`)
  return { flags, rels, scheduled: b.scheduled.map((x) => `${x.eventId}@${x.due}`), memory: b.memory.map((m) => m.text), ripples: b.ripples.length }
}

/** /dev/cutscenes: preview any script by ID against a throwaway state. */
export function CutsceneTest() {
  const live = useGame((g) => g.state)
  const playPreview = useUi((u) => u.playPreview)
  const [id, setId] = useState('opening.main')
  const [origin, setOrigin] = useState<OriginId>('fallen_ace')
  const [useCurrent, setUseCurrent] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof delta> | null>(null)
  const script = content.scripts[id]

  const run = () => {
    const state = previewState(origin, useCurrent)
    const api = createPreviewApi(state)
    setResult(null)
    playPreview([id], api, () => setResult(delta(state, api.current())))
  }
  return (
    <Screen title="Cutscene Test Page">
      <div className="panel-card" style={{ display: 'grid', gap: 10 }}>
        <label>Script ID{' '}
          <input list="scripts" type="text" value={id} onChange={(e) => setId(e.target.value)} style={{ width: 340 }} data-testid="script-id" />
          <datalist id="scripts">{Object.keys(content.scripts).map((x) => <option key={x} value={x} />)}</datalist>
        </label>
        <label>Origin{' '}
          <select value={origin} onChange={(e) => setOrigin(e.target.value as OriginId)} disabled={useCurrent && !!live} data-testid="origin-select">
            {ORIGIN_IDS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label><input type="checkbox" checked={useCurrent} disabled={!live} onChange={(e) => setUseCurrent(e.target.checked)} /> Start from a copy of the current game{live ? '' : ' (none in progress)'}</label>
        <div>{script ? <span>{script.title} · {script.beats.length} beats</span> : <span style={{ color: '#ff9aa6' }}>No script with that ID.</span>}</div>
        <div><button className="btn primary" disabled={!script} onClick={run} data-testid="play-preview">▶ Play preview</button></div>
        <div style={{ color: '#9fa6b8', fontSize: '.85rem' }}>Preview never touches your save. Keys: Space/Enter advance · 1–9 choose · L log · A auto · F fast · Esc close.</div>
        <div style={{ fontSize: '.85rem' }}>Content validation: {contentProblems.length === 0 ? <b style={{ color: '#4fd18b' }}>✔ all references resolve</b> : <b style={{ color: '#ff9aa6' }}>{contentProblems.length} problems</b>}</div>
      </div>
      {result && (
        <div className="panel-card" style={{ marginTop: 12, fontFamily: 'monospace', fontSize: '.8rem' }} data-testid="result">
          <b>Resulting delta</b>
          <div>flags: {result.flags.join(', ') || '(none)'}</div>
          <div>relationships: {result.rels.join(' | ') || '(none)'}</div>
          <div>scheduled: {result.scheduled.join(', ') || '(none)'}</div>
          <div>memory: {result.memory.join(' / ') || '(none)'}</div>
          <div>ripples: {result.ripples}</div>
        </div>
      )}
    </Screen>
  )
}
