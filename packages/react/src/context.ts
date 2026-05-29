import { createContext } from 'react'
import type { RealtimeClient } from '@realtimejs/core'

export const RealtimeContext = createContext<RealtimeClient | null>(null)
