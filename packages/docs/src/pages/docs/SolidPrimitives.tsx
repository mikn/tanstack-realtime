import { CodeBlock } from '../../components/CodeBlock'

export function SolidPrimitives() {
  return (
    <article className="doc-article">
      <h1>Solid Primitives</h1>
      <p className="doc-lead">
        All primitives are exported from <code>@tanstack/solid-realtime</code>.
        The client is sourced from <code>RealtimeProvider</code> context.
      </p>

      <p>
        The Solid adapter mirrors the React adapter 1:1 — every hook listed on
        the <a href="#/docs/hooks">React Hooks</a> page has a Solid equivalent
        with the same name and signature. Internally, hooks use Solid signals
        and <code>createEffect</code> instead of React state and{' '}
        <code>useEffect</code>.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`npm install @tanstack/realtime @tanstack/solid-realtime`}
      />

      <h2>Provider</h2>
      <CodeBlock
        title="App.tsx"
        code={`import { RealtimeProvider } from '@tanstack/solid-realtime'
import { client } from './client'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}`}
      />

      <h2>Available primitives</h2>
      <p>
        All hooks from the React adapter are available with identical names and
        signatures:
      </p>
      <ul>
        <li>
          <code>useRealtime</code>, <code>useConnectionStatus</code>,{' '}
          <code>useIsConnected</code>
        </li>
        <li>
          <code>useSubscribe</code>, <code>usePublish</code>,{' '}
          <code>useChannel</code>
        </li>
        <li>
          <code>usePresence</code>, <code>useStream</code>
        </li>
        <li>
          <code>useRealtimeCollection</code>, <code>useLiveChannel</code>
        </li>
        <li>
          <code>useLatestMessage</code>, <code>useChannelHistory</code>,{' '}
          <code>useChannelStats</code>
        </li>
        <li>
          <code>useTypingIndicator</code>, <code>useOnReconnect</code>
        </li>
        <li>
          <code>useSyncedCounter</code>, <code>useSyncedValue</code>,{' '}
          <code>useSyncedSet</code>
        </li>
      </ul>

      <h2>Testing utilities</h2>
      <p>
        <code>createTestRealtimeProvider</code> and{' '}
        <code>createTestRealtimeProviderWithPresence</code> are exported for
        testing components that use realtime primitives.
      </p>
      <p>
        See <a href="#/docs/testing">Testing</a> for patterns and examples.
      </p>

      <h2>DevTools</h2>
      <p>
        Use <code>@tanstack/solid-realtime-devtools</code> for the Solid
        developer tools panel. See <a href="#/docs/devtools">DevTools</a>.
      </p>
    </article>
  )
}
