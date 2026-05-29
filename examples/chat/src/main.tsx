import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RealtimeProvider } from '@realtimejs/react'
import { client } from './realtime.js'
import { App } from './App.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RealtimeProvider client={client}>
      <App />
    </RealtimeProvider>
  </StrictMode>,
)
