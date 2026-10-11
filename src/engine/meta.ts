import { create } from 'zustand'
import { ORIGIN_IDS, type OriginId } from './schemas'
import { safeStorage } from './save'

/** Cross-run progress: cutscene gallery + unlocks. Lives outside any save file. */
interface MetaData {
  seenScripts: string[]
  unlockedOrigins: OriginId[]
  completedRuns: number
}
const KEY = 'blel.meta'
const EMPTY: MetaData = { seenScripts: [], unlockedOrigins: [], completedRuns: 0 }

function load(): MetaData {
  try {
    const raw = safeStorage().getItem(KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<MetaData>
    return {
      seenScripts: Array.isArray(p.seenScripts) ? p.seenScripts.filter((x) => typeof x === 'string') : [],
      unlockedOrigins: Array.isArray(p.unlockedOrigins) ? p.unlockedOrigins.filter((x): x is OriginId => (ORIGIN_IDS as readonly string[]).includes(x)) : [],
      completedRuns: Number(p.completedRuns) || 0,
    }
  } catch {
    return EMPTY
  }
}

export const useMeta = create<MetaData & {
  markSeen: (id: string) => void
  unlockOrigins: (ids: OriginId[]) => void
  reset: () => void
}>((set, get) => {
  const persist = () => {
    const { seenScripts, unlockedOrigins, completedRuns } = get()
    try { safeStorage().setItem(KEY, JSON.stringify({ seenScripts, unlockedOrigins, completedRuns })) } catch { /* ignore */ }
  }
  return {
    ...load(),
    markSeen: (id) => {
      if (get().seenScripts.includes(id)) return
      set({ seenScripts: [...get().seenScripts, id] })
      persist()
    },
    unlockOrigins: (ids) => {
      set({ unlockedOrigins: [...new Set([...get().unlockedOrigins, ...ids])] })
      persist()
    },
    reset: () => {
      set(EMPTY)
      persist()
    },
  }
})
