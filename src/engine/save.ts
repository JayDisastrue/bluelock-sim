import { GameStateSchema, SAVE_FORMAT, type GameState } from './schemas'

export const SAVE_VERSION = 1

export interface SaveFile {
  format: typeof SAVE_FORMAT
  version: number
  savedAt: string
  label: string
  data: GameState
}

/** key = version being upgraded FROM; the function returns data shaped for version+1. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>
export const MIGRATIONS: Record<number, Migration> = {}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}

let fallback: StorageLike | undefined
/** localStorage when usable, otherwise an in-memory stand-in (private windows, blocked storage). */
export function safeStorage(): StorageLike {
  try {
    const k = '__blel_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    return (fallback ??= memoryStorage())
  }
}

export function migrate(
  raw: { version: number; data: unknown },
  migrations: Record<number, Migration> = MIGRATIONS,
  target = SAVE_VERSION,
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!Number.isInteger(raw.version) || raw.version < 1) return { ok: false, error: `Invalid save version ${String(raw.version)}` }
  if (raw.version > target) return { ok: false, error: `Save is from a newer version (v${raw.version}); this build reads up to v${target}.` }
  let data = raw.data as Record<string, unknown>
  for (let v = raw.version; v < target; v++) {
    const m = migrations[v]
    if (!m) return { ok: false, error: `No migration from v${v} to v${v + 1}` }
    try {
      data = m(structuredClone(data))
    } catch (err) {
      return { ok: false, error: `Migration v${v}→v${v + 1} failed: ${(err as Error).message}` }
    }
  }
  return { ok: true, data }
}

export function parseSave(input: string | unknown): { ok: true; save: SaveFile } | { ok: false; error: string } {
  let obj: unknown = input
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input)
    } catch {
      return { ok: false, error: 'File is not valid JSON.' }
    }
  }
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'Save is empty.' }
  const o = obj as Record<string, unknown>
  if (o.format !== SAVE_FORMAT) return { ok: false, error: 'Not a Blue Lock: Egoist Life save file.' }
  const mig = migrate({ version: Number(o.version), data: o.data })
  if (!mig.ok) return mig
  const parsed = GameStateSchema.safeParse(mig.data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: `Save failed validation at ${first?.path.join('.') || '(root)'}: ${first?.message}` }
  }
  return {
    ok: true,
    save: { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: String(o.savedAt ?? new Date().toISOString()), label: String(o.label ?? ''), data: parsed.data },
  }
}

export function makeSave(state: GameState, label = ''): SaveFile {
  return { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: new Date().toISOString(), label, data: state }
}

// ── slots ──
export const AUTOSAVE_KEY = 'blel.autosave'
export const SLOT_COUNT = 3
export const slotKey = (n: number) => `blel.slot.${n}`

export interface SlotSummary {
  key: string
  slot: number | 'auto'
  empty: boolean
  corrupt?: string
  label?: string
  savedAt?: string
  name?: string
  origin?: string
  week?: number
  sandboxUsed?: boolean
}

export function writeSave(key: string, state: GameState, label = '', storage: StorageLike = safeStorage()): boolean {
  try {
    storage.setItem(key, JSON.stringify(makeSave(state, label)))
    return true
  } catch {
    return false
  }
}

export function readSave(key: string, storage: StorageLike = safeStorage()): { ok: true; save: SaveFile } | { ok: false; error: string } {
  const raw = storage.getItem(key)
  if (!raw) return { ok: false, error: 'Empty slot.' }
  return parseSave(raw)
}

export function summarize(key: string, slot: number | 'auto', storage: StorageLike = safeStorage()): SlotSummary {
  const raw = storage.getItem(key)
  if (!raw) return { key, slot, empty: true }
  const r = parseSave(raw)
  if (!r.ok) return { key, slot, empty: false, corrupt: r.error }
  const d = r.save.data
  return { key, slot, empty: false, label: r.save.label, savedAt: r.save.savedAt, name: d.player.name, origin: d.player.origin, week: d.meta.turn, sandboxUsed: d.meta.sandboxUsed }
}

export function listSlots(storage: StorageLike = safeStorage()): SlotSummary[] {
  return [summarize(AUTOSAVE_KEY, 'auto', storage), ...Array.from({ length: SLOT_COUNT }, (_, i) => summarize(slotKey(i + 1), i + 1, storage))]
}

export function deleteSave(key: string, storage: StorageLike = safeStorage()) {
  storage.removeItem(key)
}
