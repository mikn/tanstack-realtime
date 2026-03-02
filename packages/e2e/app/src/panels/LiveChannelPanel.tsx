/**
 * LiveChannelPanel — exercises liveChannelOptions.
 *
 * Pattern: append-only event stream (chat messages).
 * User A sends a message → User B sees it appended to the chat list.
 * Unlike realtimeCollectionOptions, no update/delete — only inserts.
 */

import { useRef, useState } from 'react'
import { liveChannelOptions } from '@tanstack/realtime'
import { client, userId } from '../client.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface ChatMessage {
  id: string
  text: string
  author: string
  ts: number
}

const CHANNEL = 'e2e-chat'

export function LiveChannelPanel() {
  const [inputValue, setInputValue] = useState('')
  const counterRef = useRef(0)

  const messages = useCollectionSync<ChatMessage>(() =>
    liveChannelOptions<ChatMessage, string>({
      client,
      id: 'e2e-chat-collection',
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
    const text = inputValue.trim()
    if (!text) return
    void client.publish(CHANNEL, {
      type: 'message',
      id: `msg-${userId}-${++counterRef.current}-${Date.now()}`,
      text,
      author: userId,
      ts: Date.now(),
    })
    setInputValue('')
  }

  return (
    <div className="panel" data-testid="live-channel-panel">
      <h2>liveChannelOptions — Chat</h2>
      <input
        data-testid="chat-input"
        type="text"
        placeholder="Message…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button data-testid="send-message" onClick={sendMessage}>
        Send
      </button>
      <div data-testid="chat-messages" style={{ marginTop: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} className="list-item">
            <span className="tag">{msg.author}</span>
            <span style={{ flex: 1 }}>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
