import { useNavigate } from 'react-router-dom'
import { INTRO_SCRIPTS } from '../content'
import { createPreviewApi } from '../engine/preview'
import { useMeta } from '../engine/meta'
import { Screen } from './Screen'
import { previewState } from './previewState'
import { useUi } from './uiStore'

/** Replay gallery: scenes unlock as you see them. Replays run on a throwaway state; they never touch your save. */
export function Gallery() {
  const seen = useMeta((m) => m.seenScripts)
  const playPreview = useUi((u) => u.playPreview)
  const nav = useNavigate()
  const unlocked = INTRO_SCRIPTS.filter((s) => seen.includes(s.id)).length
  return (
    <Screen title="Cutscene Gallery">
      <p style={{ color: '#9fa6b8' }}>{unlocked} / {INTRO_SCRIPTS.length} scenes unlocked. Replays are non-canon: choices in them don’t change your save.</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {INTRO_SCRIPTS.map((s) => {
          const ok = seen.includes(s.id)
          return (
            <div key={s.id} className="panel-card" style={{ opacity: ok ? 1 : 0.5 }}>
              <div className="slash-title" style={{ fontSize: '1.2rem' }}>{ok ? s.title : '??? ? ???'}</div>
              <div style={{ color: '#9fa6b8', minHeight: '2.6em' }}>{ok ? s.blurb : 'Not yet seen.'}</div>
              <button className="btn small" disabled={!ok} onClick={() => { nav('/gallery'); playPreview([s.id], createPreviewApi(previewState())) }}>▶ Replay</button>
            </div>
          )
        })}
      </div>
    </Screen>
  )
}
