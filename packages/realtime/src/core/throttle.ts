/**
 * Throttle utility for high-frequency realtime operations.
 *
 * Useful for cursor positions, drag events, sensor data, and typing indicators
 * where you want to limit the rate of outbound publishes without losing the
 * most recent value.
 *
 * Uses a trailing-edge strategy: the first call fires immediately, subsequent
 * calls within the interval are coalesced, and the last value is always sent
 * when the interval expires.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThrottleOptions {
  /**
   * Minimum interval between calls in milliseconds.
   * @default 50
   */
  interval?: number
}

export interface ThrottledFn<TArgs extends Array<unknown>> {
  /** Call the throttled function. */
  (...args: TArgs): void
  /** Cancel any pending trailing call. */
  cancel(): void
  /** Immediately fire the pending trailing call (if any) and reset. */
  flush(): void
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Throttle a function with trailing-edge coalescing.
 *
 * @example
 * const throttledPublish = throttle(
 *   (pos: { x: number; y: number }) => client.publish('cursors', pos),
 *   { interval: 50 }
 * )
 *
 * // Called on every mouse move — at most 20 publishes/sec
 * onMouseMove = (e) => throttledPublish({ x: e.clientX, y: e.clientY })
 */
export function throttle<TArgs extends Array<unknown>>(
  fn: (...args: TArgs) => void,
  options: ThrottleOptions = {},
): ThrottledFn<TArgs> {
  const { interval = 50 } = options

  let lastCallTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: TArgs | null = null

  function execute(args: TArgs): void {
    lastCallTime = Date.now()
    fn(...args)
  }

  const throttled = ((...args: TArgs) => {
    const now = Date.now()
    const elapsed = now - lastCallTime

    if (elapsed >= interval) {
      // Enough time has passed — fire immediately.
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      pendingArgs = null
      execute(args)
    } else {
      // Too soon — schedule a trailing call with the latest args.
      pendingArgs = args
      if (timer === null) {
        timer = setTimeout(() => {
          timer = null
          if (pendingArgs !== null) {
            const a = pendingArgs
            pendingArgs = null
            execute(a)
          }
        }, interval - elapsed)
      }
    }
  }) as ThrottledFn<TArgs>

  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
  }

  throttled.flush = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    if (pendingArgs !== null) {
      const args = pendingArgs
      pendingArgs = null
      execute(args)
    }
  }

  return throttled
}
