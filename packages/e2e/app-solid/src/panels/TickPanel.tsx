/**
 * TickPanel — exercises tickCollectionOptions.
 * Pattern: game-state batch updates via the tick transport.
 */
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { sseTransport } from '@realtimejs/adapter-sse'
import { tickCollectionOptions, useTickBatching } from '@realtimejs/core'

interface GameEntity {
  id: string
  x: number
  y: number
}

const TICK_CHANNEL = 'e2e-tick-game'

// Alias to avoid lint false positive — useTickBatching is a transport hook.
const registerTickBatching = useTickBatching

export function TickPanel() {
  let tickInstance: ReturnType<typeof useTickBatching> | null = null
  const [connected, setConnected] = createSignal(false)
  const [entities, setEntities] = createSignal<Array<GameEntity>>([])

  onMount(() => {
    const transport = sseTransport({
      url: '/api/realtime',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0,
    })
    const tick = registerTickBatching(transport, { tickMs: 100 })
    tickInstance = tick

    void transport.connect().then(() => setConnected(true))

    // Drive the collection sync manually (no React/Solid hook needed here).
    const map = new Map<string, GameEntity>()
    const config = tickCollectionOptions<GameEntity, string>({
      transport: tick,
      id: 'e2e-tick-entities-solid',
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

    const stop = config.sync.sync({
      collection: null,
      begin: () => {},
      write(op) {
        if (op.type === 'insert' || op.type === 'update') {
          const key =
            op.key !== undefined
              ? String(op.key)
              : ((op.value as GameEntity | undefined)?.id ?? 'unknown')
          map.set(key, op.value)
        } else {
          map.delete(String(op.key))
        }
      },
      commit() {
        setEntities([...map.values()])
      },
      markReady() {
        setEntities([...map.values()])
      },
      truncate() {
        map.clear()
      },
    })

    onCleanup(() => {
      tick.stop()
      transport.disconnect()
      if (typeof stop === 'function') stop()
    })
  })

  function moveEntity() {
    if (!tickInstance) return
    tickInstance.setState(TICK_CHANNEL, 'entity1', {
      x: Math.floor(Math.random() * 200),
      y: Math.floor(Math.random() * 200),
    })
  }

  return (
    <div class="panel" data-testid="tick-panel">
      <h2>tickCollectionOptions — Game Entities</h2>
      <div
        style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '6px' }}
      >
        Tick transport: {connected() ? '✓ connected' : 'connecting…'}
      </div>
      <button
        data-testid="move-entity"
        onClick={moveEntity}
        disabled={!connected()}
      >
        Move Entity
      </button>
      <div data-testid="tick-entities" style={{ 'margin-top': '8px' }}>
        <Show
          when={entities().length > 0}
          fallback={
            <span style={{ color: '#aaa', 'font-size': '12px' }}>
              No entities yet
            </span>
          }
        >
          <For each={entities()}>
            {(e) => (
              <div class="list-item">
                <span>{e.id}</span>
                <span class="tag">
                  x:{e.x} y:{e.y}
                </span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
