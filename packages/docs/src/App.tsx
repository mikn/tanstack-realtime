import React, { useCallback, useEffect, useState } from 'react'
import './styles.css'
import { Sidebar } from './components/Sidebar'
import { SearchDialog } from './components/SearchDialog'
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
import { WireProtocol } from './pages/docs/WireProtocol'
import { Testing } from './pages/docs/Testing'
import { ChoosingAPattern } from './pages/docs/ChoosingAPattern'
import { ReactiveQueries } from './pages/docs/ReactiveQueries'
import { SolidPrimitives } from './pages/docs/SolidPrimitives'
import { VueComposables } from './pages/docs/VueComposables'
import { Devtools } from './pages/docs/Devtools'
import { Examples } from './pages/docs/Examples'

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
  '#/docs/reactive-queries': ReactiveQueries,
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
  '#/docs/wire-protocol': WireProtocol,
  '#/docs/testing': Testing,
  '#/docs/choosing-a-pattern': ChoosingAPattern,
  '#/docs/solid-primitives': SolidPrimitives,
  '#/docs/vue-composables': VueComposables,
  '#/docs/devtools': Devtools,
  '#/docs/examples': Examples,
}

// ---------------------------------------------------------------------------
// Prev / Next navigation order
// ---------------------------------------------------------------------------

const docOrder = [
  { hash: '#/docs/getting-started', label: 'Getting Started' },
  { hash: '#/docs/collections', label: 'Collections' },
  { hash: '#/docs/choosing-a-pattern', label: 'Choosing a Pattern' },
  { hash: '#/docs/server-functions', label: 'TanStack Start + Drizzle' },
  { hash: '#/docs/reactive-queries', label: 'Reactive Queries' },
  { hash: '#/docs/authentication', label: 'Authentication' },
  { hash: '#/docs/rich-text-crdts', label: 'Rich Text (Y.js)' },
  { hash: '#/docs/centrifugo', label: 'Centrifugo Guide' },
  { hash: '#/docs/read-receipts', label: 'Read Receipts' },
  { hash: '#/docs/testing', label: 'Testing' },
  { hash: '#/docs/crdts', label: 'CRDTs' },
  { hash: '#/docs/presence', label: 'Presence' },
  { hash: '#/docs/channels', label: 'Channels & Pub/Sub' },
  { hash: '#/docs/streaming', label: 'Streaming' },
  { hash: '#/docs/ephemeral', label: 'Ephemeral Channels' },
  { hash: '#/docs/tick', label: 'Tick-Based Sync' },
  { hash: '#/docs/transports', label: 'Transports' },
  { hash: '#/docs/resilience', label: 'Resilience' },
  { hash: '#/docs/scaling', label: 'Scaling to Production' },
  { hash: '#/docs/server-hooks', label: 'Server Hooks' },
  { hash: '#/docs/hooks', label: 'React Hooks' },
  { hash: '#/docs/solid-primitives', label: 'Solid Primitives' },
  { hash: '#/docs/vue-composables', label: 'Vue Composables' },
  { hash: '#/docs/devtools', label: 'DevTools' },
  { hash: '#/docs/examples', label: 'Examples' },
  { hash: '#/docs/api-reference', label: 'API Reference' },
  { hash: '#/docs/error-reference', label: 'Error Reference' },
  { hash: '#/docs/wire-protocol', label: 'Wire Protocol' },
]

function PrevNextNav({ hash }: { hash: string }) {
  const idx = docOrder.findIndex((d) => d.hash === hash)
  if (idx === -1) return null
  const prev = idx > 0 ? docOrder[idx - 1] : null
  const next = idx < docOrder.length - 1 ? docOrder[idx + 1] : null
  return (
    <nav className="prev-next-nav">
      {prev ? (
        <a href={prev.hash} className="prev-next-link prev-link">
          &larr; {prev.label}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={next.hash} className="prev-next-link next-link">
          {next.label} &rarr;
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
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

function DocsNav({
  hash,
  onSearchOpen,
}: {
  hash: string
  onSearchOpen: () => void
}) {
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
          ) : (
            <button className="search-trigger" onClick={onSearchOpen}>
              Search <kbd>Ctrl+K</kbd>
            </button>
          )}
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
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <DisclaimerBar />
      <DocsNav hash={hash} onSearchOpen={openSearch} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
      {isDocsPage ? (
        <div className="docs-layout">
          <Sidebar currentHash={hash} />
          <main className="docs-content">
            {DocPage ? <DocPage /> : <GettingStarted />}
            <PrevNextNav hash={hash} />
          </main>
        </div>
      ) : (
        <Home />
      )}
    </>
  )
}
