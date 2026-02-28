const sections = [
  {
    title: 'Overview',
    items: [
      { label: 'Getting Started', hash: '#/docs/getting-started' },
      { label: 'Collections', hash: '#/docs/collections' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'CRDTs', hash: '#/docs/crdts' },
      { label: 'Presence', hash: '#/docs/presence' },
      { label: 'Channels & Pub/Sub', hash: '#/docs/channels' },
      { label: 'Streaming', hash: '#/docs/streaming' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { label: 'Transports', hash: '#/docs/transports' },
      { label: 'Resilience', hash: '#/docs/resilience' },
    ],
  },
  {
    title: 'Reference',
    items: [{ label: 'React Hooks', hash: '#/docs/hooks' }],
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
