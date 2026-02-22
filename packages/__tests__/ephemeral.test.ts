/**
 * Tests for the ephemeral map (createEphemeralMap).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEphemeralMap } from '@tanstack/realtime'

describe('createEphemeralMap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves a value', () => {
    const map = createEphemeralMap<string>()
    map.set('a', 'hello')
    expect(map.get('a')).toBe('hello')
    expect(map.has('a')).toBe(true)
    expect(map.size()).toBe(1)
  })

  it('returns undefined for missing keys', () => {
    const map = createEphemeralMap<string>()
    expect(map.get('missing')).toBeUndefined()
    expect(map.has('missing')).toBe(false)
  })

  it('auto-expires entries after TTL', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    map.set('a', 'hello')
    expect(map.has('a')).toBe(true)

    vi.advanceTimersByTime(999)
    expect(map.has('a')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(map.has('a')).toBe(false)
    expect(map.get('a')).toBeUndefined()
    expect(map.size()).toBe(0)
  })

  it('refreshes TTL on re-set', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    map.set('a', 'v1')

    vi.advanceTimersByTime(800)
    map.set('a', 'v2') // refreshes TTL

    vi.advanceTimersByTime(800) // 1600ms total, but only 800ms since last set
    expect(map.has('a')).toBe(true)
    expect(map.get('a')).toBe('v2')

    vi.advanceTimersByTime(200) // 1000ms since last set
    expect(map.has('a')).toBe(false)
  })

  it('manual delete removes immediately', () => {
    const map = createEphemeralMap<string>({ ttl: 5000 })
    map.set('a', 'hello')
    map.delete('a')
    expect(map.has('a')).toBe(false)
    expect(map.size()).toBe(0)
  })

  it('delete is a no-op for missing keys', () => {
    const map = createEphemeralMap<string>()
    map.delete('nope') // should not throw
  })

  it('entries() returns a snapshot of all live entries', () => {
    const map = createEphemeralMap<number>({ ttl: 5000 })
    map.set('a', 1)
    map.set('b', 2)
    map.set('c', 3)

    const entries = map.entries()
    expect(entries).toHaveLength(3)
    expect(entries.map((e) => e.key).sort()).toEqual(['a', 'b', 'c'])
    expect(entries.find((e) => e.key === 'a')!.value).toBe(1)
  })

  it('subscribe is called on set', () => {
    const map = createEphemeralMap<string>({ ttl: 5000 })
    const cb = vi.fn()
    map.subscribe(cb)

    map.set('a', 'hello')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0]![0]).toHaveLength(1)
    expect(cb.mock.calls[0]![0][0].key).toBe('a')
  })

  it('subscribe is called on delete', () => {
    const map = createEphemeralMap<string>({ ttl: 5000 })
    map.set('a', 'hello')

    const cb = vi.fn()
    map.subscribe(cb)

    map.delete('a')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0]![0]).toHaveLength(0)
  })

  it('subscribe is called on auto-expiry', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    const cb = vi.fn()
    map.subscribe(cb)

    map.set('a', 'hello')
    expect(cb).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb.mock.calls[1]![0]).toHaveLength(0) // expired
  })

  it('unsubscribe stops notifications', () => {
    const map = createEphemeralMap<string>()
    const cb = vi.fn()
    const unsub = map.subscribe(cb)

    map.set('a', 'hello')
    expect(cb).toHaveBeenCalledTimes(1)

    unsub()
    map.set('b', 'world')
    expect(cb).toHaveBeenCalledTimes(1) // no more calls
  })

  it('clear removes all entries and cancels timers', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    const cb = vi.fn()
    map.subscribe(cb)

    map.set('a', '1')
    map.set('b', '2')
    cb.mockClear()

    map.clear()
    expect(map.size()).toBe(0)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0]![0]).toHaveLength(0)

    // Expired timers should not fire after clear.
    vi.advanceTimersByTime(2000)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('destroy cancels timers and clears listeners', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    const cb = vi.fn()
    map.subscribe(cb)

    map.set('a', '1')
    cb.mockClear()

    map.destroy()

    // Timers should not fire.
    vi.advanceTimersByTime(2000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('handles multiple keys with different expiry times', () => {
    const map = createEphemeralMap<string>({ ttl: 1000 })
    map.set('a', '1')

    vi.advanceTimersByTime(500)
    map.set('b', '2')

    vi.advanceTimersByTime(500) // a expires at 1000ms
    expect(map.has('a')).toBe(false)
    expect(map.has('b')).toBe(true)

    vi.advanceTimersByTime(500) // b expires at 1500ms
    expect(map.has('b')).toBe(false)
  })

  it('uses default TTL of 3000ms', () => {
    const map = createEphemeralMap<string>()
    map.set('a', 'v')

    vi.advanceTimersByTime(2999)
    expect(map.has('a')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(map.has('a')).toBe(false)
  })

  it('notifies all subscribers on each change', () => {
    const map = createEphemeralMap<string>({ ttl: 5000 })
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const cb3 = vi.fn()

    map.subscribe(cb1)
    map.subscribe(cb2)
    map.subscribe(cb3)

    map.set('x', 'hello')

    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)
    expect(cb3).toHaveBeenCalledTimes(1)
  })

  it('unsubscribing one listener does not affect others', () => {
    const map = createEphemeralMap<string>({ ttl: 5000 })
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    const unsub1 = map.subscribe(cb1)
    map.subscribe(cb2)

    unsub1()
    map.set('k', 'v')

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledTimes(1)
  })
})
