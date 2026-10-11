import { useEffect } from 'react'
import { content } from '../content'
import type { RippleEntry } from '../engine/schemas'

const GLYPH = { good: '▲', bad: '▼', neutral: '●' } as const
const WORD = { good: 'better', bad: 'worse', neutral: 'changed' } as const

/** Manga-style card showing who noticed a choice and what rippled out of it. */
export function RippleCard({ ripple, onDismiss }: { ripple: RippleEntry; onDismiss?: () => void }) {
  useEffect(() => {
    if (!onDismiss) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
      }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [onDismiss])
  return (
    <div className="ripple-scrim" onClick={(e) => { e.stopPropagation(); onDismiss?.() }} role="dialog" aria-label="Ripple">
      <div className="ripple">
        <header><span className="h1">RIPPLE</span><span className="h2">{ripple.headline}</span></header>
        <div className="body">
          {ripple.choiceLabel && <div className="said">{ripple.choiceLabel}</div>}
          {ripple.noticed.length > 0 && (
            <div className="noticed">Noticed: {ripple.noticed.map((n) => content.characters[n]?.short ?? n).join(', ')}</div>
          )}
          <ul>
            {ripple.changes.map((c, i) => (
              <li key={i} className={c.tone}>
                <span className="g" aria-label={WORD[c.tone]}>{GLYPH[c.tone]}</span>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
          {ripple.hint && <div className="hint">{ripple.hint}</div>}
          {onDismiss && <div className="go">Press Enter / click to continue</div>}
        </div>
      </div>
    </div>
  )
}
