// This file is intentionally empty.
// The WebSocket transport (`wsTransport`) lives in the base `@tanstack/realtime`
// package. Import it directly:
//
//   import { wsTransport } from '@tanstack/realtime'
//
// In Node.js < 21 (no global WebSocket), pass the `ws` package:
//   import { WebSocket } from 'ws'
//   wsTransport({ url: '...', WebSocket })
