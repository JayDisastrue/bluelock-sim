# BLUE LOCK: EGOIST LIFE — Build Prompt (v2)

Paste everything below the line into Claude Code in an **empty project folder**.

---

# Role & Mission

You are a senior game architect, narrative designer, and front-end engineer. Build **"BLUE LOCK: EGOIST LIFE"** — a *BitLife*-style life sim fused with a visual novel and a tactical football match engine, set inside the world and arcs of *Blue Lock*. The player is **the main character** of their own Blue Lock story: the manga, if it happened to you.

This is a personal, non-commercial fan project. Never ship or fetch ripped official art/models. Use the asset pipeline in §2.

## Pillars (resolve every design conflict in this order)
1. **Choices matter.** Nothing is "+1 stat" alone. Every meaningful choice changes a relationship, a story flag, a roster slot, a tactical option, or a future event — and the game *shows* the player the ripple.
2. **It looks like the manga/anime.** Clean cutscenes, expressive characters, impact frames, onomatopoeia. Presentation is a feature, not polish.
3. **Matches feel like Blue Lock.** Egoism, 1v1 duels, Metavision, Flow, weapons, devouring. Matches are authored story beats with simulated texture, not coin flips.
4. **It's also a life.** Between matches you live: train, eat, sleep, study, argue, fall apart, recover. BitLife energy.
5. **Always playable.** Every milestone must run, save, and load. No big-bang integration.

---

# 1. Tech Stack & Delivery

- **Not a Claude Artifact** (too big). Scaffold a local **Vite + React + TypeScript + Tailwind** project. Zustand (or a plain reducer) for state; Zod for save-file validation; Vitest for the narrative/match engines.
- **Rendering**: DOM/CSS for UI and cutscenes; **Canvas 2D** for the match radar; optional **Three.js** stage for 3D (see §2). Target 60fps on a mid laptop; desktop-first, tablet-friendly.
- **Audio hooks**: an `audio.ts` facade (`play('don')`, `music('selection-tension')`) that no-ops when files are missing, so sound can be added later without code changes.
- **Content as data, engine as code.** Story events, dialogue, characters, matches, weapons live in typed data files (`/src/content/**`), not hard-coded in components. A new event should need zero engine changes.
- Autosave to `localStorage` every turn + 3 manual slots + export/import save as JSON. Versioned saves with migrations.
- Run `tsc`, lint, and tests before saying any milestone is done. Open the game in a browser and play through to verify; report what you actually saw.

---

# 2. Assets & Visual Direction (the honest version)

Official Blue Lock art and rigged 3D models are copyrighted and effectively unavailable, so **do not scrape or invent URLs for them**. Instead build an **asset abstraction layer** so the game looks great now and gets better when the user drops in their own files.

**Asset manifest** (`/public/assets/manifest.json` + typed loader): every character, background, impact frame, weapon icon, and 3D model is referenced by ID. If a file is missing, fall back to a generated placeholder. The user can swap in fan art, commissioned art, or their own models with zero code changes.

**Default (ship this first): 2D, authored in-engine.**
- Characters = **layered portrait system**: base head/body silhouette + hair + eyes + mouth + brow + aura layers, composed from SVG/CSS so every character has the emotion set `neutral, smirk, furious, shocked, despair, flow, metavision, devoured`. Distinct hair shapes, kit colors, and silhouettes make canon-style cast recognizable without using official art.
- Backgrounds = stylized SVG/CSS scenes (Room Z, cafeteria, locker room, training pitch, tunnel, stadium, the big monitor wall, Ego's office).
- Manga look: high-contrast dark UI, halftone/screentone overlays, speed lines, ink-edge borders, panel gutters, red/blue "ego" accent palette, bold impact typography.

**Optional 3D layer (Phase 2, behind a toggle):**
- Three.js scene with **stylized low-poly players** (capsule/box rigs are fine) and a small shared clip library: `idle, jog, sprint, dribble, kick, volley, shield, celebrate, fall`. Characters differ by kit, hair mesh, and scale, not by custom animation.
- Source free animations from **Mixamo** (retargeted to a generic humanoid) and generic CC0 models (Poly Pizza, Quaternius, Kenney, Sketchfab CC0 filters). Record license + source for each file in `ASSETS.md`.
- Use 3D only for match highlight replays and the opening cinematic; keep all dialogue/cutscenes in the 2D layer. Never block gameplay on 3D loading.

Write `ASSETS.md` explaining exactly where the user drops files, naming conventions, recommended sizes, and how to swap placeholders for real art.

---

# 3. The Cutscene & Dialogue Engine

Build this as a reusable framework driven by data scripts.

**Script format** (typed JSON/TS): an array of beats, each one of:
`line`, `narration`, `panel`, `impact`, `choice`, `timedChoice`, `cutIn`, `shake`, `flash`, `bgChange`, `music`, `setFlag`, `branch`, `wait`.

**Presentation features**
- Characters slide in/out, swap emotions mid-line, face off in **split-screen duels** with diagonal cut.
- **Manga panel sequences**: CSS-grid panels that slam in one by one with staggered easing; skippable, with a "fast" mode.
- **Impact cards**: full-screen onomatopoeia ("DON!!", "ZZZT", "LOCK ON", "DEVOUR") with screen shake and speed lines.
- **Flow / Metavision aura**: pulsing SVG/CSS auras around portraits (blue flame, black lightning, puzzle-piece shards for Metavision), plus a "vision lines" overlay showing the field read.
- **Text**: typewriter, emphasis words that scale/shake, inner-monologue style (italic, vignette) for the protagonist's ego monologues.
- **Timed dialogue choices** during confrontations (3–5s ring timer). Timing out = a *default* choice with consequences, never a soft fail.
- **Dialogue tones**: `Provoke`, `Analyze`, `Ignore`, `Devour`, `Support`. Each tone has an effect model (see §5), not a number bump.
- Backlog, auto-advance, skip-seen, and a cutscene **replay gallery** unlocked as scenes are seen.
- Ship a **Cutscene Test Page** (`/dev/cutscenes`) to preview any script by ID.

---

# 4. Protagonist, Origins & Identity

Creation wizard: name, appearance (portrait layers), position, handedness, **Origin**, starting **Ego type**, and a **starting weapon seed**.

## Origins (each injects tags, changes how NPCs treat you, and unlocks/locks scenes)

| Origin | Past | Start state | Unique branches |
|---|---|---|---|
| **Fallen High School Ace** | Passed at the decisive moment and lost the qualifiers. | High teamwork, low killer instinct. Tag `HAUNTED_PASS`. | "Regret vs Ruthlessness" scenes; Ego Jinpachi targets this wound early; one teammate from your old team may appear as a rival selectee. |
| **Academy Exile** | Cut from a pro youth academy for being "too selfish." | Strong technique, tag `COACH_DISTRUST`. | Academy-prodigy rivalries; insider tactical knowledge unlocks extra options in tactical briefings; staff are colder to you. |
| **Street Football Renegade** | Futsal cages and concrete; never played 11v11. | Unpredictable dribbling, weak positioning, tag `UNSTRUCTURED`. | Structured defenses misread you; early tactical drills are harder; officials flag you as an "anomaly" (extra attention, extra pressure). |
| **Overlooked Playmaker** | Fed selfish strikers for years. | High vision/passing, tag `HABITUAL_PASSER`. | Everyone expects you to pass, so a selfish play shocks them (bonus), but your auto-instincts fight you (penalty until you break the habit via a multi-event arc). |
| **Unlock later:** **The Prodigy's Shadow** (sibling/rival of a pro) and **The Late Starter** (took up the sport at 17). | | | Made available after one full playthrough or via Sandbox. |

Origin is never just a stat preset. It must change **dialogue**, **who approaches you**, **which events can fire**, and **which endings are reachable**.

**Life model (BitLife layer)**: age/time, health & injuries, stamina, mood/mental state, money, family & hometown contact, public image/social media, school/education, romance & friendships (optional, toggleable in Settings), sponsorships. These make off-pitch events real, not decoration.

---

# 5. The Consequence Engine (the heart of the game)

**Hard rule:** if a choice only changes a number, redesign the choice.

## 5.1 State primitives
- **Flags**: booleans/enums set by choices (`DEVOURED_CHIGIRI_R1`, `PASSED_TO_BACHIRA_CLUTCH`).
- **Relationship graph**: for each NPC, `trust`, `respect`, `fear`, `rivalry`, plus a **status** from `{Stranger, Ally, Devoted, Subordinate, Rival, Hostile, Devoured, Eliminated}`. Status transitions are rule-driven and visible.
- **Reputation axes (public + internal)**: `Ego Aura` (how dangerous you look), `Team Player`, `Media Darling`, `Coach Favor`, `Mystery`. These gate scenes and affect how opponents set up against you.
- **Memory log**: the game records *what you did, to whom, when*, and NPCs reference it later in dialogue ("You did that to Chigiri in the second match. Don't look at me like it's nothing.").
- **Scarce resources** that force trade-offs: Action Points per week, Stamina, Mental Composure, Money/Yen, and a **Tactical Intel** pool you spend on opponent reads.

## 5.2 Event grammar
Each event = `{ id, when (preconditions on flags/relationships/arc/time), weight, cast, scenes, choices[] }`.
Each choice = `{ label, tone, requires?, cost?, effects[], delayed[], reveal? }`.

**Effect types** (the vocabulary the designer must use, not just stat deltas):
`setFlag`, `shiftRelationship`, `setStatus`, `unlockScene`, `lockScene`, `unlockWeapon / evolveWeapon / corruptWeapon`, `addTrait / removeTrait`, `changeRosterSlot`, `changeFormation`, `scheduleEvent(delay)`, `injure`, `eliminate(npc)`, `modifyAI(npc, behavior)`, `modifyMatchScript(matchId, patch)`.

**Delayed consequences** are first-class: a choice can schedule an event 2–6 turns or arcs later (betrayal, comeback, debt called in).

**Consequence feedback**: after major choices show a **"Ripple" card** (manga-style): who noticed, what changed in the relationship graph, and a hint of what might come back. Keep a **Ripple Log** page.

## 5.3 Example choice (build in this style)
> *Final minute, Team Z are drawing. Bachira is open, but you can score solo.*
> - **Shoot (Devour):** you score; Bachira → `Rival` ("You don't need me"), refuses your passes for the next two matches; Team Player −, Ego Aura +, `Subordinate` path unlocks for the defender you beat; Jinpachi highlights it in the roundup.
> - **Pass:** Bachira scores; he becomes `Devoted`, unlocks the *"Monster's Pass"* combo weapon later; but a rival in the dorm now reads you as soft and tests you in the cafeteria next week.
> - **Fake the pass, then shoot (needs Metavision ≥ threshold OR Playmaker origin):** both outcomes partially happen; unlocks the *Bait* trait.

## 5.4 Dialogue tone effects (not numbers)
| Tone | Mechanical effect |
|---|---|
| **Provoke** | Target gets `Tilted` for the match: more aggressive, worse positioning; might also bond them to you as a rival. |
| **Analyze** | Spends Tactical Intel; reveals an opponent weakness that unlocks a one-time match option. |
| **Ignore** | Preserves composure; risks being read as weak; may defuse or let a grudge fester. |
| **Devour** | Declares intent to eat the target; sets a `DEVOUR_TARGET` flag and forces a payoff or humiliation in the next shared match. |
| **Support** | Builds trust; unlocks combo plays; can mark you as "soft" to some NPCs. |

## 5.5 Necessary systemic divergences
- Who you eliminate in the Tag Test is **permanently removed** from the playthrough, and the story rewrites around the gap.
- Your **squad** in the 2nd Selection is built from actual results; each stolen/owned player changes cutscenes, synergies, and later alliances.
- **Authority**: submitting to staff lowers Ego Aura and risks benching in high-stakes arcs; defying managers carries bench penalties unless backed by immediate results.
- **Elimination is real.** If you lose key matches, you can be cut. Offer a *Second Life* path only for specific origins/flags (e.g. an outsider's wildcard re-entry).

---

# 6. Characters & Cast

Create `/src/content/characters/` with each NPC as data: portrait spec, personality, speech style, ego type, playing style, weapon, relationship hooks, and **per-origin dialogue variants**.

**Canon cast**: use your knowledge of the manga for the main roster and rivals (Team Z, Rin/Sae Itoshi, Barou, Nagi, Reo, Bachira, Chigiri, Kunigami, Raichi, etc., plus Ego Jinpachi, Anri, Noel Noa, NEL clubs and their stars). Where you're unsure of a detail, make a sensible choice and list it in `docs/CANON_NOTES.md` so the user can correct it.

**Original characters**: create **at least 12 invented characters** (rivals, mentors, a foreign prodigy per NEL stratum, a journalist, a family member, a sponsor, an antagonist) so your protagonist's story isn't just a recast of Isagi's. They live in the same world and plug into the same arcs.

Characters must **react to your history**: tone, which dialogue is available, whether they pass to you on the pitch, and what they say after matches.

---

# 7. Match Engine ("Matches are mapped out")

Matches are **authored beat-maps** over a simulated flow.

## 7.1 Match map format
Each match file defines: teams and rosters, stakes (survival, rank, transfer, trophy), **time segments**, **scripted set pieces and key moments** (some canon-accurate, some branching), **branch nodes** where player choices alter the scoreline or the follow-up scenes, and **fail/success outcomes** with consequences.

Example skeleton:
```
Match: FirstSelection_Z_vs_V
  Stakes: Lose → elimination risk for 2 players, 1 is you
  Segments:
    0–15': "Feeling out" — sim, 1 clash node
    16': KEY MOMENT: canon pass sequence — player choice branches
    …
  Branches: score/flag-dependent half-time cutscene
  Outcomes: W / D / L, each with its own post-match chain
```

## 7.2 Simulation texture
- The map is filled with **4–8 sim possessions** per half driven by team ratings, tactics, fatigue, tilt, and relationship-driven passing AI (`Hostile` teammates don't pass to you).
- **Interactive Clash Nodes**: when you hold the ball, the screen drops into a manga confrontation panel (1v1, blindspot run, shot-block, keeper duel). Choose from actions gated by Origin, **Weapons**, **Flow Meter**, composure, and Tactical Intel.
- **Emotion system**: `Composure`, `Confidence`, `Tilt`, `Hunger`. Emotions change outcomes and *change which options are shown* (e.g. at high Tilt you may lose the "Analyze" action but gain "Reckless Shot").
- **Flow states**: conditions to enter (a read, a rival's challenge, a perfect pass), effects while active (extra reads, visual aura, enhanced weapon), and a crash (cooldown/exhaustion).
- **Metavision**: reveals highlighted lanes and the opponent's next move on the radar; costs stamina; upgradable.
- **Weapons**: see §8.

## 7.3 Radar pitch & highlights
- 2D Canvas pitch: players as labeled dots, ball arc trails, pass-lane lines, positional shape, heat flashes on key events.
- Key moments trigger a **highlight cut-in**: panels, speed lines, impact text, 1–2s slow-motion on the radar, and optionally a **3D replay** if that layer is installed.
- A **Highlights reel** is stored per match (clip data, not video) and playable later from the profile.

---

# 8. Weapons, Traits, Training & Growth

- **Weapons** are named abilities with trigger conditions, cooldown/cost, counters, and **evolutions** (e.g. *Direct Shot → Curved Direct Shot → Flow Direct Shot*). Teammates and rivals can **influence** your weapon (copy it, counter it, or evolve it with you).
- **Traits** (e.g. `Hunger`, `Clutch`, `Bait`, `Cold Blooded`) are permanent identity modifiers acquired via events.
- **Training mode**: a weekly **Action Point** planner (train / study film / spar / recover / socialize). Training minigames are lightweight and choice-driven: each drill has trade-offs (risk of injury, rivalry with a drill partner, coach attention).
- **Skill points**: normal progression grants *XP → points* spent on a skill tree with branches (Finishing, Dribbling, Metavision, Speed, Defense, Teamwork, Ego). Some nodes are **locked behind story flags** (e.g. a weapon evolution that requires having devoured a specific rival).

---

# 9. Post-Game Roundups

After every significant match, a **roundup sequence**:
1. **Manga recap strip**: 4–6 panels of the key moments.
2. **Stat card**: goals, assists, duels won, Metavision reads, ego score — plus a letter-grade ranking board.
3. **Ego Jinpachi evaluation**: lines that reference the specific decisions you made (including contradictions, e.g. "You passed at 78' but were hunting at 12'. Which one are you?").
4. **Relationship summary**: who respects, resents, or fears you now.
5. **Media / public reaction**: headlines, social posts, sponsor reaction.
6. **Next step**: schedule shift, injuries, selection board changes.

---

# 10. Arc Roadmap

Reproduce the manga's arcs **as playable chapters**. Each arc has a *canon spine* (events that tend to happen) and *player-driven branches* (events that only happen because of you).

1. **Prologue & Entrance (Room Z / Tag Test)** — survival chase; eliminations are permanent.
2. **First Selection** — team league, internal top-scorer stakes, Team Z drama.
3. **Second Selection** — 100-goal holographic room, then steal matches (2v2/3v3/4v4). Winning/losing builds your squad.
4. **Third Selection & Blue Lock vs Japan U-20** — fight for the starting XI, stadium showcase against Sae Itoshi & Oliver Aiku.
5. **Neo Egoist League (NEL)** — choose a stratum (Germany, England, Spain, Italy, France); club training philosophy, live **auction bid board** tracking your value in millions of yen.
6. **U-20 World Cup & Beyond** — your path through the tournament.
7. **Original Final Arcs (invent logically)** — when the canon runs thin or the game is deep into your own divergence, generate coherent original arcs: senior national team call-up, a rival's redemption/downfall, a Ballon d'Or race, a mentor's retirement, etc. Introduce these via `docs/STORY_BIBLE.md` so they stay consistent.

Each arc ends with an **Arc Report**: what changed, who you are now, and which flags carry forward.

---

# 11. Sandbox / God Mode (always accessible)

A collapsible panel at the top of the screen (keybind `~`), clearly marked so it doesn't pollute a "pure" run. Using it flips a `SANDBOX_USED` flag shown on the save slot.

- **Skill Point Mode**: tick "Free Points" and just add points to Finishing, Speed, Dribbling, Metavision, Ego, Flow, Stamina, etc. with sliders/steppers. No unlocks required.
- **Weapons & Traits**: add, remove, swap, and set evolution level for any weapon or trait.
- **Arc Teleporter**: jump to any arc/match/scene (Tag Test, 2nd Selection 3v3, U-20 match, NEL Germany, Season 3 Week 12).
- **Relationship Editor**: set any NPC's status/values (Devoured, Devoted, Hostile, Rival, Eliminated).
- **Flag Inspector**: view/toggle any story flag and see which events depend on it.
- **Auction Override**: set your NEL valuation.
- **Time/Resource editors**: AP, money, injuries, age.
- **Cutscene launcher**: play any cutscene by ID.

---

# 12. Information Architecture & Screens

Main menu · New Game wizard · **Life Hub** (week view: AP, calendar, events inbox, status) · Training · Dorm/Social · Match Day (briefing → pitch → roundup) · Relationship Map (graph) · Ripple Log · Skills/Weapons · Stats & Career · Media feed · Settings (text speed, flashing/shake reduction, content toggles, colorblind mode) · Save/Load · Sandbox.

Accessibility: keyboard navigable, reduced-motion toggle, shake/flash toggles, readable fonts, color-independent state indicators.

---

# 13. Project Structure & Process

```
/src
  /engine      // state, event scheduler, relationship/rep systems, save/migrate
  /match       // map runner, sim, clash resolver, radar renderer
  /cutscene    // script runner, panels, impact, portraits
  /content     // characters, events, matches, weapons, arcs (data only)
  /ui          // screens and components
  /dev         // sandbox, cutscene test page, flag inspector
/docs          // STORY_BIBLE.md, CANON_NOTES.md, CONTENT_GUIDE.md
ASSETS.md
```

Before writing code, produce a **short design doc** (≤2 pages) with: data schemas, event grammar, and the milestone plan. Then build in milestones, each **playable and saved/loaded**, and tell me what you tested at the end of each one.

| Milestone | Deliverable |
|---|---|
| **M1** | Core state/store, save/load, relationship graph, flag system, content schemas + validation, Sandbox panel (flags, relationships, skill points). |
| **M2** | Cutscene engine + test page, layered portrait system, character creation with all 4 origins, one fully scripted opening scene that diverges by origin. |
| **M3** | Life Hub weekly loop: AP planner, training, 15+ events with delayed consequences, Ripple cards. |
| **M4** | Match engine: map runner, radar canvas, clash nodes, flow/metavision/weapons, post-game roundup; one complete authored match. |
| **M5** | Arc controller: Prologue Tag Test + First Selection fully playable with permanent eliminations and squad divergence. |
| **M6+** | Second Selection, Third Selection/U-20, NEL, World Cup, original final arcs; optional 3D layer; audio pass. |

**Start now with M1 and M2.** At the end of M2, show me the origin-divergent opening scene and the Sandbox working, state what you verified in the browser, and list anything you cut or faked.

## Rules of engagement
- Don't stub major systems with comments like "TODO: implement later" and call them done.
- Don't fake data: if content is placeholder, label it `PLACEHOLDER` in the data.
- Keep canon inaccuracies in `CANON_NOTES.md` instead of hiding them.
- If a design choice has a real trade-off, make a call, record it in the design doc, and keep moving.
