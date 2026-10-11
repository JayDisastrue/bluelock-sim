import type { GameState, OriginId } from './schemas'
import type { ContentDB } from './types'

export const ORIGIN_NAMES: Record<OriginId, string> = {
  fallen_ace: 'Fallen High School Ace',
  academy_exile: 'Academy Exile',
  street_renegade: 'Street Football Renegade',
  overlooked_playmaker: 'Overlooked Playmaker',
  prodigys_shadow: "The Prodigy's Shadow",
  late_starter: 'The Late Starter',
}

/** Substitutes {player}, {origin}, {recall:<npc>} (latest memory involving that NPC). */
export function renderText(text: string, s: GameState, content?: Pick<ContentDB, 'characters'>): string {
  return text
    .replace(/\{player\}/g, s.player.name)
    .replace(/\{origin\}/g, ORIGIN_NAMES[s.player.origin])
    .replace(/\{recall:([a-z0-9_]+)\}/g, (_m, npc: string) => {
      const m = [...s.memory].reverse().find((x) => x.target === npc)
      return m ? m.text : `what happened with ${content?.characters[npc]?.short ?? npc}`
    })
}

/** Splits `*emphasis*` markup into styled runs. */
export function parseEmphasis(text: string): { text: string; em: boolean }[] {
  const out: { text: string; em: boolean }[] = []
  text.split(/(\*[^*]+\*)/g).forEach((part) => {
    if (!part) return
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) out.push({ text: part.slice(1, -1), em: true })
    else out.push({ text: part, em: false })
  })
  return out
}
