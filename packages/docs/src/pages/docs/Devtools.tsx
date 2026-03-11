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
npm install @tanstack/react-realtime-devtools

# Solid
npm install @tanstack/solid-realtime-devtools

# Vue
npm install @tanstack/vue-realtime-devtools`}
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
        code={`import { RealtimeProvider } from '@tanstack/react-realtime'
import { RealtimeDevtools } from '@tanstack/react-realtime-devtools'

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
        code={`import { RealtimeProvider } from '@tanstack/solid-realtime'
import { RealtimeDevtools } from '@tanstack/solid-realtime-devtools'

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
import { RealtimeProvider } from '@tanstack/vue-realtime'
import { RealtimeDevtools } from '@tanstack/vue-realtime-devtools'
import { client } from './client'
</script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
    <RealtimeDevtools />
  </RealtimeProvider>
</template>`}
      />

      <h2>Props</h2>
      <CodeBlock
        code={`interface RealtimeDevtoolsProps {
  /** Position of the floating toggle button.
   *  @default 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
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
        It accepts a <code>RealtimeClient</code> and returns a reactive store
        with all the data the panel displays.
      </p>
      <CodeBlock
        code={`import { createDevtoolsStore } from '@tanstack/react-realtime-devtools'

const devtools = createDevtoolsStore({ client })
// devtools.store → DevtoolsState (channels, messages, connection history, etc.)
// devtools.destroy() → clean up listeners`}
      />
    </article>
  )
}
