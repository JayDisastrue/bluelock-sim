import { useEffect, useState } from 'react'

/** Shape of public/assets/manifest.json. Every id is optional: anything missing falls back to generated art. */
export interface Manifest {
  portraits: Record<string, { default?: string; manga?: string } & Partial<Record<string, string>>>
  backgrounds: Record<string, string>
  impacts: Record<string, string>
  weapons: Record<string, string>
  models: Record<string, string>
  /** exact per-line recordings: file stem → path */
  voice?: Record<string, string>
  /** random clips per character: id → { default: [...], <emotion>: [...] } */
  voiceBanks?: Record<string, { default?: string[] } & Partial<Record<string, string[]>>>
}
const EMPTY: Manifest = { portraits: {}, backgrounds: {}, impacts: {}, weapons: {}, models: {} }

let manifest: Manifest = EMPTY
let loading: Promise<Manifest> | null = null
const listeners = new Set<() => void>()
const base = () => import.meta.env.BASE_URL

/** Fetches the manifest once. A missing/invalid manifest just means "use generated placeholders". */
export function loadManifest(): Promise<Manifest> {
  loading ??= fetch(`${base()}assets/manifest.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : EMPTY))
    .then((m: Partial<Manifest>) => {
      manifest = { ...EMPTY, ...m }
      listeners.forEach((l) => l())
      return manifest
    })
    .catch(() => EMPTY)
  return loading
}

export function useManifest(): Manifest {
  const [, tick] = useState(0)
  useEffect(() => {
    const l = () => tick((n) => n + 1)
    listeners.add(l)
    void loadManifest()
    return () => void listeners.delete(l)
  }, [])
  return manifest
}

/** URL for a character's art in the given emotion (emotion-specific file, else the default). */
export function portraitUrl(m: Manifest, artId: string, emotion?: string): string | undefined {
  const e = m.portraits[artId]
  const file = (emotion && e?.[emotion]) || e?.default
  return file ? `${base()}assets/${file}` : undefined
}
export const assetUrl = (file: string) => `${base()}assets/${file}`
