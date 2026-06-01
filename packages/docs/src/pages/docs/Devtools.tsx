import { CodeBlock } from '../../components/CodeBlock'

export function Devtools() {
  return (
    <article className="doc-article">
      <h1>DevTools</h1>
      <p className="doc-lead">
        Developer tools panels for inspecting channels, messages, presence,
        connection state, and the offline queue. Available for React, Solid, and
        Vue.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`# React
npm install @realtimejs/react-devtools

# Solid
npm install @realtimejs/solid-devtools

# Vue
npm install @realtimejs/vue-devtools`}
      />

      <h2>Usage</h2>
      <p>
        Add the <code>RealtimeDevtools</code> component anywhere inside your{' '}
        <code>RealtimeProvider</code>. It renders a floating panel that can be
        toggled open/closed.
      </p>

      <h3>React</h3>
      <CodeBlock
        title="App.tsx"
        code={`import { RealtimeProvider } from '@realtimejs/react'
import { RealtimeDevtools } from '@realtimejs/react-devtools'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
      <RealtimeDevtools />
    </RealtimeProvider>
  )
}`}
      />

      <h3>Solid</h3>
      <CodeBlock
        title="App.tsx"
        code={`import { RealtimeProvider } from '@realtimejs/solid'
import { RealtimeDevtools } from '@realtimejs/solid-devtools'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
      <RealtimeDevtools />
    </RealtimeProvider>
  )
}`}
      />

      <h3>Vue</h3>
      <CodeBlock
        title="App.vue"
        code={`<script setup lang="ts">
import { RealtimeProvider } from '@realtimejs/vue'
import { RealtimeDevtools } from '@realtimejs/vue-devtools'
import { client } from './client'
</script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
    <RealtimeDevtools />
  </RealtimeProvider>
</template>`}
      />

      <p>
        In production builds (<code>process.env.NODE_ENV === 'production'</code>
        ), <code>RealtimeDevtools</code> renders nothing unless{' '}
        <code>force</code> is set to <code>true</code>.
      </p>

      <h2>Props</h2>
      <CodeBlock
        code={`interface RealtimeDevtoolsProps {
  /** Initial open state. @default false */
  initialIsOpen?: boolean
  /** Position of the floating toggle button. @default 'bottom-left' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Force rendering in production builds. @default false */
  force?: boolean
  /** Custom inline styles for the floating toggle button. */
  toggleButtonStyle?: CSSProperties
  /** Custom inline styles for the panel container. */
  panelStyle?: CSSProperties
  /** Offline queue handle to display queue state. Pass the result of useOfflineQueue(). */
  offlineQueue?: OfflineQueueHandle
  /** Track presence on channels when the transport supports it. @default true */
  trackPresence?: boolean
}`}
      />

      <h2>What it shows</h2>
      <ul>
        <li>
          <strong>Active channels</strong> — list of all current subscriptions
          and subscriber count
        </li>
        <li>
          <strong>Message log</strong> — timestamped incoming/outgoing messages,
          filterable by channel
        </li>
        <li>
          <strong>Connection state</strong> — current status and a timeline of
          connection transitions
        </li>
        <li>
          <strong>Presence</strong> — per-channel membership with user data
        </li>
        <li>
          <strong>Offline queue</strong> — pending mutations and flush status
        </li>
      </ul>

      <h2>Advanced: createDevtoolsStore</h2>
      <p>
        For custom devtools UIs, use <code>createDevtoolsStore</code> directly.
        It takes the <code>RealtimeClient</code> as its first argument (plus
        optional <code>DevtoolsStoreOptions</code>) and returns a reactive
        handle with all the data the panel displays.
      </p>
      <CodeBlock
        code={`import { createDevtoolsStore } from '@realtimejs/react-devtools'

const devtools = createDevtoolsStore(client, {
  offlineQueue,        // optional OfflineQueueHandle from useOfflineQueue()
  trackPresence: true, // default
})
// devtools.store → Store<DevtoolsState> (channels, messages, connection history, etc.)
// devtools.clear() → clear collected messages and events
// devtools.destroy() → detach from the client and stop collecting`}
      />
    </article>
  )
}
