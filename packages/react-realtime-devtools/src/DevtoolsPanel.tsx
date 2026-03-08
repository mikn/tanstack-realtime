/**
 * DevtoolsPanel — the main panel content rendered inside the floating devtools.
 *
 * Tabs:
 *  - Overview:  Client info + connection status
 *  - Channels:  Active channel list with message counts
 *  - Messages:  Rolling message log (inbound/outbound)
 *  - Events:    Connection lifecycle events
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { useConnectionStatus, useRealtime } from '@tanstack/react-realtime'
import { styles } from './styles.js'
import type { DevtoolsMessage, DevtoolsStoreHandle } from './devtoolsStore.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function truncateJson(data: unknown, maxLen = 300): string {
  try {
    const json = JSON.stringify(data)
    if (json.length <= maxLen) return json
    return json.slice(0, maxLen) + '…'
  } catch {
    return String(data)
  }
}

type Tab = 'overview' | 'channels' | 'messages' | 'events'

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

interface DevtoolsPanelProps {
  devtoolsStore: DevtoolsStoreHandle
  onClose: () => void
}

export function DevtoolsPanel({ devtoolsStore, onClose }: DevtoolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('channels')
  const status = useConnectionStatus()
  const { client } = useRealtime()

  const state = useStore(devtoolsStore.store, (s) => s)

  const channelCount = state.channels.size
  const messageCount = state.messages.length

  return (
    <div style={styles.panel} data-testid="realtime-devtools-panel">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>TanStack Realtime</span>
          <span style={styles.statusBadge(status)}>
            <span style={styles.statusDot(status)} />
            {status}
          </span>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.iconButton}
            onClick={() => devtoolsStore.clear()}
            title="Clear log"
          >
            ⌫
          </button>
          <button style={styles.iconButton} onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {(
          [
            ['overview', 'Overview', null],
            ['channels', 'Channels', channelCount],
            ['messages', 'Messages', messageCount],
            ['events', 'Events', state.events.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            style={styles.tab(activeTab === key)}
            onClick={() => setActiveTab(key as Tab)}
          >
            {label}
            {count != null && count > 0 && (
              <span style={styles.tabCount}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <OverviewTab clientId={client.clientId} status={status} />
        )}
        {activeTab === 'channels' && <ChannelsTab state={state} />}
        {activeTab === 'messages' && <MessagesTab messages={state.messages} />}
        {activeTab === 'events' && <EventsTab events={state.events} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({
  clientId,
  status,
}: {
  clientId: string
  status: string
}) {
  return (
    <div style={styles.infoGrid}>
      <span style={styles.infoLabel}>Client ID</span>
      <span style={styles.infoValue}>{clientId}</span>
      <span style={styles.infoLabel}>Status</span>
      <span style={styles.infoValue}>{status}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Channels tab
// ---------------------------------------------------------------------------

function ChannelsTab({
  state,
}: {
  state: {
    channels: ReadonlyMap<
      string,
      {
        channel: string
        subscribedAt: number
        messageCount: number
        lastMessageAt: number | null
      }
    >
  }
}) {
  const channels = Array.from(state.channels.values())

  if (channels.length === 0) {
    return <div style={styles.empty}>No active channels</div>
  }

  const now = Date.now()

  return (
    <div>
      {channels.map((ch) => (
        <div key={ch.channel} style={styles.channelRow}>
          <span style={styles.channelName} title={ch.channel}>
            {ch.channel}
          </span>
          <div style={styles.channelMeta}>
            <span>
              {ch.messageCount} msg{ch.messageCount === 1 ? '' : 's'}
            </span>
            <span>up {formatDuration(now - ch.subscribedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

function MessagesTab({
  messages,
}: {
  messages: ReadonlyArray<DevtoolsMessage>
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, autoScroll])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    // If user scrolled away from bottom, disable auto-scroll
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }, [])

  if (messages.length === 0) {
    return <div style={styles.empty}>No messages yet</div>
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {messages.map((msg) => (
        <div key={msg.id} style={styles.messageRow(msg.direction)}>
          <span style={styles.messageDirection(msg.direction)}>
            {msg.direction === 'inbound' ? 'IN' : 'OUT'}
          </span>
          <span style={styles.messageChannel} title={msg.channel}>
            {msg.channel}
          </span>
          <span style={styles.messageData}>{truncateJson(msg.data)}</span>
          <span style={styles.messageTime}>{formatTime(msg.timestamp)}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Events tab
// ---------------------------------------------------------------------------

function EventsTab({
  events,
}: {
  events: ReadonlyArray<{
    id: number
    type: string
    detail: string
    timestamp: number
  }>
}) {
  if (events.length === 0) {
    return <div style={styles.empty}>No events yet</div>
  }

  return (
    <div>
      {[...events].reverse().map((evt) => (
        <div key={evt.id} style={styles.eventRow(evt.type)}>
          <span style={styles.eventType}>{evt.type}</span>
          <span style={styles.eventDetail}>{evt.detail}</span>
          <span style={styles.eventTime}>{formatTime(evt.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}
