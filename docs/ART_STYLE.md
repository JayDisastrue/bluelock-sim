# Art style sheet (original characters)

The look: **modern TV-anime production quality, gritty sports-anime**. This is the style block that produced the current cast (full-body standing sheets, one per character). Paste it before every character description so new characters match.

## Style block
> Original character, full-body standing character-design sheet in modern TV-anime production quality (gritty sports-anime): clean thin dark-brown ink linework with subtle line-weight variation, flat matte cel colours with a single soft shadow layer, short ink hatching lines under the jaw and along the neck, large expressive eyes with layered white highlights and a defined upper lash line, finely drawn hands with visible knuckles and fingernails, realistic athletic proportions about 8 heads tall, detailed fabric folds.

**Per-character line:** `Character: <name>, <age>, <build>, <hair>, <eyes>, <expression>. Outfit: <kit with colours, panel pattern, number>.`
**Pose and framing line:** `Standing <pose>, facing three-quarters to the viewer, entire body visible head to boots, plain solid white background, no text, no logo, no other characters, no scenery.`
Generate at 1000×1500 (2:3). Keep one team colour + one accent per kit; give each character a distinct silhouette (hair shape, pose, build).

## Cutting out and importing
`pip install pillow`, then `python3 scripts/cutout.py <raw images dir> public/assets/portraits/` (removes the white background, including enclosed gaps, crops, pads to 2:3). Name inputs `<characterId>.png`. Then `npm run assets:scan`.

## Variations per character (optional)
The game supports `<id>_<emotion>.png` (`neutral smirk furious shocked despair flow metavision devoured`) next to the default `<id>.png`. Close-up and action frames work as `_smirk` / `_furious` variants. Separate text-to-image calls drift a little; for tight consistency generate variants from the approved image with an image-edit model.

## Original cast (descriptions used)
- **sora**: Sora Kaizuka, 17, left winger. Ash-brown side-swept messy hair with a longer fringe over the right eye, amber eyes, small bandage on the left cheek, calm guarded expression. Forest-green bib, white hexagon side panels, number 11, black compression top/leggings.
- **reiji**: Reiji Hasegawa, 17, academy captain. Neat swept sandy-blond hair, narrow blue-grey eyes, polished smirk. Deep-blue bib with white trim, number 10. Arms crossed.
- **mio**: Mio Tachibana, 24, journalist. Shoulder-length curly auburn hair, freckles, hazel eyes. White shirt, red scarf, press lanyard, camera, notebook.
- **haruka**: Haruka Shirane, 15, the player's sister. Black side ponytail, side bangs, teasing smirk. Pale-blue oversized hoodie, grey joggers.
- **dante**: Dante Cavalli, 18, Italian centre-back. Dark curly swept-back hair, thick brows, beauty mark by the mouth. White bib with a green-and-red sash, number 5.
- **lukas**: Lukas Brandt, 18, German forward. Cropped platinum-blond hair, cold pale-blue eyes, no expression. Black bib with red geometric stripes, number 9.
- **tomas**: Tomás Ferreira, 18, Spanish midfielder. Long dark hair tied low, sleepy amused eyes, light stubble. Red bib with a gold diamond panel, number 8.
- **kisaragi**: Ayame Kisaragi, 32, sponsor executive. Sleek crimson bob with straight fringe, sharp eyes, confident smile. Black tailored pantsuit, white blouse, red lapel pin, tablet.
