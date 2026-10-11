# Player creator parts (mix and match)

Every part is a **transparent PNG, exactly 1000 × 1300 px (10:13)**, with the part drawn in the right place on that canvas.
Use `_template.png` as the alignment guide: it marks the head oval, eye line, brows, nose, mouth, chin, ears and shoulders.
Draw **only the one part** (e.g. just the eyes, or just the hair) and delete the guide layer before exporting.

```
player/face/<id>.png         head shape + skin (replaces the drawn head and ears)
player/hair/<id>.png         hair (front and back in one image; it is drawn over the face)
player/eyes/<id>.png         both eyes
player/brow/<id>.png         both eyebrows
player/nose/<id>.png         nose
player/mark/<id>.png         scar / bandage / freckles / etc.
player/accessory/<id>.png    glasses, headband, earrings, ...
```

- **Image-first:** once a slot has any image, the creator offers **only your images** for that slot (the drawn placeholders disappear). Slots with no images still show the drawn placeholders.
- **New part:** any `<id>` becomes an option automatically. Using a built-in id (`hair/spiky.png`) is fine too.
- **Expressions (optional):** `eyes/sharp_furious.png`, `brow/thin_shocked.png` … (emotions: `neutral smirk furious shocked despair flow metavision devoured`). The plain `<id>.png` is the fallback.
- **Colours:** parts are fixed colour. For several hair colours make `hair/spiky_black.png`, `hair/spiky_red.png`, … (the creator lists each file as its own option).
- **Mixing:** slots mix freely, so you can import only hair and keep the drawn eyes until you add eye images.

Then run `npm run assets:scan` and refresh. The full id list lives in `docs/IDS.md`. Built-in placeholder ids: face `oval round square long heart sharp`; hair `spiky swept shaggy buzz undercut curly long mohawk bob ponytail side_part topknot wavy pixie afro braid`; eyes `sharp round narrow droopy upturned wide almond heavy_lid`; brow `straight thick thin arched angled soft`; nose `small straight pointed broad`; mark `none scar bandage mole freckles eyebags bruise`; accessory `none headband glasses earring hair_clip`.
