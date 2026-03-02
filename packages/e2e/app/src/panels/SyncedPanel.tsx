/**
 * SyncedPanel — exercises defineSyncedCounter and defineSyncedSet.
 *
 * Patterns:
 *   - useSyncedCounter: PN-Counter CRDT (concurrent increments converge)
 *   - useSyncedSet:     OR-Set CRDT (concurrent add/remove resolves correctly)
 *
 * useSyncedValue is demoed in PresencePanel to spread coverage.
 */

import { useSyncedCounter, useSyncedSet } from '@tanstack/react-realtime'
import { sharedCounter, sharedSet } from '../defs.js'

export function SyncedPanel() {
  // ── PN-Counter ────────────────────────────────────────────────────────────
  const {
    value: count,
    increment,
    decrement,
  } = useSyncedCounter(sharedCounter, {
    params: {},
    initial: 0,
  })

  // ── OR-Set ────────────────────────────────────────────────────────────────
  const {
    values: tags,
    add: addTag,
    remove: removeTag,
  } = useSyncedSet<string>(sharedSet, { params: {}, initial: [] })

  return (
    <div className="panel" data-testid="synced-panel">
      {/* ── Counter ──────────────────────────────────────────────────────── */}
      <h2>useSyncedCounter — PN-Counter CRDT</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <button data-testid="counter-decrement" onClick={() => decrement()}>
          −
        </button>
        <span
          data-testid="counter-value"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          {count}
        </span>
        <button data-testid="counter-increment" onClick={() => increment()}>
          +
        </button>
      </div>

      {/* ── Set ──────────────────────────────────────────────────────────── */}
      <h2 style={{ marginTop: 8 }}>useSyncedSet — OR-Set CRDT</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button data-testid="set-add-a" onClick={() => addTag('item-a')}>
          + item-a
        </button>
        <button data-testid="set-add-b" onClick={() => addTag('item-b')}>
          + item-b
        </button>
        <button
          data-testid="set-remove-a"
          className="danger"
          onClick={() => removeTag('item-a')}
        >
          − item-a
        </button>
      </div>
      <div data-testid="set-display">
        {tags.length === 0 ? (
          <span style={{ color: '#aaa', fontSize: 12 }}>empty set</span>
        ) : (
          tags.map((tag) => (
            <span key={tag} className="tag" style={{ marginRight: 4 }}>
              {tag}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
