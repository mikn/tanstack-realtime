# Hooks Rearchitecture Plan

## Executive Summary

Replace the middleware-wrapping pattern (where `withGapRecovery`, `createOfflineQueue`, and `tickTransport` each create a proxy transport with copy-pasted presence forwarding) with a **hooks-based pipeline** on the transport itself. Multi-tab coordination (`createCoordinatedTransport`, `createBroadcastChannelTransport`, `createSharedWorkerTransport`) stays as a transport factory since it genuinely replaces the transport rather than augmenting it.

---

## Problem Statement

Today, every middleware wrapper (`withGapRecovery`, `createOfflineQueue`, `tickTransport`) must:

1. **Forward every transport method** (`connect`, `disconnect`, `subscribe`, `publish`, `onSubscribeError`)
2. **Detect and forward presence** via `hasPresence()` + `Object.assign` (~30 identical lines per wrapper)
3. **Return a new object** that masquerades as a `RealtimeTransport` — but isn't the original, breaking identity checks and requiring `as any` casts in tests

This means:

- Adding a new capability to `RealtimeTransport` requires updating **every wrapper**
- Composition order matters but isn't enforced: `offlineQueue(gapRecovery(transport))` vs `gapRecovery(offlineQueue(transport))` behave differently with no guidance
- Type safety degrades through the wrapping chain (presence types require runtime `Object.assign`)
- ~90 lines of identical presence-forwarding boilerplate across 3 files

---

## Design: Transport Hooks

### Core Hook Types

```ts
// New file: packages/realtime/src/core/hooks.ts

export interface TransportHooks {
  /**
   * Called after the transport transitions to 'connected'.
   * Use for: flushing offline queues, re-registering state.
   */
  onConnect?: () => void | Promise<void>

  /**
   * Called when the transport transitions away from 'connected'.
   * Receives the new status ('disconnected' | 'reconnecting').
   */
  onDisconnect?: (status: 'disconnected' | 'reconnecting') => void

  /**
   * Called when the transport transitions from a non-connected state
   * back to 'connected' (i.e., a gap occurred).
   * Use for: gap recovery, re-fetching missed data.
   * NOT called on initial connection.
   */
  onReconnect?: (activeChannels: ReadonlySet<string>) => void | Promise<void>

  /**
   * Intercept outbound publishes. Return the (possibly transformed) data
   * to continue, or `false` to suppress the publish entirely.
   * Use for: offline queueing (return false + enqueue), data transformation.
   */
  beforePublish?: (channel: string, data: unknown) => { data: unknown } | false

  /**
   * Intercept inbound messages after the transport receives them but before
   * they reach subscriber callbacks. Return the (possibly transformed) data
   * to continue, or `false` to suppress (dedup, echo filtering).
   */
  beforeDeliver?: (channel: string, data: unknown) => { data: unknown } | false

  /**
   * Called when a channel gains its first subscriber.
   * Use for: tracking active channels.
   */
  onChannelSubscribe?: (channel: string) => void

  /**
   * Called when a channel loses its last subscriber.
   */
  onChannelUnsubscribe?: (channel: string) => void
}

export interface HookRegistration {
  /** Unique name for debugging/logging. */
  name: string
  /** Lower priority runs first. @default 0 */
  priority?: number
  hooks: TransportHooks
}

export interface HookHandle {
  /** Remove this hook registration. */
  unhook: () => void
}
```

### Extended Transport Interface

```ts
// Modified: packages/realtime/src/core/types.ts

export interface RealtimeTransport {
  // ... existing methods unchanged ...

  /**
   * Register hooks into the transport's lifecycle pipeline.
   * Returns a handle to remove the hooks.
   *
   * Hooks run in priority order (lower first). Multiple hooks of the
   * same type form a pipeline — `beforeDeliver` hooks run sequentially,
   * and if any returns `false`, the message is suppressed.
   */
  hook(registration: HookRegistration): HookHandle
}
```

### Hook Pipeline Execution

```ts
// New file: packages/realtime/src/core/hookPipeline.ts

export function createHookPipeline() {
  const registrations: Array<HookRegistration & { id: number }> = []
  let nextId = 0

  function sorted() {
    return [...registrations].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
    )
  }

  return {
    register(reg: HookRegistration): HookHandle {
      const entry = { ...reg, id: nextId++ }
      registrations.push(entry)
      return {
        unhook() {
          const idx = registrations.findIndex((r) => r.id === entry.id)
          if (idx >= 0) registrations.splice(idx, 1)
        },
      }
    },

    async runOnConnect() {
      for (const r of sorted()) {
        if (r.hooks.onConnect) await r.hooks.onConnect()
      }
    },

    runOnDisconnect(status: 'disconnected' | 'reconnecting') {
      for (const r of sorted()) {
        r.hooks.onDisconnect?.(status)
      }
    },

    async runOnReconnect(activeChannels: ReadonlySet<string>) {
      for (const r of sorted()) {
        if (r.hooks.onReconnect) await r.hooks.onReconnect(activeChannels)
      }
    },

    runBeforePublish(
      channel: string,
      data: unknown,
    ): { data: unknown } | false {
      let current = { data }
      for (const r of sorted()) {
        if (!r.hooks.beforePublish) continue
        const result = r.hooks.beforePublish(channel, current.data)
        if (result === false) return false
        current = result
      }
      return current
    },

    runBeforeDeliver(
      channel: string,
      data: unknown,
    ): { data: unknown } | false {
      let current = { data }
      for (const r of sorted()) {
        if (!r.hooks.beforeDeliver) continue
        const result = r.hooks.beforeDeliver(channel, current.data)
        if (result === false) return false
        current = result
      }
      return current
    },

    runOnChannelSubscribe(channel: string) {
      for (const r of sorted()) {
        r.hooks.onChannelSubscribe?.(channel)
      }
    },

    runOnChannelUnsubscribe(channel: string) {
      for (const r of sorted()) {
        r.hooks.onChannelUnsubscribe?.(channel)
      }
    },
  }
}
```

---

## Migration Plan: File-by-File

### Phase 1: Foundation (no breaking changes)

#### 1.1 Create `packages/realtime/src/core/hooks.ts`

- Export `TransportHooks`, `HookRegistration`, `HookHandle` types

#### 1.2 Create `packages/realtime/src/core/hookPipeline.ts`

- Export `createHookPipeline()` factory
- Unit tests in `packages/__tests__/hookPipeline.test.ts`

#### 1.3 Add `hook()` to `RealtimeTransport` interface

- **Optional** method initially: `hook?: (reg: HookRegistration) => HookHandle`
- This avoids breaking existing adapter implementations

#### 1.4 Wire hooks into SSE transport (`packages/realtime-adapter-sse/src/transport.ts`)

- Create a `hookPipeline` in `sseTransport()`
- In `subscribe()`: wrap the `onMessage` callback to run `pipeline.runBeforeDeliver()` before dispatching
- In `publish()`: run `pipeline.runBeforePublish()` before sending
- On status transitions: call `runOnConnect()`, `runOnDisconnect()`, `runOnReconnect()` appropriately
- Track first/last subscriber per channel to fire `onChannelSubscribe`/`onChannelUnsubscribe`
- Implement `hook()` method

#### 1.5 Wire hooks into Centrifugo transport (`packages/realtime-adapter-centrifugo/src/transport.ts`)

- Same pattern as SSE

#### 1.6 Create `createHookableTransport()` wrapper

- For adapters that don't natively implement `hook()`, provides a thin wrapper that adds the hook pipeline
- This is the **transition bridge** — existing custom transports get hooks via wrapping
- Unlike the current middleware pattern, this wrapper is generic and only needs to be written once

```ts
// packages/realtime/src/core/hookableTransport.ts
export function createHookableTransport(
  inner: RealtimeTransport,
): RealtimeTransport {
  if (inner.hook) return inner // already hookable

  const pipeline = createHookPipeline()
  // ... wire pipeline into inner's subscribe/publish/status ...
  return { ...inner, hook: (reg) => pipeline.register(reg) }
}
```

### Phase 2: Convert Middleware to Hook Factories

Each middleware becomes a **function that registers hooks** instead of wrapping the transport.

#### 2.1 Convert `withGapRecovery` to `useGapRecovery()`

**Before** (middleware wrapper, 216 lines):

```ts
const transport = withGapRecovery(inner, { onGap })
```

**After** (hook registration, ~40 lines):

```ts
const handle = useGapRecovery(transport, { onGap })
// handle.activeChannels — still available
// handle.unhook() — remove gap recovery
```

**New file**: `packages/realtime/src/core/gapRecoveryHook.ts`

```ts
export interface GapRecoveryHandle {
  readonly activeChannels: ReadonlySet<string>
  unhook: () => void
}

export function useGapRecovery(
  transport: RealtimeTransport,
  options: GapRecoveryOptions,
): GapRecoveryHandle {
  const activeChannels = new Set<string>()

  const { unhook } = transport.hook({
    name: 'gap-recovery',
    hooks: {
      onReconnect(channels) {
        for (const ch of channels) {
          ;(async () => options.onGap(ch))().catch((err) => {
            options.onGapError?.(err, ch)
          })
        }
      },
      onChannelSubscribe(ch) {
        activeChannels.add(ch)
      },
      onChannelUnsubscribe(ch) {
        activeChannels.delete(ch)
      },
    },
  })

  return { activeChannels, unhook }
}
```

**Lines eliminated**: ~170 (entire presence forwarding block, proxy object construction)

#### 2.2 Convert `createOfflineQueue` to `useOfflineQueue()`

**Before** (middleware wrapper, 289 lines):

```ts
const transport = createOfflineQueue(inner, { maxSize: 500 })
// transport.queueStore — reactive store
// transport.clearQueue() — discard pending
```

**After** (hook registration, ~80 lines):

```ts
const queue = useOfflineQueue(transport, { maxSize: 500 })
// queue.store — same reactive store (renamed from queueStore)
// queue.clearQueue() — same API
// queue.unhook() — remove offline queueing
```

**New file**: `packages/realtime/src/core/offlineQueueHook.ts`

```ts
export interface OfflineQueueHandle {
  readonly store: Store<OfflineQueueState>
  clearQueue: () => void
  unhook: () => void
}

export function useOfflineQueue(
  transport: RealtimeTransport,
  options: OfflineQueueOptions = {},
): OfflineQueueHandle {
  const { maxSize = 1000, onFlushError = () => false, storage } = options
  // ... queue state (same as today) ...

  const { unhook } = transport.hook({
    name: 'offline-queue',
    priority: -10, // runs early — intercepts publishes before other hooks
    hooks: {
      beforePublish(channel, data) {
        if (transport.store.get() !== 'connected') {
          enqueue(channel, data)
          return false // suppress the actual publish
        }
        return { data }
      },
      onConnect() {
        return flush()
      },
    },
  })

  return { store: queueStore, clearQueue, unhook }
}
```

**Lines eliminated**: ~200 (entire proxy transport, presence forwarding, store sharing)

**Key change**: `queueStore` is no longer on the transport object — it's on the returned handle. Users access it as `queue.store` instead of `transport.queueStore`. This is cleaner: the transport stays a transport; queue state lives on the queue handle.

#### 2.3 Convert `tickTransport` to `useTickBatching()`

**Before** (middleware wrapper, 398 lines):

```ts
const tick = tickTransport(inner, { tickMs: 16 })
// tick.setState('game:room-1', playerId, state)
// tick.onTick('game:room-1', callback)
```

**After** (hook registration, ~150 lines):

```ts
const tick = useTickBatching(transport, { tickMs: 16 })
// tick.setState('game:room-1', playerId, state) — same
// tick.onTick('game:room-1', callback) — same
// tick.tickStore — same
// tick.stop() — same
// tick.unhook() — remove tick batching
```

**New file**: `packages/realtime/src/core/tickBatchingHook.ts`

The tick transport is more complex because it introduces new methods (`setState`, `removeEntity`, `onTick`). These don't map to transport hooks — they're domain-specific. But the **wrapping** part (presence forwarding, subscribe filtering, publish delegation) goes away entirely. The tick-specific logic lives on the returned handle.

```ts
export function useTickBatching(
  transport: RealtimeTransport,
  options: TickTransportOptions = {},
): TickHandle {
  // ... tick state (same as today) ...

  const { unhook } = transport.hook({
    name: 'tick-batching',
    hooks: {
      beforeDeliver(channel, data) {
        const d = data as Record<string, unknown>
        if (d.__tick) {
          // Dispatch to tick listeners, suppress from normal subscribers
          dispatchTickFrame(channel, d as unknown as TickFrame)
          return false
        }
        return { data }
      },
    },
  })

  return { tickStore, setState, removeEntity, onTick, stop, unhook }
}
```

**Lines eliminated**: ~240 (entire proxy transport, presence forwarding, subscribe wrapper)

#### 2.4 Dedup as a Hook

`createDedup()` already exists as a standalone filter. It becomes trivially composable:

```ts
const dedup = createDedup({ maxSize: 500 })

transport.hook({
  name: 'dedup',
  hooks: {
    beforeDeliver(channel, data) {
      const d = data as { id?: string }
      if (d.id && dedup.seen(channel, d.id)) return false
      return { data }
    },
  },
})
```

No new file needed — this is just a usage pattern documented in examples.

### Phase 3: Update Consumers

#### 3.1 Update `createRealtimeClient` (`packages/realtime/src/core/client.ts`)

- No changes to the client API
- The client already just delegates to the transport
- Hooks are registered on the transport before passing it to the client

#### 3.2 Update React integration

- No changes to `RealtimeProvider` or hooks — they consume `RealtimeClient`, not the transport directly
- The `useOfflineQueue` React hook (if we add one) would be a thin React wrapper around `useOfflineQueue()`:

```ts
// Optional convenience: packages/react-realtime/src/useOfflineQueue.ts
function useOfflineQueueReact(options: OfflineQueueOptions) {
  const client = useRealtime()
  const [handle] = useState(() => useOfflineQueue(client.transport, options))
  useEffect(() => () => handle.unhook(), [handle])
  return handle
}
```

#### 3.3 Update multi-tab coordination

- `createCoordinatedTransport` stays as-is — it's a transport factory, not middleware
- `createBroadcastChannelTransport` stays as-is
- `createSharedWorkerTransport` stays as-is
- These are the one case where wrapping is correct: they replace the transport entirely

The coordinated transports should implement `hook()` by forwarding to the inner transport's pipeline (leader tab) or maintaining their own pipeline (all tabs). This ensures hooks registered on a coordinated transport work correctly.

#### 3.4 Update tests

- **Keep existing test files** — they validate the same behavior
- Adapt assertions from `transport.activeChannels` to `handle.activeChannels`
- Adapt assertions from `transport.queueStore` to `queue.store`
- Remove presence-forwarding tests (no longer relevant — transport identity is preserved)

### Phase 4: Deprecation & Cleanup

#### 4.1 Deprecate old APIs

- Mark `withGapRecovery`, `createOfflineQueue` (as transport wrapper), `tickTransport` as `@deprecated`
- Add deprecation comments pointing to the hook equivalents
- Keep working for at least one major version

#### 4.2 Update exports in `packages/realtime/src/index.ts`

- Export new hook factories: `useGapRecovery`, `useOfflineQueue`, `useTickBatching`
- Export hook types: `TransportHooks`, `HookRegistration`, `HookHandle`
- Export `createHookableTransport` for custom transport authors
- Keep deprecated exports

#### 4.3 Remove old middleware (next major)

- Delete `gapRecovery.ts` (replaced by `gapRecoveryHook.ts`)
- Delete the wrapper version of `offlineQueue.ts` (replaced by `offlineQueueHook.ts`)
- Delete `tickTransport.ts` (replaced by `tickBatchingHook.ts`)
- Remove `PresenceAwareTransport` utility type (no longer needed)
- Remove presence-forwarding `Object.assign` pattern from docs/examples

---

## Impact Analysis

### Files Created (5)

| File                        | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `core/hooks.ts`             | Hook type definitions                                    |
| `core/hookPipeline.ts`      | Pipeline execution engine                                |
| `core/hookableTransport.ts` | Wrapper for transports that don't natively support hooks |
| `core/gapRecoveryHook.ts`   | Gap recovery as hooks                                    |
| `core/offlineQueueHook.ts`  | Offline queue as hooks                                   |
| `core/tickBatchingHook.ts`  | Tick batching as hooks                                   |

### Files Modified (8)

| File                                  | Change                                                            |
| ------------------------------------- | ----------------------------------------------------------------- |
| `core/types.ts`                       | Add optional `hook()` to `RealtimeTransport`                      |
| `core/client.ts`                      | Expose transport for hook registration (or pass-through `hook()`) |
| `adapter-sse/src/transport.ts`        | Native hook pipeline integration                                  |
| `adapter-centrifugo/src/transport.ts` | Native hook pipeline integration                                  |
| `broadcastChannelTransport.ts`        | Forward `hook()` to inner/local pipeline                          |
| `sharedWorkerTransport.ts`            | Forward `hook()`                                                  |
| `index.ts`                            | New exports, deprecation markers                                  |
| Test files (3-4)                      | Adapt to handle-based API                                         |

### Files Eventually Deleted (3, next major)

| File                              | Replaced By           |
| --------------------------------- | --------------------- |
| `gapRecovery.ts`                  | `gapRecoveryHook.ts`  |
| `offlineQueue.ts` (wrapper parts) | `offlineQueueHook.ts` |
| `tickTransport.ts`                | `tickBatchingHook.ts` |

### Lines of Code

| Metric                          | Estimate                                |
| ------------------------------- | --------------------------------------- |
| Presence forwarding removed     | ~270 lines (90 per wrapper x 3)         |
| Proxy transport objects removed | ~150 lines                              |
| Hook pipeline added             | ~120 lines                              |
| Hook factories added            | ~270 lines (much simpler than wrappers) |
| **Net change**                  | **~-30 lines**, dramatically simpler    |

### Breaking Changes (Phase 4 only)

| Change                                             | Migration                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `withGapRecovery` returns handle, not transport    | `const h = useGapRecovery(t, opts)` — use `t` as transport, `h` for active channels        |
| `createOfflineQueue` returns handle, not transport | `const q = useOfflineQueue(t, opts)` — use `t` as transport, `q.store` for queue state     |
| `tickTransport` returns handle, not transport      | `const tick = useTickBatching(t, opts)` — use `t` as transport, `tick` for setState/onTick |
| `PresenceAwareTransport` type removed              | No longer needed — transport identity preserved                                            |

---

## User-Facing API Comparison

### Before (middleware stacking)

```ts
import { sseTransport } from '@tanstack/realtime-adapter-sse'
import {
  createRealtimeClient,
  createOfflineQueue,
  withGapRecovery,
  createDedup,
} from '@tanstack/realtime'

// Build transport stack — order matters, types degrade
const raw = sseTransport({ url: '/api/sse' })
const gapped = withGapRecovery(raw, { onGap: refetch })
const queued = createOfflineQueue(gapped, { maxSize: 500 })
// `queued` is a proxy — presence methods may or may not exist

const client = createRealtimeClient({ transport: queued })

// Queue state is on the transport proxy
const pending = queued.queueStore.state.pending.length
```

### After (hooks on one transport)

```ts
import { sseTransport } from '@tanstack/realtime-adapter-sse'
import {
  createRealtimeClient,
  useGapRecovery,
  useOfflineQueue,
  createDedup,
} from '@tanstack/realtime'

// One transport — never wrapped
const transport = sseTransport({ url: '/api/sse' })

// Plug in capabilities — order doesn't matter (priority handles it)
const recovery = useGapRecovery(transport, { onGap: refetch })
const queue = useOfflineQueue(transport, { maxSize: 500 })

// Dedup — just a hook, no wrapper
const dedup = createDedup()
transport.hook({
  name: 'dedup',
  hooks: {
    beforeDeliver(ch, data) {
      const d = data as { id?: string }
      if (d.id && dedup.seen(ch, d.id)) return false
      return { data }
    },
  },
})

const client = createRealtimeClient({ transport })

// Queue state is on the queue handle — clean separation
const pending = queue.store.state.pending.length

// Recovery channels are on the recovery handle
const channels = recovery.activeChannels
```

---

## Risks & Mitigations

| Risk                                         | Mitigation                                                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook ordering bugs                           | Priority system + documented conventions. Offline queue = -10, dedup = 0, app hooks = 10+                                                                               |
| Async hook errors crash pipeline             | Each hook invocation is try/caught. Errors logged but don't block the pipeline                                                                                          |
| Performance of pipeline iteration            | Hooks are registered once, not per-message. The sorted array is cached and invalidated on register/unregister. For the common case (2-3 hooks), iteration is negligible |
| Custom transports don't implement `hook()`   | `createHookableTransport()` adds it generically. `hook()` is optional on the interface during transition                                                                |
| Multi-tab: hooks registered on follower tabs | Coordinated transports maintain a local pipeline. `beforeDeliver` hooks run on the tab that receives the message (all tabs), not just the leader                        |

---

## Implementation Order

```
Phase 1.1-1.2: Types + Pipeline          (1 PR, no breaking changes)
Phase 1.3-1.6: Wire into transports      (1 PR, no breaking changes)
Phase 2.1-2.4: Hook factories            (1 PR, adds new APIs alongside old)
Phase 3.1-3.4: Consumer updates + tests  (1 PR)
Phase 4.1-4.3: Deprecation + cleanup     (1 PR, next major version)
```

Each phase is independently shippable. Phase 1 and 2 can be merged without any user-visible changes. Phase 3 introduces the new API. Phase 4 removes the old one.
