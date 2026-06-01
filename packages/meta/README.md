# realtime.js

The one-install "kitchen sink" for [realtime.js](https://github.com/mikn/tanstack-realtime).

This meta-package bundles:

- **[`@realtimejs/core`](../core)** — the framework-agnostic realtime client,
  collection helpers, and presence primitives.
- **[`@realtimejs/adapter-sse`](../adapter-sse)** — the recommended default
  transport, built on Server-Sent Events.

Everything exported by both packages is re-exported here, so you can install a
single dependency and get the framework-agnostic core plus the default SSE
transport.

```sh
npm install realtime.js
```

```ts
import { createRealtimeClient, sseTransport } from 'realtime.js'
```

## Framework adapters are separate

Framework bindings are intentionally **not** included. Install the adapter for
your framework alongside `realtime.js`:

- `@realtimejs/react`
- `@realtimejs/vue`
- `@realtimejs/solid`

If you need a different transport (for example
`@realtimejs/adapter-centrifugo`), depend on `@realtimejs/core` directly along
with the transport of your choice instead of this meta-package.
