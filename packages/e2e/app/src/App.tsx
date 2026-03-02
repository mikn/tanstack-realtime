/**
 * Main application shell — renders all realtime pattern panels in a grid.
 * Each panel is self-contained and exercises a distinct library pattern.
 *
 * Panels are withheld until the client has established its first successful
 * connection. This ensures hooks like `usePresence` call `joinPresence` only
 * when the transport is ready, avoiding missed joins during the initial
 * connect handshake.
 */

import { useEffect, useState } from 'react'
import { useRealtime } from '@tanstack/react-realtime'
import { StatusBar } from './panels/StatusBar.js'
import { RealtimeCollectionPanel } from './panels/RealtimeCollectionPanel.js'
import { LiveChannelPanel } from './panels/LiveChannelPanel.js'
import { PresencePanel } from './panels/PresencePanel.js'
import { EphemeralPanel } from './panels/EphemeralPanel.js'
import { StreamPanel } from './panels/StreamPanel.js'
import { TickPanel } from './panels/TickPanel.js'
import { SyncedPanel } from './panels/SyncedPanel.js'

function Panels() {
  return (
    <div id="app">
      <RealtimeCollectionPanel />
      <LiveChannelPanel />
      <PresencePanel />
      <EphemeralPanel />
      <StreamPanel />
      <TickPanel />
      <SyncedPanel />
    </div>
  )
}

export function App() {
  const { status } = useRealtime()
  // Track whether we have connected at least once. Once true, panels remain
  // mounted even during transient reconnections so they don't reset state.
  const [hasConnected, setHasConnected] = useState(status === 'connected')

  useEffect(() => {
    if (status === 'connected' && !hasConnected) {
      setHasConnected(true)
    }
  }, [status, hasConnected])

  return (
    <>
      <StatusBar />
      {hasConnected && <Panels />}
    </>
  )
}
