import type { ReactElement } from 'react'
import type { Manifest } from '../assets'
import { assetUrl } from '../assets'
import type { Aura, Emotion, PortraitSpec } from '../engine/schemas'

/**
 * Layered player/original-character portrait. Every part slot (face, hair, eyes, brow, nose, mark, accessory) is drawn
 * from a built-in id, OR from an imported image at public/assets/player/<slot>/<id>.png (1000×1300, aligned to the
 * template) which replaces the drawn version of that id. Drawn and imported parts mix freely in one stack.
 */
type Parts = Manifest['playerParts']

const INK = '#14141a'
const SKIN_SHADE = 'rgba(0,0,0,0.12)'

function imageFor(parts: Parts, slot: string, id: string, emotion?: string): string | undefined {
  const e = parts?.[slot]?.[id]
  const file = (emotion && e?.[emotion]) || e?.default
  return file ? assetUrl(file) : undefined
}
const PartImage = ({ href, filter }: { href: string; filter?: string }) => <image href={href} x="0" y="0" width="200" height="260" preserveAspectRatio="none" filter={filter ? `url(#${filter})` : undefined} />

/**
 * Imported hair art is black-blue. To honour the hair-colour swatches without a file per colour, the art goes through a
 * gradient map: luminance is stretched and mapped onto a ramp (ink, shadow, base, light, shine) built from the chosen colour.
 * Near-black choices keep the art as drawn.
 */
const hexToRgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
export const isDarkHair = (hex: string) => hex.length !== 7 || hexToRgb(hex).every((v) => v < 0.2)
function HairTint({ hex }: { hex: string }) {
  const t = hexToRgb(hex)
  const mix = (a: number, b: number, k: number) => a + (b - a) * k
  const ramp = (c: number) => [c * 0.08, c * 0.4, c * 0.85, mix(c, 1, 0.35), mix(c, 1, 0.75)].map((v) => v.toFixed(3)).join(' ')
  const g = 2.6
  return (
    <filter id={`hair-${hex.slice(1)}`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
      <feColorMatrix type="matrix" values={`${0.2126 * g} ${0.7152 * g} ${0.0722 * g} 0 0  ${0.2126 * g} ${0.7152 * g} ${0.0722 * g} 0 0  ${0.2126 * g} ${0.7152 * g} ${0.0722 * g} 0 0  0 0 0 1 0`} />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={ramp(t[0])} /><feFuncG type="table" tableValues={ramp(t[1])} /><feFuncB type="table" tableValues={ramp(t[2])} />
      </feComponentTransfer>
    </filter>
  )
}

// ───────────── face shapes ─────────────
const HEAD: Record<string, string> = {
  oval: 'M54 100 Q54 60 100 58 Q146 60 146 100 L144 138 Q136 176 100 182 Q64 176 56 138Z',
  round: 'M52 108 Q50 62 100 58 Q150 62 148 108 Q150 160 100 184 Q50 160 52 108Z',
  square: 'M54 98 Q54 60 100 58 Q146 60 146 98 L148 150 Q146 178 100 182 Q54 178 52 150Z',
  long: 'M58 96 Q58 56 100 52 Q142 56 142 96 L140 150 Q134 186 100 192 Q66 186 60 150Z',
  heart: 'M52 100 Q52 60 100 58 Q148 60 148 100 Q146 140 118 172 Q100 188 82 172 Q54 140 52 100Z',
  sharp: 'M56 98 Q56 60 100 58 Q144 60 144 98 L142 146 L116 180 L100 186 L84 180 L58 146Z',
}

// ───────────── hair ─────────────
function Hair({ spec, back, parts }: { spec: PortraitSpec; back: boolean; parts: Parts }) {
  const img = imageFor(parts, 'hair', spec.hair)
  if (img) {
    if (back) return null
    const tint = !isDarkHair(spec.hairColor)
    return <>{tint && <defs><HairTint hex={spec.hairColor} /></defs>}<PartImage href={img} filter={tint ? `hair-${spec.hairColor.slice(1)}` : undefined} /></>
  }
  const c = spec.hairColor
  const dark = 'rgba(0,0,0,0.25)'
  switch (spec.hair) {
    case 'spiky':
      return back ? null : (
        <g><path d="M52 100 L48 62 L66 78 L72 46 L88 70 L100 38 L112 70 L128 46 L134 78 L152 62 L148 100 Q100 70 52 100Z" fill={c} /><path d="M60 96 Q100 76 140 96" stroke={dark} strokeWidth="3" fill="none" /></g>
      )
    case 'swept':
      return back ? null : (
        <g><path d="M50 104 Q46 56 100 44 Q158 50 152 106 Q140 78 112 76 Q86 84 62 96Z" fill={c} /><path d="M70 84 Q96 66 130 72" stroke={dark} strokeWidth="3" fill="none" /></g>
      )
    case 'shaggy':
      return back ? <path d="M48 112 Q40 150 56 160 L64 120Z M152 112 Q160 150 144 160 L136 120Z" fill={c} /> : (
        <path d="M48 108 Q40 52 100 42 Q160 52 152 108 L140 84 L126 100 L110 78 L96 100 L80 78 L68 102Z" fill={c} />
      )
    case 'buzz':
      return back ? null : <path d="M54 98 Q54 52 100 48 Q146 52 146 98 Q100 76 54 98Z" fill={c} opacity="0.92" />
    case 'undercut':
      return back ? null : <path d="M56 96 Q60 50 104 46 Q150 52 146 94 Q124 66 90 70 Q70 74 56 96Z" fill={c} />
    case 'curly':
      return back ? null : (
        <g fill={c}>{[[62, 78], [80, 62], [100, 56], [120, 62], [138, 78], [54, 98], [146, 98], [90, 76], [110, 76]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="17" />)}</g>
      )
    case 'long':
      return back ? <path d="M46 100 Q36 170 58 214 L84 150 L116 150 L142 214 Q164 170 154 100Z" fill={c} /> : (
        <path d="M50 104 Q48 56 100 46 Q152 56 150 104 Q130 76 100 80 Q70 76 50 104Z" fill={c} />
      )
    case 'mohawk':
      return back ? null : <path d="M86 98 L90 40 L100 24 L110 40 L114 98 Q100 86 86 98Z" fill={c} />
    case 'bob':
      return back ? <path d="M44 100 Q36 156 60 174 L72 120Z M156 100 Q164 156 140 174 L128 120Z" fill={c} /> : (
        <g><path d="M48 106 Q44 54 100 44 Q156 54 152 106 Q132 84 100 86 Q68 84 48 106Z" fill={c} /><path d="M66 82 Q100 66 134 82" stroke={dark} strokeWidth="3" fill="none" /></g>
      )
    case 'ponytail':
      return back ? <path d="M138 78 Q198 86 188 170 Q176 198 164 174 Q172 128 134 112Z" fill={c} /> : (
        <path d="M50 104 Q46 56 100 46 Q154 56 150 104 Q132 80 100 82 Q68 80 50 104Z" fill={c} />
      )
    case 'side_part':
      return back ? null : (
        <g><path d="M50 104 Q46 54 104 46 Q154 52 150 104 Q140 76 112 70 Q84 66 70 92 Q60 98 50 104Z" fill={c} /><path d="M92 50 Q80 66 78 90" stroke={dark} strokeWidth="2.5" fill="none" /></g>
      )
    case 'topknot':
      return back ? <circle cx="100" cy="34" r="17" fill={c} /> : (
        <g><path d="M54 98 Q54 54 100 50 Q146 54 146 98 Q100 78 54 98Z" fill={c} /><rect x="88" y="44" width="24" height="7" rx="3" fill={spec.accent} stroke={INK} strokeWidth="1.5" /></g>
      )
    case 'wavy':
      return back ? <path d="M46 100 Q28 150 52 190 Q44 214 66 222 L84 150 L116 150 L134 222 Q156 214 148 190 Q172 150 154 100Z" fill={c} /> : (
        <path d="M50 104 Q46 56 100 46 Q154 56 150 104 Q138 86 120 92 Q104 80 86 92 Q64 84 50 104Z" fill={c} />
      )
    case 'pixie':
      return back ? null : (
        <g><path d="M52 100 Q50 56 100 48 Q150 54 148 98 Q130 74 104 78 Q74 78 52 100Z" fill={c} /><path d="M128 78 Q146 70 152 90" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" /></g>
      )
    case 'afro':
      return back ? <circle cx="100" cy="70" r="64" fill={c} /> : <path d="M54 100 Q56 70 100 66 Q144 70 146 100 Q124 84 100 86 Q76 84 54 100Z" fill={c} />
    case 'braid':
      return back ? <g fill={c} stroke={INK} strokeWidth="1.2">{[[150, 128], [155, 146], [150, 164], [155, 182], [150, 198]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" />)}</g> : (
        <path d="M50 104 Q46 56 100 46 Q154 56 150 104 Q132 80 100 82 Q68 80 50 104Z" fill={c} />
      )
    default:
      return back ? null : <path d="M50 104 Q46 56 100 46 Q154 56 150 104 Q132 80 100 82 Q68 80 50 104Z" fill={c} />
  }
}

// ───────────── eyes ─────────────
const EYE_SHAPE: Record<string, { rx: number; ry: number; tilt: number; lid?: boolean }> = {
  sharp: { rx: 11, ry: 7, tilt: -6 },
  round: { rx: 11, ry: 10, tilt: 0 },
  narrow: { rx: 11, ry: 5, tilt: 0 },
  droopy: { rx: 10, ry: 7, tilt: 6 },
  upturned: { rx: 11, ry: 7, tilt: -12 },
  wide: { rx: 12, ry: 11, tilt: 0 },
  almond: { rx: 12, ry: 6, tilt: -3 },
  heavy_lid: { rx: 11, ry: 6, tilt: 0, lid: true },
}

interface EyeProps { x: number; y: number; mirror: boolean; rx: number; ry: number; tilt: number; lid?: boolean; wide: boolean; half: boolean; emotion: Emotion; eyeFill: string; iris: string }

function Eye({ x, y, mirror, rx, ry, tilt, lid, wide, half, emotion, eyeFill, iris }: EyeProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${mirror ? -tilt : tilt})`}>
      <ellipse rx={rx + (wide ? 2 : 0)} ry={wide ? ry + 4 : half ? ry * 0.6 : ry} fill={eyeFill} stroke={INK} strokeWidth="2" />
      {emotion === 'devoured' ? (
        <ellipse rx={rx - 2} ry={ry - 1} fill="none" stroke="#e5233b" strokeWidth="1.5" opacity="0.8" />
      ) : emotion === 'metavision' ? (
        <g><circle r={ry} fill={iris} /><path d="M-4 -4 L4 -4 L4 4 L-4 4Z M0 -7 L7 0 L0 7 L-7 0Z" fill="none" stroke="#fff" strokeWidth="1.2" /></g>
      ) : (
        <g><circle cx={mirror ? -1 : 1} r={wide ? 3.5 : ry * 0.75} fill={iris} /><circle cx={mirror ? -3 : 3} cy="-2" r="1.8" fill="#fff" opacity={emotion === 'despair' ? 0.4 : 0.95} /></g>
      )}
      {emotion === 'despair' && <path d="M-4 9 Q-6 18 -3 24" stroke="#7fb4ff" strokeWidth="2" fill="none" opacity="0.8" />}
      {(half || lid) && <path d={`M${-rx - 1} ${-ry * (lid ? 0.35 : 0.2)} L${rx + 1} ${-ry * (lid ? 0.35 : 0.2)}`} stroke={INK} strokeWidth={lid ? 4 : 3} />}
    </g>
  )
}

// ───────────── brows ─────────────
const BROW_STYLE: Record<string, { w: number; arch: number; tilt: number }> = {
  straight: { w: 3.5, arch: 0, tilt: 0 },
  thick: { w: 5.5, arch: 0, tilt: 0 },
  thin: { w: 2, arch: -1, tilt: 0 },
  arched: { w: 3.5, arch: 6, tilt: 0 },
  angled: { w: 4, arch: 0, tilt: 4 },
  soft: { w: 3, arch: -3, tilt: -2 },
}

const NOSE: Record<string, ReactElement> = {
  small: <path d="M99 132 Q101 140 97 143" stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinecap="round" />,
  straight: <path d="M98 128 Q101 142 96 146" stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinecap="round" />,
  pointed: <path d="M100 124 L104 144 L96 146" stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinejoin="round" />,
  broad: <g stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinecap="round"><path d="M94 142 Q100 150 106 142" /><path d="M99 128 Q101 138 99 142" /></g>,
}

function Face({ spec, emotion, parts }: { spec: PortraitSpec; emotion: Emotion; parts: Parts }) {
  const ec = spec.eyeColor
  const shape = EYE_SHAPE[spec.eyes] ?? EYE_SHAPE.sharp!
  const bs = BROW_STYLE[spec.brow] ?? BROW_STYLE.straight!
  const lx = 78, rxp = 122, ey = 116
  const brows: Record<Emotion, [number, number, number, number]> = {
    neutral: [-4, -6, -4, -6], smirk: [-4, -7, -9, -3], furious: [2, -12, 2, -12], shocked: [-14, -16, -14, -16],
    despair: [-13, -3, -13, -3], flow: [-5, -9, -5, -9], metavision: [-6, -8, -6, -8], devoured: [-3, -3, -3, -3],
  }
  const [a, b, c, d] = brows[emotion]
  const eye = {
    ...shape,
    wide: emotion === 'shocked',
    half: emotion === 'smirk' || emotion === 'despair',
    emotion,
    eyeFill: emotion === 'flow' ? '#7fb4ff' : emotion === 'devoured' ? '#05050a' : '#fff',
    iris: emotion === 'flow' ? '#1f6bff' : emotion === 'devoured' ? '#05050a' : ec,
  }
  const arch = bs.arch
  const browPath = (x1: number, y1: number, x2: number, y2: number, innerFirst: boolean) => {
    const ia = bs.tilt
    const yy1 = innerFirst ? y1 : y1 + ia
    const yy2 = innerFirst ? y2 + ia : y2
    return `M${x1} ${yy1} Q${(x1 + x2) / 2} ${(yy1 + yy2) / 2 - arch} ${x2} ${yy2}`
  }
  const mouth = {
    neutral: <path d="M90 158 Q100 160 110 158" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    smirk: <path d="M88 158 Q102 164 114 152" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />,
    furious: <g><path d="M86 158 Q100 150 114 158 Q100 170 86 158Z" fill="#2a0a0e" stroke={INK} strokeWidth="2" /><path d="M90 157 H110" stroke="#fff" strokeWidth="2.4" /></g>,
    shocked: <ellipse cx="100" cy="160" rx="6" ry="8" fill="#2a0a0e" stroke={INK} strokeWidth="2" />,
    despair: <path d="M88 164 Q100 152 112 164" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />,
    flow: <path d="M86 154 Q100 170 114 154 Q100 160 86 154Z" fill="#2a0a0e" stroke={INK} strokeWidth="2" />,
    metavision: <path d="M92 158 H108" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />,
    devoured: <path d="M90 160 H110" stroke="#e5233b" strokeWidth="2" strokeLinecap="round" />,
  }[emotion]

  const eyesImg = imageFor(parts, 'eyes', spec.eyes, emotion)
  const browImg = imageFor(parts, 'brow', spec.brow, emotion)
  const noseImg = imageFor(parts, 'nose', spec.nose, emotion)
  const markImg = spec.mark !== 'none' ? imageFor(parts, 'mark', spec.mark, emotion) : undefined

  return (
    <g>
      {eyesImg ? <PartImage href={eyesImg} /> : (<><Eye x={lx} y={ey} mirror={false} {...eye} /><Eye x={rxp} y={ey} mirror {...eye} /></>)}
      {browImg ? <PartImage href={browImg} /> : (
        <g stroke={spec.hairColor} strokeWidth={bs.w} strokeLinecap="round" fill="none">
          <path d={browPath(lx - 12, ey + b, lx + 10, ey + a, false)} />
          <path d={browPath(rxp - 10, ey + c, rxp + 12, ey + d, true)} />
        </g>
      )}
      {noseImg ? <PartImage href={noseImg} /> : (NOSE[spec.nose] ?? NOSE.straight)}
      {mouth}
      {emotion === 'furious' && <path d="M144 88 l5 -6 l-2 8 l6 -2" stroke="#e5233b" strokeWidth="2" fill="none" />}
      {emotion === 'devoured' && <rect x="56" y="104" width="88" height="22" fill="#000" opacity="0.28" />}
      {markImg ? <PartImage href={markImg} /> : (
        <>
          {spec.mark === 'scar' && <path d="M130 104 L144 132" stroke="#a04a4a" strokeWidth="2.5" />}
          {spec.mark === 'bandage' && <rect x="124" y="136" width="20" height="9" fill="#f2efe6" stroke="#bbb" transform="rotate(-18 134 140)" />}
          {spec.mark === 'mole' && <circle cx="124" cy="150" r="2.2" fill="#4a2a1f" />}
          {spec.mark === 'freckles' && <g fill="#b0643f" opacity="0.7">{[[70, 138], [78, 142], [86, 138], [114, 138], [122, 142], [130, 138]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}</g>}
          {spec.mark === 'eyebags' && <path d="M68 130 Q78 136 88 130 M112 130 Q122 136 132 130" stroke="rgba(90,40,70,.5)" strokeWidth="2" fill="none" strokeLinecap="round" />}
          {spec.mark === 'bruise' && <ellipse cx="130" cy="141" rx="10" ry="7" fill="#7a4a8a" opacity="0.45" />}
        </>
      )}
    </g>
  )
}

function Accessory({ spec, parts }: { spec: PortraitSpec; parts: Parts }) {
  const img = spec.accessory !== 'none' ? imageFor(parts, 'accessory', spec.accessory) : undefined
  if (img) return <PartImage href={img} />
  switch (spec.accessory) {
    case 'headband': return <path d="M52 88 Q100 72 148 88 L148 99 Q100 85 52 99Z" fill={spec.accent} stroke={INK} strokeWidth="1.5" />
    case 'glasses': return (
      <g fill="rgba(255,255,255,0.12)" stroke={INK} strokeWidth="2.5">
        <rect x="58" y="103" width="38" height="27" rx="9" /><rect x="104" y="103" width="38" height="27" rx="9" />
        <path d="M96 114 H104" fill="none" /><path d="M58 113 L50 110 M142 113 L150 110" fill="none" />
      </g>
    )
    case 'earring': return <circle cx="54" cy="146" r="3.6" fill={spec.accent} stroke={INK} strokeWidth="1" />
    case 'hair_clip': return (
      <g transform="rotate(-20 128 78)"><rect x="116" y="73" width="24" height="6" rx="2" fill={spec.accent} stroke={INK} strokeWidth="1.2" /><rect x="121" y="79" width="14" height="4" rx="2" fill={spec.accent} stroke={INK} strokeWidth="1.2" /></g>
    )
    default: return null
  }
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

export interface SvgPortraitProps {
  spec: PortraitSpec
  emotion?: Emotion
  aura?: Aura | null
  parts?: Parts
  /** SVG viewBox override, used to crop thumbnails (default "0 0 200 260") */
  crop?: string
  label?: string
}

export function SvgPortrait({ spec, emotion = 'neutral', aura, parts, crop, label = 'character portrait' }: SvgPortraitProps) {
  const shoulderW = spec.build === 'broad' ? 94 : spec.build === 'lean' ? 70 : 82
  const faceImg = imageFor(parts, 'face', spec.face)
  return (
    <svg viewBox={crop ?? '0 0 200 260'} role="img" aria-label={label} className="portrait-svg">
      {aura && <AuraLayer aura={aura} />}
      <Hair spec={spec} back parts={parts} />
      <path d={`M${100 - shoulderW} 260 Q${100 - shoulderW} 196 ${100 - 30} 188 L100 204 L${100 + 30} 188 Q${100 + shoulderW} 196 ${100 + shoulderW} 260Z`} fill={spec.kit} stroke={INK} strokeWidth="2.5" />
      <path d={`M${100 - 22} 190 L100 224 L${100 + 22} 190`} stroke={spec.accent} strokeWidth="4" fill="none" />
      <rect x="86" y="164" width="28" height="30" fill={spec.skin} />
      <rect x="86" y="180" width="28" height="12" fill={SKIN_SHADE} />
      {faceImg ? <PartImage href={faceImg} /> : (
        <>
          <ellipse cx="54" cy="128" rx="8" ry="13" fill={spec.skin} stroke={INK} strokeWidth="2" />
          <ellipse cx="146" cy="128" rx="8" ry="13" fill={spec.skin} stroke={INK} strokeWidth="2" />
          <path d={HEAD[spec.face] ?? HEAD.oval} fill={spec.skin} stroke={INK} strokeWidth="2.5" />
        </>
      )}
      <Face spec={spec} emotion={emotion} parts={parts} />
      <Hair spec={spec} back={false} parts={parts} />
      <Accessory spec={spec} parts={parts} />
    </svg>
  )
}
