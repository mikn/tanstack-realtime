import { useEffect, useRef, useState } from 'react'

interface SearchEntry {
  label: string
  hash: string
  section: string
  keywords: string
}

const searchIndex: Array<SearchEntry> = [
  // Overview
  {
    label: 'Why realtime.js',
    hash: '#/docs/why',
    section: 'Overview',
    keywords:
      'why bring your own backend vendor-neutral no platform no lock-in no per-seat sync convex comparison capability matrix progressive adoption',
  },
  {
    label: 'Getting Started',
    hash: '#/docs/getting-started',
    section: 'Overview',
    keywords:
      'install setup quick start server handler createStartHandler createReactiveQueries provider transport',
  },
  {
    label: 'Tutorial: Task Board',
    hash: '#/docs/tutorial',
    section: 'Overview',
    keywords:
      'tutorial task board walkthrough end-to-end preset-start adapter-sse reactive-drizzle drizzle schema presence',
  },
  {
    label: 'Collections',
    hash: '#/docs/collections',
    section: 'Overview',
    keywords:
      'realtimeCollectionOptions liveChannelOptions streamChannelOptions collection source',
  },
  {
    label: 'Choosing a Pattern',
    hash: '#/docs/choosing-a-pattern',
    section: 'Overview',
    keywords: 'decision matrix pattern CRDT presence pub/sub streaming',
  },
  // Guides
  {
    label: 'TanStack Start + Drizzle',
    hash: '#/docs/server-functions',
    section: 'Guides',
    keywords:
      'server functions drizzle ORM withServerFns createValidatedPublish',
  },
  {
    label: 'Authentication',
    hash: '#/docs/authentication',
    section: 'Guides',
    keywords: 'auth getUser authorize JWT token bearer permissions',
  },
  {
    label: 'Rich Text (Y.js)',
    hash: '#/docs/rich-text-crdts',
    section: 'Guides',
    keywords: 'yjs hocuspocus rich text editor CRDT collaborative',
  },
  {
    label: 'Centrifugo Guide',
    hash: '#/docs/centrifugo',
    section: 'Guides',
    keywords: 'centrifugo websocket token proxy configuration',
  },
  {
    label: 'Read Receipts',
    hash: '#/docs/read-receipts',
    section: 'Guides',
    keywords: 'read receipts seen unread message tracking',
  },
  {
    label: 'Testing',
    hash: '#/docs/testing',
    section: 'Guides',
    keywords:
      'test mock createMockTransport createMockClient vitest jest unit integration',
  },
  // Features
  {
    label: 'CRDTs',
    hash: '#/docs/crdts',
    section: 'Features',
    keywords:
      'CRDT conflict-free LWW register PN-counter OR-set merge convergence fields',
  },
  {
    label: 'Presence',
    hash: '#/docs/presence',
    section: 'Features',
    keywords:
      'presence usePresence cursor who online avatar joinPresence updatePresence',
  },
  {
    label: 'Channels & Pub/Sub',
    hash: '#/docs/channels',
    section: 'Features',
    keywords:
      'channel subscribe publish useChannel useSubscribe usePublish message broadcast',
  },
  {
    label: 'Streaming',
    hash: '#/docs/streaming',
    section: 'Features',
    keywords:
      'stream AI reduce useStream createServerStream LLM streaming status done error',
  },
  {
    label: 'Ephemeral Channels',
    hash: '#/docs/ephemeral',
    section: 'Features',
    keywords:
      'ephemeral TTL typing indicator transient createEphemeralMap expiry auto-expire',
  },
  {
    label: 'Tick-Based Sync',
    hash: '#/docs/tick',
    section: 'Features',
    keywords:
      'tick game 60Hz delta compression useTickBatching computeDelta applyDelta high frequency',
  },
  // Infrastructure
  {
    label: 'Transports',
    hash: '#/docs/transports',
    section: 'Infrastructure',
    keywords:
      'transport SSE websocket centrifugo adapter sseTransport centrifugoTransport pusher soketi partykit durable objects pusherTransport partykitTransport capabilities conformance',
  },
  {
    label: 'Resilience',
    hash: '#/docs/resilience',
    section: 'Infrastructure',
    keywords:
      'offline queue reconnect gap recovery dedup multi-tab SharedWorker BroadcastChannel coordinated',
  },
  {
    label: 'Scaling to Production',
    hash: '#/docs/scaling',
    section: 'Infrastructure',
    keywords:
      'scaling production redis PublishBackend multi-process fan-out deploy',
  },
  {
    label: 'Server Hooks',
    hash: '#/docs/server-hooks',
    section: 'Infrastructure',
    keywords:
      'server hooks lifecycle onClientConnect onClientDisconnect onFirstSubscriber onChannelEmpty',
  },
  // Reference
  {
    label: 'React Hooks',
    hash: '#/docs/hooks',
    section: 'Reference',
    keywords:
      'react hooks useRealtime useSubscribe usePublish useChannel usePresence useStream useRealtimeCollection useLiveChannel useSyncedCounter useSyncedValue useSyncedSet useConnectionStatus useIsConnected useLatestMessage useChannelHistory useTypingIndicator useChannelStats useOnReconnect',
  },
  {
    label: 'Solid Primitives',
    hash: '#/docs/solid-primitives',
    section: 'Reference',
    keywords:
      'solid primitives createRealtime createSubscribe createPublish createChannel createPresence createStream',
  },
  {
    label: 'Vue Composables',
    hash: '#/docs/vue-composables',
    section: 'Reference',
    keywords:
      'vue composables useRealtime useSubscribe usePublish useChannel usePresence useStream provide inject',
  },
  {
    label: 'DevTools',
    hash: '#/docs/devtools',
    section: 'Reference',
    keywords:
      'devtools panel inspect debug channels messages connection state offline queue',
  },
  {
    label: 'API Reference',
    hash: '#/docs/api-reference',
    section: 'Reference',
    keywords:
      'API reference createRealtimeClient serializeKey parseChannel createHookPipeline createHookableTransport deriveChannelFromUrl normalizePermissions createDedup createEphemeralMap throttle useGapRecovery useOfflineQueue createCoordinatedTransport createBroadcastChannelTransport createSharedWorkerTransport RealtimeProvider sseTransport centrifugoTransport createSseHandler createStartHandler',
  },
  {
    label: 'Error Reference',
    hash: '#/docs/error-reference',
    section: 'Reference',
    keywords: 'error code RT_ troubleshoot debug ConflictError',
  },
  {
    label: 'Wire Protocol',
    hash: '#/docs/wire-protocol',
    section: 'Reference',
    keywords:
      'wire protocol SSE format envelope sequence signature message format',
  },
]

function matchScore(entry: SearchEntry, query: string): number {
  const q = query.toLowerCase()
  const label = entry.label.toLowerCase()
  const keywords = entry.keywords.toLowerCase()

  // exact label match is highest
  if (label === q) return 100
  // label starts with query
  if (label.startsWith(q)) return 80
  // label contains query
  if (label.includes(q)) return 60
  // keyword exact word match
  const words = keywords.split(/\s+/)
  if (words.some((w) => w === q)) return 50
  // keyword starts with query
  if (words.some((w) => w.startsWith(q))) return 40
  // keyword contains query
  if (keywords.includes(q)) return 30
  // section match
  if (entry.section.toLowerCase().includes(q)) return 10
  return 0
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onClose() // toggle handled by parent
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const results = query.trim()
    ? searchIndex
        .map((entry) => ({ entry, score: matchScore(entry, query.trim()) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((r) => r.entry)
    : searchIndex.slice(0, 8)

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No results found</div>
          ) : (
            results.map((entry) => (
              <a
                key={entry.hash}
                href={entry.hash}
                className="search-result"
                onClick={onClose}
              >
                <span className="search-result-section">{entry.section}</span>
                <span className="search-result-label">{entry.label}</span>
              </a>
            ))
          )}
        </div>
        <div className="search-footer">
          <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
