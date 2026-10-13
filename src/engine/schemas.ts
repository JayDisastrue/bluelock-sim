import { z } from 'zod'

// ───────────────────────── enums ─────────────────────────
export const ORIGIN_IDS = [
  'fallen_ace',
  'academy_exile',
  'street_renegade',
  'overlooked_playmaker',
  'prodigys_shadow',
  'late_starter',
] as const
export const OriginId = z.enum(ORIGIN_IDS)
export type OriginId = z.infer<typeof OriginId>

export const TONES = ['Provoke', 'Analyze', 'Ignore', 'Devour', 'Support'] as const
export const Tone = z.enum(TONES)
export type Tone = z.infer<typeof Tone>

export const REL_STATUSES = [
  'Stranger',
  'Ally',
  'Devoted',
  'Subordinate',
  'Rival',
  'Hostile',
  'Devoured',
  'Eliminated',
] as const
export const RelStatus = z.enum(REL_STATUSES)
export type RelStatus = z.infer<typeof RelStatus>

export const EMOTIONS = [
  'neutral',
  'smirk',
  'furious',
  'shocked',
  'despair',
  'flow',
  'metavision',
  'devoured',
] as const
export const Emotion = z.enum(EMOTIONS)
export type Emotion = z.infer<typeof Emotion>

export const AURAS = ['flow', 'metavision', 'devoured'] as const
export const Aura = z.enum(AURAS)
export type Aura = z.infer<typeof Aura>

export const SKILLS = [
  'finishing',
  'dribbling',
  'metavision',
  'speed',
  'defense',
  'teamwork',
  'ego',
  'flow',
  'stamina',
] as const
export const SkillId = z.enum(SKILLS)
export type SkillId = z.infer<typeof SkillId>

export const REP_AXES = ['egoAura', 'teamPlayer', 'mediaDarling', 'coachFavor', 'mystery'] as const
export const RepAxis = z.enum(REP_AXES)
export type RepAxis = z.infer<typeof RepAxis>

export const REL_FIELDS = ['trust', 'respect', 'fear', 'rivalry'] as const
export const RelField = z.enum(REL_FIELDS)
export type RelField = z.infer<typeof RelField>

export const RES_KEYS = ['ap', 'stamina', 'composure', 'money', 'tacticalIntel', 'health', 'mood'] as const
export const ResKey = z.enum(RES_KEYS)
export type ResKey = z.infer<typeof ResKey>

export const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'DM', 'FB', 'CB', 'GK'] as const
export const Position = z.enum(POSITIONS)
export type Position = z.infer<typeof Position>

export const EGO_TYPES = ['predator', 'architect', 'wildcard', 'survivor', 'monarch'] as const
export const EgoType = z.enum(EGO_TYPES)
export type EgoType = z.infer<typeof EgoType>

export const Op = z.enum(['>=', '>', '<=', '<', '==', '!='])
export type Op = z.infer<typeof Op>

// ───────────────────────── portraits ─────────────────────────
export const FACE_IDS = ['oval', 'round', 'square', 'long', 'heart', 'sharp'] as const
export const HAIR_IDS = ['spiky', 'swept', 'shaggy', 'buzz', 'undercut', 'curly', 'long', 'mohawk', 'bob', 'ponytail', 'side_part', 'topknot', 'wavy', 'pixie', 'afro', 'braid'] as const
export const EYE_IDS = ['sharp', 'round', 'narrow', 'droopy', 'upturned', 'wide', 'almond', 'heavy_lid'] as const
export const BROW_IDS = ['straight', 'thick', 'thin', 'arched', 'angled', 'soft'] as const
export const NOSE_IDS = ['small', 'straight', 'pointed', 'broad'] as const
export const MARK_IDS = ['none', 'scar', 'bandage', 'mole', 'freckles', 'eyebags', 'bruise'] as const
export const ACCESSORY_IDS = ['none', 'headband', 'glasses', 'earring', 'hair_clip'] as const

/** Part ids are plain strings: the built-ins above plus any ids added by dropping images in public/assets/player/<slot>/. */
export const PortraitSpec = z.object({
  skin: z.string(),
  face: z.string().default('oval'),
  hair: z.string(),
  hairColor: z.string(),
  eyes: z.string(),
  eyeColor: z.string(),
  brow: z.string(),
  nose: z.string().default('straight'),
  kit: z.string(),
  accent: z.string(),
  build: z.enum(['lean', 'mid', 'broad']),
  mark: z.string(),
  accessory: z.string().default('none'),
})
export type PortraitSpec = z.infer<typeof PortraitSpec>

// ───────────────────────── conditions ─────────────────────────
export type FlagValue = boolean | string | number
export type Condition =
  | { t: 'flag'; flag: string; value?: FlagValue }
  | { t: 'noFlag'; flag: string }
  | { t: 'origin'; in: OriginId[] }
  | { t: 'trait'; id: string; has?: boolean }
  | { t: 'rel'; npc: string; field: RelField; op: Op; value: number }
  | { t: 'status'; npc: string; in: RelStatus[] }
  | { t: 'rep'; axis: RepAxis; op: Op; value: number }
  | { t: 'skill'; skill: SkillId; op: Op; value: number }
  | { t: 'res'; key: ResKey; op: Op; value: number }
  | { t: 'turn'; op: Op; value: number }
  | { t: 'arc'; id: string }
  | { t: 'sceneSeen'; id: string; seen?: boolean }
  | { t: 'eliminated'; npc: string; is?: boolean }
  | { t: 'memory'; verb: string; target?: string; withinTurns?: number }
  | { t: 'weapon'; id: string; minLevel?: number }
  | { t: 'sandbox'; used: boolean }
  | { t: 'and'; all: Condition[] }
  | { t: 'or'; any: Condition[] }
  | { t: 'not'; cond: Condition }

const FlagValueSchema = z.union([z.boolean(), z.string(), z.number()])

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('t', [
    z.object({ t: z.literal('flag'), flag: z.string(), value: FlagValueSchema.optional() }),
    z.object({ t: z.literal('noFlag'), flag: z.string() }),
    z.object({ t: z.literal('origin'), in: z.array(OriginId).min(1) }),
    z.object({ t: z.literal('trait'), id: z.string(), has: z.boolean().optional() }),
    z.object({ t: z.literal('rel'), npc: z.string(), field: RelField, op: Op, value: z.number() }),
    z.object({ t: z.literal('status'), npc: z.string(), in: z.array(RelStatus).min(1) }),
    z.object({ t: z.literal('rep'), axis: RepAxis, op: Op, value: z.number() }),
    z.object({ t: z.literal('skill'), skill: SkillId, op: Op, value: z.number() }),
    z.object({ t: z.literal('res'), key: ResKey, op: Op, value: z.number() }),
    z.object({ t: z.literal('turn'), op: Op, value: z.number() }),
    z.object({ t: z.literal('arc'), id: z.string() }),
    z.object({ t: z.literal('sceneSeen'), id: z.string(), seen: z.boolean().optional() }),
    z.object({ t: z.literal('eliminated'), npc: z.string(), is: z.boolean().optional() }),
    z.object({
      t: z.literal('memory'),
      verb: z.string(),
      target: z.string().optional(),
      withinTurns: z.number().optional(),
    }),
    z.object({ t: z.literal('weapon'), id: z.string(), minLevel: z.number().optional() }),
    z.object({ t: z.literal('sandbox'), used: z.boolean() }),
    z.object({ t: z.literal('and'), all: z.array(ConditionSchema) }),
    z.object({ t: z.literal('or'), any: z.array(ConditionSchema) }),
    z.object({ t: z.literal('not'), cond: ConditionSchema }),
  ]),
)

// ───────────────────────── effects ─────────────────────────
const relDeltas = {
  trust: z.number().optional(),
  respect: z.number().optional(),
  fear: z.number().optional(),
  rivalry: z.number().optional(),
}

export const EffectSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('setFlag'), flag: z.string(), value: FlagValueSchema.default(true) }),
  z.object({ t: z.literal('shiftRelationship'), npc: z.string(), ...relDeltas }),
  z.object({ t: z.literal('setStatus'), npc: z.string(), status: RelStatus, pin: z.boolean().optional() }),
  z.object({ t: z.literal('unlockScene'), id: z.string() }),
  z.object({ t: z.literal('lockScene'), id: z.string() }),
  z.object({ t: z.literal('unlockWeapon'), id: z.string() }),
  z.object({ t: z.literal('evolveWeapon'), id: z.string() }),
  z.object({ t: z.literal('corruptWeapon'), id: z.string() }),
  z.object({ t: z.literal('addTrait'), id: z.string() }),
  z.object({ t: z.literal('removeTrait'), id: z.string() }),
  z.object({ t: z.literal('changeRosterSlot'), slot: z.string(), npc: z.string().nullable() }),
  z.object({ t: z.literal('changeFormation'), formation: z.string() }),
  z.object({ t: z.literal('scheduleEvent'), eventId: z.string(), delay: z.number().int().min(0) }),
  z.object({
    t: z.literal('injure'),
    part: z.string(),
    severity: z.enum(['minor', 'moderate', 'severe']),
    weeks: z.number().int().min(1),
  }),
  z.object({ t: z.literal('eliminate'), npc: z.string() }),
  z.object({
    t: z.literal('modifyAI'),
    npc: z.string(),
    behavior: z.string(),
    duration: z.enum(['match', 'permanent']).default('match'),
  }),
  z.object({ t: z.literal('modifyMatchScript'), matchId: z.string(), patch: z.record(z.string(), z.unknown()) }),
  z.object({ t: z.literal('changePosition'), position: Position }),
  z.object({ t: z.literal('changeFoot'), foot: z.enum(['left', 'right', 'both']) }),
  // bookkeeping
  z.object({ t: z.literal('adjust'), key: ResKey, delta: z.number() }),
  z.object({ t: z.literal('adjustRep'), axis: RepAxis, delta: z.number() }),
  z.object({ t: z.literal('adjustSkill'), skill: SkillId, delta: z.number() }),
  z.object({
    t: z.literal('logMemory'),
    verb: z.string(),
    target: z.string().optional(),
    text: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({ t: z.literal('setArc'), id: z.string(), chapter: z.number().int().default(1) }),
])
export const EFFECT_TYPES = EffectSchema.options.map((o) => o.shape.t.def.values[0] as string)
export type Effect = z.infer<typeof EffectSchema>
export type EffectInput = z.input<typeof EffectSchema>

// ───────────────────────── choices & beats ─────────────────────────
export const CostSchema = z.object({
  ap: z.number().optional(),
  stamina: z.number().optional(),
  composure: z.number().optional(),
  money: z.number().optional(),
  tacticalIntel: z.number().optional(),
})
export type Cost = z.infer<typeof CostSchema>

export const DelayedSchema = z.object({
  eventId: z.string(),
  delay: z.union([z.number().int().min(0), z.tuple([z.number().int().min(0), z.number().int().min(0)])]),
})
export type Delayed = z.infer<typeof DelayedSchema>

export const ChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  tone: Tone.optional(),
  target: z.string().optional(),
  requires: ConditionSchema.optional(),
  lockedHint: z.string().optional(),
  /** when `requires` fails: hide the option entirely instead of showing it locked */
  hideWhenLocked: z.boolean().optional(),
  cost: CostSchema.optional(),
  effects: z.array(EffectSchema).default([]),
  delayed: z.array(DelayedSchema).default([]),
  reveal: z.string().optional(),
  major: z.boolean().optional(),
  memory: z.object({ verb: z.string(), text: z.string() }).optional(),
  goto: z.string().optional(),
})
export type Choice = z.infer<typeof ChoiceSchema>
export type ChoiceInput = z.input<typeof ChoiceSchema>

const when = { when: ConditionSchema.optional() }
const actor = z.string() // character id or 'player'
export const SideSchema = z.enum(['left', 'center', 'right'])
export type Side = z.infer<typeof SideSchema>
export const BG_IDS = [
  'black',
  'letter',
  'room_z',
  'cafeteria',
  'locker_room',
  'training_pitch',
  'tunnel',
  'stadium',
  'monitor_wall',
  'ego_office',
  'old_pitch',
  'academy_gate',
  'street_cage',
  'bench_dusk',
] as const
export const BgId = z.enum(BG_IDS)
export type BgId = z.infer<typeof BgId>

export const PanelCell = z.object({
  bg: BgId.optional(),
  who: actor.optional(),
  emotion: Emotion.optional(),
  aura: Aura.optional(),
  caption: z.string().optional(),
  sfx: z.string().optional(),
  span: z.enum(['wide', 'tall']).optional(),
})

export const BeatSchema = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('line'),
    who: actor,
    text: z.string(),
    emotion: Emotion.optional(),
    side: SideSchema.optional(),
    aura: Aura.nullable().optional(),
    mono: z.boolean().optional(),
    variants: z.partialRecord(OriginId, z.string()).optional(),
    ...when,
  }),
  z.object({ t: z.literal('narration'), text: z.string(), variants: z.partialRecord(OriginId, z.string()).optional(), ...when }),
  z.object({
    t: z.literal('panel'),
    layout: z.enum(['strip3', 'grid4', 'wideTop']).default('grid4'),
    cells: z.array(PanelCell).min(1),
    ...when,
  }),
  z.object({
    t: z.literal('impact'),
    text: z.string(),
    style: z.enum(['don', 'zzzt', 'lock', 'devour', 'quiet']).default('don'),
    ...when,
  }),
  z.object({ t: z.literal('choice'), prompt: z.string().optional(), choices: z.array(ChoiceSchema).min(1), ...when }),
  z.object({
    t: z.literal('timedChoice'),
    prompt: z.string().optional(),
    seconds: z.number().min(1).max(30).default(4),
    defaultChoiceId: z.string(),
    timeoutEffects: z.array(EffectSchema).default([]),
    choices: z.array(ChoiceSchema).min(2),
    ...when,
  }),
  z.object({
    t: z.literal('cutIn'),
    left: z.object({ who: actor, emotion: Emotion.optional(), aura: Aura.optional() }),
    right: z.object({ who: actor, emotion: Emotion.optional(), aura: Aura.optional() }).optional(),
    text: z.string().optional(),
    ...when,
  }),
  z.object({ t: z.literal('shake'), intensity: z.number().min(1).max(3).default(2), ...when }),
  z.object({ t: z.literal('flash'), color: z.enum(['white', 'red', 'blue', 'black']).default('white'), ...when }),
  z.object({ t: z.literal('bgChange'), bg: BgId, ...when }),
  z.object({ t: z.literal('music'), track: z.string(), ...when }),
  z.object({ t: z.literal('setFlag'), flag: z.string(), value: FlagValueSchema.default(true), ...when }),
  z.object({
    t: z.literal('branch'),
    cases: z.array(z.object({ when: ConditionSchema, goto: z.string() })),
    else: z.string().optional(),
    ...when,
  }),
  z.object({ t: z.literal('wait'), ms: z.number().min(0).max(5000), ...when }),
  z.object({
    t: z.literal('enter'),
    who: actor,
    side: SideSchema,
    emotion: Emotion.optional(),
    aura: Aura.nullable().optional(),
    ...when,
  }),
  z.object({ t: z.literal('exit'), who: actor, ...when }),
  z.object({ t: z.literal('aura'), who: actor, aura: Aura.nullable(), ...when }),
  z.object({ t: z.literal('vision'), on: z.boolean(), ...when }),
  z.object({ t: z.literal('label'), id: z.string() }),
  /** call another script as a subroutine; returns here when it ends */
  z.object({ t: z.literal('run'), script: z.string(), ...when }),
  z.object({ t: z.literal('goto'), label: z.string(), ...when }),
  z.object({ t: z.literal('effects'), effects: z.array(EffectSchema), ...when }),
])
export type Beat = z.infer<typeof BeatSchema>
export type BeatInput = z.input<typeof BeatSchema>

export const ScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** shown in the replay gallery */
  blurb: z.string().optional(),
  /** listed in the replay gallery once seen (sub-scenes called via `run` stay hidden) */
  gallery: z.boolean().default(false),
  bg: BgId.optional(),
  music: z.string().optional(),
  beats: z.array(BeatSchema).min(1),
})
export type Script = z.infer<typeof ScriptSchema>
export type ScriptInput = z.input<typeof ScriptSchema>

// ───────────────────────── content records ─────────────────────────
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  short: z.string(),
  kind: z.enum(['canon', 'original']),
  /** manifest portrait id (defaults to id) */
  art: z.string().optional(),
  portrait: PortraitSpec,
  personality: z.string(),
  speech: z.string(),
  egoType: z.string(),
  playStyle: z.string(),
  weapon: z.string(),
  hooks: z.array(z.string()),
  originVariants: z.partialRecord(OriginId, z.string()).default({}),
  contemptForSoft: z.boolean().default(false),
  /** shown on the relationship map; false for staff/media who are never selectees */
  selectee: z.boolean().default(true),
  /** content is a stub awaiting its arc milestone */
  placeholder: z.boolean().optional(),
})
export type Character = z.infer<typeof CharacterSchema>
export type CharacterInput = z.input<typeof CharacterSchema>

export const OriginSchema = z.object({
  id: OriginId,
  name: z.string(),
  tagline: z.string(),
  past: z.string(),
  tags: z.array(z.string()),
  startSkills: z.partialRecord(SkillId, z.number()),
  startRep: z.partialRecord(RepAxis, z.number()).default({}),
  startFlags: z.record(z.string(), FlagValueSchema),
  startTraits: z.array(z.string()),
  approachedBy: z.string(),
  branches: z.array(z.string()),
  /** unlocked only via meta progress or Sandbox */
  locked: z.boolean().default(false),
  unlockHint: z.string().optional(),
})
export type Origin = z.infer<typeof OriginSchema>
export type OriginInput = z.input<typeof OriginSchema>

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const
export type Rarity = (typeof RARITIES)[number]
export const WEAPON_CATEGORIES = ['shooting', 'dribbling', 'passing', 'vision', 'movement', 'defense', 'physical', 'mental'] as const
export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number]
/** Display names for each rarity tier, and the glyph shown beside it (so rarity never relies on colour alone). */
export const RARITY_INFO: Record<Rarity, { label: string; glyph: string; startWeight: number }> = {
  common: { label: 'Fundamental', glyph: '●', startWeight: 50 },
  uncommon: { label: 'Refined', glyph: '◆', startWeight: 28 },
  rare: { label: 'Specialist', glyph: '★', startWeight: 14 },
  epic: { label: 'Egoist', glyph: '★★', startWeight: 6 },
  legendary: { label: 'New Generation XI', glyph: '★★★', startWeight: 2 },
  mythic: { label: 'World XI', glyph: '✦', startWeight: 0 },
}

export const WeaponSchema = z.object({
  id: z.string(),
  rarity: z.enum(RARITIES),
  category: z.enum(WEAPON_CATEGORIES),
  /** original invention, or a concept inspired by canon abilities (always with an original name) */
  source: z.enum(['original', 'inspired']),
  /** how the story grants non-start weapons */
  obtain: z.string().optional(),
  name: z.string(),
  summary: z.string(),
  levels: z.array(z.object({ name: z.string(), desc: z.string() })).length(3),
  trigger: z.string(),
  cost: z.string(),
  cooldown: z.number(),
  counters: z.array(z.string()),
  /** can be picked as the starting weapon seed */
  seedable: z.boolean().default(true),
}).refine((w) => !(w.rarity === 'mythic' && w.seedable), { message: 'mythic weapons are story-only and cannot be start-eligible' })
export type Weapon = z.infer<typeof WeaponSchema>
export type WeaponInput = z.input<typeof WeaponSchema>

export const TraitSchema = z.object({ id: z.string(), name: z.string(), desc: z.string() })
export type Trait = z.infer<typeof TraitSchema>

export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  when: ConditionSchema.optional(),
  weight: z.number().min(0).default(1),
  cast: z.array(z.string()).default([]),
  scenes: z.array(z.string()).min(1),
  repeatable: z.boolean().default(false),
  cooldown: z.number().int().min(0).default(0),
  /** only fires when scheduled by an effect (never rolled randomly) */
  scheduledOnly: z.boolean().default(false),
  /** teaser shown on a Ripple card when an effect schedules this */
  hint: z.string().optional(),
  arc: z.string().optional(),
})
export type GameEvent = z.infer<typeof EventSchema>
export type EventInput = z.input<typeof EventSchema>

export const ArcSchema = z.object({ id: z.string(), name: z.string(), summary: z.string() })
export type Arc = z.infer<typeof ArcSchema>

// ───────────────────────── game state ─────────────────────────
const Rel = z.object({
  trust: z.number(),
  respect: z.number(),
  fear: z.number(),
  rivalry: z.number(),
  status: RelStatus,
  /** status set by an explicit effect; auto-rules will not override it */
  pinned: z.boolean(),
})
export type Relationship = z.infer<typeof Rel>

const Injury = z.object({ part: z.string(), severity: z.enum(['minor', 'moderate', 'severe']), weeksLeft: z.number() })

export const MemoryEntry = z.object({
  id: z.number().int(),
  turn: z.number().int(),
  verb: z.string(),
  target: z.string().optional(),
  text: z.string(),
  tags: z.array(z.string()),
  source: z.string(),
})
export type MemoryEntry = z.infer<typeof MemoryEntry>

export const RippleChange = z.object({
  kind: z.enum(['relationship', 'status', 'flag', 'scene', 'weapon', 'trait', 'roster', 'eliminated', 'resource', 'rep', 'tag', 'role']),
  text: z.string(),
  npc: z.string().optional(),
  tone: z.enum(['good', 'bad', 'neutral']).default('neutral'),
})
export type RippleChange = z.infer<typeof RippleChange>

export const RippleEntry = z.object({
  id: z.number().int(),
  turn: z.number().int(),
  source: z.string(),
  headline: z.string(),
  choiceLabel: z.string().optional(),
  noticed: z.array(z.string()),
  changes: z.array(RippleChange),
  hint: z.string().optional(),
})
export type RippleEntry = z.infer<typeof RippleEntry>

export const GameStateSchema = z.object({
  meta: z.object({
    turn: z.number().int(),
    seed: z.number().int(),
    rng: z.number().int(),
    sandboxUsed: z.boolean(),
    createdAt: z.string(),
    nextId: z.number().int(),
  }),
  player: z.object({
    name: z.string().min(1),
    origin: OriginId,
    portrait: PortraitSpec,
    position: Position,
    handedness: z.enum(['left', 'right', 'both']),
    egoType: EgoType,
    weaponSeed: z.string(),
  }),
  skills: z.record(SkillId, z.number()),
  skillPoints: z.number().int(),
  xp: z.number().int(),
  life: z.object({
    age: z.number().int(),
    week: z.number().int(),
    ap: z.number(),
    apMax: z.number(),
    stamina: z.number(),
    staminaMax: z.number(),
    composure: z.number(),
    health: z.number(),
    mood: z.number(),
    money: z.number(),
    injuries: z.array(Injury),
    hometownContact: z.number(),
    education: z.string(),
    sponsors: z.array(z.string()),
    romanceEnabled: z.boolean(),
  }),
  resources: z.object({ tacticalIntel: z.number() }),
  flags: z.record(z.string(), FlagValueSchema),
  relationships: z.record(z.string(), Rel),
  reputation: z.record(RepAxis, z.number()),
  traits: z.array(z.string()),
  weapons: z.record(z.string(), z.object({ level: z.number().int(), corrupted: z.boolean() })),
  memory: z.array(MemoryEntry),
  ripples: z.array(RippleEntry),
  scheduled: z.array(z.object({ eventId: z.string(), due: z.number().int(), source: z.string() })),
  firedEvents: z.record(z.string(), z.number().int()),
  scenes: z.object({ seen: z.array(z.string()), unlocked: z.array(z.string()), locked: z.array(z.string()) }),
  roster: z.record(z.string(), z.string().nullable()),
  formation: z.string(),
  eliminated: z.array(z.string()),
  arc: z.object({ id: z.string(), chapter: z.number().int() }),
  aiMods: z.array(z.object({ npc: z.string(), behavior: z.string(), duration: z.enum(['match', 'permanent']), source: z.string() })),
  matchPatches: z.array(z.object({ matchId: z.string(), patch: z.record(z.string(), z.unknown()), source: z.string() })),
  auction: z.object({ valueMillions: z.number() }),
})
export type GameState = z.infer<typeof GameStateSchema>
export type Source = string

export const SAVE_FORMAT = 'bluelock-egoist-life'
