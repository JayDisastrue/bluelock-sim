import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Common frame for non-cutscene screens. */
export function Screen({ title, children, back = '/' }: { title: string; children: ReactNode; back?: string }) {
  return (
    <div className="tone" style={{ minHeight: '100%', padding: '1.2rem 1.5rem 3rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
          <Link to={back} className="btn small">← Back</Link>
          <h1 className="slash-title" style={{ fontSize: '2.2rem', margin: 0, color: '#fff', textShadow: '3px 3px 0 #e5233b' }}>{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Meter({ value, min = 0, max = 100, label }: { value: number; min?: number; max?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, ((Math.abs(value) - 0) / Math.max(Math.abs(max), Math.abs(min))) * 100))
  return (
    <div title={label}>
      <div className={`meter ${value < 0 ? 'neg' : ''}`}><i style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
