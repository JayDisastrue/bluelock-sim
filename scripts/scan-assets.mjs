// Wires up whatever image files you drop into public/assets/ by updating manifest.json. No manual editing needed.
//   portraits/<id>.png            default art for a character id (or "player")
//   portraits/<id>_<emotion>.png  emotion-specific art: neutral smirk furious shocked despair flow metavision devoured (or "manga")
//   backgrounds/<bgId>.jpg        scene background (ids listed below)
//   player/<slot>/<id>.png        player-creator part image (slots: face hair eyes brow nose mark accessory; 1000x1300, see player/README.md)
//   player/<slot>/<id>_<emotion>.png   emotion variant of a part (eyes/brow/nose/mark)
//   voice/<scriptId>_<n>.mp3      exact voice line (file names come from `npm run voice:export`)
//   voice/<characterId>/*.mp3     random clips for that character (grunts, laughs, short phrases)
//   voice/<characterId>/<emotion>/*.mp3   random clips used only for lines with that emotion
// If several files share a name with different extensions, the most recently modified one wins.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

const ROOT = 'public/assets'
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i
const EMOTIONS = ['neutral', 'smirk', 'furious', 'shocked', 'despair', 'flow', 'metavision', 'devoured', 'manga']
const BG_IDS = ['black', 'letter', 'room_z', 'cafeteria', 'locker_room', 'training_pitch', 'tunnel', 'stadium', 'monitor_wall', 'ego_office', 'old_pitch', 'academy_gate', 'street_cage', 'bench_dusk', 'dorm_hallway', 'dorm_room', 'shower_room', 'gym', 'medical_room', 'lounge', 'rooftop', 'monitor_room_night', 'selection_hall', 'tag_test_arena', 'first_selection_field', 'second_selection_field', 'training_pitch_night', 'training_pitch_rain', 'pitch_sunrise', 'pitch_snow', 'indoor_court', 'futsal_court', 'press_room', 'interview_stage', 'sponsor_lounge', 'ego_lab', 'briefing_room', 'corridor', 'stairwell', 'vending_corner', 'hometown_street', 'school_gym', 'school_classroom', 'school_rooftop', 'riverside_pitch', 'convenience_store', 'train_station', 'airport_gate', 'bus_window', 'bedroom_night', 'family_kitchen', 'hospital_room', 'shrine_steps', 'festival_night', 'beach_dusk', 'cafe', 'u20_stadium_day', 'u20_stadium_night', 'stadium_tunnel_roar', 'press_conference', 'hotel_room', 'city_night', 'locker_room_europe', 'training_ground_europe', 'penalty_spot', 'goal_mouth_close', 'white_void', 'red_void', 'memory_haze', 'flow_field', 'metavision_grid', 'scoreboard_closeup', 'newspaper_wall']

const manifestPath = `${ROOT}/manifest.json`
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
for (const k of ['portraits', 'backgrounds', 'impacts', 'weapons', 'models']) manifest[k] ??= {}

const files = (dir) => (existsSync(`${ROOT}/${dir}`) ? readdirSync(`${ROOT}/${dir}`) : [])
  .filter((f) => IMG.test(f))
  .map((f) => ({ f, t: statSync(`${ROOT}/${dir}/${f}`).mtimeMs }))
  .sort((a, b) => a.t - b.t) // oldest first so the newest overrides

const portraits = {}
for (const { f } of files('portraits')) {
  const stem = f.replace(IMG, '')
  const m = stem.match(new RegExp(`^(.+)_(${EMOTIONS.join('|')})$`))
  const [id, key] = m ? [m[1], m[2]] : [stem, 'default']
  ;(portraits[id] ??= {})[key] = `portraits/${f}`
}
manifest.portraits = portraits
const rosterIds = new Set(JSON.parse(readFileSync('src/content/roster.json', 'utf8')).characters.map((c) => c.id).concat('player'))
const unknownPortraits = Object.keys(portraits).filter((id) => !rosterIds.has(id))
if (unknownPortraits.length) console.log(`WARNING portrait ids not in src/content/roster.json (add them there first): ${unknownPortraits.join(', ')}`)

const backgrounds = {}
for (const { f } of files('backgrounds')) backgrounds[f.replace(IMG, '')] = `backgrounds/${f}`
manifest.backgrounds = backgrounds

const PART_SLOTS = ['face', 'hair', 'eyes', 'brow', 'nose', 'mark', 'accessory']
const playerParts = {}
for (const slot of PART_SLOTS) {
  for (const { f } of files(`player/${slot}`)) {
    const stem = f.replace(IMG, '')
    const m = stem.match(new RegExp(`^(.+)_(${EMOTIONS.join('|')})$`))
    const [id, key] = m ? [m[1], m[2]] : [stem, 'default']
    ;((playerParts[slot] ??= {})[id] ??= {})[key] = `player/${slot}/${f}`
  }
}
manifest.playerParts = playerParts

const AUDIO = /\.(mp3|ogg|wav|m4a|webm)$/i
const voice = {}      // exact lines:  voice/<scriptId>_<n>.mp3
const voiceBanks = {} // random clips: voice/<characterId>/*.mp3  and  voice/<characterId>/<emotion>/*.mp3
const vdir = `${ROOT}/voice`
for (const e of existsSync(vdir) ? readdirSync(vdir, { withFileTypes: true }) : []) {
  if (e.isFile() && AUDIO.test(e.name)) voice[e.name.replace(AUDIO, '')] = `voice/${e.name}`
  if (e.isDirectory()) {
    const bank = {}
    for (const f of readdirSync(`${vdir}/${e.name}`, { withFileTypes: true })) {
      if (f.isFile() && AUDIO.test(f.name)) (bank.default ??= []).push(`voice/${e.name}/${f.name}`)
      if (f.isDirectory()) {
        const emo = EMOTIONS.includes(f.name) ? f.name : 'default'
        for (const g of readdirSync(`${vdir}/${e.name}/${f.name}`)) if (AUDIO.test(g)) (bank[emo] ??= []).push(`voice/${e.name}/${f.name}/${g}`)
      }
    }
    if (Object.keys(bank).length) voiceBanks[e.name] = bank
  }
}
manifest.voice = voice
manifest.voiceBanks = voiceBanks

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`portraits: ${Object.keys(portraits).length} characters (${Object.values(portraits).reduce((n, e) => n + Object.keys(e).length, 0)} files)`)
console.log(`player parts: ${Object.values(playerParts).reduce((n, o) => n + Object.keys(o).length, 0)} options across ${Object.keys(playerParts).length} slots`)
console.log(`voice: ${Object.keys(voice).length} exact lines, ${Object.keys(voiceBanks).length} character banks (${Object.values(voiceBanks).reduce((n, b) => n + Object.values(b).flat().length, 0)} clips)`)
console.log(`backgrounds: ${Object.keys(backgrounds).length}/${BG_IDS.length}`)
const missing = BG_IDS.filter((id) => !backgrounds[id])
if (missing.length) console.log(`  ${missing.length} background ids have no art yet (see docs/IDS.md); first few: ${missing.slice(0, 8).join(', ')}`)
const unknown = Object.keys(backgrounds).filter((id) => !BG_IDS.includes(id))
if (unknown.length) console.log(`  WARNING unknown background ids (ignored by the game): ${unknown.join(', ')}`)
