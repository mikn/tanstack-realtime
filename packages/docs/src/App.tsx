import React, { useEffect, useState } from 'react'
import './styles.css'
import { Sidebar } from './components/Sidebar'
import { Home } from './pages/Home'
import { GettingStarted } from './pages/docs/GettingStarted'
import { Collections } from './pages/docs/Collections'
import { CRDTs } from './pages/docs/CRDTs'
import { Presence } from './pages/docs/Presence'
import { Channels } from './pages/docs/Channels'
import { Streaming } from './pages/docs/Streaming'
import { Transports } from './pages/docs/Transports'
import { Resilience } from './pages/docs/Resilience'
import { Hooks } from './pages/docs/Hooks'
import { ErrorReference } from './pages/docs/ErrorReference'
import { ServerFunctions } from './pages/docs/ServerFunctions'
import { RichTextCRDTs } from './pages/docs/RichTextCRDTs'
import { Authentication } from './pages/docs/Authentication'
import { Scaling } from './pages/docs/Scaling'
import { Centrifugo } from './pages/docs/Centrifugo'
import { Ephemeral } from './pages/docs/Ephemeral'
import { Tick } from './pages/docs/Tick'
import { ReadReceipts } from './pages/docs/ReadReceipts'
import { ServerHooks } from './pages/docs/ServerHooks'
import { ApiReference } from './pages/docs/ApiReference'

// ---------------------------------------------------------------------------
// Simple hash router
// ---------------------------------------------------------------------------

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const handler = () => {
      setHash(window.location.hash || '#/')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}

const docRoutes: Partial<Record<string, () => React.JSX.Element>> = {
  '#/docs/getting-started': GettingStarted,
  '#/docs/collections': Collections,
  '#/docs/server-functions': ServerFunctions,
  '#/docs/crdts': CRDTs,
  '#/docs/presence': Presence,
  '#/docs/channels': Channels,
  '#/docs/streaming': Streaming,
  '#/docs/transports': Transports,
  '#/docs/resilience': Resilience,
  '#/docs/hooks': Hooks,
  '#/docs/error-reference': ErrorReference,
  '#/docs/rich-text-crdts': RichTextCRDTs,
  '#/docs/authentication': Authentication,
  '#/docs/scaling': Scaling,
  '#/docs/centrifugo': Centrifugo,
  '#/docs/ephemeral': Ephemeral,
  '#/docs/tick': Tick,
  '#/docs/read-receipts': ReadReceipts,
  '#/docs/server-hooks': ServerHooks,
  '#/docs/api-reference': ApiReference,
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function DisclaimerBar() {
  return (
    <div className="disclaimer-bar">
      <span>
        <strong>Unofficial project</strong> — exploring an architecture for
        TanStack Realtime. Not affiliated with or endorsed by TanStack.{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime"
          target="_blank"
          rel="noopener"
        >
          View on GitHub
        </a>
      </span>
    </div>
  )
}

function DocsNav({ hash }: { hash: string }) {
  const isHome = !hash.startsWith('#/docs')
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#/" className="nav-logo">
          <span className="logo-tan">TanStack</span>{' '}
          <span className="logo-realtime">Realtime</span>
        </a>
        <div className="nav-links">
          {isHome ? (
            <>
              <a href="#features">Features</a>
              <a href="#quickstart">Quick Start</a>
              <a href="#when-to-use">When to use</a>
            </>
          ) : null}
          <a
            href="#/docs/getting-started"
            className={!isHome ? 'nav-active' : ''}
          >
            Docs
          </a>
          <a
            href="https://github.com/mikn/tanstack-realtime"
            className="nav-github"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const hash = useHash()
  const isDocsPage = hash.startsWith('#/docs')
  const DocPage = docRoutes[hash]

  return (
    <>
      <DisclaimerBar />
      <DocsNav hash={hash} />
      {isDocsPage ? (
        <div className="docs-layout">
          <Sidebar currentHash={hash} />
          <main className="docs-content">
            {DocPage ? <DocPage /> : <GettingStarted />}
          </main>
        </div>
      ) : (
        <Home />
      )}
    </>
  )
}
