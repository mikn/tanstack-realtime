/**
 * DevtoolsPanel — the main panel content rendered inside the floating devtools.
 *
 * Tabs:
 *  - Overview:  Client info + connection status + queue summary
 *  - Channels:  Active channel list with message counts + presence
 *  - Messages:  Rolling message log with expandable payloads
 *  - Events:    Connection lifecycle events (including presence + queue)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { useConnectionStatus, useRealtime } from '@tanstack/react-realtime'
import { styles } from './styles.js'
import type {
  ChannelInfo,
  DevtoolsMessage,
  DevtoolsStoreHandle,
  OfflineQueueSnapshot,
} from './devtoolsStore.js'

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

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

function truncateJson(data: unknown, maxLen = 120): string {
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
  const totalPresence = Array.from(state.channels.values()).reduce(
    (sum, ch) => sum + ch.presenceUsers.length,
    0,
  )

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
          {state.offlineQueue && state.offlineQueue.pending > 0 && (
            <span style={styles.queueFlushingBadge}>
              {state.offlineQueue.isFlushing
                ? 'flushing'
                : `${state.offlineQueue.pending} queued`}
            </span>
          )}
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
          <OverviewTab
            clientId={client.clientId}
            status={status}
            offlineQueue={state.offlineQueue}
            channelCount={channelCount}
            totalPresence={totalPresence}
          />
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
  offlineQueue,
  channelCount,
  totalPresence,
}: {
  clientId: string
  status: string
  offlineQueue: OfflineQueueSnapshot | null
  channelCount: number
  totalPresence: number
}) {
  return (
    <div style={styles.infoGrid}>
      <span style={styles.infoLabel}>Client ID</span>
      <span style={styles.infoValue}>{clientId}</span>
      <span style={styles.infoLabel}>Status</span>
      <span style={styles.infoValue}>{status}</span>
      <span style={styles.infoLabel}>Channels</span>
      <span style={styles.infoValue}>{channelCount}</span>
      <span style={styles.infoLabel}>Presence</span>
      <span style={styles.infoValue}>
        {totalPresence} user{totalPresence === 1 ? '' : 's'} online
      </span>
      {offlineQueue && (
        <>
          <span style={styles.infoLabel}>Queue</span>
          <span style={styles.infoValue}>
            {offlineQueue.pending} pending · {offlineQueue.flushed} flushed
            {offlineQueue.isFlushing ? ' · flushing…' : ''}
          </span>
        </>
      )}
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
    channels: ReadonlyMap<string, ChannelInfo>
  }
}) {
  const channels = Array.from(state.channels.values())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (channels.length === 0) {
    return <div style={styles.empty}>No active channels</div>
  }

  const now = Date.now()

  const toggleExpand = (channel: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(channel)) next.delete(channel)
      else next.add(channel)
      return next
    })
  }

  return (
    <div>
      {channels.map((ch) => (
        <div key={ch.channel}>
          <div
            style={{ ...styles.channelRow, cursor: 'pointer' }}
            onClick={() => toggleExpand(ch.channel)}
          >
            <span style={styles.channelName} title={ch.channel}>
              {expanded.has(ch.channel) ? '▾ ' : '▸ '}
              {ch.channel}
            </span>
            <div style={styles.channelMeta}>
              {ch.presenceUsers.length > 0 && (
                <span style={styles.presenceCount}>
                  {ch.presenceUsers.length} online
                </span>
              )}
              <span>
                {ch.messageCount} msg{ch.messageCount === 1 ? '' : 's'}
              </span>
              <span>up {formatDuration(now - ch.subscribedAt)}</span>
            </div>
          </div>
          {expanded.has(ch.channel) && ch.presenceUsers.length > 0 && (
            <div style={styles.presenceSection}>
              {ch.presenceUsers.map((user) => (
                <div key={user.connectionId} style={styles.presenceUserRow}>
                  <span style={styles.presenceDot} />
                  <span
                    style={styles.presenceConnectionId}
                    title={user.connectionId}
                  >
                    {user.connectionId}
                  </span>
                  <span style={styles.presenceData}>
                    {truncateJson(user.data)}
                  </span>
                </div>
              ))}
            </div>
          )}
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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, autoScroll])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }, [])

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
      {messages.map((msg) => {
        const isExpanded = expandedIds.has(msg.id)
        return (
          <div key={msg.id} style={styles.messageRow(msg.direction)}>
            <span style={styles.messageDirection(msg.direction)}>
              {msg.direction === 'inbound' ? 'IN' : 'OUT'}
            </span>
            <span style={styles.messageChannel} title={msg.channel}>
              {msg.channel}
            </span>
            <span
              style={
                isExpanded
                  ? styles.messageDataExpanded
                  : styles.messageDataExpandable
              }
              onClick={() => toggleExpand(msg.id)}
              title={isExpanded ? 'Click to collapse' : 'Click to expand'}
            >
              {isExpanded ? formatJson(msg.data) : truncateJson(msg.data)}
            </span>
            <span style={styles.messageTime}>{formatTime(msg.timestamp)}</span>
          </div>
        )
      })}
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
