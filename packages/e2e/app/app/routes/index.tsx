/**
 * Main test page — renders all realtime pattern panels in a grid.
 * Panels are deferred until the client connects at least once.
 */
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useRealtime } from '@tanstack/react-realtime'
import { StatusBar } from '../panels/StatusBar.js'
import { RealtimeCollectionPanel } from '../panels/RealtimeCollectionPanel.js'
import { LiveChannelPanel } from '../panels/LiveChannelPanel.js'
import { PresencePanel } from '../panels/PresencePanel.js'
import { EphemeralPanel } from '../panels/EphemeralPanel.js'
import { StreamPanel } from '../panels/StreamPanel.js'
import { TickPanel } from '../panels/TickPanel.js'
import { SyncedPanel } from '../panels/SyncedPanel.js'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

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

function IndexPage() {
  const { status } = useRealtime()
  const [hasConnected, setHasConnected] = useState(status === 'connected')

  useEffect(() => {
    if (status === 'connected' && !hasConnected) setHasConnected(true)
  }, [status, hasConnected])

  return (
    <>
      <StatusBar />
      {hasConnected && <Panels />}
    </>
  )
}
