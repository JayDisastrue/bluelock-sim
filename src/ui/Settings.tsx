import type { ReactNode } from 'react'
import { useMeta } from '../engine/meta'
import { useSettings } from '../engine/settings'
import { Screen } from './Screen'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, alignItems: 'center', padding: '.4rem 0', borderBottom: '1px solid #242a40' }}>{label}<span>{children}</span></label>
  )
}

export function SettingsScreen() {
  const s = useSettings()
  const reset = useMeta((m) => m.reset)
  return (
    <Screen title="Settings">
      <div className="panel-card">
        <Row label="Text speed">
          <select value={s.textSpeed} onChange={(e) => s.set({ textSpeed: e.target.value as typeof s.textSpeed })}>
            {['slow', 'normal', 'fast', 'instant'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Row>
        <Row label="Auto-advance delay (ms)"><input type="number" min={400} max={6000} step={100} value={s.autoDelayMs} onChange={(e) => s.set({ autoDelayMs: Number(e.target.value) })} /></Row>
        <Row label="Timed-choice window">
          <select value={s.timerScale} onChange={(e) => s.set({ timerScale: Number(e.target.value) as typeof s.timerScale })}>
            <option value={1}>Standard</option><option value={1.5}>Relaxed ×1.5</option><option value={2}>Generous ×2</option><option value={0}>No timer</option>
          </select>
        </Row>
        <Row label="Text size">
          <select value={s.fontScale} onChange={(e) => s.set({ fontScale: Number(e.target.value) as typeof s.fontScale })}>
            <option value={1}>Normal</option><option value={1.15}>Large</option><option value={1.3}>Extra large</option>
          </select>
        </Row>
        <Row label="Reduced motion"><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.set({ reducedMotion: e.target.checked })} /></Row>
        <Row label="Screen shake"><input type="checkbox" checked={s.shake} onChange={(e) => s.set({ shake: e.target.checked })} /></Row>
        <Row label="Flashes"><input type="checkbox" checked={s.flash} onChange={(e) => s.set({ flash: e.target.checked })} /></Row>
        <Row label="Colour-blind palette"><input type="checkbox" checked={s.colorblind} onChange={(e) => s.set({ colorblind: e.target.checked })} /></Row>
        <Row label="Romance & friendship subplots"><input type="checkbox" checked={s.romance} onChange={(e) => s.set({ romance: e.target.checked })} /></Row>
        <Row label="Music"><input type="checkbox" checked={s.music} onChange={(e) => s.set({ music: e.target.checked })} /></Row>
        <Row label="Character voice clips">
          <select value={s.voiceChance} onChange={(e) => s.set({ voiceChance: Number(e.target.value) as typeof s.voiceChance })} aria-label="Character voice clips">
            <option value={1}>Every line</option><option value={0.6}>Often</option><option value={0.3}>Sometimes</option><option value={0}>Off</option>
          </select>
        </Row>
        <Row label="Sound effects & voice"><input type="checkbox" checked={s.sfx} onChange={(e) => s.set({ sfx: e.target.checked })} /></Row>
        <div style={{ marginTop: 12 }}>
          <button className="btn small" onClick={() => { if (confirm('Clear the cutscene gallery and bonus-origin unlocks?')) reset() }}>Reset gallery &amp; unlocks</button>
        </div>
      </div>
    </Screen>
  )
}
