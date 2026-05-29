/**
 * Typed stream channel definition shared between the hook and the channel key.
 *
 * `useStream` folds each incoming `{ type: 'token', content }` event into the
 * accumulated text via `reduce`. The server's `stream.done()` pushes a
 * `STREAM_DONE` sentinel which `isDone` detects to close the stream; a
 * `STREAM_ERROR` sentinel maps to the error state.
 */
import {
  STREAM_DONE,
  STREAM_ERROR,
  createStreamChannel,
} from '@realtimejs/core'

interface StreamState {
  content: string
}

type StreamEvent =
  | { type: 'token'; content: string }
  | { type: typeof STREAM_DONE }
  | { type: typeof STREAM_ERROR; message?: string }

export const aiStream = createStreamChannel<
  StreamState,
  StreamEvent,
  { sessionId: string }
>({
  id: 'ai-message-stream',
  channel: (p) => ['ai', { sessionId: p.sessionId }],
  initial: { content: '' },
  reduce: (state, event) =>
    event.type === 'token' ? { content: state.content + event.content } : state,
  isDone: (_, event) => event.type === STREAM_DONE,
  isError: (_, event) =>
    event.type === STREAM_ERROR ? (event.message ?? 'Stream error') : false,
  staleAfter: 15_000,
})
