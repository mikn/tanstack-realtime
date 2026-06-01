/**
 * DevtoolsPanel — the main panel content rendered inside the floating devtools.
 *
 * Tabs:
 *  - Overview:  Client info + connection status + queue summary
 *  - Channels:  Active channel list with message counts + presence
 *  - Messages:  Rolling message log with expandable payloads
 *  - Events:    Connection lifecycle events (including presence + queue)
 */

import { computed, defineComponent, nextTick, onUpdated, ref } from 'vue'
import { useConnectionStatus, useRealtime } from '@realtimejs/vue'
import { useStoreRef } from './useStoreRef.js'
import { styles } from './styles.js'
import type { PropType } from 'vue'
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

export const DevtoolsPanel = defineComponent({
  name: 'DevtoolsPanel',

  props: {
    devtoolsStore: {
      type: Object as PropType<DevtoolsStoreHandle>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },

  setup(props) {
    const activeTab = ref<Tab>('channels')
    const status = useConnectionStatus()
    const { client } = useRealtime()
    const state = useStoreRef(props.devtoolsStore.store, (s) => s)

    const channelCount = computed(() => state.value.channels.size)
    const messageCount = computed(() => state.value.messages.length)
    const eventCount = computed(() => state.value.events.length)
    const totalPresence = computed(() =>
      Array.from(state.value.channels.values()).reduce(
        (sum, ch) => sum + ch.presenceUsers.length,
        0,
      ),
    )

    const tabs = [
      {
        key: 'overview' as Tab,
        label: 'Overview',
        count: null as null | (() => number),
      },
      {
        key: 'channels' as Tab,
        label: 'Channels',
        count: () => channelCount.value,
      },
      {
        key: 'messages' as Tab,
        label: 'Messages',
        count: () => messageCount.value,
      },
      { key: 'events' as Tab, label: 'Events', count: () => eventCount.value },
    ]

    return () => (
      <div style={styles.panel} data-testid="realtime-devtools-panel">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerTitle}>realtime.js</span>
            <span style={styles.statusBadge(status.value)}>
              <span style={styles.statusDot(status.value)} />
              {status.value}
            </span>
            {state.value.offlineQueue &&
              state.value.offlineQueue.pending > 0 && (
                <span style={styles.queueFlushingBadge}>
                  {state.value.offlineQueue.isFlushing
                    ? 'flushing'
                    : `${state.value.offlineQueue.pending} queued`}
                </span>
              )}
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
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              style={styles.tab(activeTab.value === key)}
              onClick={() => {
                activeTab.value = key
              }}
            >
              {label}
              {count !== null && count() > 0 && (
                <span style={styles.tabCount}>{count()}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab.value === 'overview' && (
            <OverviewTab
              clientId={client.clientId}
              status={status.value}
              offlineQueue={state.value.offlineQueue}
              channelCount={channelCount.value}
              totalPresence={totalPresence.value}
            />
          )}
          {activeTab.value === 'channels' && (
            <ChannelsTab channels={state.value.channels} />
          )}
          {activeTab.value === 'messages' && (
            <MessagesTab messages={state.value.messages} />
          )}
          {activeTab.value === 'events' && (
            <EventsTab events={state.value.events} />
          )}
        </div>
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

const OverviewTab = defineComponent({
  name: 'OverviewTab',
  props: {
    clientId: { type: String, required: true },
    status: { type: String, required: true },
    offlineQueue: {
      type: Object as PropType<OfflineQueueSnapshot | null>,
      default: null,
    },
    channelCount: { type: Number, required: true },
    totalPresence: { type: Number, required: true },
  },
  setup(props) {
    return () => (
      <div style={styles.infoGrid}>
        <span style={styles.infoLabel}>Client ID</span>
        <span style={styles.infoValue}>{props.clientId}</span>
        <span style={styles.infoLabel}>Status</span>
        <span style={styles.infoValue}>{props.status}</span>
        <span style={styles.infoLabel}>Channels</span>
        <span style={styles.infoValue}>{props.channelCount}</span>
        <span style={styles.infoLabel}>Presence</span>
        <span style={styles.infoValue}>
          {props.totalPresence} user{props.totalPresence === 1 ? '' : 's'}{' '}
          online
        </span>
        {props.offlineQueue && (
          <>
            <span style={styles.infoLabel}>Queue</span>
            <span style={styles.infoValue}>
              {props.offlineQueue.pending} pending ·{' '}
              {props.offlineQueue.flushed} flushed
              {props.offlineQueue.isFlushing ? ' · flushing…' : ''}
            </span>
          </>
        )}
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Channels tab
// ---------------------------------------------------------------------------

const ChannelsTab = defineComponent({
  name: 'ChannelsTab',
  props: {
    channels: {
      type: Object as PropType<ReadonlyMap<string, ChannelInfo>>,
      required: true,
    },
  },
  setup(props) {
    const expanded = ref<Set<string>>(new Set())

    const toggleExpand = (channel: string) => {
      const next = new Set(expanded.value)
      if (next.has(channel)) next.delete(channel)
      else next.add(channel)
      expanded.value = next
    }

    return () => {
      const channels = Array.from(props.channels.values())
      const now = Date.now()

      if (channels.length === 0) {
        return <div style={styles.empty}>No active channels</div>
      }

      return (
        <div>
          {channels.map((ch) => (
            <div key={ch.channel}>
              <div
                style={styles.channelRow}
                onClick={() => toggleExpand(ch.channel)}
              >
                <span style={styles.channelName} title={ch.channel}>
                  {expanded.value.has(ch.channel) ? '▾ ' : '▸ '}
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
              {expanded.value.has(ch.channel) &&
                ch.presenceUsers.length > 0 && (
                  <div style={styles.presenceSection}>
                    {ch.presenceUsers.map((user) => (
                      <div
                        key={user.connectionId}
                        style={styles.presenceUserRow}
                      >
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
  },
})

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

const MessagesTab = defineComponent({
  name: 'MessagesTab',
  props: {
    messages: {
      type: Array as PropType<ReadonlyArray<DevtoolsMessage>>,
      required: true,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLDivElement | null>(null)
    const bottomRef = ref<HTMLDivElement | null>(null)
    const autoScroll = ref(true)
    const expandedIds = ref<Set<number>>(new Set())

    const handleScroll = () => {
      const el = containerRef.value
      if (!el) return
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      autoScroll.value = atBottom
    }

    const toggleExpand = (id: number) => {
      const next = new Set(expandedIds.value)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      expandedIds.value = next
    }

    // Auto-scroll to bottom when new messages arrive.
    onUpdated(() => {
      if (autoScroll.value && bottomRef.value) {
        void nextTick(() => {
          bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
        })
      }
    })

    return () => {
      if (props.messages.length === 0) {
        return <div style={styles.empty}>No messages yet</div>
      }

      return (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{ height: '100%', overflow: 'auto' }}
        >
          {props.messages.map((msg) => {
            const isExpanded = expandedIds.value.has(msg.id)
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
                <span style={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Events tab
// ---------------------------------------------------------------------------

const EventsTab = defineComponent({
  name: 'EventsTab',
  props: {
    events: {
      type: Array as PropType<
        ReadonlyArray<{
          id: number
          type: string
          detail: string
          timestamp: number
        }>
      >,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (props.events.length === 0) {
        return <div style={styles.empty}>No events yet</div>
      }

      return (
        <div>
          {[...props.events].reverse().map((evt) => (
            <div key={evt.id} style={styles.eventRow(evt.type)}>
              <span style={styles.eventType}>{evt.type}</span>
              <span style={styles.eventDetail}>{evt.detail}</span>
              <span style={styles.eventTime}>{formatTime(evt.timestamp)}</span>
            </div>
          ))}
        </div>
      )
    }
  },
})
