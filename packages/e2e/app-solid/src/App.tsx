/**
 * App root — renders all realtime pattern panels.
 * Panels are deferred until the client connects at least once.
 */
import { Show, createEffect, createSignal } from 'solid-js'
import { RealtimeProvider, useConnectionStatus } from '@tanstack/solid-realtime'
import { client } from './transport.js'
import { StatusBar } from './panels/StatusBar.js'
import { RealtimeCollectionPanel } from './panels/RealtimeCollectionPanel.js'
import { LiveChannelPanel } from './panels/LiveChannelPanel.js'
import { PresencePanel } from './panels/PresencePanel.js'
import { EphemeralPanel } from './panels/EphemeralPanel.js'
import { StreamPanel } from './panels/StreamPanel.js'
import { TickPanel } from './panels/TickPanel.js'
import { SyncedPanel } from './panels/SyncedPanel.js'

function AppInner() {
  const status = useConnectionStatus()
  const [hasConnected, setHasConnected] = createSignal(status() === 'connected')

  createEffect(() => {
    if (status() === 'connected') setHasConnected(true)
  })

  return (
    <>
      <StatusBar />
      <Show when={hasConnected()}>
        <div id="app">
          <RealtimeCollectionPanel />
          <LiveChannelPanel />
          <PresencePanel />
          <EphemeralPanel />
          <StreamPanel />
          <TickPanel />
          <SyncedPanel />
        </div>
      </Show>
    </>
  )
}

export function App() {
  return (
    <RealtimeProvider client={client}>
      <AppInner />
    </RealtimeProvider>
  )
}
