/**
 * Tick-based transport wrapper — batches updates per tick interval for
 * high-frequency realtime use cases like multiplayer games.
 *
 * Instead of publishing individual events, `setState()` sets the local state
 * for a channel and the transport batches all dirty channels into a single
 * frame sent once per tick interval.
 *
 * On the receiving side, `onTick()` delivers the full batched frame per tick
 * rather than individual events.
 */

import { Store } from '@tanstack/store'
import type { RealtimeTransport } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickTransportOptions {
  /**
   * Tick interval in milliseconds. Updates are batched and sent once per tick.
   * @default 16 (≈ 60 Hz, matching requestAnimationFrame)
   */
  tickMs?: number

  /**
   * Delta compression: only send fields that changed since last tick.
   * The receiver reconstructs full state from deltas.
   * @default false
   */
  deltaCompression?: boolean
}

/**
 * A single tick frame received from the server (or another client).
 */
export interface TickFrame {
  /** Tick number for this frame. */
  tick: number
  /** Timestamp when this frame was sent (ms since epoch). */
  timestamp: number
  /** Per-entity state updates. Key is the entity ID. */
  entities: Record<string, unknown>
  /** Entity IDs removed this tick. */
  removed: Array<string>
}

export interface TickTransport extends RealtimeTransport {
  /** Observable store for the current tick number. */
  readonly tickStore: Store<{ tick: number; serverTick: number }>

  /**
   * Set the local state for an entity on a channel. The transport batches
   * all entity states and sends them as a single frame on the next tick.
   */
  setState: (channel: string, entityId: string, data: unknown) => void

  /**
   * Mark an entity as removed. Sent in the next tick frame's `removed` array.
   */
  removeEntity: (channel: string, entityId: string) => void

  /**
   * Subscribe to tick frames from a channel. Unlike normal `subscribe`,
   * the callback receives the full batched frame per tick.
   */
  onTick: (channel: string, callback: (frame: TickFrame) => void) => () => void

  /** Stop the tick loop. */
  stop: () => void
}

// ---------------------------------------------------------------------------
// Delta compression helpers
// ---------------------------------------------------------------------------

/**
 * Compute a shallow diff between prev and next objects.
 * Returns only the keys that changed.
 */
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

  // Check for removed keys
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      delta[key] = undefined
      hasChanges = true
    }
  }

  return hasChanges ? delta : null
}

/**
 * Apply a delta to a base object to reconstruct full state.
 */
export function applyDelta(
  base: Record<string, unknown> | undefined,
  delta: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...(base ?? {}), ...delta }
  // Remove keys set to undefined
  for (const [key, value] of Object.entries(delta)) {
    if (value === undefined) delete result[key]
  }
  return result
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Wrap a transport with tick-based batching.
 *
 * The wrapper accumulates `setState()` calls and publishes them as a single
 * tick frame per interval. Incoming frames are delivered via `onTick()`.
 *
 * Normal `subscribe`/`publish` still work (delegated to the inner transport)
 * for non-tick channels.
 *
 * @example
 * import { createTickTransport, wsTransport } from '@tanstack/realtime'
 *
 * const tick = createTickTransport(
 *   wsTransport({ url: 'ws://localhost:3001' }),
 *   { tickMs: 16 },
 * )
 *
 * // Set state each render frame
 * tick.setState('game:room-1', myPlayerId, { x: 100, y: 200 })
 *
 * // Receive batched frames from all players
 * tick.onTick('game:room-1', (frame) => {
 *   for (const [entityId, state] of Object.entries(frame.entities)) {
 *     updateEntity(entityId, state)
 *   }
 * })
 */
export function createTickTransport(
  inner: RealtimeTransport,
  options: TickTransportOptions = {},
): TickTransport {
  const { tickMs = 16, deltaCompression = false } = options

  const tickStore = new Store<{ tick: number; serverTick: number }>({
    tick: 0,
    serverTick: 0,
  })

  // channel → entityId → current state
  const dirtyState = new Map<string, Map<string, unknown>>()
  // channel → entityId → previous state (for delta compression)
  const previousState = new Map<string, Map<string, Record<string, unknown>>>()
  // channel → Set of removed entity IDs this tick
  const removedEntities = new Map<string, Set<string>>()

  // channel → Set of tick frame listeners
  const tickListeners = new Map<
    string,
    Set<(frame: TickFrame) => void>
  >()

  // Inner subscription unsubs (one per channel with tick listeners)
  const innerSubs = new Map<string, () => void>()

  let tickTimer: ReturnType<typeof setInterval> | null = null
  let localTick = 0

  function ensureTickLoop(): void {
    if (tickTimer) return
    tickTimer = setInterval(sendTick, tickMs)
  }

  function sendTick(): void {
    if (dirtyState.size === 0 && removedEntities.size === 0) return

    localTick++
    tickStore.setState((s) => ({ ...s, tick: localTick }))

    for (const [channel, entities] of dirtyState) {
      const frame: TickFrame = {
        tick: localTick,
        timestamp: Date.now(),
        entities: {},
        removed: [],
      }

      // Add removed entities for this channel
      const removed = removedEntities.get(channel)
      if (removed) {
        frame.removed = Array.from(removed)
        removedEntities.delete(channel)
      }

      for (const [entityId, state] of entities) {
        if (deltaCompression) {
          if (!previousState.has(channel)) {
            previousState.set(channel, new Map())
          }
          const prev = previousState.get(channel)!.get(entityId)
          const delta = computeDelta(
            prev,
            state as Record<string, unknown>,
          )
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

      if (
        Object.keys(frame.entities).length > 0 ||
        frame.removed.length > 0
      ) {
        inner
          .publish(channel, { __tick: true, ...frame })
          .catch(() => {})
      }
    }

    dirtyState.clear()
  }

  function ensureInnerSub(channel: string): void {
    if (innerSubs.has(channel)) return
    const unsub = inner.subscribe(channel, (raw) => {
      const data = raw as Record<string, unknown>
      if (!data.__tick) {
        // Not a tick frame — ignore (let normal subscribe handle it)
        return
      }
      const frame = data as unknown as TickFrame & { __tick: boolean }
      tickStore.setState((s) => ({
        ...s,
        serverTick: Math.max(s.serverTick, frame.tick),
      }))

      const listeners = tickListeners.get(channel)
      if (listeners) {
        for (const cb of listeners) cb(frame)
      }
    })
    innerSubs.set(channel, unsub)
  }

  const transport: TickTransport = {
    store: inner.store,
    tickStore,

    async connect() {
      return inner.connect()
    },

    disconnect() {
      inner.disconnect()
    },

    subscribe(channel, onMessage) {
      return inner.subscribe(channel, onMessage)
    },

    async publish(channel, data) {
      return inner.publish(channel, data)
    },

    setState(channel, entityId, data) {
      if (!dirtyState.has(channel)) dirtyState.set(channel, new Map())
      dirtyState.get(channel)!.set(entityId, data)
      ensureTickLoop()
    },

    removeEntity(channel, entityId) {
      if (!removedEntities.has(channel)) removedEntities.set(channel, new Set())
      removedEntities.get(channel)!.add(entityId)
      // Also clean from dirtyState
      dirtyState.get(channel)?.delete(entityId)
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
      if (tickTimer) {
        clearInterval(tickTimer)
        tickTimer = null
      }
      for (const unsub of innerSubs.values()) unsub()
      innerSubs.clear()
      dirtyState.clear()
      removedEntities.clear()
    },
  }

  return transport
}
