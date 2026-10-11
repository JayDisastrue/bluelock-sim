# HANDOFF: BLUE LOCK: EGOIST LIFE

Everything a fresh session needs. Read this top to bottom, then `docs/BUILD_PROMPT.md` (the original spec the owner wrote), `docs/DESIGN.md`, `docs/CONTENT_GUIDE.md`, `ASSETS.md`, `docs/IDS.md`.

## Kickoff prompt (paste into the new session)
> Read HANDOFF.md in the repo and continue. First restart the working branch from main. Then do, in order: (1) the rarity-based weapons expansion (spec in HANDOFF §6A), (2) the Gemini image-edit part-extraction pipeline (§6B) and the full-body preset route (§6C), showing me contact sheets for approval before any bulk generation. My Gemini API key is stored as an environment secret; never print it or ask me to paste it. Be direct, no preamble.

## 1. State at handoff
- Repo: `JayDisastrue/bluelock-sim`. `main` = `7c13b2e` (PRs #1–#4 merged). Live site (GitHub Pages, auto-deploys on push to `main`): https://jaydisastrue.github.io/bluelock-sim/
- Working branch convention for the harness: `claude/modest-darwin-z0ol01`. Its PRs are all merged, so **restart it from main** before new work: `git fetch origin main && git checkout -B claude/modest-darwin-z0ol01 origin/main`. Never stack commits on merged history.
- **Milestones M1 + M2 are complete** (see the original prompt for M3+). Checks at handoff: `tsc`, `eslint`, **72 vitest tests**, production build, **54 Playwright checks**, all green.
- The owner usually wants changes **merged to main and visible on the live site** (they said "auto merge", and complained when files were missing on `main`). Open a PR and merge it after checks pass, unless told otherwise.

## 2. What exists
**Engine** (`src/engine`, pure/immer, Zod is the source of truth): condition grammar; full effect vocabulary incl. `changePosition`/`changeFoot`; rule-driven relationship statuses with hysteresis; dialogue-tone effect models (Provoke/Analyze/Ignore/Devour/Support); ripple builder; deterministic scheduler with delayed consequences; versioned saves (3 slots + autosave, JSON export/import) and **copy-paste save codes** `BLEL1.<crc32>.<gzip base64url>` for cross-device play; `rollFate` (rolled strong foot 45/45/10 + rolled starting weapon); `idlist.ts` (generates `docs/IDS.md`).
**Cutscene engine** (`src/cutscene`): script runner (guards, labels, branch, `run` subroutines, tone choices, timed choices whose timeout has consequences), typewriter with stable box size, manga panels, impact cards, diagonal duel cut-ins, auras, vision overlay, backlog/auto/fast/skip-seen, Ripple cards, replay gallery, `/dev/cutscenes` test page, voice hook.
**Content** (`src/content`): 6 origins (2 unlockable), **23 characters** (15 canon, 8 original), 6 weapons, 11 traits, **23 scenes**, 9 delayed-consequence events, 40 authored flags. The opening scene diverges by origin (cold open, Ego's callout, a different approacher, gated options).
**UI**: main menu, creation wizard (identity → appearance → origin → ego & weapon → confirm; **position locked to striker**, foot and weapon rolled with re-rolls), Life Hub (**PLACEHOLDER**; M3 is next), relationship map, ripple log, gallery, save/load (+ save code), settings, Sandbox (`~`, flips `SANDBOX_USED`), flag inspector.
**Player creator**: parts catalog (6 face shapes, 16 hair, 8 eyes, 6 brows, 4 noses, 7 marks, 5 accessories + palettes, per-slot dice, randomize-all). **Image-first**: once any image exists in `public/assets/player/<slot>/` only images are offered for that slot; drawn SVG parts are placeholders.
**Assets**: 8 AI-generated original character portraits in `public/assets/portraits/` (sora, reiji, mio, haruka, dante, lukas, tomas, kisaragi). Canon characters have no art (a neutral silhouette shows) until the owner imports their own.

## 3. Commands
```
npm install
npm run dev            # http://localhost:5173
npm test               # vitest (72)
npm run lint && npm run typecheck && npm run build
npm run e2e            # needs `vite preview` on :4173 and a chromium; set PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
npm run assets:scan    # index portraits, backgrounds, player parts, voice into public/assets/manifest.json
npm run ids            # regenerate docs/IDS.md (a test fails if it is stale)
npm run voice:export   # docs/voice-script.csv: every voiceable line and its file slot
python3 scripts/cutout.py <in> <out> [--pockets N]   # remove white background, frame 2:3 (needs Pillow)
```

## 4. Hard boundaries decided in this project (keep them)
- **No cloning/ripping the real voice actors' voices or anime audio.** Voice support is file-driven: random per-character clips (`voice/<characterId>/*.mp3`, optional `<emotion>/`) and exact per-line recordings; the owner imports files they have rights to.
- **No bulk scraping of manga/anime art.** Earlier a few images were fetched at the owner's request; they were later removed. The owner imports their own art. Do not generate likenesses of existing characters; generated art is for **original** characters only. The style target is "modern TV-anime sports-drama production quality" (see `docs/ART_STYLE.md`), not any specific character's design.
- Honest reporting: say what was verified in a browser vs only unit-tested; mark placeholder content `PLACEHOLDER`; log canon uncertainties in `docs/CANON_NOTES.md`.
- Don't spend the owner's paid credits without their OK on the plan and count.

## 5. Environment notes
- **Figma image generation** (paid, owner's credits): tool `mcp__Figma__generate_image`; plan `team::1643567194846001904` (owner's own admin team); best model so far `gemini-3.1-flash-image`; returns ~848×1264 PNG/JPEG at a URL valid 7 days (download with curl). Text-only, **cannot take a reference image**, so cross-call consistency drifts. About 12 image calls used so far.
- **Gemini API** (the owner said they added a key as an environment secret): it was **not visible** in the earlier session (secrets load at session start). In the new session check names only: `env | cut -d= -f1 | grep -iE "gemini|google|genai"`. Never print the value, never ask the owner to paste it. `generativelanguage.googleapis.com` is reachable from the container. Image-capable model ids change often; list them via the API (without echoing the key) and make the model an env var (`GEMINI_IMAGE_MODEL`). If the key still isn't visible: environment settings → add as a Network secret / environment variable, then start a new session.
- Playwright is installed (`playwright-core`) with chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **Shell gotcha:** `pkill -f "vite preview"` (or any pattern that appears in your own command line) kills your own shell (exit 144). Kill by PID: `for p in $(pgrep -f "vite preview" | grep -v "^$$\$"); do kill $p; done`.
- `shots/` is gitignored scratch. The GitHub Pages site is **public**, and `public/assets` is committed, so anything the owner drops in is published after a merge (see `ASSETS.md`).
- Cloud sessions can only show the owner files inside the working dir; send images with `SendUserFile`.

## 6. Pending work (in this order)

### 6A. Rarity-based weapons (the owner's latest request)
Goal: "a lot more weapons based on rarity… a new-generation-11 player should have a rarer weapon than a basic one; invent some; use info from the wiki."
- **Where:** `src/content/weapons.ts`, `WeaponSchema` in `src/engine/schemas.ts`, `rollFate` in `src/engine/fate.ts`, wizard weapon card in `src/ui/NewGame.tsx`, Hub weapons list, Sandbox weapons tab, `src/engine/idlist.ts` (add rarity column) then `npm run ids`.
- **Schema additions:** `rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary'|'mythic'`, `category: 'shooting'|'dribbling'|'passing'|'vision'|'movement'|'defense'|'physical'|'mental'`, `source: 'original'|'inspired'`, optional `obtain` (how the story grants non-start weapons). Keep `levels[3]`, `trigger`, `cost`, `cooldown`, `counters`.
- **Tiers (display name → meaning):** common = *Fundamental*; uncommon = *Refined*; rare = *Specialist*; epic = *Egoist*; legendary = *New Generation XI* (Gen-11-level signature); mythic = *World XI* (story-only, never rolled at start).
- **Target ~40 weapons:** ~10 common, 9 uncommon, 8 rare, 6 epic, 5 legendary, 3 mythic. Cover every category; mix of original inventions and wiki-**inspired** concepts.
- **Wiki research (read-only):** `https://bluelock.fandom.com/api.php` (works from the container; the HTML pages 403). Use it to see which kinds of abilities exist, then **write original names and descriptions in your own words**; do not copy wiki text; canon-inspired weapons get original names, `source: 'inspired'`.
- **Starting roll weights (seedable only):** common 50, uncommon 28, rare 14, epic 6, legendary 2, mythic 0. Re-roll button keeps the same odds. Legendary/mythic are normally story rewards via `unlockWeapon`/`evolveWeapon`.
- **Accessibility:** show rarity with a **label/glyph, not colour alone** (the project has a colour-blind mode).
- **Tests:** weights/odds with a seeded rand, every weapon has 3 levels and unique id, no mythic is start-eligible, `docs/IDS.md` regenerated, update `src/engine/fate.test.ts` and `e2e/creator.mjs` (it currently expects ≥3 distinct rolled weapons and that the non-seedable one never appears).

### 6B. Gemini image-edit part extraction (aligned layers for the creator)
Goal: image-based mix-and-match parts in a TV-anime style, replacing the drawn SVG placeholders.
- Parts are transparent PNGs, **1000×1300**, aligned to `public/assets/player/_template.png`, at `public/assets/player/<slot>/<id>.png` (slots face/hair/eyes/brow/nose/mark/accessory; ids in `docs/IDS.md`; format in `public/assets/player/README.md`).
- Pipeline to build as `scripts/gen-parts.*` (key from env, model from `GEMINI_IMAGE_MODEL`):
  1. Generate/approve ONE neutral base bust on white, placed per the template guides (centre x=500, eye line y≈580, mouth ≈790, chin ≈910).
  2. For each option, image-edit the base: "change only the <slot> to <variant>; keep everything else identical (face, skin, eyes, outfit, framing, white background)".
  3. Extract the layer by diffing against the base inside the slot's region (mask, feather), reject results that drift outside the region (retry ≤3), cut background with `scripts/cutout.py` logic.
  4. Colour variants (hair/eye colours) by recolouring in Python, not regenerating.
  5. Write to `public/assets/player/<slot>/`, run `npm run assets:scan`, verify in the wizard with a contact sheet.
- **Show the owner a contact sheet and get approval before bulk generation** (cost). Expect generative drift; be honest about quality.

### 6C. Full-body preset route (the reliable alternative; do both)
- Generate ~20–30 original full-body player looks (mixed builds/genders/hair/kits) in the `docs/ART_STYLE.md` style, cut out with `scripts/cutout.py`, store as `public/assets/player/presets/<id>.png` (+ optional `<id>_<emotion>.png`).
- Extend `scan-assets.mjs` (`manifest.playerPresets`), `PortraitSpec` (optional `preset` id), `Portrait` (a chosen preset renders like `player.png`), wizard (Appearance step tabs: **Presets | Mix & match**, with a random-preset dice), tests and e2e.

### 6D. Next milestones from the original prompt
M3 Life Hub weekly loop (AP planner, training, 15+ events with delayed consequences, Ripple cards; the Hub is a placeholder now) → M4 match engine → M5 Tag Test + First Selection → M6+. `modifyAI`, `modifyMatchScript`, formation and roster are stored in state but not consumed until M4.

### 6E. Known gaps
- Not visually verified: Flow/Metavision auras, `strip3`/`wideTop` panel layouts, tablet widths, reduced-motion and colour-blind modes.
- Browser-played origins: Fallen Ace, Street Renegade, Overlooked Playmaker (the other three are covered by unit tests only).
- Original cast is 8 of the 12+ the prompt asks for (5 are placeholders until their arcs); only the six opening characters have per-origin dialogue variants.
- Save migrations: only v1 exists; the chain is tested with synthetic migrations.
- Generated art: a few tiny white pockets can remain after cutout (tune `--pockets`); one image per character (no expression variants yet).
- Drawn SVG parts are intentionally plain placeholders.

## 7. Working style the owner expects
Direct answers, no preamble or filler or trailing summaries; plain prose or tight lists. Show things (screenshots, contact sheets) instead of describing them. Verify in a real browser and report what you actually saw. Make the call and move on; ask only when a decision is genuinely theirs (spending credits, publishing, which design). They get frustrated by refusals without a workable alternative, so offer the closest allowed route immediately.
