/**
 * DevtoolsPanel — the main panel content rendered inside the floating devtools.
 *
 * Tabs:
 *  - Overview:  Client info + connection status + queue summary
 *  - Channels:  Active channel list with message counts + presence
 *  - Messages:  Rolling message log with expandable payloads
 *  - Events:    Connection lifecycle events (including presence + queue)
 */

import { For, Show, createEffect, createSignal } from 'solid-js'
import { useConnectionStatus, useRealtime } from '@tanstack/solid-realtime'
import { createStoreSignal } from './createStoreSignal.js'
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

export function DevtoolsPanel(props: DevtoolsPanelProps) {
  const [activeTab, setActiveTab] = createSignal<Tab>('channels')
  const status = useConnectionStatus()
  const { client } = useRealtime()

  const state = createStoreSignal(props.devtoolsStore.store, (s) => s)

  const channelCount = () => state().channels.size
  const messageCount = () => state().messages.length
  const totalPresence = () =>
    Array.from(state().channels.values()).reduce(
      (sum, ch) => sum + ch.presenceUsers.length,
      0,
    )

  const tabs = [
    ['overview', 'Overview', null],
    ['channels', 'Channels', channelCount],
    ['messages', 'Messages', messageCount],
    ['events', 'Events', () => state().events.length],
  ] as const

  return (
    <div style={styles.panel} data-testid="realtime-devtools-panel">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>TanStack Realtime</span>
          <span style={styles.statusBadge(status())}>
            <span style={styles.statusDot(status())} />
            {status()}
          </span>
          <Show
            when={state().offlineQueue && state().offlineQueue!.pending > 0}
          >
            <span style={styles.queueFlushingBadge}>
              {state().offlineQueue!.isFlushing
                ? 'flushing'
                : `${state().offlineQueue!.pending} queued`}
            </span>
          </Show>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.iconButton}
            onClick={() => props.devtoolsStore.clear()}
            title="Clear log"
          >
            ⌫
          </button>
          <button
            style={styles.iconButton}
            onClick={props.onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <For each={tabs}>
          {([key, label, countFn]) => (
            <button
              style={styles.tab(activeTab() === key)}
              onClick={() => setActiveTab(key as Tab)}
            >
              {label}
              <Show when={countFn != null && (countFn as () => number)() > 0}>
                <span style={styles.tabCount}>
                  {(countFn as () => number)()}
                </span>
              </Show>
            </button>
          )}
        </For>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <Show when={activeTab() === 'overview'}>
          <OverviewTab
            clientId={client.clientId}
            status={status()}
            offlineQueue={state().offlineQueue}
            channelCount={channelCount()}
            totalPresence={totalPresence()}
          />
        </Show>
        <Show when={activeTab() === 'channels'}>
          <ChannelsTab channels={state().channels} />
        </Show>
        <Show when={activeTab() === 'messages'}>
          <MessagesTab messages={state().messages} />
        </Show>
        <Show when={activeTab() === 'events'}>
          <EventsTab events={state().events} />
        </Show>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab(props: {
  clientId: string
  status: string
  offlineQueue: OfflineQueueSnapshot | null
  channelCount: number
  totalPresence: number
}) {
  return (
    <div style={styles.infoGrid}>
      <span style={styles.infoLabel}>Client ID</span>
      <span style={styles.infoValue}>{props.clientId}</span>
      <span style={styles.infoLabel}>Status</span>
      <span style={styles.infoValue}>{props.status}</span>
      <span style={styles.infoLabel}>Channels</span>
      <span style={styles.infoValue}>{props.channelCount}</span>
      <span style={styles.infoLabel}>Presence</span>
      <span style={styles.infoValue}>
        {props.totalPresence} user{props.totalPresence === 1 ? '' : 's'} online
      </span>
      <Show when={props.offlineQueue}>
        {(queue) => (
          <>
            <span style={styles.infoLabel}>Queue</span>
            <span style={styles.infoValue}>
              {queue().pending} pending · {queue().flushed} flushed
              {queue().isFlushing ? ' · flushing…' : ''}
            </span>
          </>
        )}
      </Show>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Channels tab
// ---------------------------------------------------------------------------

function ChannelsTab(props: { channels: ReadonlyMap<string, ChannelInfo> }) {
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const channels = () => Array.from(props.channels.values())
  const now = () => Date.now()

  const toggleExpand = (channel: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(channel)) next.delete(channel)
      else next.add(channel)
      return next
    })
  }

  return (
    <Show
      when={channels().length > 0}
      fallback={<div style={styles.empty}>No active channels</div>}
    >
      <div>
        <For each={channels()}>
          {(ch) => (
            <div>
              <div
                style={{ ...styles.channelRow, cursor: 'pointer' }}
                onClick={() => toggleExpand(ch.channel)}
              >
                <span style={styles.channelName} title={ch.channel}>
                  {expanded().has(ch.channel) ? '▾ ' : '▸ '}
                  {ch.channel}
                </span>
                <div style={styles.channelMeta}>
                  <Show when={ch.presenceUsers.length > 0}>
                    <span style={styles.presenceCount}>
                      {ch.presenceUsers.length} online
                    </span>
                  </Show>
                  <span>
                    {ch.messageCount} msg{ch.messageCount === 1 ? '' : 's'}
                  </span>
                  <span>up {formatDuration(now() - ch.subscribedAt)}</span>
                </div>
              </div>
              <Show
                when={expanded().has(ch.channel) && ch.presenceUsers.length > 0}
              >
                <div style={styles.presenceSection}>
                  <For each={ch.presenceUsers}>
                    {(user) => (
                      <div style={styles.presenceUserRow}>
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
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

function MessagesTab(props: { messages: ReadonlyArray<DevtoolsMessage> }) {
  let bottomRef: HTMLDivElement | undefined
  let containerRef: HTMLDivElement | undefined
  const [autoScroll, setAutoScroll] = createSignal(true)
  const [expandedIds, setExpandedIds] = createSignal<Set<number>>(new Set())

  createEffect(() => {
    // Access messages length to track the reactive dependency.
    props.messages.length
    if (autoScroll() && bottomRef) {
      bottomRef.scrollIntoView({ behavior: 'smooth' })
    }
  })

  const handleScroll = () => {
    if (!containerRef) return
    const atBottom =
      containerRef.scrollHeight -
        containerRef.scrollTop -
        containerRef.clientHeight <
      40
    setAutoScroll(atBottom)
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Show
      when={props.messages.length > 0}
      fallback={<div style={styles.empty}>No messages yet</div>}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: '100%', overflow: 'auto' }}
      >
        <For each={props.messages}>
          {(msg) => {
            const isExpanded = () => expandedIds().has(msg.id)
            return (
              <div style={styles.messageRow(msg.direction)}>
                <span style={styles.messageDirection(msg.direction)}>
                  {msg.direction === 'inbound' ? 'IN' : 'OUT'}
                </span>
                <span style={styles.messageChannel} title={msg.channel}>
                  {msg.channel}
                </span>
                <span
                  style={
                    isExpanded()
                      ? styles.messageDataExpanded
                      : styles.messageDataExpandable
                  }
                  onClick={() => toggleExpand(msg.id)}
                  title={isExpanded() ? 'Click to collapse' : 'Click to expand'}
                >
                  {isExpanded() ? formatJson(msg.data) : truncateJson(msg.data)}
                </span>
                <span style={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )
          }}
        </For>
        <div ref={bottomRef} />
      </div>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Events tab
// ---------------------------------------------------------------------------

function EventsTab(props: {
  events: ReadonlyArray<{
    id: number
    type: string
    detail: string
    timestamp: number
  }>
}) {
  const reversed = () => [...props.events].reverse()

  return (
    <Show
      when={props.events.length > 0}
      fallback={<div style={styles.empty}>No events yet</div>}
    >
      <div>
        <For each={reversed()}>
          {(evt) => (
            <div style={styles.eventRow(evt.type)}>
              <span style={styles.eventType}>{evt.type}</span>
              <span style={styles.eventDetail}>{evt.detail}</span>
              <span style={styles.eventTime}>{formatTime(evt.timestamp)}</span>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}
