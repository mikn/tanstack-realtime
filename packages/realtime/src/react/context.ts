import { createContext } from 'react'
import type { RealtimeClient } from '../core/types.js'

export const RealtimeContext = createContext<RealtimeClient | null>(null)
