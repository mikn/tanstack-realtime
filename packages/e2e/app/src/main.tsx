/**
 * React entry point.
 *
 * Wraps the App in RealtimeProvider using the client created from URL params,
 * so each browser context (alice / bob) gets its own independent connection.
 */

import { createRoot } from 'react-dom/client'
import { RealtimeProvider } from '@tanstack/react-realtime'
import { client } from './client.js'
import { App } from './App.js'

const root = document.getElementById('root')!
createRoot(root).render(
  <RealtimeProvider client={client}>
    <App />
  </RealtimeProvider>,
)
