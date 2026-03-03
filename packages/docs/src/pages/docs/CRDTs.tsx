import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Shared demo helpers
// ---------------------------------------------------------------------------

interface LogEntry {
  id: number
  client: 'a' | 'b' | 'system'
  text: string
}
let _logId = 0
function log(client: LogEntry['client'], text: string): LogEntry {
  return { id: ++_logId, client, text }
}

function DemoLog({ entries }: { entries: Array<LogEntry> }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries.length])
  return (
    <div className="demo-log" ref={ref}>
      {entries.map((e) => (
        <div key={e.id} className={`demo-log-entry demo-log-${e.client}`}>
          {e.client !== 'system' && (
            <span className={`demo-dot demo-dot-${e.client}`} />
          )}
          {e.text}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LWW Register Demo
// ---------------------------------------------------------------------------

function LwwDemo() {
  const [valA, setValA] = useState('Shopping List')
  const [valB, setValB] = useState('Shopping List')
  const [clockA, setClockA] = useState(0)
  const [clockB, setClockB] = useState(0)
  const [merged, setMerged] = useState<{
    value: string
    winner: 'A' | 'B'
    reason: string
  } | null>(null)
  const [entries, setEntries] = useState<Array<LogEntry>>([
    log('system', 'Both clients see "Shopping List". Edit both, then merge.'),
  ])

  const editA = (v: string) => {
    const c = clockA + 1
    setValA(v)
    setClockA(c)
    setMerged(null)
    setEntries((p) => [...p, log('a', `set "${v}" (clock ${c})`)])
  }
  const editB = (v: string) => {
    const c = clockB + 1
    setValB(v)
    setClockB(c)
    setMerged(null)
    setEntries((p) => [...p, log('b', `set "${v}" (clock ${c})`)])
  }
  const merge = () => {
    const aWins = clockA > clockB
    const winner: 'A' | 'B' = aWins ? 'A' : 'B'
    const value = aWins ? valA : valB
    const reason =
      clockA === clockB
        ? `Tie at clock ${clockA} — clientId tiebreak (B > A)`
        : `clock ${Math.max(clockA, clockB)} > ${Math.min(clockA, clockB)}`
    setMerged({ value, winner, reason })
    setEntries((p) => [
      ...p,
      log('system', `Merge: Client ${winner} wins (${reason})`),
      log('system', `Both converge to "${value}"`),
    ])
  }
  const reset = () => {
    setValA('Shopping List')
    setValB('Shopping List')
    setClockA(0)
    setClockB(0)
    setMerged(null)
    setEntries([log('system', 'Reset. Both clients see "Shopping List".')])
  }

  return (
    <div className="demo-box">
      <h3>LWW Register</h3>
      <p className="demo-desc">
        Two clients rename a document while offline. On reconnect, the higher
        Lamport clock wins. Edit both fields and click <strong>Merge</strong>.
      </p>
      <div className="demo-clients">
        <div className="demo-client demo-client-a">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-a" /> Client A
            <span className="demo-clock">clock: {clockA}</span>
          </div>
          <input
            className="demo-input"
            value={valA}
            onChange={(e) => editA(e.target.value)}
          />
        </div>
        <div className="demo-client demo-client-b">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-b" /> Client B
            <span className="demo-clock">clock: {clockB}</span>
          </div>
          <input
            className="demo-input"
            value={valB}
            onChange={(e) => editB(e.target.value)}
          />
        </div>
      </div>
      <div className="demo-actions">
        <button className="demo-btn demo-btn-primary" onClick={merge}>
          Reconnect &amp; Merge
        </button>
        <button className="demo-btn" onClick={reset}>
          Reset
        </button>
      </div>
      {merged && (
        <div
          className={`demo-result demo-result-${merged.winner.toLowerCase()}`}
        >
          <strong>Merged:</strong> "{merged.value}" &mdash; Client{' '}
          {merged.winner} wins ({merged.reason})
        </div>
      )}
      <DemoLog entries={entries} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PN-Counter Demo
// ---------------------------------------------------------------------------

interface PnState {
  inc: { [key: string]: number | undefined }
  dec: { [key: string]: number | undefined }
}
function pnVal(s: PnState) {
  let t = 0
  for (const v of Object.values(s.inc)) t += v ?? 0
  for (const v of Object.values(s.dec)) t -= v ?? 0
  return t
}
function pnMerge(a: PnState, b: PnState): PnState {
  const inc: { [key: string]: number | undefined } = { ...a.inc }
  const dec: { [key: string]: number | undefined } = { ...a.dec }
  for (const [id, v] of Object.entries(b.inc))
    if ((inc[id] ?? 0) < (v ?? 0)) inc[id] = v
  for (const [id, v] of Object.entries(b.dec))
    if ((dec[id] ?? 0) < (v ?? 0)) dec[id] = v
  return { inc, dec }
}

function PnCounterDemo() {
  const [stA, setStA] = useState<PnState>({ inc: {}, dec: {} })
  const [stB, setStB] = useState<PnState>({ inc: {}, dec: {} })
  const [entries, setEntries] = useState<Array<LogEntry>>([
    log(
      'system',
      'Click +/- on each client. The merged total is always correct.',
    ),
  ])

  const incA = () => {
    setStA((s) => ({ inc: { ...s.inc, a: (s.inc.a ?? 0) + 1 }, dec: s.dec }))
    setEntries((p) => [...p, log('a', '+1')])
  }
  const decA = () => {
    setStA((s) => ({ inc: s.inc, dec: { ...s.dec, a: (s.dec.a ?? 0) + 1 } }))
    setEntries((p) => [...p, log('a', '-1')])
  }
  const incB = () => {
    setStB((s) => ({ inc: { ...s.inc, b: (s.inc.b ?? 0) + 1 }, dec: s.dec }))
    setEntries((p) => [...p, log('b', '+1')])
  }
  const decB = () => {
    setStB((s) => ({ inc: s.inc, dec: { ...s.dec, b: (s.dec.b ?? 0) + 1 } }))
    setEntries((p) => [...p, log('b', '-1')])
  }
  const reset = () => {
    setStA({ inc: {}, dec: {} })
    setStB({ inc: {}, dec: {} })
    setEntries([log('system', 'Reset. Counter back to 0.')])
  }

  const m = pnMerge(stA, stB)
  const total = pnVal(m)

  return (
    <div className="demo-box">
      <h3>PN-Counter</h3>
      <p className="demo-desc">
        Each client tracks its own increments and decrements. Merging takes the
        max per client &mdash; <strong>concurrent votes never get lost</strong>.
      </p>
      <div className="demo-counter-total">
        <span className="demo-counter-num">{total}</span>
        <span className="demo-counter-label">merged total</span>
      </div>
      <div className="demo-clients">
        <div className="demo-client demo-client-a">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-a" /> Client A
            <span className="demo-clock">
              +{stA.inc.a ?? 0} / -{stA.dec.a ?? 0}
            </span>
          </div>
          <div className="demo-btn-row">
            <button className="demo-btn demo-btn-green" onClick={incA}>
              +1
            </button>
            <button className="demo-btn demo-btn-red" onClick={decA}>
              -1
            </button>
          </div>
        </div>
        <div className="demo-client demo-client-b">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-b" /> Client B
            <span className="demo-clock">
              +{stB.inc.b ?? 0} / -{stB.dec.b ?? 0}
            </span>
          </div>
          <div className="demo-btn-row">
            <button className="demo-btn demo-btn-green" onClick={incB}>
              +1
            </button>
            <button className="demo-btn demo-btn-red" onClick={decB}>
              -1
            </button>
          </div>
        </div>
      </div>
      <div className="demo-actions">
        <button className="demo-btn" onClick={reset}>
          Reset
        </button>
      </div>
      <DemoLog entries={entries} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// OR-Set Demo
// ---------------------------------------------------------------------------

interface OrEntry {
  key: string
  value: string
  tag: string
}
interface OrSetState {
  entries: Array<OrEntry>
}
function orVals(s: OrSetState) {
  const seen = new Map<string, string>()
  for (const e of s.entries) seen.set(e.key, e.value)
  return Array.from(seen.values())
}
function orMerge(a: OrSetState, b: OrSetState): OrSetState {
  const seen = new Map<string, OrEntry>()
  for (const e of a.entries) seen.set(e.tag, e)
  for (const e of b.entries) seen.set(e.tag, e)
  return { entries: Array.from(seen.values()) }
}
function orAdd(s: OrSetState, value: string): OrSetState {
  const tag = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return { entries: [...s.entries, { key: JSON.stringify(value), value, tag }] }
}
function orRemove(s: OrSetState, value: string): OrSetState {
  return { entries: s.entries.filter((e) => e.key !== JSON.stringify(value)) }
}
const TAGS = ['bug', 'feature', 'docs']
function fresh(): OrSetState {
  let s: OrSetState = { entries: [] }
  for (const t of TAGS) s = orAdd(s, t)
  return s
}

function OrSetDemo() {
  const [stA, setStA] = useState<OrSetState>(fresh)
  const [stB, setStB] = useState<OrSetState>(fresh)
  const [inA, setInA] = useState('')
  const [inB, setInB] = useState('')
  const [show, setShow] = useState(false)
  const [entries, setEntries] = useState<Array<LogEntry>>([
    log(
      'system',
      'Both clients see: bug, feature, docs. Add/remove, then merge.',
    ),
  ])

  const addA = () => {
    if (!inA.trim()) return
    setStA((s) => orAdd(s, inA.trim()))
    setEntries((p) => [...p, log('a', `add "${inA.trim()}"`)])
    setInA('')
    setShow(false)
  }
  const addB = () => {
    if (!inB.trim()) return
    setStB((s) => orAdd(s, inB.trim()))
    setEntries((p) => [...p, log('b', `add "${inB.trim()}"`)])
    setInB('')
    setShow(false)
  }
  const rmA = (v: string) => {
    setStA((s) => orRemove(s, v))
    setEntries((p) => [...p, log('a', `remove "${v}"`)])
    setShow(false)
  }
  const rmB = (v: string) => {
    setStB((s) => orRemove(s, v))
    setEntries((p) => [...p, log('b', `remove "${v}"`)])
    setShow(false)
  }
  const merge = () => {
    const vals = orVals(orMerge(stA, stB))
    setShow(true)
    setEntries((p) => [
      ...p,
      log('system', `Merge (union): [${vals.join(', ')}]`),
    ])
  }
  const reset = () => {
    const i = fresh()
    setStA(i)
    setStB(i)
    setInA('')
    setInB('')
    setShow(false)
    setEntries([log('system', 'Reset.')])
  }

  const merged = orMerge(stA, stB)

  return (
    <div className="demo-box">
      <h3>OR-Set</h3>
      <p className="demo-desc">
        Each add gets a unique tag. A concurrent add always wins over a
        concurrent remove. Try adding a tag on one client while removing it on
        the other.
      </p>
      <div className="demo-clients">
        <div className="demo-client demo-client-a">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-a" /> Client A
          </div>
          <div className="demo-tags">
            {orVals(stA).map((v) => (
              <span key={v} className="demo-tag">
                {v}{' '}
                <button className="demo-tag-x" onClick={() => rmA(v)}>
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="demo-tag-add">
            <input
              className="demo-input"
              value={inA}
              placeholder="new tag..."
              onChange={(e) => setInA(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addA()}
            />
            <button className="demo-btn" onClick={addA}>
              Add
            </button>
          </div>
        </div>
        <div className="demo-client demo-client-b">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-b" /> Client B
          </div>
          <div className="demo-tags">
            {orVals(stB).map((v) => (
              <span key={v} className="demo-tag">
                {v}{' '}
                <button className="demo-tag-x" onClick={() => rmB(v)}>
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="demo-tag-add">
            <input
              className="demo-input"
              value={inB}
              placeholder="new tag..."
              onChange={(e) => setInB(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addB()}
            />
            <button className="demo-btn" onClick={addB}>
              Add
            </button>
          </div>
        </div>
      </div>
      <div className="demo-actions">
        <button className="demo-btn demo-btn-primary" onClick={merge}>
          Reconnect &amp; Merge
        </button>
        <button className="demo-btn" onClick={reset}>
          Reset
        </button>
      </div>
      {show && (
        <div className="demo-result">
          <strong>Merged tags:</strong>{' '}
          {orVals(merged).map((v) => (
            <span key={v} className="demo-tag demo-tag-merged">
              {v}
            </span>
          ))}
        </div>
      )}
      <DemoLog entries={entries} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CRDTs() {
  const [tab, setTab] = useState<'lww' | 'pn' | 'or'>('lww')

  return (
    <article className="doc-article">
      <h1>CRDTs</h1>
      <p className="doc-lead">
        Conflict-free data types let two clients edit the same row
        simultaneously and merge deterministically. Declare <code>fields</code>{' '}
        on a collection and every conflict is resolved automatically.
      </p>

      <h2 id="try-it">Try it</h2>
      <p>
        Each demo simulates two clients editing while offline. Click{' '}
        <strong>Reconnect &amp; Merge</strong> to see how the CRDT resolves the
        conflict.
      </p>

      <div className="demo-tabs">
        <button
          className={`demo-tab${tab === 'lww' ? ' active' : ''}`}
          onClick={() => setTab('lww')}
        >
          LWW Register
        </button>
        <button
          className={`demo-tab${tab === 'pn' ? ' active' : ''}`}
          onClick={() => setTab('pn')}
        >
          PN-Counter
        </button>
        <button
          className={`demo-tab${tab === 'or' ? ' active' : ''}`}
          onClick={() => setTab('or')}
        >
          OR-Set
        </button>
      </div>
      {tab === 'lww' && <LwwDemo />}
      {tab === 'pn' && <PnCounterDemo />}
      {tab === 'or' && <OrSetDemo />}

      <h2 id="field-types">Field types</h2>
      <CodeBlock
        code={`realtimeCollectionOptions({
  // ...
  fields: {
    title:     'lww',        // Last-writer-wins (Lamport clock + clientId)
    votes:     'pn-counter', // Positive-negative counter
    tags:      'or-set',     // Observed-remove set (add wins)
    draftText: 'local',      // Client-only, never synced
  },
})`}
      />

      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>lww</h3>
          <p>
            Lamport clock + clientId tiebreak. Most recent write wins
            deterministically. Use for text, enums, timestamps.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>pn-counter</h3>
          <p>
            Per-client increment/decrement vectors. Merging takes the max
            &mdash; concurrent votes always add up.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>or-set</h3>
          <p>
            Each add gets a unique tag. Add always wins over concurrent remove.
            Use for tags, reactions, assignee lists.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>local</h3>
          <p>
            Client-only field, never synced. Incoming messages leave it
            untouched. Use for UI state like drafts or expand toggles.
          </p>
        </div>
      </div>

      <h2 id="standalone-hooks">Standalone CRDT hooks</h2>
      <p>
        Self-contained hooks for shared counters, values, and sets. No
        collection required.
      </p>
      <CodeBlock
        title="useSyncedCounter"
        code={`import { defineSyncedCounter } from '@tanstack/realtime'
import { useSyncedCounter } from '@tanstack/react-realtime'

const postVotes = defineSyncedCounter({
  id: 'post-votes',
  channel: (params: { postId: string }) => ['votes', params],
})

function VoteButton({ postId }: { postId: string }) {
  const { value, increment, decrement } = useSyncedCounter(postVotes, {
    params: { postId },
    initial: 0,
  })

  return (
    <div>
      <button onClick={() => decrement()}>-</button>
      <span>{value}</span>
      <button onClick={() => increment()}>+</button>
    </div>
  )
}`}
      />
      <CodeBlock
        title="useSyncedSet"
        code={`import { defineSyncedSet } from '@tanstack/realtime'
import { useSyncedSet } from '@tanstack/react-realtime'

const postTags = defineSyncedSet({
  id: 'post-tags',
  channel: (params: { postId: string }) => ['tags', params],
})

function TagEditor({ postId }: { postId: string }) {
  const { values: tags, add, remove } = useSyncedSet(postTags, {
    params: { postId },
    initial: [],
  })

  return (
    <>
      {tags.map(tag => (
        <span key={tag}>{tag} <button onClick={() => remove(tag)}>x</button></span>
      ))}
      <button onClick={() => add('important')}>+ important</button>
    </>
  )
}`}
      />

      <h2 id="undo-redo">Undo / redo</h2>
      <p>
        CRDTs guarantee <strong>convergence</strong> &mdash; every client
        reaches the same state regardless of message ordering. However,
        convergence is not the same as undo. A CRDT merge doesn&rsquo;t track
        &ldquo;who did what&rdquo; &mdash; it merges concurrent operations into
        a single resolved state. This means there&rsquo;s no built-in way to say
        &ldquo;undo Alice&rsquo;s last change without undoing
        Bob&rsquo;s.&rdquo;
      </p>

      <h3 id="lww-undo">Lightweight undo with LWW fields</h3>
      <p>
        For LWW fields you can implement a local undo stack: before each
        mutation, snapshot the current field value per-client and push it onto a
        stack. On undo, pop the stack and write the previous value as a new LWW
        operation.
      </p>
      <p>
        <strong>Caveat:</strong> this &ldquo;undo&rdquo; is really &ldquo;set to
        previous value.&rdquo; If Bob changed the field between your edit and
        your undo, your undo overwrites Bob&rsquo;s change (last-writer-wins).
      </p>
      <p>
        <strong>Note:</strong> Undo for <code>pn-counter</code> and{' '}
        <code>or-set</code> is not covered here &mdash; those CRDTs would
        require computing inverse operations (e.g. decrement to undo an
        increment, re-add to undo a remove), which is application-specific.
      </p>
      <CodeBlock
        title="Wrapping useSyncedValue with an undo stack"
        code={`import { useCallback, useRef } from 'react'
import { defineSyncedValue } from '@tanstack/realtime'
import { useSyncedValue } from '@tanstack/react-realtime'

const docTitle = defineSyncedValue<string>({
  id: 'doc-title',
  channel: (params: { docId: string }) => ['doc:title', params],
})

function EditableTitle({ docId }: { docId: string }) {
  const { value, set } = useSyncedValue(docTitle, {
    params: { docId },
    initial: 'Untitled',
  })

  const undoStack = useRef<Array<string>>([])
  const redoStack = useRef<Array<string>>([])

  const editTitle = useCallback(
    (newTitle: string) => {
      undoStack.current.push(value)
      redoStack.current = [] // clear redo on new edit
      set(newTitle)
    },
    [value, set],
  )

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (prev === undefined) return
    redoStack.current.push(value)
    // This is a NEW LWW write — if Bob edited in between,
    // your undo will overwrite his change (last-writer-wins).
    set(prev)
  }, [value, set])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (next === undefined) return
    undoStack.current.push(value)
    set(next)
  }, [value, set])

  return (
    <div>
      <input value={value} onChange={(e) => editTitle(e.target.value)} />
      <button onClick={undo} disabled={undoStack.current.length === 0}>
        Undo
      </button>
      <button onClick={redo} disabled={redoStack.current.length === 0}>
        Redo
      </button>
    </div>
  )
}`}
      />

      <h3 id="rich-text-undo">Rich text: use Y.js UndoManager</h3>
      <p>
        For character-level collaborative text editing, TanStack
        Realtime&rsquo;s field-level CRDTs aren&rsquo;t the right tool. They
        operate on whole-field granularity (replacing the entire value), not
        individual characters or ranges.
      </p>
      <p>
        Use a dedicated rich-text CRDT library such as <strong>Y.js</strong> or{' '}
        <strong>Automerge</strong>, both of which provide a built-in{' '}
        <code>UndoManager</code> that tracks operations per-client and can
        reverse them without affecting other users&rsquo; concurrent edits.
      </p>
      <p>
        See the <a href="#/docs/rich-text-crdts">Rich Text (Y.js) guide</a> for
        a full walkthrough.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Summary:</strong> Field-level CRDTs are designed for
          structured data (forms, settings, counters, tag sets). For rich text
          collaboration with proper undo, pair TanStack Realtime as the
          transport with Y.js as the CRDT engine.
        </p>
      </div>
    </article>
  )
}
