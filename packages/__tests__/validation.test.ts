/**
 * Tests for server-side validation (Feature 3).
 *
 * Covers:
 * - `createValidatedPublish` wrapper (TanStack Start compatible)
 * - `PublishValidationError` on rejection
 * - Data transformation on validation pass
 * - Data transformation and error handling
 */

import { describe, expect, it, vi } from 'vitest'
import {
  PublishValidationError,
  createValidatedPublish,
} from '@tanstack/realtime'
import type { PublishFn, ValidatePublishFn } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Tests: createValidatedPublish
// ---------------------------------------------------------------------------

describe('createValidatedPublish', () => {
  it('publishes data when validation accepts', async () => {
    const publishCalls: Array<{
      channel: string | ReadonlyArray<unknown>
      data: unknown
    }> = []
    const publish: PublishFn = (channel, data) => {
      publishCalls.push({ channel: channel as string, data })
      return Promise.resolve()
    }

    const validate: ValidatePublishFn = () => ({ accepted: true })

    const validated = createValidatedPublish({ publish, validate })
    await validated('my-channel', { action: 'insert', data: { id: '1' } })

    expect(publishCalls).toHaveLength(1)
    expect(publishCalls[0].channel).toBe('my-channel')
    expect(publishCalls[0].data).toEqual({
      action: 'insert',
      data: { id: '1' },
    })
  })

  it('throws PublishValidationError when validation rejects', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => ({
      accepted: false,
      reason: 'Invalid data shape',
    })

    const validated = createValidatedPublish({ publish, validate })

    await expect(validated('my-channel', { bad: 'data' })).rejects.toThrow(
      PublishValidationError,
    )

    await expect(validated('my-channel', { bad: 'data' })).rejects.toThrow(
      'Invalid data shape',
    )

    expect(publish).not.toHaveBeenCalled()
  })

  it('uses default reason when rejection has no reason', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => ({ accepted: false })

    const validated = createValidatedPublish({ publish, validate })

    await expect(validated('ch', {})).rejects.toThrow('Validation failed')
  })

  it('publishes transformed data when validation returns data', async () => {
    const publishCalls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      publishCalls.push({ data })
      return Promise.resolve()
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
    const publish: PublishFn = () => Promise.resolve()
    const validateCalls: Array<{
      namespace: string
      params: Record<string, string>
    }> = []

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
    const publish: PublishFn = () => Promise.resolve()
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

    await expect(
      validated('ch', {
        action: 'insert',
        data: { title: 'Short' },
      }),
    ).resolves.toBeUndefined()

    await expect(
      validated('ch', {
        action: 'insert',
        data: { title: 'A'.repeat(101) },
      }),
    ).rejects.toThrow('Title too long')
  })

  it('publishes falsy data (null) when validation returns { data: null }', async () => {
    const publishCalls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      publishCalls.push({ data })
      return Promise.resolve()
    }

    const validate: ValidatePublishFn = () => ({
      accepted: true,
      data: null,
    })

    const validated = createValidatedPublish({ publish, validate })
    await validated('ch', { original: true })

    // Should publish null, not the original data
    expect(publishCalls[0].data).toBeNull()
  })

  it('publishes falsy data (0) when validation returns { data: 0 }', async () => {
    const publishCalls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      publishCalls.push({ data })
      return Promise.resolve()
    }

    const validate: ValidatePublishFn = () => ({
      accepted: true,
      data: 0,
    })

    const validated = createValidatedPublish({ publish, validate })
    await validated('ch', { original: true })

    // Should publish 0, not the original data
    expect(publishCalls[0].data).toBe(0)
  })

  it('propagates exceptions thrown by validate (not just rejections)', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => {
      throw new Error('Unexpected crash')
    }

    const validated = createValidatedPublish({ publish, validate })

    await expect(validated('ch', {})).rejects.toThrow('Unexpected crash')
    expect(publish).not.toHaveBeenCalled()
  })

  it('PublishValidationError has reason property', async () => {
    const publish: PublishFn = vi.fn()
    const validate: ValidatePublishFn = () => ({
      accepted: false,
      reason: 'Custom reason',
    })

    const validated = createValidatedPublish({ publish, validate })

    const err = await validated('ch', {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PublishValidationError)
    expect((err as PublishValidationError).reason).toBe('Custom reason')
    expect((err as PublishValidationError).name).toBe('PublishValidationError')
  })
})
