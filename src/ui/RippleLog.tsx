import { RippleCard } from '../cutscene/RippleCard'
import { useGame } from '../engine/store'
import { Screen } from './Screen'

export function RippleLog() {
  const s = useGame((g) => g.state)
  if (!s) return <Screen title="Ripple Log"><p>Start or load a game first.</p></Screen>
  const list = [...s.ripples].reverse()
  return (
    <Screen title="Ripple Log" back="/hub">
      {list.length === 0 && <div className="panel-card">No ripples yet: every major choice leaves one here.</div>}
      <div style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
        {list.map((r) => (
          <div key={r.id} style={{ position: 'relative', height: 'auto' }}>
            <div style={{ color: '#9fa6b8', fontSize: '.8rem', marginBottom: 4 }}>Week {r.turn} · {r.source.replace('scene:', '')}</div>
            <div style={{ position: 'static', fontSize: 14 }} className="ripple-static"><RippleCard ripple={r} /></div>
          </div>
        ))}
      </div>
      <style>{`.ripple-static .ripple-scrim{position:static;background:none;display:block;cursor:default;animation:none}.ripple-static .ripple{width:100%;animation:none;font-size:14px}.ripple-static .ripple header .h1{font-size:28px}.ripple-static .ripple .body{font-size:15px}`}</style>
    </Screen>
  )
}
