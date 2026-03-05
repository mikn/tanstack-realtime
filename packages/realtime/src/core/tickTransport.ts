/**
 * Tick-based batching hook — batches updates per tick interval for
 * high-frequency realtime use cases like multiplayer games.
 *
 * Instead of publishing individual events, `setState()` sets the local state
 * for a channel and the hook batches all dirty channels into a single
 * frame sent once per tick interval.
 *
 * On the receiving side, `onTick()` delivers the full batched frame per tick
 * rather than individual events. Tick wire frames are filtered from normal
 * `subscribe()` callbacks via a `beforeDeliver` hook.
 */

import { Store } from '@tanstack/store'
import type { HookHandle } from './hooks.js'
import type { RealtimeTransport } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickTransportOptions {
  /**
   * Tick interval in milliseconds.
   * @default 16 (≈ 60 Hz)
   */
  tickMs?: number

  /**
   * Delta compression: only send fields that changed since last tick.
   * @default false
   */
  deltaCompression?: boolean
}

export interface TickFrame {
  tick: number
  timestamp: number
  entities: Record<string, unknown>
  removed: Array<string>
}

interface TickWireFrame extends TickFrame {
  __tick: true
}

export interface TickHandle {
  readonly tickStore: Store<{ tick: number; serverTick: number }>
  setState: (channel: string, entityId: string, data: unknown) => void
  removeEntity: (channel: string, entityId: string) => void
  onTick: (channel: string, callback: (frame: TickFrame) => void) => () => void
  stop: () => void
  unhook: () => void
}

// ---------------------------------------------------------------------------
// Delta compression helpers
// ---------------------------------------------------------------------------

export function computeDelta(
  prev: Record<string, unknown> | undefined,
  next: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!prev) return next

  const delta: Record<string, unknown> = {}
  let hasChanges = false

  for (const key of Object.keys(next)) {
    if (next[key] !== prev[key]) {
      delta[key] = next[key]
      hasChanges = true
    }
  }

  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      delta[key] = undefined
      hasChanges = true
    }
  }

  return hasChanges ? delta : null
}

export function applyDelta(
  base: Record<string, unknown> | undefined,
  delta: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...(base ?? {}), ...delta }
  for (const [key, value] of Object.entries(delta)) {
    if (value === undefined) delete result[key]
  }
  return result
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

/**
 * Register tick batching hooks on a transport.
 *
 * The hook accumulates `setState()` calls and publishes them as a single
 * tick frame per interval. Incoming tick frames are delivered via `onTick()`.
 * Normal `subscribe()` callbacks never see tick wire frames (filtered by
 * the `beforeDeliver` hook).
 *
 * @example
 * const tick = useTickBatching(transport, { tickMs: 16 })
 *
 * tick.setState('game:room-1', myPlayerId, { x: 100, y: 200 })
 * tick.onTick('game:room-1', (frame) => {
 *   for (const [entityId, state] of Object.entries(frame.entities)) {
 *     updateEntity(entityId, state)
 *   }
 * })
 */
export function useTickBatching(
  transport: RealtimeTransport,
  options: TickTransportOptions = {},
): TickHandle {
  const { tickMs = 16, deltaCompression = false } = options

  const tickStore = new Store<{ tick: number; serverTick: number }>({
    tick: 0,
    serverTick: 0,
  })

  const dirtyState = new Map<string, Map<string, unknown>>()
  const previousState = new Map<string, Map<string, Record<string, unknown>>>()
  const removedEntities = new Map<string, Set<string>>()
  const tickListeners = new Map<string, Set<(frame: TickFrame) => void>>()
  const innerSubs = new Map<string, () => void>()

  let tickTimer: ReturnType<typeof setInterval> | null = null
  let localTick = 0

  let isConnected = transport.store.get() === 'connected'
  transport.store.subscribe((status) => {
    isConnected = status === 'connected'
  })

  function ensureTickLoop(): void {
    if (tickTimer) return
    tickTimer = setInterval(sendTick, tickMs)
  }

  function sendTick(): void {
    const allChannels = new Set<string>([
      ...dirtyState.keys(),
      ...removedEntities.keys(),
    ])

    if (allChannels.size === 0) return
    if (!isConnected) return

    localTick++
    tickStore.setState((s) => ({ ...s, tick: localTick }))

    for (const channel of allChannels) {
      const frame: TickFrame = {
        tick: localTick,
        timestamp: Date.now(),
        entities: {},
        removed: [],
      }

      const removed = removedEntities.get(channel)
      if (removed) {
        frame.removed = Array.from(removed)
        removedEntities.delete(channel)
      }

      const entities = dirtyState.get(channel)
      if (entities) {
        for (const [entityId, state] of entities) {
          if (deltaCompression) {
            if (!previousState.has(channel)) {
              previousState.set(channel, new Map())
            }
            const prev = previousState.get(channel)!.get(entityId)
            const delta = computeDelta(prev, state as Record<string, unknown>)
            if (delta) {
              frame.entities[entityId] = delta
              previousState
                .get(channel)!
                .set(entityId, { ...(prev ?? {}), ...delta })
            }
          } else {
            frame.entities[entityId] = state
          }
        }
      }

      if (Object.keys(frame.entities).length > 0 || frame.removed.length > 0) {
        transport
          .publish(channel, { __tick: true, ...frame } satisfies TickWireFrame)
          .catch(() => {})
      }
    }

    dirtyState.clear()
  }

  function ensureInnerSub(channel: string): void {
    if (innerSubs.has(channel)) return
    const unsub = transport.subscribe(channel, (_raw) => {
      // Tick frames reach here because beforeDeliver returns false for them
      // in the normal pipeline — but onTick subscriptions bypass the pipeline.
      // We handle tick frame dispatch here instead.
    })
    innerSubs.set(channel, unsub)
  }

  // Track the last dispatched tick per channel to avoid duplicate dispatch
  // when beforeDeliver runs once per subscriber on the same message.
  const lastDispatchedTick = new Map<string, number>()

  // Register a beforeDeliver hook that intercepts tick wire frames and
  // dispatches them to tick listeners instead of normal subscribers.
  const hookHandle: HookHandle = transport.hook({
    name: 'tick-batching',
    hooks: {
      beforeDeliver(channel, data) {
        const d = data as Record<string, unknown>
        if (d.__tick) {
          const frame = data as TickFrame

          // Only dispatch once per tick per channel (beforeDeliver may run
          // once per subscriber, but we only want one dispatch).
          const prev = lastDispatchedTick.get(channel) ?? -1
          if (frame.tick > prev) {
            lastDispatchedTick.set(channel, frame.tick)
            tickStore.setState((s) => ({
              ...s,
              serverTick: Math.max(s.serverTick, frame.tick),
            }))
            const cbs = tickListeners.get(channel)
            if (cbs) {
              for (const cb of cbs) cb(frame)
            }
          }

          return false // suppress from normal subscribers
        }
        return { data }
      },
    },
  })

  function stop(): void {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
    for (const unsub of innerSubs.values()) unsub()
    innerSubs.clear()
    dirtyState.clear()
    removedEntities.clear()
    previousState.clear()
    lastDispatchedTick.clear()
  }

  return {
    tickStore,

    setState(channel, entityId, data) {
      if (!dirtyState.has(channel)) dirtyState.set(channel, new Map())
      dirtyState.get(channel)!.set(entityId, data)
      ensureTickLoop()
    },

    removeEntity(channel, entityId) {
      if (!removedEntities.has(channel)) removedEntities.set(channel, new Set())
      removedEntities.get(channel)!.add(entityId)
      dirtyState.get(channel)?.delete(entityId)
      previousState.get(channel)?.delete(entityId)
      ensureTickLoop()
    },

    onTick(channel, callback) {
      if (!tickListeners.has(channel)) tickListeners.set(channel, new Set())
      tickListeners.get(channel)!.add(callback)
      ensureInnerSub(channel)

      return () => {
        tickListeners.get(channel)?.delete(callback)
        if (tickListeners.get(channel)?.size === 0) {
          tickListeners.delete(channel)
          innerSubs.get(channel)?.()
          innerSubs.delete(channel)
        }
      }
    },

    stop() {
      stop()
    },

    unhook() {
      stop()
      hookHandle.unhook()
    },
  }
}
