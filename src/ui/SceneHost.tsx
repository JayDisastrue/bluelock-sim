import { CutscenePlayer } from '../cutscene/CutscenePlayer'
import { liveApi } from '../engine/store'
import { useUi } from './uiStore'

/** Renders the active cutscene full-screen above whatever screen is mounted. */
export function SceneHost() {
  const scene = useUi((s) => s.scene)
  const key = useUi((s) => s.sceneKey)
  const next = useUi((s) => s.nextScene)
  const close = useUi((s) => s.closeScene)
  if (!scene) return null
  const script = scene.scripts[scene.index]!
  const api = scene.api === 'live' ? liveApi : scene.api
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}>
      <CutscenePlayer key={key} scriptId={script} api={api} onDone={next} onClose={scene.api === 'live' ? undefined : close} />
    </div>
  )
}
