/**
 * Hookable transport wrapper — adds the hook pipeline to any transport that
 * doesn't natively implement it.
 *
 * This is the bridge for custom/third-party transports: wrap once, then
 * register hooks normally.
 *
 * Built-in transports (mock, SSE, Centrifugo) should integrate the pipeline
 * directly for better performance. This wrapper is for everything else.
 */

import { createHookPipeline } from './hookPipeline.js'
import type { HookHandle, HookRegistration } from './hooks.js'
import type { ConnectionStatus, RealtimeTransport } from './types.js'

export function createHookableTransport(
  inner: RealtimeTransport,
): RealtimeTransport {
  const pipeline = createHookPipeline()

  // Track active channels for reconnect hooks.
  const channelRefCounts = new Map<string, number>()
  const activeChannels = new Set<string>()

  // Track connection status transitions for hook invocation.
  let previousStatus: ConnectionStatus = inner.store.get()
  let wasEverConnected = previousStatus === 'connected'
  let wasDisconnected = false

  inner.store.subscribe((status) => {
    const prev = previousStatus
    previousStatus = status

    if (prev === 'connected' && status !== 'connected') {
      pipeline.runOnDisconnect(status as 'disconnected' | 'reconnecting')
    }

    if (status === 'reconnecting' || status === 'disconnected') {
      wasDisconnected = true
    }

    if (status === 'connected') {
      if (wasDisconnected && wasEverConnected) {
        void pipeline.runOnReconnect(activeChannels)
      }
      void pipeline.runOnConnect()
      wasEverConnected = true
      wasDisconnected = false
    }
  })

  const transport: RealtimeTransport = {
    store: inner.store,

    hook(registration: HookRegistration): HookHandle {
      return pipeline.register(registration)
    },

    async connect() {
      return inner.connect()
    },

    disconnect() {
      inner.disconnect()
    },

    subscribe(channel: string, onMessage: (data: unknown) => void) {
      const count = channelRefCounts.get(channel) ?? 0
      channelRefCounts.set(channel, count + 1)
      if (count === 0) {
        activeChannels.add(channel)
        pipeline.runOnChannelSubscribe(channel)
      }

      const unsub = inner.subscribe(channel, (raw) => {
        const result = pipeline.runBeforeDeliver(channel, raw)
        if (result === false) return
        onMessage(result.data)
      })

      return () => {
        unsub()
        const newCount = (channelRefCounts.get(channel) ?? 1) - 1
        if (newCount <= 0) {
          channelRefCounts.delete(channel)
          activeChannels.delete(channel)
          pipeline.runOnChannelUnsubscribe(channel)
        } else {
          channelRefCounts.set(channel, newCount)
        }
      }
    },

    async publish(channel: string, data: unknown) {
      const result = pipeline.runBeforePublish(channel, data)
      if (result === false) return
      return inner.publish(channel, result.data)
    },

    onSubscribeError: inner.onSubscribeError
      ? (callback) => inner.onSubscribeError!(callback)
      : undefined,
  }

  // Forward presence methods if inner transport has them.
  const innerAny = inner as unknown as Record<string, unknown>
  if (typeof innerAny.joinPresence === 'function') {
    Object.assign(transport, {
      joinPresence: innerAny.joinPresence.bind(inner),
      updatePresence: (innerAny.updatePresence as Function).bind(inner),
      leavePresence: (innerAny.leavePresence as Function).bind(inner),
      onPresenceChange: (innerAny.onPresenceChange as Function).bind(inner),
    })
  }

  return transport
}
