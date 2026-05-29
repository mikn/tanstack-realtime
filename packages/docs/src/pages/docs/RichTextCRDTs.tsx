import { CodeBlock } from '../../components/CodeBlock'

export function RichTextCRDTs() {
  return (
    <article className="doc-article">
      <h1>Rich Text Collaboration</h1>
      <p className="doc-lead">
        TanStack Realtime's field-level CRDTs handle structured data (forms,
        settings, counters). For character-level rich text editing &mdash;
        Google Docs-style &mdash; pair TanStack Realtime as the transport with
        Y.js as the CRDT engine.
      </p>

      {/* ----------------------------------------------------------------- */}
      {/* When to use Y.js vs field CRDTs                                   */}
      {/* ----------------------------------------------------------------- */}

      <h2 id="when">When to use Y.js vs field CRDTs</h2>
      <p>
        TanStack Realtime ships three built-in CRDT field types. They cover the
        vast majority of structured, field-level collaboration. Y.js (or
        Automerge) is only needed when you require character-level concurrent
        editing inside a single text value.
      </p>

      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>Field CRDTs (built-in)</h3>
          <p>
            <code>lww</code>, <code>pn-counter</code>, <code>or-set</code>{' '}
            &mdash; structured data, forms, counters, tag sets. Zero
            dependencies, included in <code>@realtimejs/core</code>.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>Y.js / Automerge</h3>
          <p>
            Rich text, nested documents, character-level concurrent editing.
            External dependency, larger bundle (~20-40 kB gzipped).
          </p>
        </div>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th>Use case</th>
            <th>Recommended approach</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rename a document title</td>
            <td>
              <code>lww</code> field
            </td>
          </tr>
          <tr>
            <td>Upvote / downvote counter</td>
            <td>
              <code>pn-counter</code> field
            </td>
          </tr>
          <tr>
            <td>Tag or label set</td>
            <td>
              <code>or-set</code> field
            </td>
          </tr>
          <tr>
            <td>Collaborative rich text editor</td>
            <td>Y.js + TanStack Realtime transport</td>
          </tr>
          <tr>
            <td>Collaborative code editor</td>
            <td>Y.js + TanStack Realtime transport</td>
          </tr>
          <tr>
            <td>Shared whiteboard / drawing</td>
            <td>Y.js + TanStack Realtime transport</td>
          </tr>
        </tbody>
      </table>

      {/* ----------------------------------------------------------------- */}
      {/* Architecture                                                      */}
      {/* ----------------------------------------------------------------- */}

      <h2 id="architecture">Architecture</h2>
      <p>
        The integration follows a clean separation of concerns. Each layer does
        one thing well:
      </p>

      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>TanStack Realtime</h3>
          <p>
            Handles transport (WebSocket/SSE), presence, reconnection, auth, and
            multi-tab coordination. Provides <code>subscribe</code> and{' '}
            <code>publish</code> on named channels.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>Y.js</h3>
          <p>
            Handles the text CRDT, awareness protocol, undo manager, and
            conflict-free merging of concurrent character-level edits.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>Custom provider (the glue)</h3>
          <p>
            A Y.js provider that bridges <code>Y.Doc</code> updates to TanStack
            Realtime channels. On local edit, publish the update. On channel
            message, apply it to the doc.
          </p>
        </div>
      </div>

      <CodeBlock
        title="Architecture overview"
        code={`// Data flow:
//
//   Editor (Tiptap, ProseMirror, Monaco, etc.)
//     |
//     v
//   Y.Doc  -- local edits --> doc.on('update') --> client.publish(channel, update)
//     ^                                                  |
//     |                                                  v
//   Y.applyUpdate(doc, update) <-- client.subscribe(channel, onMessage)
//     ^
//     |
//   Remote edits from other clients`}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Step-by-step setup                                                */}
      {/* ----------------------------------------------------------------- */}

      <h2 id="setup">Step-by-step setup</h2>

      <h3>1. Install dependencies</h3>
      <CodeBlock code={`npm install yjs y-protocols @realtimejs/core`} />

      <h3>2. Create a Y.js document</h3>
      <CodeBlock
        code={`import * as Y from 'yjs'

const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-text')`}
      />

      <h3>3. Create a TanStack Realtime provider for Y.js</h3>
      <p>
        The provider bridges Y.js document updates to TanStack Realtime's
        pub/sub channels. When the local Y.Doc changes, it publishes the binary
        update to a channel. When a message arrives from the channel, it applies
        the update to the local Y.Doc.
      </p>
      <CodeBlock
        title="realtime-yjs-provider.ts"
        code={`import * as Y from 'yjs'
import type { RealtimeClient } from '@realtimejs/core'

export class RealtimeYjsProvider {
  private unsubscribe: (() => void) | null = null
  private updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null

  constructor(
    private client: RealtimeClient,
    private channel: string,
    private doc: Y.Doc,
  ) {}

  /** Start syncing. Call once after the client is connected. */
  connect() {
    // 1. Listen for remote updates from the channel
    this.unsubscribe = this.client.subscribe<{ update: Array<number> }>(
      this.channel,
      (message) => {
        const update = new Uint8Array(message.update)
        // Apply with a non-self origin so the handler below ignores it
        Y.applyUpdate(this.doc, update, 'remote')
      },
    )

    // 2. Publish local updates to the channel
    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      // Only publish updates that originated locally (not from remote apply)
      if (origin === 'remote') return
      this.client.publish(this.channel, {
        update: Array.from(update),
      })
    }
    this.doc.on('update', this.updateHandler)
  }

  /** Stop syncing and clean up listeners. */
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    if (this.updateHandler) {
      this.doc.off('update', this.updateHandler)
      this.updateHandler = null
    }
  }
}`}
      />

      <h3>4. Wire it up</h3>
      <CodeBlock
        title="app.ts"
        code={`import * as Y from 'yjs'
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { RealtimeYjsProvider } from './realtime-yjs-provider'

// Create the TanStack Realtime client
const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})

// Create the Y.js document
const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-editor')

// Bridge them together
const provider = new RealtimeYjsProvider(client, 'doc:my-document', ydoc)

// Connect
await client.connect()
provider.connect()

// Now any editor bound to yText will sync through TanStack Realtime.
// For example, with Tiptap:
//
//   import { Editor } from '@tiptap/core'
//   import Collaboration from '@tiptap/extension-collaboration'
//
//   const editor = new Editor({
//     extensions: [
//       Collaboration.configure({ document: ydoc }),
//     ],
//   })`}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Cursor sharing via Awareness + Presence                           */}
      {/* ----------------------------------------------------------------- */}

      <h2 id="awareness">
        Cursor sharing via Y.js Awareness + TanStack Presence
      </h2>
      <p>
        Collaborative editors show remote cursors and selections. Y.js provides
        an Awareness protocol for this, and TanStack Realtime provides Presence.
        They serve complementary roles:
      </p>

      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>Y.js Awareness</h3>
          <p>
            Tracks cursor position and selection <strong>inside</strong> the
            document. Updated on every keystroke. Editors like Tiptap and
            ProseMirror consume awareness state directly.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>TanStack Presence</h3>
          <p>
            Tracks user identity, display name, color, and online status.
            Updated infrequently. Use for the collaborator list, avatars, and
            "who is viewing" indicators.
          </p>
        </div>
      </div>

      <CodeBlock
        title="awareness-bridge.ts"
        code={`import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from 'y-protocols/awareness'
import type { RealtimeClient } from '@realtimejs/core'
import type * as Y from 'yjs'

/**
 * Bridge Y.js Awareness updates through TanStack Realtime channels,
 * while using TanStack Presence for user metadata.
 */
export function setupAwareness(
  client: RealtimeClient,
  doc: Y.Doc,
  channel: string,
  user: { name: string; color: string },
) {
  const awareness = new Awareness(doc)

  // Set local awareness state (cursor, selection, user info)
  awareness.setLocalState({
    user,
    cursor: null,
    selection: null,
  })

  // Publish awareness updates through the channel
  awareness.on('update', ({ added, updated, removed }: {
    added: Array<number>
    updated: Array<number>
    removed: Array<number>
  }) => {
    const changedClients = added.concat(updated, removed)
    const update = encodeAwarenessUpdate(awareness, changedClients)
    client.publish(channel + ':awareness', {
      update: Array.from(update),
    })
  })

  // Apply remote awareness updates
  const unsub = client.subscribe<{ update: Array<number> }>(
    channel + ':awareness',
    (message) => {
      applyAwarenessUpdate(
        awareness,
        new Uint8Array(message.update),
        'remote',
      )
    },
  )

  // Use TanStack Presence for user-level metadata
  client.joinPresence(channel, {
    name: user.name,
    color: user.color,
    status: 'editing',
  })

  return {
    awareness,
    destroy() {
      unsub()
      client.leavePresence(channel)
      awareness.destroy()
    },
  }
}`}
      />
      <div className="doc-callout">
        <strong>Transport requirement.</strong> The <code>joinPresence</code>{' '}
        and <code>leavePresence</code> methods are only available on transports
        that implement the <code>PresenceCapable</code> interface (e.g.{' '}
        <code>centrifugoTransport</code>). If your transport does not support
        presence natively (e.g. <code>sseTransport</code>), omit the presence
        calls and rely solely on Y.js Awareness for cursor sharing, or use
        TanStack Realtime&rsquo;s <code>createPresenceChannel</code> with a
        separate pub/sub channel instead.
      </div>
      <p>
        With this setup, the editor renders remote cursors from Y.js Awareness
        (keystroke-level updates), while the UI sidebar shows collaborator names
        and colors from TanStack Presence (infrequent, higher-level metadata).
      </p>

      {/* ----------------------------------------------------------------- */}
      {/* Undo                                                              */}
      {/* ----------------------------------------------------------------- */}

      <h2 id="undo">Undo with Y.UndoManager</h2>
      <p>
        Y.js tracks operations per-client, enabling proper collaborative undo.
        When Client A undoes, only their own changes are reversed &mdash; Client
        B's edits are preserved.
      </p>
      <CodeBlock
        code={`import * as Y from 'yjs'

const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-editor')

// Create an undo manager scoped to yText
const undoManager = new Y.UndoManager(yText)

// Undo the last local operation
undoManager.undo()

// Redo the last undone operation
undoManager.redo()

// Wire to keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) undoManager.redo()
    else undoManager.undo()
  }
})`}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Callout                                                           */}
      {/* ----------------------------------------------------------------- */}

      <div className="doc-callout">
        <strong>Production considerations.</strong> This guide shows the
        integration pattern. For a production implementation, also consider:
        initial document state loading, persistence, conflict-free reconnection,
        and document garbage collection.
      </div>
    </article>
  )
}
