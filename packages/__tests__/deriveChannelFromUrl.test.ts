import { describe, expect, it } from 'vitest'
import { deriveChannelFromUrl } from '@tanstack/realtime'

describe('deriveChannelFromUrl', () => {
  it('extracts the last path segment as namespace', () => {
    expect(deriveChannelFromUrl('/api/todos')).toBe('todos')
  })

  it('strips /api prefix', () => {
    expect(deriveChannelFromUrl('/api/todos')).toBe('todos')
  })

  it('strips /api/vN prefix', () => {
    expect(deriveChannelFromUrl('/api/v2/todos')).toBe('todos')
    expect(deriveChannelFromUrl('/api/v10/tasks')).toBe('tasks')
  })

  it('uses the last segment for nested paths', () => {
    expect(deriveChannelFromUrl('/api/v2/projects/abc/tasks')).toBe('tasks')
  })

  it('converts query params into sorted channel params', () => {
    expect(deriveChannelFromUrl('/api/todos?projectId=123')).toBe(
      'todos:projectId=123',
    )
  })

  it('sorts query params alphabetically', () => {
    expect(deriveChannelFromUrl('/api/todos?status=active&projectId=123')).toBe(
      'todos:projectId=123,status=active',
    )
  })

  it('handles absolute URLs with origin', () => {
    expect(deriveChannelFromUrl('https://example.com/api/todos')).toBe('todos')
  })

  it('handles absolute URLs with query params', () => {
    expect(
      deriveChannelFromUrl('https://example.com/api/todos?projectId=abc'),
    ).toBe('todos:projectId=abc')
  })

  it('URI-encodes param values', () => {
    expect(deriveChannelFromUrl('/api/items?name=hello%20world')).toBe(
      'items:name=hello%20world',
    )
  })

  it('handles URLs with no /api prefix', () => {
    expect(deriveChannelFromUrl('/todos?projectId=123')).toBe(
      'todos:projectId=123',
    )
  })

  it('handles URLs with no query params and no /api prefix', () => {
    expect(deriveChannelFromUrl('/todos')).toBe('todos')
  })

  it('guards against prototype pollution keys', () => {
    expect(deriveChannelFromUrl('/api/todos?__proto__=bad&projectId=123')).toBe(
      'todos:projectId=123',
    )
    expect(
      deriveChannelFromUrl('/api/todos?constructor=bad&projectId=123'),
    ).toBe('todos:projectId=123')
  })

  it('handles empty query string gracefully', () => {
    expect(deriveChannelFromUrl('/api/todos?')).toBe('todos')
  })
})
