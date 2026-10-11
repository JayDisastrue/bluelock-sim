# BLUE LOCK: EGOIST LIFE — Design Doc (M1/M2)

## Principles
Content is data (`src/content`), engine is code (`src/engine`). The engine is **pure**: `applyEffect(state, effect, ctx) → state` (immer). The cutscene runner talks to the game only through a small `GameAPI` (`get`, `apply`), so the same scripts run against the live store, a throwaway preview state (test page, replay gallery) or a fake in unit tests.

## Data schemas (Zod is the source of truth; TS types are inferred)
- **GameState** `{ meta{turn,seed,rng,sandboxUsed}, player{name,origin,portrait,position,handedness,egoType,weaponSeed}, skills{9}, skillPoints, xp, life{age,week,ap,stamina,composure,health,mood,money,injuries[],…}, resources{tacticalIntel}, flags{id→bool|string|number}, relationships{npc→{trust,respect,fear,rivalry,status,pinned}}, reputation{egoAura,teamPlayer,mediaDarling,coachFavor,mystery}, traits[], weapons{id→{level,corrupted}}, memory[], ripples[], scheduled[{eventId,due,source}], firedEvents, scenes{seen,unlocked,locked}, roster, formation, eliminated[], arc, aiMods[], matchPatches[], auction }`
- **Character** `{ id, name, kind:'canon'|'original', portrait spec, personality, speech, egoType, playStyle, weapon, hooks[], originVariants{origin→line}, contemptForSoft }`
- **Origin** `{ id, name, past, tags, startSkills, startRep, startFlags, startTraits, approaches(npc), locked }`
- **Weapon** `{ id, name, levels[3]{name,desc}, trigger, cost, cooldown, counters[] }`
- **Save** `{ format, version, savedAt, label, data: GameState }`, validated on load, migrated through a `version → version+1` chain.

## Condition grammar
`flag, noFlag, origin, trait, rel(npc,field,op,n), status, rep, skill, res, turn, arc, sceneSeen, eliminated, memory(verb,target,withinTurns), weapon, sandbox, and, or, not`. Used by event preconditions, `when` guards on any beat, and choice `requires`.

## Event grammar (§5.2)
`Event { id, title, when, weight, cast[], scenes[scriptId], repeatable?, cooldown? }`. Choices live in the scenes' `choice` beats (so cutscenes and events share one vocabulary):
`Choice { id, label, tone?, target?, requires?, cost?, effects[], delayed[{eventId,delay|[min,max]}], reveal?, major?, memory?, goto? }`.
**Effects** (`t`): `setFlag, shiftRelationship, setStatus, unlockScene, lockScene, unlockWeapon, evolveWeapon, corruptWeapon, addTrait, removeTrait, changeRosterSlot, changeFormation, scheduleEvent, injure, eliminate, modifyAI, modifyMatchScript` plus bookkeeping `adjust, adjustRep, adjustSkill, logMemory, setArc`.
**Tone model** (`engine/tones.ts`): a choice with `tone`+`target` gets generated effects (Provoke→tilt AI mod + rivalry; Analyze→costs Intel, `exposed` AI mod; Ignore→defuse or fester by rivalry; Devour→`DEVOUR_TARGET` flag + match payoff patch; Support→trust + combo flag, "soft" penalty vs contemptuous NPCs).
**Ripple**: `buildRipple(before, after, choice)` diffs state → who noticed, relationship/status changes, locks/unlocks, scheduled-return hints; stored in the Ripple Log and shown as a manga card.

## Cutscene beats
`line, narration, panel, impact, choice, timedChoice, cutIn, shake, flash, bgChange, music, setFlag, branch, wait` + `enter, exit, aura, vision, label, goto, effects`. Every beat takes an optional `when` guard. Lines support per-origin `variants`, `*emphasis*`, `{player}` templates. Timed choices carry `defaultChoiceId` and `timeoutEffects`; timing out is a real choice with consequences.

## Assets
`public/assets/manifest.json` maps ids → files. Missing/unlisted → generated SVG layered portraits and SVG backgrounds. `npm run assets` pulls colored character art from the fan wiki (gitignored, personal use).

## Milestones
M1 store/save/relationships/flags/schemas+validation/Sandbox · M2 cutscene engine, portraits, creation wizard, origin-divergent opening · M3 Life Hub loop · M4 match engine · M5 Tag Test + First Selection · M6+ later arcs, 3D, audio.
Trade-off calls: hash router (static hosting); events reference scripts instead of owning choices (one choice vocabulary); save migrations are a tested chain even though only v1 exists today.
