# Voice and sounds

Two ways to add sound. Both are optional and can be mixed.

## 1. Random character clips (recommended): grunts, laughs, "hm", short phrases
```
voice/<characterId>/anything.mp3            plays at random when that character speaks
voice/<characterId>/furious/anything.mp3    used only for lines spoken with that emotion
voice/player/hm.mp3                         your own character
```
Emotions: `neutral smirk furious shocked despair flow metavision devoured`. The same clip never plays twice in a row.
Make **5+ clips per character** so it doesn't get repetitive. Settings → *Character voice clips* controls how often they play.

## 2. Exact recordings for specific lines
Run `npm run voice:export`, then put a file at the path in the `file` column of `docs/voice-script.csv`, e.g. `voice/opening.main_23.mp3`. An exact recording always beats a random clip.

**Format (both):** MP3 (OGG/WAV/M4A also work), mono, 44.1 kHz, trimmed silence at both ends, similar loudness across files (about −16 LUFS). Clips 0.2–3 s, exact lines up to ~8 s.

Then run `npm run assets:scan` and refresh.
