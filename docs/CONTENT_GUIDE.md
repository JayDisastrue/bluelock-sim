# Content guide

Content is data in `src/content`; adding an event needs no engine change.

## Add a character
`src/content/characters/{canon,original}.ts` → `defineChars([{ id, name, short, kind, portrait: P(...), personality, speech, egoType, playStyle, weapon, hooks, originVariants, contemptForSoft? }])`. Art: see ASSETS.md.

## Write a scene
`src/content/scenes/*.ts`. A script is `{ id, title, bg, beats[] }` with beats `line, narration, panel, impact, choice, timedChoice, cutIn, shake, flash, bgChange, music, setFlag, branch, wait, enter, exit, aura, vision, label, goto, run, effects`. Every beat accepts `when: <condition>`. Helpers: `say(who, text, emotion?)`, `mono(text)`, `nar(text)`, `toneChoice(id, target, { Provoke, Analyze, Ignore, Devour, Support })`. `*word*` emphasises; `{player}`, `{origin}`, `{recall:<npc>}` substitute. `variants: { fallen_ace: '…' }` swaps text per origin.

## Write an event with a delayed consequence
1. Define an event in `src/content/events/…` (`evt(id, meta, beats)` in `opening-events.ts` shows the pattern). Mark `scheduledOnly: true` if only a choice should trigger it, and give it a `hint` (shown on the Ripple card).
2. In any choice add `delayed: [{ eventId, delay: [2, 3] }]` (or a `scheduleEvent` effect).
3. The event's scene branches on flags/relationships/memory with `when` guards.

## Effects vocabulary
`setFlag shiftRelationship setStatus unlockScene lockScene unlockWeapon evolveWeapon corruptWeapon addTrait removeTrait changeRosterSlot changeFormation scheduleEvent injure eliminate modifyAI modifyMatchScript` plus `adjust adjustRep adjustSkill logMemory setArc`. `modifyAI`/`modifyMatchScript`/formation/roster are stored in state now and consumed by the match engine in M4.

## Tones (engine/tones.ts)
Give a choice `tone` + `target` and the engine adds the effect model: Provoke (Tilted AI + rivalry), Analyze (1 Intel, `exposed` AI + `READ:` flag), Ignore (defuse or fester), Devour (`DEVOUR_TARGET:` + match obligation), Support (trust, combo flag, “soft” penalty vs contemptuous NPCs).

## Ripples
Mark a choice `major: true` to show the Ripple card. Add a human line for important flags in `src/content/flags.ts` (`NAME:*` matches `NAME:<npc>`).

## Validate
`npm test` runs `validateContent` (every reference resolves) and plays the whole opening for all 6 origins. The Flag Inspector (`/dev/flags`) shows which scenes/events read or set each flag.
