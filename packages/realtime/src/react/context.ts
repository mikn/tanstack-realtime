import { createContext } from 'react'
import type { RealtimeClient } from '../core/types.js'

/** React context that provides the `RealtimeClient` to child components via `<RealtimeProvider>`. */
export const RealtimeContext = createContext<RealtimeClient | null>(null)
