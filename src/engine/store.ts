import { produce } from 'immer'
import { create } from 'zustand'
import { content } from '../content'
import { applyEffect, applyEffects } from './effects'
import { useMeta } from './meta'
import { createGame, type NewGameConfig } from './newGame'
import { advanceTurn as advance } from './scheduler'
import { AUTOSAVE_KEY, readSave, writeSave } from './save'
import type { Effect, GameState, RippleEntry } from './schemas'
import type { GameAPI } from './types'

interface GameStore {
  state: GameState | null
  /** events waiting to be played, in order (filled by advanceTurn) */
  eventQueue: string[]
  newGame: (cfg: NewGameConfig) => void
  load: (state: GameState) => void
  loadAutosave: () => boolean
  quit: () => void
  apply: (effects: Effect[], source: string) => void
  /** Sandbox edits: any mutation flips SANDBOX_USED (design §11). */
  sandbox: (fn: (draft: GameState) => void) => void
  sandboxEffects: (effects: Effect[]) => void
  advanceTurn: () => void
  shiftQueue: () => string | undefined
  pushRipple: (entry: RippleEntry) => void
  markSeen: (scriptId: string) => void
}

export const useGame = create<GameStore>((set, get) => {
  /** Single commit point: updates state and autosaves (every turn / every change). */
  const commit = (next: GameState, extra: Partial<GameStore> = {}) => {
    set({ state: next, ...extra })
    writeSave(AUTOSAVE_KEY, next, 'Autosave')
  }
  const cur = () => {
    const s = get().state
    if (!s) throw new Error('No game in progress')
    return s
  }
  return {
    state: null,
    eventQueue: [],
    newGame: (cfg) => commit(createGame(cfg, content), { eventQueue: [] }),
    load: (state) => commit(state, { eventQueue: [] }),
    loadAutosave: () => {
      const r = readSave(AUTOSAVE_KEY)
      if (!r.ok) return false
      set({ state: r.save.data, eventQueue: [] })
      return true
    },
    quit: () => set({ state: null, eventQueue: [] }),
    apply: (effects, source) => commit(applyEffects(cur(), effects, source)),
    sandbox: (fn) =>
      commit(
        produce(cur(), (d) => {
          fn(d as GameState)
          d.meta.sandboxUsed = true
          d.flags['SANDBOX_USED'] = true
        }),
      ),
    sandboxEffects: (effects) => get().sandbox((d) => { for (const e of effects) applyEffect(d, e, 'sandbox') }),
    advanceTurn: () => {
      const { state: next, queue } = advance(cur(), content)
      commit(next, { eventQueue: [...get().eventQueue, ...queue] })
    },
    shiftQueue: () => {
      const [head, ...rest] = get().eventQueue
      if (head !== undefined) set({ eventQueue: rest })
      return head
    },
    pushRipple: (entry) =>
      commit(produce(cur(), (d) => {
        d.ripples.push(entry)
        d.meta.nextId += 1
      })),
    markSeen: (scriptId) => {
      useMeta.getState().markSeen(scriptId)
      const s = get().state
      if (s && !s.scenes.seen.includes(scriptId)) commit(produce(s, (d) => void d.scenes.seen.push(scriptId)))
    },
  }
})

/** GameAPI bound to the live store, for the cutscene runner. */
export const liveApi: GameAPI = {
  get: () => {
    const s = useGame.getState().state
    if (!s) throw new Error('No game in progress')
    return s
  },
  apply: (effects, source) => useGame.getState().apply(effects, source),
  markSeen: (id) => useGame.getState().markSeen(id),
  pushRipple: (e) => useGame.getState().pushRipple(e),
}
