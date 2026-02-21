/**
 * Tests for the throttle utility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle } from '@tanstack/realtime'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires immediately on the first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('does not fire again within the interval', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a')
    throttled('b') // should be deferred
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('fires the trailing call after the interval', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a') // immediate
    throttled('b') // deferred
    throttled('c') // coalesced — replaces 'b'

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('c')
  })

  it('fires again immediately after interval has passed', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a')
    vi.advanceTimersByTime(100)
    throttled('b')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('cancel prevents the trailing call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a')
    throttled('b') // pending
    throttled.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('flush fires pending call immediately', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('a') // immediate
    throttled('b') // pending

    throttled.flush()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('flush is a no-op when nothing is pending', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled.flush()
    expect(fn).not.toHaveBeenCalled()
  })

  it('cancel is a no-op when nothing is pending', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled.cancel() // should not throw
    expect(fn).not.toHaveBeenCalled()
  })

  it('coalesces rapid calls to the last value', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled(1) // immediate
    for (let i = 2; i <= 100; i++) {
      throttled(i) // coalesced
    }
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(100)
  })

  it('works with multiple arguments', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, { interval: 100 })
    throttled('x', 1, true)
    expect(fn).toHaveBeenCalledWith('x', 1, true)
  })

  it('uses default interval of 50ms', () => {
    const fn = vi.fn()
    const throttled = throttle(fn) // default options
    throttled('a')
    throttled('b')
    vi.advanceTimersByTime(49)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
