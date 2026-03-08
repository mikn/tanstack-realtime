/**
 * LiveChannelPanel — exercises liveChannelOptions.
 * Pattern: append-only event stream (chat messages).
 */
import { For, createSignal } from 'solid-js'
import { liveChannelOptions } from '@tanstack/realtime'
import { client, userId } from '../transport.js'
import { createCollectionSync } from '../createCollectionSync.js'

interface ChatMessage {
  id: string
  text: string
  author: string
  ts: number
}

const CHANNEL = 'e2e-chat'
let msgCounter = 0

export function LiveChannelPanel() {
  const [inputValue, setInputValue] = createSignal('')

  const messages = createCollectionSync<ChatMessage>(() =>
    liveChannelOptions<ChatMessage, string>({
      client,
      id: 'e2e-chat-collection-solid',
      channel: CHANNEL,
      getKey: (m) => m.id,
      onEvent: (raw) => {
        const e = raw as {
          type?: string
          id?: string
          text?: string
          author?: string
          ts?: number
        }
        if (e.type !== 'message') return null
        return { id: e.id!, text: e.text!, author: e.author!, ts: e.ts! }
      },
    }),
  )

  function sendMessage() {
    const text = inputValue().trim()
    if (!text) return
    void client.publish(CHANNEL, {
      type: 'message',
      id: `msg-${userId}-${++msgCounter}-${Date.now()}`,
      text,
      author: userId,
      ts: Date.now(),
    })
    setInputValue('')
  }

  return (
    <div class="panel" data-testid="live-channel-panel">
      <h2>liveChannelOptions — Chat</h2>
      <input
        data-testid="chat-input"
        type="text"
        placeholder="Message…"
        value={inputValue()}
        onInput={(e) => setInputValue(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button data-testid="send-message" onClick={sendMessage}>
        Send
      </button>
      <div data-testid="chat-messages" style={{ 'margin-top': '8px' }}>
        <For each={messages()}>
          {(msg) => (
            <div class="list-item">
              <span class="tag">{msg.author}</span>
              <span style={{ flex: '1' }}>{msg.text}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
