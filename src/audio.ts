import { assetUrl, loadManifest } from './assets'
import { useSettings } from './engine/settings'
import { voiceFile } from './engine/voice'

/**
 * Audio facade. Calls are safe no-ops when files are missing, so sound can be dropped into
 * public/assets/audio/{sfx,music,voice}/<id>.(mp3|ogg|wav) later without code changes.
 * Declare files in manifest.json under "sfx", "music" or "voice" (id → path relative to /assets).
 */
type Kind = 'sfx' | 'music' | 'voice'
const cache = new Map<string, HTMLAudioElement | null>()
let current: HTMLAudioElement | null = null
let currentTrack: string | undefined

async function lookup(kind: Kind, id: string): Promise<string | undefined> {
  const m = (await loadManifest()) as unknown as Record<string, Record<string, string> | undefined>
  const file = m[kind]?.[id]
  return file ? assetUrl(file) : undefined
}

function make(url: string, loop: boolean): HTMLAudioElement | null {
  try {
    const a = new Audio(url)
    a.loop = loop
    a.addEventListener('error', () => cache.set(url, null))
    return a
  } catch {
    return null
  }
}

export async function play(id: string): Promise<void> {
  if (!useSettings.getState().sfx) return
  const url = await lookup('sfx', id)
  if (!url) return
  const a = make(url, false)
  void a?.play().catch(() => {})
}

const missing = new Set<string>()

/** Plays the voice file for a line if one exists (manifest entry, origin variant, then generic). Silent otherwise. */
export async function voice(lineId: string, origin?: string): Promise<void> {
  if (!useSettings.getState().sfx) return
  const m = (await loadManifest()) as unknown as { voice?: Record<string, string> }
  const candidates = [
    m.voice?.[lineId],
    origin ? voiceFile(lineId, origin) : undefined,
    voiceFile(lineId),
  ].filter((x): x is string => !!x && !missing.has(x))
  for (const file of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      const a = make(assetUrl(file), false)
      if (!a) return resolve(false)
      a.addEventListener('error', () => { missing.add(file); resolve(false) }, { once: true })
      a.addEventListener('canplaythrough', () => { void a.play().catch(() => {}); resolve(true) }, { once: true })
      a.load()
    })
    if (ok) return
  }
}

export async function music(track: string | undefined): Promise<void> {
  if (track === currentTrack) return
  currentTrack = track
  current?.pause()
  current = null
  if (!track || !useSettings.getState().music) return
  const url = await lookup('music', track)
  if (!url || currentTrack !== track) return
  current = make(url, true)
  void current?.play().catch(() => {})
}
