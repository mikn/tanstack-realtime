import { createContext } from 'react'
import type { RealtimeClient } from '../core/client.js'

export const RealtimeContext = createContext<RealtimeClient | null>(null)
