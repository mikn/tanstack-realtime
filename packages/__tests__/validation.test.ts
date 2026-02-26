/**
 * Tests for server-side validation (Feature 3).
 *
 * Covers:
 * - `createValidatedPublish` wrapper (TanStack Start compatible)
 * - `PublishValidationError` on rejection
 * - Data transformation on validation pass
 * - `onPublish` hook in createNodeServer (integration)
 */

import { createServer } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import {
  PublishValidationError,
  createRealtimeClient,
  createValidatedPublish,
  wsTransport,
} from '@tanstack/realtime'
import { createNodeServer } from '@tanstack/realtime-preset-node'
import type { Server } from 'node:http'
import type {
  PublishFn,
  RealtimeClient,
  ValidatePublishFn,
} from '@tanstack/realtime'
import type { NodeServer } from '@tanstack/realtime-preset-node'

// ---------------------------------------------------------------------------
// Tests: createValidatedPublish
// ---------------------------------------------------------------------------

describe('createValidatedPublish', () => {
  it('publishes data when validation accepts', async () => {
    const publishCalls: Array<{ channel: string | ReadonlyArray<unknown>; data: unknown }> = []
    const publish: PublishFn = async (channel, data) => {
      publishCalls.push({ channel: channel as string, data })
    }

    const validate: ValidatePublishFn = () => ({ accepted: true })

    const validated = createValidatedPublish({ publish, validate })
    await validated('my-channel', { action: 'insert', data: { id: '1' } })

    expect(publishCalls).toHaveLength(1)
    expect(publishCalls[0].channel).toBe('my-channel')
    expect(publishCalls[0].data).toEqual({ action: 'insert', data: { id: '1' } })
  })

  it('throws PublishValidationError when validation rejects', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => ({
      accepted: false,
      reason: 'Invalid data shape',
    })

    const validated = createValidatedPublish({ publish, validate })

    await expect(
      validated('my-channel', { bad: 'data' }),
    ).rejects.toThrow(PublishValidationError)

    await expect(
      validated('my-channel', { bad: 'data' }),
    ).rejects.toThrow('Invalid data shape')

    expect(publish).not.toHaveBeenCalled()
  })

  it('uses default reason when rejection has no reason', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => ({ accepted: false })

    const validated = createValidatedPublish({ publish, validate })

    await expect(
      validated('ch', {}),
    ).rejects.toThrow('Validation failed')
  })

  it('publishes transformed data when validation returns data', async () => {
    const publishCalls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      publishCalls.push({ data })
    }

    const validate: ValidatePublishFn = ({ data }) => ({
      accepted: true,
      data: { ...(data as Record<string, unknown>), sanitized: true },
    })

    const validated = createValidatedPublish({ publish, validate })
    await validated('ch', { title: 'Hello' })

    expect(publishCalls[0].data).toEqual({ title: 'Hello', sanitized: true })
  })

  it('passes parsed channel to the validate function', async () => {
    const publish: PublishFn = async () => {}
    const validateCalls: Array<{ namespace: string; params: Record<string, string> }> = []

    const validate: ValidatePublishFn = ({ channel }) => {
      validateCalls.push({
        namespace: channel.namespace,
        params: channel.params,
      })
      return { accepted: true }
    }

    const validated = createValidatedPublish({ publish, validate })
    await validated(['todos', { projectId: '123' }], { action: 'insert' })

    expect(validateCalls).toHaveLength(1)
    expect(validateCalls[0].namespace).toBe('todos')
    expect(validateCalls[0].params).toEqual({ projectId: '123' })
  })

  it('supports async validate functions', async () => {
    const publish: PublishFn = async () => {}
    const validate: ValidatePublishFn = async ({ data }) => {
      // Simulate async validation (e.g., database lookup)
      await new Promise((r) => setTimeout(r, 1))
      const msg = data as { action: string; data: { title: string } }
      if (msg.data.title.length > 100) {
        return { accepted: false, reason: 'Title too long' }
      }
      return { accepted: true }
    }

    const validated = createValidatedPublish({ publish, validate })

    await expect(validated('ch', {
      action: 'insert',
      data: { title: 'Short' },
    })).resolves.toBeUndefined()

    await expect(validated('ch', {
      action: 'insert',
      data: { title: 'A'.repeat(101) },
    })).rejects.toThrow('Title too long')
  })
})

// ---------------------------------------------------------------------------
// Tests: createNodeServer with onPublish
// ---------------------------------------------------------------------------

describe('createNodeServer — onPublish validation', () => {
  let httpServer: Server
  let nodeServer: NodeServer
  let port: number

  async function startServer(
    onPublish?: ValidatePublishFn,
  ): Promise<void> {
    httpServer = createServer()
    nodeServer = createNodeServer({
      getUser: () => Promise.resolve({ userId: 'test-user' }),
      authorize: () =>
        Promise.resolve({
          subscribe: true,
          publish: true,
          presence: false,
        }),
      onPublish,
    })
    nodeServer.attach(httpServer)
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as { port: number }).port
        resolve()
      })
    })
  }

  async function createClient(): Promise<RealtimeClient> {
    const client = createRealtimeClient({
      transport: wsTransport({ url: `ws://localhost:${port}` }),
    })
    await client.connect()
    return client
  }

  async function teardown(): Promise<void> {
    await nodeServer.close()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  }

  function waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  it('fans out normally when onPublish is not provided', async () => {
    await startServer()
    try {
      const clientA = await createClient()
      const clientB = await createClient()

      // Both clients subscribe — clientA needs to be authorized to publish
      clientA.subscribe('test-ch', () => {})
      const received: Array<unknown> = []
      clientB.subscribe('test-ch', (data) => received.push(data))

      // Wait for subscriptions to register on the server
      await waitFor(100)

      await clientA.publish('test-ch', { hello: 'world' })
      await waitFor(100)

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ hello: 'world' })

      clientA.disconnect()
      clientB.disconnect()
    } finally {
      await teardown()
    }
  })

  it('blocks fan-out when onPublish rejects', async () => {
    await startServer(({ data }) => {
      const msg = data as { forbidden?: boolean }
      if (msg.forbidden) {
        return { accepted: false, reason: 'Not allowed' }
      }
      return { accepted: true }
    })

    try {
      const clientA = await createClient()
      const clientB = await createClient()

      clientA.subscribe('test-ch', () => {})
      const received: Array<unknown> = []
      clientB.subscribe('test-ch', (data) => received.push(data))

      await waitFor(100)

      // This should be rejected by onPublish
      await clientA.publish('test-ch', { forbidden: true })
      await waitFor(100)

      // This should pass
      await clientA.publish('test-ch', { forbidden: false })
      await waitFor(100)

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ forbidden: false })

      clientA.disconnect()
      clientB.disconnect()
    } finally {
      await teardown()
    }
  })

  it('fans out transformed data when onPublish returns data', async () => {
    await startServer(({ data }) => ({
      accepted: true,
      data: { ...(data as Record<string, unknown>), serverValidated: true },
    }))

    try {
      const clientA = await createClient()
      const clientB = await createClient()

      clientA.subscribe('test-ch', () => {})
      const received: Array<unknown> = []
      clientB.subscribe('test-ch', (data) => received.push(data))

      await waitFor(100)

      await clientA.publish('test-ch', { title: 'Hello' })
      await waitFor(100)

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ title: 'Hello', serverValidated: true })

      clientA.disconnect()
      clientB.disconnect()
    } finally {
      await teardown()
    }
  })
})
