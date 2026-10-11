// Fetches COLORED character art (anime designs / key visuals / uniform art) from the Blue Lock fandom wiki
// into public/assets/portraits, plus the B&W manga infobox panel as a fallback.
// Writes public/assets/manifest.json + public/assets/SOURCES.json.
// Personal, non-commercial fan use only. The downloaded files are gitignored (see .gitignore).
import { mkdir, writeFile } from 'node:fs/promises'

const WIKI = 'https://bluelock.fandom.com'
const CAST = {
  ego: 'Jinpachi Ego', anri: 'Anri Teieri', bachira: 'Meguru Bachira', barou: 'Shoei Baro',
  chigiri: 'Hyoma Chigiri', kunigami: 'Rensuke Kunigami', raichi: 'Jingo Raichi',
  rin: 'Rin Itoshi', sae: 'Sae Itoshi', nagi: 'Seishiro Nagi', reo: 'Reo Mikage',
  noel_noa: 'Noel Noa', isagi: 'Yoichi Isagi', gagamaru: 'Gin Gagamaru', oliver_aiku: 'Oliver Aiku',
}
const UA = { 'User-Agent': 'bluelock-egoist-life fan project (personal, non-commercial)' }
const api = async (params) =>
  (await fetch(`${WIKI}/api.php?${new URLSearchParams({ format: 'json', redirects: '1', ...params })}`, { headers: UA })).json()

// Higher = better colored portrait. Lowest-scoring (<=0) files are ignored.
function score(name) {
  const n = name.replace(/^File:/, '')
  if (!/\.(png|jpe?g|webp)$/i.test(n)) return 0
  if (/chapter|volume|skill parameter|first appearance|birthday|christmas|collab|pop.?up|coloring book|cafe|beta design/i.test(n)) return 0
  if (/uniform anime design/i.test(n)) return 100
  if (/anime design/i.test(n) && !/suit|casual/i.test(n)) return 90
  if (/anime design/i.test(n)) return 80
  if (/key visual/i.test(n)) return 70
  if (/team z uniform|blue lock 11 uniform|u20/i.test(n)) return 60
  if (/^BL Icon/i.test(n)) return 50
  return 0
}

await mkdir('public/assets/portraits', { recursive: true })
const manifest = { portraits: {}, backgrounds: {}, impacts: {}, weapons: {}, models: {} }
const sources = {}

async function download(url, stem) {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  const ext = ct.includes('webp') ? 'webp' : ct.includes('jpeg') ? 'jpg' : 'png'
  const file = `portraits/${stem}.${ext}`
  await writeFile(`public/assets/${file}`, Buffer.from(await res.arrayBuffer()))
  return file
}

for (const [id, title] of Object.entries(CAST)) {
  const page = Object.values((await api({ action: 'query', titles: title, prop: 'images|pageimages', imlimit: '200', piprop: 'original' })).query.pages)[0]
  const ranked = (page.images || []).map((i) => ({ title: i.title, s: score(i.title) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)
  const entry = {}
  const src = { wikiPage: `${WIKI}/wiki/${title.replace(/ /g, '_')}` }
  if (ranked[0]) {
    const info = Object.values((await api({ action: 'query', titles: ranked[0].title, prop: 'imageinfo', iiprop: 'url' })).query.pages)[0]
    const url = info.imageinfo?.[0]?.url
    if (url) { entry.default = await download(url, id); src.colored = { wikiFile: ranked[0].title, url, file: entry.default } }
  }
  const manga = page.original?.source
  if (manga) { entry.manga = await download(manga, `${id}_manga`); src.manga = { url: manga, file: entry.manga } }
  if (!entry.default && entry.manga) entry.default = entry.manga
  manifest.portraits[id] = entry
  sources[id] = src
  console.log(`${entry.default === entry.manga ? 'B&W ' : 'COLOR'} ${id.padEnd(12)} ${src.colored?.wikiFile ?? '(manga fallback only)'}`)
}
await writeFile('public/assets/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
await writeFile('public/assets/SOURCES.json', JSON.stringify(sources, null, 2) + '\n')
