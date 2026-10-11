// Wires up whatever image files you drop into public/assets/ by updating manifest.json. No manual editing needed.
//   portraits/<id>.png            default art for a character id (or "player")
//   portraits/<id>_<emotion>.png  emotion-specific art: neutral smirk furious shocked despair flow metavision devoured (or "manga")
//   backgrounds/<bgId>.jpg        scene background (ids listed below)
// If several files share a name with different extensions, the most recently modified one wins.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

const ROOT = 'public/assets'
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i
const EMOTIONS = ['neutral', 'smirk', 'furious', 'shocked', 'despair', 'flow', 'metavision', 'devoured', 'manga']
const BG_IDS = ['black', 'letter', 'room_z', 'cafeteria', 'locker_room', 'training_pitch', 'tunnel', 'stadium', 'monitor_wall', 'ego_office', 'old_pitch', 'academy_gate', 'street_cage', 'bench_dusk']

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

const backgrounds = {}
for (const { f } of files('backgrounds')) backgrounds[f.replace(IMG, '')] = `backgrounds/${f}`
manifest.backgrounds = backgrounds

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`portraits: ${Object.keys(portraits).length} characters (${Object.values(portraits).reduce((n, e) => n + Object.keys(e).length, 0)} files)`)
console.log(`backgrounds: ${Object.keys(backgrounds).length}/${BG_IDS.length}`)
const missing = BG_IDS.filter((id) => !backgrounds[id])
if (missing.length) console.log(`  missing backgrounds: ${missing.join(', ')}`)
const unknown = Object.keys(backgrounds).filter((id) => !BG_IDS.includes(id))
if (unknown.length) console.log(`  WARNING unknown background ids (ignored by the game): ${unknown.join(', ')}`)
