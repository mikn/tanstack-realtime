/**
 * Root layout — wraps all routes with RealtimeProvider.
 * Styles and HTML shell live in index.html (Vite entry point).
 */
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { RealtimeProvider } from '@tanstack/react-realtime'
import { client } from '../transport.js'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <RealtimeProvider client={client}>
      <Outlet />
    </RealtimeProvider>
  )
}
