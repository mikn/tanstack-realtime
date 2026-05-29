/**
 * realtime.js — the one-install "kitchen sink" meta-package.
 *
 * It re-exports the framework-agnostic core (`@realtimejs/core`) together with
 * the recommended default transport (`@realtimejs/adapter-sse`), so a single
 * dependency gives you everything needed to build a realtime app on the
 * server and in framework-agnostic client code.
 *
 * Framework bindings (`@realtimejs/react`, `@realtimejs/vue`,
 * `@realtimejs/solid`, …) are intentionally NOT bundled here — install the
 * adapter for your framework alongside this package.
 *
 * Core and adapter-sse export disjoint symbol sets, so both can be re-exported
 * wholesale. Should a future collision arise, prefer core's symbol and
 * re-export the adapter's under its own name.
 */
export * from '@realtimejs/core'
export * from '@realtimejs/adapter-sse'
