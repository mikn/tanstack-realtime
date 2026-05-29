/**
 * In-memory chat server for the chat example.
 *
 * No ORM, no database — message history is a plain in-memory array. The server
 * is responsible for:
 *  - An **auth stub** (`getUser`) that derives a userId from a query param so
 *    each browser tab can identify as a different user
 *    (`/api/realtime?userId=alice`).
 *  - `GET  /api/messages` → returns the message history (the channel's
 *    `initialData` source).
 *  - `POST /api/messages` → append a message and broadcast it over the `chat`
 *    channel so every connected client appends it live.
 *  - The SSE stream + presence/typing pub-sub, delegated to `createSseHandler`.
 *
 * Presence (`usePresence`) and typing (`useTypingIndicator`) ride the same SSE
 * transport's pub/sub channels — the server simply fans messages out, it does
 * not need any presence-specific code.
 */
import { createSseHandler } from '@realtimejs/adapter-sse'

interface ChatMessage {
  id: string
  userId: string
  text: string
  timestamp: number
}

const CHAT_CHANNEL = 'chat'

interface ChatServer {
  handleRealtime: (req: Request) => Promise<Response>
  handleRest: (req: Request) => Promise<Response | null>
}

export function createChatServer(): ChatServer {
  const sse = createSseHandler({
    pingInterval: 0,
    // Auth stub: trust a userId query param. A real app would verify a JWT or
    // session cookie here and return null to reject (→ 401).
    getUser: (req) => {
      const userId = new URL(req.url).searchParams.get('userId')
      return userId ? { userId } : { userId: 'anonymous' }
    },
  })

  // The entire message store — a plain in-memory array (no database).
  const history: Array<ChatMessage> = [
    {
      id: 'seed-1',
      userId: 'system',
      text: 'Welcome! Open another tab with ?userId=bob to chat.',
      timestamp: Date.now(),
    },
  ]

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  async function handleRest(req: Request): Promise<Response | null> {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/messages')) return null

    if (req.method === 'GET') {
      return json(history)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as Partial<ChatMessage>
      const message: ChatMessage = {
        id: body.id ?? crypto.randomUUID(),
        userId: body.userId ?? 'anonymous',
        text: body.text ?? '',
        timestamp: body.timestamp ?? Date.now(),
      }
      history.push(message)
      // Broadcast in the append-only live-channel envelope `useLiveChannel`
      // expects: the client's `onEvent` reads `data`.
      sse.broadcast(CHAT_CHANNEL, { type: 'message', data: message })
      return json(message, 201)
    }

    return json({ error: 'method not allowed' }, 405)
  }

  return {
    handleRealtime: (req) => sse.handle(req),
    handleRest,
  }
}
