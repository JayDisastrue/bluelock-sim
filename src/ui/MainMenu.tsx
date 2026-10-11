import { useNavigate } from 'react-router-dom'
import { INTRO_SCRIPTS } from '../content'
import { AUTOSAVE_KEY, safeStorage } from '../engine/save'
import { useGame } from '../engine/store'
import { useUi } from './uiStore'

export function MainMenu() {
  const nav = useNavigate()
  const inGame = useGame((s) => !!s.state)
  const loadAuto = useGame((s) => s.loadAutosave)
  const hasAuto = !!safeStorage().getItem(AUTOSAVE_KEY)
  const toggleSandbox = useUi((s) => s.toggleSandbox)
  return (
    <div className="tone" style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: '2rem', background: 'radial-gradient(ellipse at 30% 20%, #10204a 0%, #05060a 60%)' }}>
      <div style={{ textAlign: 'center', maxWidth: 560, width: '100%' }}>
        <div className="slash-title" style={{ fontSize: 'clamp(2.6rem, 9vw, 5.5rem)', lineHeight: 0.9, color: '#fff', textShadow: '5px 5px 0 #e5233b, 9px 9px 0 #0a0c14', transform: 'rotate(-3deg)' }}>
          BLUE LOCK
        </div>
        <div className="slash-title" style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.6rem)', color: '#6ea0ff', letterSpacing: '.3em', margin: '.4rem 0 .2rem' }}>EGOIST LIFE</div>
        <p style={{ color: '#9fa6b8', margin: '0 0 2rem', fontStyle: 'italic' }}>The manga, if it happened to you.</p>
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {inGame && <button className="btn primary" onClick={() => nav('/hub')}>Resume</button>}
          {!inGame && hasAuto && <button className="btn primary" onClick={() => { if (loadAuto()) nav('/hub') }}>Continue (autosave)</button>}
          <button className="btn blue" onClick={() => nav('/new')}>New Game</button>
          <button className="btn" onClick={() => nav('/saves')}>Save / Load</button>
          <button className="btn" onClick={() => nav('/gallery')}>Cutscene Gallery</button>
          <button className="btn" onClick={() => nav('/settings')}>Settings</button>
          <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'center' }}>
            <button className="btn small" onClick={() => nav('/dev/cutscenes')}>Cutscene Test Page</button>
            <button className="btn small" onClick={() => nav('/dev/flags')}>Flag Inspector</button>
            <button className="btn small" onClick={toggleSandbox}>Sandbox (~)</button>
          </div>
        </div>
        <p style={{ color: '#5a6280', fontSize: '.75rem', marginTop: '2rem' }}>
          Personal, non-commercial fan project · {INTRO_SCRIPTS.length} playable scenes · autosaves every turn
        </p>
      </div>
    </div>
  )
}
