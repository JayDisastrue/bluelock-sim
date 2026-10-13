# Backgrounds

**Format:** JPG, WebP or PNG, **1920 × 1080 (16:9)**, under 1.5 MB. No text or UI baked in.
Keep the bottom ~30% calm (low detail): the dialogue box sits there.

**Name the file after the scene id:** one of the 131 ids in [`docs/IDS.md`](../../../docs/IDS.md) (grouped: current scenes, facility, pitches, home life, world stage, match day, venues from the series, transitions and cards, cutscene moods, abstract). Transition and card ids (`wipe_*`, `speedlines`, `title_card`, `chapter_card`, `week_card`, `loading_pitch`) are full-frame art for scene changes and match intros, e.g. `cafeteria.jpg`. The 14 used by today's scenes are `black letter room_z cafeteria locker_room training_pitch tunnel stadium monitor_wall ego_office old_pitch academy_gate street_cage bench_dusk`; the rest are reserved for future scenes.

Then run `npm run assets:scan` and refresh. Missing ones show a plain gradient.
