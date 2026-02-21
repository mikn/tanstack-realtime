/**
 * Tests for the deduplication filter (createDedup).
 */

import { describe, it, expect } from 'vitest'
import { createDedup } from '@tanstack/realtime'

describe('createDedup', () => {
  it('returns false for the first occurrence of an id', () => {
    const dedup = createDedup()
    expect(dedup.seen('ch', 'msg-1')).toBe(false)
  })

  it('returns true for a repeated id on the same channel', () => {
    const dedup = createDedup()
    dedup.seen('ch', 'msg-1')
    expect(dedup.seen('ch', 'msg-1')).toBe(true)
  })

  it('treats the same id on different channels as distinct', () => {
    const dedup = createDedup()
    dedup.seen('ch-a', 'msg-1')
    expect(dedup.seen('ch-b', 'msg-1')).toBe(false)
  })

  it('tracks size per channel', () => {
    const dedup = createDedup()
    dedup.seen('ch', 'a')
    dedup.seen('ch', 'b')
    dedup.seen('ch', 'c')
    expect(dedup.size('ch')).toBe(3)
    expect(dedup.size('other')).toBe(0)
  })

  it('does not increment size for duplicate ids', () => {
    const dedup = createDedup()
    dedup.seen('ch', 'a')
    dedup.seen('ch', 'a')
    dedup.seen('ch', 'a')
    expect(dedup.size('ch')).toBe(1)
  })

  it('evicts the oldest entry when maxSize is reached', () => {
    const dedup = createDedup({ maxSize: 3 })
    dedup.seen('ch', 'a')
    dedup.seen('ch', 'b')
    dedup.seen('ch', 'c')
    // At capacity — inserting 'd' should evict 'a'.
    expect(dedup.seen('ch', 'd')).toBe(false)
    expect(dedup.size('ch')).toBe(3)
    // 'a' was evicted — it's no longer seen.
    expect(dedup.seen('ch', 'a')).toBe(false)
  })

  it('evicts in insertion order (FIFO)', () => {
    const dedup = createDedup({ maxSize: 3 })
    dedup.seen('ch', 'a')
    dedup.seen('ch', 'b')
    dedup.seen('ch', 'c')
    expect(dedup.size('ch')).toBe(3)

    // Insert 'd' — evicts 'a' (oldest).
    expect(dedup.seen('ch', 'd')).toBe(false)
    expect(dedup.size('ch')).toBe(3)

    // 'a' was evicted.
    expect(dedup.seen('ch', 'a')).toBe(false) // new again (evicts 'b')
    // 'b' was evicted when 'a' was re-inserted.
    expect(dedup.seen('ch', 'b')).toBe(false) // new again (evicts 'c')

    // Current set: {d, a, b} — 'c' and 'd' were evicted in sequence.
    // 'd' was evicted when 'b' was re-inserted.
    expect(dedup.seen('ch', 'c')).toBe(false)
    expect(dedup.seen('ch', 'd')).toBe(false)

    // Now check that recent additions ARE seen.
    expect(dedup.seen('ch', 'b')).toBe(true)
    expect(dedup.seen('ch', 'c')).toBe(true)
    expect(dedup.seen('ch', 'd')).toBe(true)
  })

  it('resetChannel clears only the specified channel', () => {
    const dedup = createDedup()
    dedup.seen('ch-a', 'msg-1')
    dedup.seen('ch-b', 'msg-2')
    dedup.resetChannel('ch-a')
    expect(dedup.size('ch-a')).toBe(0)
    expect(dedup.seen('ch-a', 'msg-1')).toBe(false) // no longer seen
    expect(dedup.seen('ch-b', 'msg-2')).toBe(true) // still seen
  })

  it('reset clears all channels', () => {
    const dedup = createDedup()
    dedup.seen('ch-a', '1')
    dedup.seen('ch-b', '2')
    dedup.reset()
    expect(dedup.size('ch-a')).toBe(0)
    expect(dedup.size('ch-b')).toBe(0)
    expect(dedup.seen('ch-a', '1')).toBe(false)
    expect(dedup.seen('ch-b', '2')).toBe(false)
  })

  it('handles maxSize of 1 correctly', () => {
    const dedup = createDedup({ maxSize: 1 })
    dedup.seen('ch', 'a')
    expect(dedup.seen('ch', 'a')).toBe(true)
    dedup.seen('ch', 'b') // evicts 'a'
    expect(dedup.seen('ch', 'a')).toBe(false)
    expect(dedup.size('ch')).toBe(1)
  })

  it('handles many channels independently', () => {
    const dedup = createDedup({ maxSize: 2 })
    for (let i = 0; i < 10; i++) {
      const ch = `ch-${i}`
      dedup.seen(ch, 'x')
      dedup.seen(ch, 'y')
      expect(dedup.size(ch)).toBe(2)
    }
  })
})
