import { ArcSchema, EventSchema, ScriptSchema, TraitSchema } from '../engine/schemas'
import type { ContentDB } from '../engine/types'
import { validateContent } from '../engine/refs'
import { arcs } from './arcs'
import { canon } from './characters/canon'
import { original } from './characters/original'
import { openingEvents, openingEventScripts } from './events/opening-events'
import { flagLabels } from './flags'
import { origins } from './origins'
import { approaches } from './scenes/approach'
import { coldOpens } from './scenes/cold-opens'
import { openingFinale, openingMain } from './scenes/opening'
import { traits } from './traits'
import { weapons } from './weapons'

const byId = <T extends { id: string }>(xs: T[]): Record<string, T> => {
  const out: Record<string, T> = {}
  for (const x of xs) {
    if (out[x.id]) throw new Error(`Duplicate content id "${x.id}"`)
    out[x.id] = x
  }
  return out
}

/** Zod-parses every authored record (filling defaults) and assembles the lookup tables the engine uses. */
export function buildContent(): ContentDB {
  const scripts = [openingMain, openingFinale, ...coldOpens, ...approaches, ...openingEventScripts].map((s) => ScriptSchema.parse(s))
  return {
    characters: byId([...canon, ...original]),
    origins: byId(origins),
    weapons: byId(weapons),
    traits: byId(traits.map((t) => TraitSchema.parse(t))),
    events: byId(openingEvents.map((e) => EventSchema.parse(e))),
    scripts: byId(scripts),
    arcs: byId(arcs.map((a) => ArcSchema.parse(a))),
    flagLabels,
  }
}

export const content: ContentDB = buildContent()

/** Cross-reference problems in authored content (empty when consistent). Checked by tests and shown in dev. */
export const contentProblems: string[] = validateContent(content)

export const OPENING_SCRIPT = 'opening.main'
export const INTRO_SCRIPTS = Object.values(content.scripts).filter((s) => s.gallery)
