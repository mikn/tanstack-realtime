import { CodeBlock } from '../../components/CodeBlock'

export function ChoosingAPattern() {
  return (
    <article className="doc-article">
      <h1>Choosing a Pattern</h1>
      <p className="doc-lead">
        TanStack Realtime has several collection patterns. This page helps you
        pick the right one for your use case.
      </p>

      <h2 id="decision-tree">Decision tree</h2>
      <p>
        Answer the questions from top to bottom. The first match is your
        pattern.
      </p>

      <table className="api-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Pattern</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Do you need raw channel events without a collection abstraction?
            </td>
            <td>
              <a href="#/docs/channels">
                <code>useSubscribe</code> / <code>usePublish</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              Are you syncing CRUD data from a database (rows with
              insert/update/delete)?
            </td>
            <td>
              <a href="#/docs/collections">
                <code>realtimeCollectionOptions</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              Is the data append-only (chat messages, activity feeds, event
              logs)?
            </td>
            <td>
              <a href="#/docs/channels">
                <code>liveChannelOptions</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              Should rows auto-expire after a TTL (typing indicators, cursors)?
            </td>
            <td>
              <a href="#/docs/ephemeral">
                <code>ephemeralLiveOptions</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              Are you reducing a stream of events into a single value (AI token
              stream, progress)?
            </td>
            <td>
              <a href="#/docs/streaming">
                <code>streamChannelOptions</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>Do you need to show who is currently online (who is here)?</td>
            <td>
              <a href="#/docs/presence">
                <code>presenceChannelOptions</code>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              Are you sending high-frequency batch state updates (game ticks)?
            </td>
            <td>
              <a href="#/docs/tick">
                <code>tickCollectionOptions</code>
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="quick-comparison">Quick comparison</h2>
      <table className="api-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Mutations</th>
            <th>Many rows</th>
            <th>TTL</th>
            <th>CRDTs</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>realtimeCollectionOptions</code>
            </td>
            <td>insert/update/delete</td>
            <td>yes</td>
            <td>no</td>
            <td>yes</td>
            <td>Database tables</td>
          </tr>
          <tr>
            <td>
              <code>liveChannelOptions</code>
            </td>
            <td>read-only (append)</td>
            <td>yes</td>
            <td>no</td>
            <td>no</td>
            <td>Chat, logs, feeds</td>
          </tr>
          <tr>
            <td>
              <code>ephemeralLiveOptions</code>
            </td>
            <td>read-only (append)</td>
            <td>yes</td>
            <td>yes</td>
            <td>no</td>
            <td>Typing, cursors</td>
          </tr>
          <tr>
            <td>
              <code>streamChannelOptions</code>
            </td>
            <td>reduce only</td>
            <td>single item</td>
            <td>no</td>
            <td>no</td>
            <td>AI streams, progress</td>
          </tr>
          <tr>
            <td>
              <code>presenceChannelOptions</code>
            </td>
            <td>read-only</td>
            <td>yes</td>
            <td>connection-tied</td>
            <td>no</td>
            <td>Who is online</td>
          </tr>
          <tr>
            <td>
              <code>tickCollectionOptions</code>
            </td>
            <td>batch overwrite</td>
            <td>yes</td>
            <td>no</td>
            <td>no</td>
            <td>Game state</td>
          </tr>
        </tbody>
      </table>

      <h2 id="common-combos">Common combinations</h2>
      <p>Most apps use 2&ndash;3 patterns together. Here are typical stacks:</p>

      <h3>SaaS dashboard</h3>
      <CodeBlock
        code={`// Synced data from your database
realtimeCollectionOptions({ ...withRest({ url: '/api/issues' }), ... })

// Who is viewing this board right now
presenceChannelOptions({ channel: ['board', { id }], ... })`}
      />

      <h3>Chat app</h3>
      <CodeBlock
        code={`// Message history + live messages
liveChannelOptions({ channel: ['room', { id }], ... })

// Typing indicators (auto-expire after 3s)
ephemeralLiveOptions({ channel: ['typing', { id }], ttl: 3000, ... })

// Who is in this room
presenceChannelOptions({ channel: ['room', { id }], ... })`}
      />

      <h3>AI assistant</h3>
      <CodeBlock
        code={`// Conversation history (CRUD)
realtimeCollectionOptions({ ...withRest({ url: '/api/messages' }), ... })

// Token stream for the current response
streamChannelOptions({ channel: ['stream', { sessionId }], ... })`}
      />

      <h2 id="start-simple">Start simple: useRealtimeCollection</h2>
      <p>
        If you are building a React app, <code>useRealtimeCollection</code>{' '}
        paired with <code>useLiveQuery</code> is the recommended pattern. Pass a{' '}
        <code>url</code> to get REST CRUD automatically, or pass{' '}
        <code>queryFn</code> for custom data sources.
      </p>
      <CodeBlock
        code={`import { useRealtimeCollection } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
  })

  // Select all — re-renders on every change
  const { data } = useLiveQuery((q) => q.from({ todos }))

  // Mutations via the collection
  await todos.insert({ id: uuid(), text: 'New todo' })
  await todos.update(id, (draft) => { draft.done = true })
  await todos.delete(id)
}`}
      />
      <p>
        The two-hook pattern is intentional: the collection manages sync, the
        query manages rendering. When you need filtering, sorting, or joins,
        change the query &mdash; not the collection:
      </p>
      <CodeBlock
        code={`// Same collection, different views
const { data: active } = useLiveQuery((q) =>
  q.from({ todos }).where('done', '=', false)
)

const { data: sorted } = useLiveQuery((q) =>
  q.from({ todos }).orderBy('createdAt', 'desc')
)`}
      />

      <h3 id="tanstack-query-escape-hatch">Already using TanStack Query?</h3>
      <p>
        Pass <code>queryFn</code> that delegates to your existing query client.
        No new API needed &mdash; you keep your cache, deduplication, and
        devtools:
      </p>
      <CodeBlock
        code={`const todos = useRealtimeCollection<Todo>({
  channel: ['todos'],
  getKey: (t) => t.id,
  queryFn: () => queryClient.fetchQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then((r) => r.json()),
  }),
})`}
      />

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/collections">Collections</a> &mdash; full
          documentation for <code>realtimeCollectionOptions</code>
        </li>
        <li>
          <a href="#/docs/api-reference">API Reference</a> &mdash; signatures
          for all patterns
        </li>
      </ul>
    </article>
  )
}
