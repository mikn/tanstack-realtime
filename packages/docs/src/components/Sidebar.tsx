const sections = [
  {
    title: 'Overview',
    items: [
      { label: 'Getting Started', hash: '#/docs/getting-started' },
      { label: 'Collections', hash: '#/docs/collections' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'TanStack Start + Drizzle', hash: '#/docs/server-functions' },
      { label: 'Authentication', hash: '#/docs/authentication' },
      { label: 'Rich Text (Y.js)', hash: '#/docs/rich-text-crdts' },
      { label: 'Centrifugo Guide', hash: '#/docs/centrifugo' },
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
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'React Hooks', hash: '#/docs/hooks' },
      { label: 'Error Reference', hash: '#/docs/error-reference' },
    ],
  },
]

export function Sidebar({ currentHash }: { currentHash: string }) {
  return (
    <aside className="sidebar">
      <a href="#/" className="sidebar-home">
        &larr; Home
      </a>
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
    </aside>
  )
}
