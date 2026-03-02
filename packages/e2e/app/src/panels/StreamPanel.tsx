/**
 * StreamPanel — exercises streamChannelOptions / useStream.
 *
 * Pattern: reduce-based stream accumulation.
 * User A clicks "Start Stream" → publishes a series of token events followed
 * by a done event. User B's useStream hook accumulates the tokens and
 * transitions to 'done' status.
 */

import { useStream } from '@tanstack/react-realtime'
import { textStream } from '../defs.js'
import { client } from '../client.js'

const STREAM_CHANNEL = 'e2e-stream'

export function StreamPanel() {
  const { state, status } = useStream(textStream, { params: {} })

  async function startStream() {
    const tokens = ['Hello', ' ', 'World', '!']
    for (const token of tokens) {
      await client.publish(STREAM_CHANNEL, { type: 'token', token })
      // Small delay so tokens arrive sequentially.
      await new Promise((r) => setTimeout(r, 30))
    }
    await client.publish(STREAM_CHANNEL, { type: 'done' })
  }

  return (
    <div className="panel" data-testid="stream-panel">
      <h2>streamChannelOptions / useStream — Token Accumulation</h2>
      <button data-testid="start-stream" onClick={() => void startStream()}>
        Start Stream
      </button>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#888' }}>Status: </span>
        <span data-testid="stream-status">{status}</span>
      </div>
      <div
        data-testid="stream-content"
        style={{
          marginTop: 4,
          padding: 8,
          background: '#f3f4f6',
          borderRadius: 4,
          minHeight: 32,
          fontFamily: 'monospace',
          fontSize: 13,
        }}
      >
        {state.content || <em style={{ color: '#aaa' }}>waiting…</em>}
      </div>
    </div>
  )
}
