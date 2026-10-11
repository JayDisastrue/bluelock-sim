import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { contentProblems } from './content'
import { CutsceneTest } from './dev/CutsceneTest'
import { FlagInspectorPage } from './dev/FlagInspector'
import { Sandbox } from './dev/Sandbox'
import { useSettings } from './engine/settings'
import { useGame } from './engine/store'
import { Gallery } from './ui/Gallery'
import { Hub } from './ui/Hub'
import { MainMenu } from './ui/MainMenu'
import { NewGame } from './ui/NewGame'
import { RelationshipMap } from './ui/RelationshipMap'
import { RippleLog } from './ui/RippleLog'
import { SaveLoad } from './ui/SaveLoad'
import { SceneHost } from './ui/SceneHost'
import { SettingsScreen } from './ui/Settings'
import { useUi } from './ui/uiStore'

export default function App() {
  const toggle = useUi((s) => s.toggleSandbox)
  const reduced = useSettings((s) => s.reducedMotion)
  const colorblind = useSettings((s) => s.colorblind)
  const fontScale = useSettings((s) => s.fontScale)
  const inGame = useGame((s) => !!s.state)
  const loc = useLocation()

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === '`' || e.key === '~') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [toggle])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduced', reduced)
    document.documentElement.toggleAttribute('data-colorblind', colorblind)
    document.documentElement.style.fontSize = `${16 * fontScale}px`
  }, [reduced, colorblind, fontScale])

  useEffect(() => {
    if (contentProblems.length) console.error('Content problems:\n' + contentProblems.join('\n'))
  }, [])

  return (
    <>
      <Sandbox />
      {contentProblems.length > 0 && (
        <div role="alert" style={{ background: '#8f1424', padding: '.5rem 1rem', fontSize: '.85rem' }}>
          {contentProblems.length} content problem(s): {contentProblems[0]} (see console)
        </div>
      )}
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new" element={<NewGame />} />
        <Route path="/hub" element={inGame ? <Hub /> : <Navigate to="/" replace state={{ from: loc.pathname }} />} />
        <Route path="/relationships" element={<RelationshipMap />} />
        <Route path="/ripples" element={<RippleLog />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/saves" element={<SaveLoad />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/dev/cutscenes" element={<CutsceneTest />} />
        <Route path="/dev/flags" element={<FlagInspectorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SceneHost />
    </>
  )
}
