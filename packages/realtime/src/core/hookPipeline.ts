/**
 * Hook pipeline — executes registered hooks in priority order.
 *
 * This is the engine behind the transport's `hook()` method. It maintains
 * an ordered list of hook registrations and provides typed methods to
 * invoke each hook point.
 */

import type { HookHandle, HookRegistration } from './hooks.js'

// ---------------------------------------------------------------------------
// Internal entry with stable identity
// ---------------------------------------------------------------------------

interface PipelineEntry extends HookRegistration {
  readonly _id: number
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface HookPipeline {
  register: (reg: HookRegistration) => HookHandle

  runOnConnect: () => Promise<void>
  runOnDisconnect: (status: 'disconnected' | 'reconnecting') => void
  runOnReconnect: (activeChannels: ReadonlySet<string>) => Promise<void>

  runBeforePublish: (
    channel: string,
    data: unknown,
  ) => { data: unknown } | false

  runBeforeDeliver: (
    channel: string,
    data: unknown,
  ) => { data: unknown } | false

  runOnChannelSubscribe: (channel: string) => void
  runOnChannelUnsubscribe: (channel: string) => void
}

export function createHookPipeline(): HookPipeline {
  const entries: Array<PipelineEntry> = []
  let nextId = 0
  let sortedCache: Array<PipelineEntry> | null = null

  function sorted(): Array<PipelineEntry> {
    if (!sortedCache) {
      sortedCache = [...entries].sort(
        (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
      )
    }
    return sortedCache
  }

  function invalidateCache(): void {
    sortedCache = null
  }

  return {
    register(reg: HookRegistration): HookHandle {
      const entry: PipelineEntry = { ...reg, _id: nextId++ }
      entries.push(entry)
      invalidateCache()
      return {
        unhook() {
          const idx = entries.findIndex((e) => e._id === entry._id)
          if (idx >= 0) {
            entries.splice(idx, 1)
            invalidateCache()
          }
        },
      }
    },

    async runOnConnect(): Promise<void> {
      for (const e of sorted()) {
        if (e.hooks.onConnect) {
          try {
            await e.hooks.onConnect()
          } catch (err) {
            console.error(`[realtime] hook "${e.name}" onConnect error:`, err)
          }
        }
      }
    },

    runOnDisconnect(status: 'disconnected' | 'reconnecting'): void {
      for (const e of sorted()) {
        try {
          e.hooks.onDisconnect?.(status)
        } catch (err) {
          console.error(`[realtime] hook "${e.name}" onDisconnect error:`, err)
        }
      }
    },

    async runOnReconnect(activeChannels: ReadonlySet<string>): Promise<void> {
      for (const e of sorted()) {
        if (e.hooks.onReconnect) {
          try {
            await e.hooks.onReconnect(activeChannels)
          } catch (err) {
            console.error(`[realtime] hook "${e.name}" onReconnect error:`, err)
          }
        }
      }
    },

    runBeforePublish(
      channel: string,
      data: unknown,
    ): { data: unknown } | false {
      let current = { data }
      for (const e of sorted()) {
        if (!e.hooks.beforePublish) continue
        try {
          const result = e.hooks.beforePublish(channel, current.data)
          if (result === false) return false
          current = result
        } catch (err) {
          console.error(`[realtime] hook "${e.name}" beforePublish error:`, err)
        }
      }
      return current
    },

    runBeforeDeliver(
      channel: string,
      data: unknown,
    ): { data: unknown } | false {
      let current = { data }
      for (const e of sorted()) {
        if (!e.hooks.beforeDeliver) continue
        try {
          const result = e.hooks.beforeDeliver(channel, current.data)
          if (result === false) return false
          current = result
        } catch (err) {
          console.error(`[realtime] hook "${e.name}" beforeDeliver error:`, err)
        }
      }
      return current
    },

    runOnChannelSubscribe(channel: string): void {
      for (const e of sorted()) {
        try {
          e.hooks.onChannelSubscribe?.(channel)
        } catch (err) {
          console.error(
            `[realtime] hook "${e.name}" onChannelSubscribe error:`,
            err,
          )
        }
      }
    },

    runOnChannelUnsubscribe(channel: string): void {
      for (const e of sorted()) {
        try {
          e.hooks.onChannelUnsubscribe?.(channel)
        } catch (err) {
          console.error(
            `[realtime] hook "${e.name}" onChannelUnsubscribe error:`,
            err,
          )
        }
      }
    },
  }
}
