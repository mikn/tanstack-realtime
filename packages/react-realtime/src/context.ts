import { createContext } from 'react'
import type { RealtimeClient } from '@tanstack/realtime'

export const RealtimeContext = createContext<RealtimeClient | null>(null)
