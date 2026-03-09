const sections = [
  {
    title: 'Overview',
    items: [
      { label: 'Getting Started', hash: '#/docs/getting-started' },
      { label: 'Collections', hash: '#/docs/collections' },
      { label: 'Choosing a Pattern', hash: '#/docs/choosing-a-pattern' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'TanStack Start + Drizzle', hash: '#/docs/server-functions' },
      { label: 'Authentication', hash: '#/docs/authentication' },
      { label: 'Rich Text (Y.js)', hash: '#/docs/rich-text-crdts' },
      { label: 'Centrifugo Guide', hash: '#/docs/centrifugo' },
      { label: 'Read Receipts', hash: '#/docs/read-receipts' },
      { label: 'Testing', hash: '#/docs/testing' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'CRDTs', hash: '#/docs/crdts' },
      { label: 'Presence', hash: '#/docs/presence' },
      { label: 'Channels & Pub/Sub', hash: '#/docs/channels' },
      { label: 'Streaming', hash: '#/docs/streaming' },
      { label: 'Ephemeral Channels', hash: '#/docs/ephemeral' },
      { label: 'Tick-Based Sync', hash: '#/docs/tick' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { label: 'Transports', hash: '#/docs/transports' },
      { label: 'Resilience', hash: '#/docs/resilience' },
      { label: 'Scaling to Production', hash: '#/docs/scaling' },
      { label: 'Server Hooks', hash: '#/docs/server-hooks' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'React Hooks', hash: '#/docs/hooks' },
      { label: 'Solid Primitives', hash: '#/docs/solid-primitives' },
      { label: 'Vue Composables', hash: '#/docs/vue-composables' },
      { label: 'DevTools', hash: '#/docs/devtools' },
      { label: 'API Reference', hash: '#/docs/api-reference' },
      { label: 'Error Reference', hash: '#/docs/error-reference' },
      { label: 'Wire Protocol', hash: '#/docs/wire-protocol' },
    ],
  },
]

const pageMap: Record<string, string> = {
  '#/docs/getting-started': 'GettingStarted.tsx',
  '#/docs/collections': 'Collections.tsx',
  '#/docs/choosing-a-pattern': 'ChoosingAPattern.tsx',
  '#/docs/server-functions': 'ServerFunctions.tsx',
  '#/docs/authentication': 'Authentication.tsx',
  '#/docs/rich-text-crdts': 'RichTextCRDTs.tsx',
  '#/docs/centrifugo': 'Centrifugo.tsx',
  '#/docs/read-receipts': 'ReadReceipts.tsx',
  '#/docs/testing': 'Testing.tsx',
  '#/docs/crdts': 'CRDTs.tsx',
  '#/docs/presence': 'Presence.tsx',
  '#/docs/channels': 'Channels.tsx',
  '#/docs/streaming': 'Streaming.tsx',
  '#/docs/ephemeral': 'Ephemeral.tsx',
  '#/docs/tick': 'Tick.tsx',
  '#/docs/transports': 'Transports.tsx',
  '#/docs/resilience': 'Resilience.tsx',
  '#/docs/scaling': 'Scaling.tsx',
  '#/docs/server-hooks': 'ServerHooks.tsx',
  '#/docs/hooks': 'Hooks.tsx',
  '#/docs/solid-primitives': 'SolidPrimitives.tsx',
  '#/docs/vue-composables': 'VueComposables.tsx',
  '#/docs/devtools': 'Devtools.tsx',
  '#/docs/api-reference': 'ApiReference.tsx',
  '#/docs/error-reference': 'ErrorReference.tsx',
  '#/docs/wire-protocol': 'WireProtocol.tsx',
}

const flatItems = sections.flatMap((s) =>
  s.items.map((item) => ({ section: s.title, ...item })),
)

export function Sidebar({ currentHash }: { currentHash: string }) {
  const current = flatItems.find((item) => currentHash === item.hash)
  const file = pageMap[currentHash]

  return (
    <aside className="sidebar">
      <a href="#/" className="sidebar-home">
        &larr; Home
      </a>
      {current ? (
        <div className="sidebar-breadcrumb">
          {current.section} &rsaquo; {current.label}
        </div>
      ) : null}
      {sections.map((section) => (
        <div key={section.title} className="sidebar-section">
          <h4 className="sidebar-heading">{section.title}</h4>
          {section.items.map((item) => (
            <a
              key={item.hash}
              href={item.hash}
              className={`sidebar-link${currentHash === item.hash ? ' active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
      {file ? (
        <a
          className="sidebar-edit-link"
          href={`https://github.com/mikn/tanstack-realtime/edit/main/packages/docs/src/pages/docs/${file}`}
          target="_blank"
          rel="noopener"
        >
          Edit this page on GitHub
        </a>
      ) : null}
    </aside>
  )
}
