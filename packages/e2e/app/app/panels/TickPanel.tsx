/**
 * TickPanel — exercises tickCollectionOptions.
 *
 * Pattern: game-state batch updates via the tick transport.
 * User A clicks "Move Entity" → the tick transport batches the state change
 * and publishes a tick frame. User B's tickCollectionOptions receives the
 * frame and updates the entity position.
 *
 * Uses sseTransport as the inner transport (second SSE connection used
 * exclusively for tick frames — publishes go to the same /api/realtime
 * endpoint which broadcasts to all e2e-tick-game subscribers).
 */

import { useEffect, useRef, useState } from 'react'
import { sseTransport } from '@tanstack/realtime-adapter-sse'
import { tickCollectionOptions, tickTransport } from '@tanstack/realtime'
import { useCollectionSync } from '../useCollectionSync.js'

interface GameEntity {
  id: string
  x: number
  y: number
}

const TICK_CHANNEL = 'e2e-tick-game'

export function TickPanel() {
  const tickTpRef = useRef<ReturnType<typeof tickTransport> | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const inner = sseTransport({
      url: '/api/realtime',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0,
    })
    const tp = tickTransport(inner, { tickMs: 100 })
    tickTpRef.current = tp

    void tp.connect().then(() => setConnected(true))

    return () => {
      tp.stop()
      tp.disconnect()
    }
  }, [])

  const entities = useCollectionSync<GameEntity>(() => {
    if (!tickTpRef.current) {
      return { sync: { sync: () => () => {} } } as any
    }

    return tickCollectionOptions<GameEntity, string>({
      transport: tickTpRef.current,
      id: 'e2e-tick-entities',
      channel: TICK_CHANNEL,
      getKey: (e) => e.id,
      keyToEntityId: (key) => key,
      fromEntity: (id, state, existing) => {
        const s = state as Partial<GameEntity>
        return {
          id,
          x: s.x ?? existing?.x ?? 0,
          y: s.y ?? existing?.y ?? 0,
        }
      },
    })
  })

  function moveEntity() {
    const tp = tickTpRef.current
    if (!tp) return
    tp.setState(TICK_CHANNEL, 'entity1', {
      x: Math.floor(Math.random() * 200),
      y: Math.floor(Math.random() * 200),
    })
  }

  return (
    <div className="panel" data-testid="tick-panel">
      <h2>tickCollectionOptions — Game Entities</h2>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
        Tick transport: {connected ? '✓ connected' : 'connecting…'}
      </div>
      <button
        data-testid="move-entity"
        onClick={moveEntity}
        disabled={!connected}
      >
        Move Entity
      </button>
      <div data-testid="tick-entities" style={{ marginTop: 8 }}>
        {entities.length === 0 ? (
          <span style={{ color: '#aaa', fontSize: 12 }}>No entities yet</span>
        ) : (
          entities.map((e) => (
            <div key={e.id} className="list-item">
              <span>{e.id}</span>
              <span className="tag">
                x:{e.x} y:{e.y}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
