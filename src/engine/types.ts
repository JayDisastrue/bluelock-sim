import type { Arc, Character, GameEvent, Script, Trait, Weapon, Origin } from './schemas'

/** Everything the engine needs to know about authored content. Built by `content/index.ts`; tests build tiny ones. */
export interface ContentDB {
  characters: Record<string, Character>
  origins: Record<string, Origin>
  weapons: Record<string, Weapon>
  traits: Record<string, Trait>
  events: Record<string, GameEvent>
  scripts: Record<string, Script>
  arcs: Record<string, Arc>
  /** human-readable text for flags that deserve a line on a Ripple card */
  flagLabels: Record<string, string>
}

/** The narrow surface the cutscene runner uses to touch the game. */
export interface GameAPI {
  get(): import('./schemas').GameState
  apply(effects: import('./schemas').Effect[], source: string): void
  /** called once per script start/finish so replay gallery & seen-scene tracking work */
  markSeen(scriptId: string): void
  pushRipple(entry: import('./schemas').RippleEntry): void
}
