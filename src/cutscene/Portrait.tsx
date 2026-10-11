import { useState } from 'react'
import { content } from '../content'
import type { Aura, Emotion, PortraitSpec } from '../engine/schemas'
import { AuraLayer, SvgPortrait } from './SvgPortrait'
import { portraitUrl, useManifest } from '../assets'
import { useGame } from '../engine/store'
import { usePreviewPlayer } from './previewPlayer'

/** Neutral stand-in for canon characters whose official art isn't installed: a generic silhouette, not a likeness. */
function Silhouette({ name, aura }: { name: string; aura?: Aura | null }) {
  return (
    <svg viewBox="0 0 200 260" role="img" aria-label={`${name} (no art installed)`} className="portrait-svg">
      {aura && <AuraLayer aura={aura} />}
      <path d="M14 260 Q14 190 70 180 L100 200 L130 180 Q186 190 186 260Z" fill="#242a40" stroke="#0a0a12" strokeWidth="2.5" />
      <ellipse cx="100" cy="116" rx="46" ry="56" fill="#181c2c" stroke="#0a0a12" strokeWidth="2.5" />
      <text x="100" y="128" textAnchor="middle" fontSize="40" fontFamily="Impact, sans-serif" fill="#6ea0ff" opacity="0.7">{name.slice(0, 1)}</text>
      <text x="100" y="246" textAnchor="middle" fontSize="15" fontFamily="Impact, sans-serif" fill="#f2efe6">{name}</text>
    </svg>
  )
}

const emotionFilter: Partial<Record<Emotion, string>> = {
  furious: 'saturate(1.25) contrast(1.1) drop-shadow(0 0 10px rgba(229,35,59,0.7))',
  despair: 'grayscale(0.7) brightness(0.8)',
  shocked: 'contrast(1.2) brightness(1.1)',
  flow: 'saturate(1.3) drop-shadow(0 0 14px rgba(31,107,255,0.9))',
  metavision: 'contrast(1.3) saturate(0.7) drop-shadow(0 0 8px #000)',
  devoured: 'grayscale(1) brightness(0.45) contrast(1.4)',
}

export interface PortraitProps {
  who: string
  emotion?: Emotion
  aura?: Aura | null
  /** crop to head/torso */
  bust?: boolean
}

/**
 * Resolves a character id (or 'player') to art:
 *  1. manifest image (user-supplied or fetched), with emotion-specific file if listed;
 *  2. generated layered SVG for the player and original characters;
 *  3. neutral silhouette for canon characters without art.
 */
export function Portrait({ who, emotion = 'neutral', aura, bust = true }: PortraitProps) {
  const manifest = useManifest()
  const [failed, setFailed] = useState<string | null>(null)
  const player = useGameSpec()
  const ch = who === 'player' ? undefined : content.characters[who]
  const artId = who === 'player' ? 'player' : (ch?.art ?? who)
  const url = portraitUrl(manifest, artId, emotion)

  if (url && failed !== url) {
    return (
      <div className={`portrait-img ${bust ? 'bust' : ''}`} style={{ filter: emotionFilter[emotion] }}>
        {aura && <svg viewBox="0 0 200 260" className="portrait-aura"><AuraLayer aura={aura} /></svg>}
        <img src={url} alt={ch?.name ?? 'player'} draggable={false} onError={() => setFailed(url)} />
      </div>
    )
  }
  if (who === 'player') return <SvgPortrait spec={player} emotion={emotion} aura={aura} parts={manifest.playerParts} />
  if (!ch) return <Silhouette name={who} aura={aura} />
  if (ch.kind === 'original') return <SvgPortrait spec={ch.portrait} emotion={emotion} aura={aura} parts={manifest.playerParts} />
  return <Silhouette name={ch.short} aura={aura} />
}

function useGameSpec(): PortraitSpec {
  const live = useGame((s) => s.state?.player.portrait)
  const preview = usePreviewPlayer((s) => s.portrait)
  return live ?? preview
}

export { AuraLayer, SvgPortrait }
