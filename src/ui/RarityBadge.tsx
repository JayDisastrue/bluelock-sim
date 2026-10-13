import { RARITY_INFO, type Rarity } from '../engine/schemas'

/** Rarity as glyph + label (never colour alone, so it survives colour-blind mode). */
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const r = RARITY_INFO[rarity]
  return <span className="chip" data-testid="rarity-badge" data-rarity={rarity} title={`${r.label} (${rarity})`}>{r.glyph} {r.label}</span>
}
