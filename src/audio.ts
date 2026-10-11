import { assetUrl, loadManifest } from './assets'
import { useSettings } from './engine/settings'
import { pickBankClip, voiceKey, type VoiceBanks } from './engine/voice'

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

const lastClip = new Map<string, string>()

/**
 * Voice for a spoken line. Order: exact recording for this line (origin variant first), then a random clip from the
 * speaker's voice bank (chance set in Settings). Silent when nothing is indexed.
 */
export async function voice(lineId: string, origin: string | undefined, who: string, emotion?: string): Promise<void> {
  const { sfx, voiceChance } = useSettings.getState()
  if (!sfx) return
  const m = (await loadManifest()) as unknown as { voice?: Record<string, string>; voiceBanks?: VoiceBanks }
  const exact = m.voice?.[lineId] ?? (origin ? m.voice?.[voiceKey(lineId, origin)] : undefined) ?? m.voice?.[voiceKey(lineId)]
  let file = exact
  if (!file && Math.random() < voiceChance) {
    file = pickBankClip(m.voiceBanks, who, emotion, lastClip.get(who), Math.random)
    if (file) lastClip.set(who, file)
  }
  if (file) void make(assetUrl(file), false)?.play().catch(() => {})
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
