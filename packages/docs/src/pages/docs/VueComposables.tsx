import { CodeBlock } from '../../components/CodeBlock'

export function VueComposables() {
  return (
    <article className="doc-article">
      <h1>Vue Composables</h1>
      <p className="doc-lead">
        All composables are exported from <code>@tanstack/vue-realtime</code>.
        The client is sourced from <code>RealtimeProvider</code> context via
        Vue&rsquo;s provide/inject.
      </p>

      <p>
        The Vue adapter mirrors the React adapter 1:1 — every hook listed on the{' '}
        <a href="#/docs/hooks">React Hooks</a> page has a Vue equivalent with
        the same name and signature. Return values are Vue <code>ref</code> /{' '}
        <code>computed</code> values instead of React state.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`npm install @tanstack/realtime @tanstack/vue-realtime`}
      />

      <h2>Provider</h2>
      <CodeBlock
        title="App.vue"
        code={`<script setup lang="ts">
import { RealtimeProvider } from '@tanstack/vue-realtime'
import { client } from './client'
</script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
  </RealtimeProvider>
</template>`}
      />

      <h2>Available composables</h2>
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
        testing components that use realtime composables.
      </p>
      <p>
        See <a href="#/docs/testing">Testing</a> for patterns and examples.
      </p>

      <h2>DevTools</h2>
      <p>
        Use <code>@tanstack/vue-realtime-devtools</code> for the Vue developer
        tools panel. See <a href="#/docs/devtools">DevTools</a>.
      </p>
    </article>
  )
}
