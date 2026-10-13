# Canon notes

Where I was unsure of canon or took a liberty. Please correct anything wrong; each is one line of data in `src/content/characters/canon.ts`.

- **Barou's weapon** is written as “Predator Eye (verify)”. I am not certain whether that ability is his or Isagi's.
- **Which team each canon player belongs to** (Z / V …) is deliberately not stated. The opening only uses first-meeting dialogue, not team rosters.
- **Sae Itoshi's club and Noel Noa's exact role** (coach/judge in the Third Selection and U-20 arc) are described loosely and marked `placeholder`.
- **Kunigami, Raichi, Chigiri, Nagi, Reo, Gagamaru, Oliver Aiku** have short summary data (personality, play style, one weapon); only the six characters used in the opening have per-origin dialogue variants so far.
- **Canon-adjacent liberties:** Ego's wound-targeting lines, the origin-dependent approacher (Bachira for street players, Barou for playmakers, Rin for the Prodigy's Shadow, Kunigami for the Late Starter) and all dialogue are my invention in the spirit of the characters, not transcriptions.
- **“Subordinate” status** means the NPC is subordinate *to you*. A player serving Barou is tracked with the flag `SERVANT_OF:barou` instead.
- **Ego types** (predator / architect / wildcard / survivor / monarch) are original categories, not canon terms.
- The eight **original characters** (Sora, Reiji, Mio, Haruka, Dante, Lukas, Tomás, Kisaragi) are invented; five of them are `placeholder` until their arcs.
- **Reserved roster (`src/content/roster.json`, tabled in `docs/ROSTER.md`)**: 218 canon names and their team memberships were read from the public wiki's character and team categories (names only; roles are "player"/"staff"/"family" unless I was sure). The wiki's spellings are used for new entries (e.g. Julien Loki, Vivien Hugo, Pablo Cavasoz); the game keeps its own display names for the 15 characters already written (e.g. "Shoei Barou", wiki: "Shoei Baro"). 20 wiki characters are in no team category and have region `other`. Several canon characters belong to more than one squad (selection teams, then clubs or the national side): `teams` lists every squad found.
- The 305 **original** entries are invented: 8 written characters plus generated players, coaches and staff to fill squads to 23 (Blue Lock teams to 11), facility staff, officials, media, sponsors and family. Names come from per-country lists and may coincide with real people; check before shipping.
