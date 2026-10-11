import { useState } from 'react'
import { content } from '../content'
import type { Aura, Emotion, PortraitSpec } from '../engine/schemas'
import { portraitUrl, useManifest } from '../assets'
import { useGame } from '../engine/store'
import { usePreviewPlayer } from './previewPlayer'

/* ───────────── layered SVG portrait: silhouette + hair + eyes + mouth + brow + aura ───────────── */

const SKIN_SHADE = 'rgba(0,0,0,0.12)'

function Hair({ spec, back }: { spec: PortraitSpec; back: boolean }) {
  const c = spec.hairColor
  const dark = 'rgba(0,0,0,0.25)'
  switch (spec.hair) {
    case 'spiky':
      return back ? null : (
        <g>
          <path d="M52 100 L48 62 L66 78 L72 46 L88 70 L100 38 L112 70 L128 46 L134 78 L152 62 L148 100 Q100 70 52 100Z" fill={c} />
          <path d="M60 96 Q100 76 140 96" stroke={dark} strokeWidth="3" fill="none" />
        </g>
      )
    case 'swept':
      return back ? null : (
        <g>
          <path d="M50 104 Q46 56 100 44 Q158 50 152 106 Q140 78 112 76 Q86 84 62 96Z" fill={c} />
          <path d="M70 84 Q96 66 130 72" stroke={dark} strokeWidth="3" fill="none" />
        </g>
      )
    case 'shaggy':
      return back ? <path d="M48 112 Q40 150 56 160 L64 120Z M152 112 Q160 150 144 160 L136 120Z" fill={c} /> : (
        <g>
          <path d="M48 108 Q40 52 100 42 Q160 52 152 108 L140 84 L126 100 L110 78 L96 100 L80 78 L68 102Z" fill={c} />
        </g>
      )
    case 'buzz':
      return back ? null : <path d="M54 98 Q54 52 100 48 Q146 52 146 98 Q100 76 54 98Z" fill={c} opacity="0.92" />
    case 'undercut':
      return back ? null : <path d="M56 96 Q60 50 104 46 Q150 52 146 94 Q124 66 90 70 Q70 74 56 96Z" fill={c} />
    case 'curly':
      return back ? null : (
        <g fill={c}>
          {[[62, 78], [80, 62], [100, 56], [120, 62], [138, 78], [54, 98], [146, 98], [90, 76], [110, 76]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="17" />
          ))}
        </g>
      )
    case 'long':
      return back ? <path d="M46 100 Q36 170 58 214 L84 150 L116 150 L142 214 Q164 170 154 100Z" fill={c} /> : (
        <path d="M50 104 Q48 56 100 46 Q152 56 150 104 Q130 76 100 80 Q70 76 50 104Z" fill={c} />
      )
    case 'mohawk':
      return back ? null : <path d="M86 98 L90 40 L100 24 L110 40 L114 98 Q100 86 86 98Z" fill={c} />
  }
}

interface EyeProps { x: number; y: number; mirror: boolean; rx: number; ry: number; wide: boolean; half: boolean; emotion: Emotion; ink: string; eyeFill: string; iris: string }

function Eye({ x, y, mirror, rx, ry, wide, half, emotion, ink, eyeFill, iris }: EyeProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={rx + (wide ? 2 : 0)} ry={wide ? ry + 4 : half ? ry * 0.6 : ry} fill={eyeFill} stroke={ink} strokeWidth="2" />
      {emotion === 'devoured' ? (
        <ellipse rx={rx - 2} ry={ry - 1} fill="none" stroke="#e5233b" strokeWidth="1.5" opacity="0.8" />
      ) : emotion === 'metavision' ? (
        <g>
          <circle r={ry} fill={iris} />
          <path d="M-4 -4 L4 -4 L4 4 L-4 4Z M0 -7 L7 0 L0 7 L-7 0Z" fill="none" stroke="#fff" strokeWidth="1.2" />
        </g>
      ) : (
        <g>
          <circle cx={mirror ? -1 : 1} r={wide ? 3.5 : ry * 0.75} fill={iris} />
          <circle cx={mirror ? -3 : 3} cy="-2" r="1.8" fill="#fff" opacity={emotion === 'despair' ? 0.4 : 0.95} />
        </g>
      )}
      {emotion === 'despair' && <path d="M-4 9 Q-6 18 -3 24" stroke="#7fb4ff" strokeWidth="2" fill="none" opacity="0.8" />}
      {half && <path d={`M${-rx - 1} ${-ry * 0.2} L${rx + 1} ${-ry * 0.2}`} stroke={ink} strokeWidth="3" />}
    </g>
  )
}

function Face({ spec, emotion }: { spec: PortraitSpec; emotion: Emotion }) {
  const ec = spec.eyeColor
  const ink = '#14141a'
  const rx = spec.eyes === 'round' ? 11 : spec.eyes === 'droopy' ? 10 : spec.eyes === 'narrow' ? 11 : 10
  const ry = spec.eyes === 'round' ? 10 : spec.eyes === 'narrow' ? 5 : spec.eyes === 'droopy' ? 7 : 7
  const browW = spec.brow === 'thick' ? 5 : spec.brow === 'thin' ? 2 : 3.5
  const lx = 78, rxp = 122, ey = 116
  // brow geometry per emotion: [left inner y, left outer y, right inner y, right outer y]
  const brows: Record<Emotion, [number, number, number, number]> = {
    neutral: [-4, -6, -4, -6], smirk: [-4, -7, -9, -3], furious: [2, -12, 2, -12], shocked: [-14, -16, -14, -16],
    despair: [-13, -3, -13, -3], flow: [-5, -9, -5, -9], metavision: [-6, -8, -6, -8], devoured: [-3, -3, -3, -3],
  }
  const [a, b, c, d] = brows[emotion]
  // eye geometry shared by both eyes
  const eye = { rx, ry, wide: emotion === 'shocked', half: emotion === 'smirk' || emotion === 'despair', emotion, ink, eyeFill: emotion === 'flow' ? '#7fb4ff' : emotion === 'devoured' ? '#05050a' : '#fff', iris: emotion === 'flow' ? '#1f6bff' : emotion === 'devoured' ? '#05050a' : ec }

  const mouth = {
    neutral: <path d="M90 158 Q100 160 110 158" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    smirk: <path d="M88 158 Q102 164 114 152" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />,
    furious: <g><path d="M86 158 Q100 150 114 158 Q100 170 86 158Z" fill="#2a0a0e" stroke={ink} strokeWidth="2" /><path d="M90 157 H110" stroke="#fff" strokeWidth="2.4" /></g>,
    shocked: <ellipse cx="100" cy="160" rx="6" ry="8" fill="#2a0a0e" stroke={ink} strokeWidth="2" />,
    despair: <path d="M88 164 Q100 152 112 164" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />,
    flow: <path d="M86 154 Q100 170 114 154 Q100 160 86 154Z" fill="#2a0a0e" stroke={ink} strokeWidth="2" />,
    metavision: <path d="M92 158 H108" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />,
    devoured: <path d="M90 160 H110" stroke="#e5233b" strokeWidth="2" strokeLinecap="round" />,
  }[emotion]

  return (
    <g>
      <Eye x={lx} y={ey} mirror={false} {...eye} />
      <Eye x={rxp} y={ey} mirror {...eye} />
      <g stroke={spec.hairColor} strokeWidth={browW} strokeLinecap="round" fill="none">
        <path d={`M${lx - 12} ${ey + b} L${lx + 10} ${ey + a}`} />
        <path d={`M${rxp - 10} ${ey + c} L${rxp + 12} ${ey + d}`} />
      </g>
      <path d="M98 128 Q101 142 96 146" stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {mouth}
      {emotion === 'furious' && <path d="M144 88 l5 -6 l-2 8 l6 -2" stroke="#e5233b" strokeWidth="2" fill="none" />}
      {emotion === 'devoured' && <rect x="56" y="104" width="88" height="22" fill="#000" opacity="0.28" />}
      {spec.mark === 'scar' && <path d="M130 104 L144 132" stroke="#a04a4a" strokeWidth="2.5" />}
      {spec.mark === 'bandage' && <g><rect x="124" y="136" width="20" height="9" fill="#f2efe6" stroke="#bbb" transform="rotate(-18 134 140)" /></g>}
      {spec.mark === 'mole' && <circle cx="124" cy="150" r="2.2" fill="#4a2a1f" />}
      {spec.mark === 'freckles' && <g fill="#b0643f" opacity="0.7">{[[70, 138], [78, 142], [86, 138], [114, 138], [122, 142], [130, 138]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}</g>}
    </g>
  )
}

/** Animated aura behind a portrait: blue flame (Flow), black lightning + puzzle shards (Metavision), void (Devoured). */
export function AuraLayer({ aura }: { aura: Aura }) {
  if (aura === 'flow') {
    return (
      <g className="aura aura-flow">
        <path className="flame f1" d="M100 250 C40 200 52 140 74 100 C70 150 100 150 96 70 C130 120 150 170 130 220 C146 190 160 150 150 120 C190 170 170 230 100 250Z" fill="#1f6bff" opacity="0.55" />
        <path className="flame f2" d="M100 250 C60 210 70 160 88 120 C90 160 110 160 110 104 C136 150 140 200 124 232Z" fill="#6ea0ff" opacity="0.7" />
      </g>
    )
  }
  if (aura === 'metavision') {
    return (
      <g className="aura aura-meta">
        <path className="bolt" d="M30 40 L58 90 L40 96 L70 150 M170 30 L146 84 L162 90 L132 150 M20 170 L52 190 L40 204" stroke="#0a0a12" strokeWidth="5" fill="none" strokeLinejoin="bevel" />
        <g fill="none" stroke="#e5233b" strokeWidth="1.8" opacity="0.8" className="shards">
          <path d="M24 70 l14 -6 l6 14 l-14 6z" /><path d="M158 56 l14 4 l-4 14 l-14 -4z" /><path d="M150 190 l16 -2 l2 16 l-16 2z" /><path d="M18 150 l12 -8 l8 12 l-12 8z" />
        </g>
      </g>
    )
  }
  return (
    <g className="aura aura-void">
      <ellipse cx="100" cy="150" rx="92" ry="120" fill="#000" opacity="0.45" />
      <path d="M10 230 Q30 150 20 90 Q60 140 50 210Z M190 230 Q170 150 180 90 Q140 140 150 210Z" fill="#0a0a12" opacity="0.8" />
    </g>
  )
}

export function SvgPortrait({ spec, emotion = 'neutral', aura }: { spec: PortraitSpec; emotion?: Emotion; aura?: Aura | null }) {
  const shoulderW = spec.build === 'broad' ? 94 : spec.build === 'lean' ? 70 : 82
  return (
    <svg viewBox="0 0 200 260" role="img" aria-label="character portrait" className="portrait-svg">
      {aura && <AuraLayer aura={aura} />}
      <Hair spec={spec} back />
      {/* shoulders + kit */}
      <path d={`M${100 - shoulderW} 260 Q${100 - shoulderW} 196 ${100 - 30} 188 L100 204 L${100 + 30} 188 Q${100 + shoulderW} 196 ${100 + shoulderW} 260Z`} fill={spec.kit} stroke="#0a0a12" strokeWidth="2.5" />
      <path d={`M${100 - 22} 190 L100 224 L${100 + 22} 190`} stroke={spec.accent} strokeWidth="4" fill="none" />
      <rect x="86" y="164" width="28" height="30" fill={spec.skin} />
      <rect x="86" y="180" width="28" height="12" fill={SKIN_SHADE} />
      {/* head */}
      <ellipse cx="54" cy="128" rx="8" ry="13" fill={spec.skin} stroke="#0a0a12" strokeWidth="2" />
      <ellipse cx="146" cy="128" rx="8" ry="13" fill={spec.skin} stroke="#0a0a12" strokeWidth="2" />
      <path d="M54 100 Q54 60 100 58 Q146 60 146 100 L144 138 Q136 176 100 182 Q64 176 56 138Z" fill={spec.skin} stroke="#0a0a12" strokeWidth="2.5" />
      <Face spec={spec} emotion={emotion} />
      <Hair spec={spec} back={false} />
    </svg>
  )
}

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
  if (who === 'player') return <SvgPortrait spec={player} emotion={emotion} aura={aura} />
  if (!ch) return <Silhouette name={who} aura={aura} />
  if (ch.kind === 'original') return <SvgPortrait spec={ch.portrait} emotion={emotion} aura={aura} />
  return <Silhouette name={ch.short} aura={aura} />
}

function useGameSpec(): PortraitSpec {
  const live = useGame((s) => s.state?.player.portrait)
  const preview = usePreviewPlayer((s) => s.portrait)
  return live ?? preview
}
