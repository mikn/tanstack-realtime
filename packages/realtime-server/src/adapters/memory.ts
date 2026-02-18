import { EventEmitter } from 'events'
import type { RealtimeAdapter, PresenceEvent } from '../types.js'

export function memoryAdapter(): RealtimeAdapter {
  const emitter = new EventEmitter()
  // One listener per topic (invalidate + presence) per createRealtimeServer call.
  emitter.setMaxListeners(2)

  return {
    async publish(serializedKey: string): Promise<void> {
      emitter.emit('invalidate', serializedKey)
    },

    async subscribe(callback: (serializedKey: string) => void): Promise<void> {
      emitter.on('invalidate', callback)
    },

    async publishPresence(
      channel: string,
      event: PresenceEvent,
    ): Promise<void> {
      emitter.emit('presence', channel, event)
    },

    async subscribePresence(
      callback: (channel: string, event: PresenceEvent) => void,
    ): Promise<void> {
      emitter.on('presence', callback)
    },

    async close(): Promise<void> {
      emitter.removeAllListeners()
    },
  }
}
