import { CodeBlock } from '../../components/CodeBlock'

export function ChoosingAPattern() {
  return (
    <article className="doc-article">
      <h1>Choosing a Pattern</h1>
      <p className="doc-lead">
        realtime.js has several patterns for different use cases. Most apps only
        need one or two.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Short answer:</strong> start with{' '}
          <a href="#/docs/reactive-queries">
            <code>useQuery</code> + <code>useMutation</code>
          </a>
          . This covers 80% of use cases &mdash; live data, optimistic updates,
          automatic cache invalidation. Add other patterns only when you hit a
          specific need (chat feeds, presence, AI streaming). You can always
          combine patterns in the same app.
        </p>
      </div>

      <h2 id="start-here">The default: reactive queries</h2>
      <p>
        If you have a server function that queries a database,{' '}
        <code>useQuery</code> is the right choice. Wrap the function with{' '}
        <code>realtime.query()</code> on the server and the hook handles
        channels, caching, and batched updates automatically.
      </p>
      <CodeBlock
        code={`// Server — one annotation, data is live
export const getTodos = realtime.query(async ({ teamId }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — all components sharing this pair share one connection
const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})

// Filter client-side without touching the server
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`}
      />
      <p>
        See the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        the full API including optimistic mutations and batched consistency.
      </p>

      <h2 id="decision-tree">Other patterns</h2>
      <p>
        When reactive queries don&rsquo;t fit your use case, use this table to
        find the right pattern.
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
              Do you have existing REST endpoints and want live CRUD without
              server functions?
            </td>
            <td>
              <a href="#/docs/collections">
                <code>realtimeCollectionOptions</code> /{' '}
                <code>useRealtimeCollection</code>
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
            <td>Do you need to show who is currently online?</td>
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
              <strong>
                <a href="#/docs/reactive-queries">
                  <code>useQuery</code>
                </a>
              </strong>
            </td>
            <td>via useMutation</td>
            <td>yes</td>
            <td>no</td>
            <td>no</td>
            <td>Server function queries</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/collections">
                <code>realtimeCollectionOptions</code>
              </a>
            </td>
            <td>insert/update/delete</td>
            <td>yes</td>
            <td>no</td>
            <td>yes</td>
            <td>REST/custom CRUD</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/channels">
                <code>liveChannelOptions</code>
              </a>
            </td>
            <td>read-only (append)</td>
            <td>yes</td>
            <td>no</td>
            <td>no</td>
            <td>Chat, logs, feeds</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/ephemeral">
                <code>ephemeralLiveOptions</code>
              </a>
            </td>
            <td>read-only (append)</td>
            <td>yes</td>
            <td>yes</td>
            <td>no</td>
            <td>Typing, cursors</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/streaming">
                <code>streamChannelOptions</code>
              </a>
            </td>
            <td>reduce only</td>
            <td>single item</td>
            <td>no</td>
            <td>no</td>
            <td>AI streams, progress</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/presence">
                <code>presenceChannelOptions</code>
              </a>
            </td>
            <td>read-only</td>
            <td>yes</td>
            <td>connection-tied</td>
            <td>no</td>
            <td>Who is online</td>
          </tr>
          <tr>
            <td>
              <a href="#/docs/tick">
                <code>tickCollectionOptions</code>
              </a>
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
        code={`// Live data from your server functions
useQuery(getIssues, { projectId }, { getKey: (i) => i.id })

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
        code={`// Conversation history — live from server function
useQuery(getMessages, { sessionId }, { getKey: (m) => m.id })

// Token stream for the current response
streamChannelOptions({ channel: ['stream', { sessionId }], ... })`}
      />

      <h2 id="rest-collections">Already have REST endpoints?</h2>
      <p>
        If you are not using server functions, connect your existing REST API
        with <code>useRealtimeCollection</code>. Pass a <code>url</code> and get
        CRUD automatically:
      </p>
      <CodeBlock
        code={`import { useRealtimeCollection } from '@realtimejs/react'
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
        query manages rendering. Change the query for filtering or sorting
        &mdash; not the collection:
      </p>
      <CodeBlock
        code={`// Same collection, different views — no extra fetches
const { data: active } = useLiveQuery((q) =>
  q.from({ todos }).where('done', '=', false)
)

const { data: sorted } = useLiveQuery((q) =>
  q.from({ todos }).orderBy('createdAt', 'desc')
)`}
      />

      <h3 id="tanstack-query-escape-hatch">Already using TanStack Query?</h3>
      <p>
        Pass a <code>queryFn</code> that delegates to your existing query
        client. You keep your cache, deduplication, and devtools:
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
          <a href="#/docs/reactive-queries">Reactive Queries</a> &mdash; full
          guide to <code>useQuery</code> and <code>useMutation</code>
        </li>
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
