/**
 * In-memory AI streaming server for the ai-streaming example.
 *
 * No ORM, no database, no real LLM — `POST /api/generate` kicks off a mock
 * token stream. The server creates a server-side stream with
 * `handler.createStream({ channel })` and pushes fake tokens with small delays
 * to simulate an LLM, then calls `stream.done()`. Clients subscribe to the same
 * channel via `useStream` and see pending → streaming → done.
 */
import { createSseHandler } from '@realtimejs/adapter-sse'

const streamChannel = (sessionId: string) => ['ai', { sessionId }] as const

const MOCK_RESPONSE =
  'Realtime.js streams server tokens to the browser over a single SSE ' +
  'connection. Each token is pushed through a typed stream channel, folded ' +
  'into reactive state by useStream, and rendered as it arrives.'

interface AiServer {
  handleRealtime: (req: Request) => Promise<Response>
  handleRest: (req: Request) => Promise<Response | null>
}

export function createAiServer(): AiServer {
  const sse = createSseHandler({ pingInterval: 0 })

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  /** Pushes mock LLM tokens to the session's channel, then completes. */
  async function runMockStream(sessionId: string): Promise<void> {
    const stream = sse.createStream<{ type: 'token'; content: string }>({
      channel: streamChannel(sessionId),
    })
    const tokens = MOCK_RESPONSE.match(/\S+\s*/g) ?? []
    for (const token of tokens) {
      await new Promise((r) => setTimeout(r, 60))
      await stream.push({ type: 'token', content: token })
    }
    await stream.done()
  }

  async function handleRest(req: Request): Promise<Response | null> {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/generate')) return null

    if (req.method === 'POST') {
      const body = (await req.json()) as { sessionId?: string }
      const sessionId = body.sessionId ?? crypto.randomUUID()
      // Fire-and-forget: subscribers receive tokens over the SSE channel.
      void runMockStream(sessionId)
      return json({ sessionId }, 202)
    }

    return json({ error: 'method not allowed' }, 405)
  }

  return {
    handleRealtime: (req) => sse.handle(req),
    handleRest,
  }
}
