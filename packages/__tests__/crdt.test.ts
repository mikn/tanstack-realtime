/**
 * Tests for the CRDT primitives (crdt.ts).
 *
 * Each CRDT type is tested for its core invariants:
 * - Commutativity: merge(a, b) === merge(b, a)
 * - Idempotency: merge(a, a) === a
 * - Correctness: operations produce the expected values
 */

import { describe, expect, it } from 'vitest'
import {
  advanceClock,
  initOrFromArray,
  lwwWins,
  mergeOr,
  mergePn,
  orAdd,
  orHas,
  orRemove,
  orValues,
  pnDecrement,
  pnIncrement,
  pnValue,
  tickClock,
} from '@tanstack/realtime'
import type { LwwState, OrState, PnState } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Lamport clock
// ---------------------------------------------------------------------------

describe('Lamport clock', () => {
  it('tickClock returns monotonically increasing values', () => {
    const a = tickClock()
    const b = tickClock()
    const c = tickClock()
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })

  it('advanceClock jumps past an incoming value', () => {
    const before = tickClock()
    advanceClock(before + 1000)
    const after = tickClock()
    expect(after).toBeGreaterThan(before + 1000)
  })

  it('advanceClock is a no-op when incoming is lower than local', () => {
    const before = tickClock()
    advanceClock(0)
    const after = tickClock()
    // Should have incremented by exactly 1 (the tickClock call), not jumped.
    expect(after).toBe(before + 1)
  })
})

// ---------------------------------------------------------------------------
// LWW-Register
// ---------------------------------------------------------------------------

describe('lwwWins', () => {
  it('higher clock wins', () => {
    const a: LwwState = { clock: 1, clientId: 'aaa' }
    expect(lwwWins(a, { clock: 2, clientId: 'aaa' })).toBe(true)
    expect(lwwWins(a, { clock: 0, clientId: 'zzz' })).toBe(false)
  })

  it('equal clock: higher clientId wins (deterministic tie-break)', () => {
    const a: LwwState = { clock: 5, clientId: 'bbb' }
    expect(lwwWins(a, { clock: 5, clientId: 'ccc' })).toBe(true)
    expect(lwwWins(a, { clock: 5, clientId: 'aaa' })).toBe(false)
  })

  it('equal clock and equal clientId: no winner (false)', () => {
    const a: LwwState = { clock: 5, clientId: 'same' }
    expect(lwwWins(a, { clock: 5, clientId: 'same' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PN-Counter
// ---------------------------------------------------------------------------

describe('PN-Counter', () => {
  const empty: PnState = { inc: {}, dec: {} }

  it('empty counter has value 0', () => {
    expect(pnValue(empty)).toBe(0)
  })

  it('increment adds to the value', () => {
    const s = pnIncrement(empty, 'alice', 3)
    expect(pnValue(s)).toBe(3)
  })

  it('decrement subtracts from the value', () => {
    const s = pnDecrement(empty, 'alice', 2)
    expect(pnValue(s)).toBe(-2)
  })

  it('increments from different clients add up', () => {
    let s = pnIncrement(empty, 'alice', 5)
    s = pnIncrement(s, 'bob', 3)
    expect(pnValue(s)).toBe(8)
  })

  it('increments and decrements from multiple clients', () => {
    let s = pnIncrement(empty, 'alice', 10)
    s = pnDecrement(s, 'bob', 3)
    s = pnIncrement(s, 'carol', 5)
    expect(pnValue(s)).toBe(12) // 10 - 3 + 5
  })

  it('multiple increments from the same client accumulate', () => {
    let s = pnIncrement(empty, 'alice', 2)
    s = pnIncrement(s, 'alice', 3)
    expect(pnValue(s)).toBe(5)
  })

  it('merge takes the max of each client counter', () => {
    const a: PnState = { inc: { alice: 5, bob: 2 }, dec: {} }
    const b: PnState = { inc: { alice: 3, carol: 4 }, dec: {} }
    const merged = mergePn(a, b)
    expect(merged.inc).toEqual({ alice: 5, bob: 2, carol: 4 })
  })

  it('merge is commutative: mergePn(a, b) === mergePn(b, a)', () => {
    const a: PnState = { inc: { alice: 5 }, dec: { bob: 2 } }
    const b: PnState = { inc: { bob: 3 }, dec: { alice: 1 } }
    expect(pnValue(mergePn(a, b))).toBe(pnValue(mergePn(b, a)))
  })

  it('merge is idempotent: mergePn(a, a) gives same value as a', () => {
    const a: PnState = { inc: { alice: 5, bob: 3 }, dec: { carol: 1 } }
    expect(pnValue(mergePn(a, a))).toBe(pnValue(a))
  })

  it('concurrent increments from two clients are never lost', () => {
    // Alice sees the counter at 0 and increments to 5.
    const alice = pnIncrement(empty, 'alice', 5)
    // Bob sees the counter at 0 and increments to 3.
    const bob = pnIncrement(empty, 'bob', 3)
    // They merge — both increments survive.
    expect(pnValue(mergePn(alice, bob))).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// OR-Set
// ---------------------------------------------------------------------------

describe('OR-Set', () => {
  const empty: OrState = { entries: [] }

  it('empty set has no values', () => {
    expect(orValues(empty)).toEqual([])
  })

  it('orAdd adds a value', () => {
    const s = orAdd(empty, 'a')
    expect(orValues(s)).toEqual(['a'])
  })

  it('orRemove removes a value', () => {
    let s = orAdd(empty, 'a')
    s = orAdd(s, 'b')
    s = orRemove(s, 'a')
    expect(orValues(s)).toEqual(['b'])
  })

  it('orHas checks membership', () => {
    let s = orAdd(empty, 'x')
    expect(orHas(s, 'x')).toBe(true)
    expect(orHas(s, 'y')).toBe(false)
    s = orRemove(s, 'x')
    expect(orHas(s, 'x')).toBe(false)
  })

  it('orValues deduplicates multiple adds of the same value', () => {
    let s = orAdd(empty, 'tag')
    s = orAdd(s, 'tag')
    s = orAdd(s, 'tag')
    // Multiple entries exist internally, but orValues deduplicates.
    expect(orValues(s)).toEqual(['tag'])
  })

  it('initOrFromArray creates state from a plain array', () => {
    const s = initOrFromArray(['a', 'b', 'c'])
    expect(orValues(s).sort()).toEqual(['a', 'b', 'c'])
    expect(s.entries).toHaveLength(3)
  })

  it('merge is commutative: mergeOr(a, b) has same values as mergeOr(b, a)', () => {
    const a = orAdd(orAdd(empty, 'x'), 'y')
    const b = orAdd(orAdd(empty, 'y'), 'z')
    const ab = orValues(mergeOr(a, b)).sort()
    const ba = orValues(mergeOr(b, a)).sort()
    expect(ab).toEqual(ba)
  })

  it('merge is idempotent: mergeOr(a, a) has same values as a', () => {
    const a = orAdd(orAdd(empty, 'x'), 'y')
    expect(orValues(mergeOr(a, a)).sort()).toEqual(orValues(a).sort())
  })

  it('add wins over a concurrent remove', () => {
    // Both start with 'tag'.
    const base = orAdd(empty, 'tag')

    // Alice removes 'tag'.
    const alice = orRemove(base, 'tag')
    // Bob concurrently re-adds 'tag' (gets a fresh tag UUID).
    const bob = orAdd(base, 'tag')

    // After merge, Bob's add survives because it has a tag Alice never saw.
    const merged = mergeOr(alice, bob)
    expect(orHas(merged, 'tag')).toBe(true)
  })

  it('works with objects via structural equality (JSON.stringify)', () => {
    let s = orAdd(empty, { id: 1, name: 'alice' })
    expect(orHas(s, { id: 1, name: 'alice' })).toBe(true)
    expect(orHas(s, { id: 2, name: 'bob' })).toBe(false)

    s = orRemove(s, { id: 1, name: 'alice' })
    expect(orHas(s, { id: 1, name: 'alice' })).toBe(false)
  })

  it('remove only affects entries with matching key', () => {
    let s = orAdd(empty, 'keep')
    s = orAdd(s, 'remove-me')
    s = orAdd(s, 'also-keep')
    s = orRemove(s, 'remove-me')
    expect(orValues(s).sort()).toEqual(['also-keep', 'keep'])
  })
})
