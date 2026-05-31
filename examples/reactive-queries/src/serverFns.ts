/**
 * Client-side proxies for the reactive server functions.
 *
 * In a TanStack Start app, `createServerFn()` would generate these RPC stubs for
 * you: calling the function on the client transparently POSTs the args to the
 * server, runs the real (`reactive.query`/`reactive.mutation`-wrapped) handler,
 * and returns its result. There is no Start here, so these are hand-written
 * `fetch` proxies hitting the `POST /api/rpc/:fn` bridge in `server.ts`.
 *
 * The crucial contract:
 *  - A QUERY proxy returns the server's `{ data, channel, channels }`. `useQuery`
 *    consumes that: it renders `data` and AUTO-SUBSCRIBES to every `channel`,
 *    with no channel string ever written by hand. When a mutation invalidates
 *    one of those channels, the engine republishes fresh data over it and the
 *    `useQuery` collection updates.
 *  - A MUTATION proxy returns whatever the server fn returns (here, the row).
 *
 * The `ReactiveQueryFn` / `ReactiveMutationFn` casts attach the phantom type
 * tags the React hooks use for inference — they carry no runtime behaviour.
 */
import type {
  ReactiveMutationFn,
  ReactiveQueryFn,
  ReactiveQueryResult,
} from '@realtimejs/core'
import type { Todo } from './schema.js'

async function rpc<T>(fn: string, args: unknown): Promise<T> {
  const res = await fetch(`/api/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    throw new Error(`rpc ${fn} failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export const getTodos = ((args: { teamId: string }) =>
  rpc<ReactiveQueryResult<Array<Todo>>>('getTodos', args)) as ReactiveQueryFn<
  { teamId: string },
  Array<Todo>
>

export const createTodo = ((args: { teamId: string; title: string }) =>
  rpc<Todo>('createTodo', args)) as ReactiveMutationFn<
  { teamId: string; title: string },
  Todo
>

export const toggleTodo = ((args: { id: string; done: boolean }) =>
  rpc<Todo>('toggleTodo', args)) as ReactiveMutationFn<
  { id: string; done: boolean },
  Todo
>

export const voteTodo = ((args: { id: string; delta: number }) =>
  rpc<Todo>('voteTodo', args)) as ReactiveMutationFn<
  { id: string; delta: number },
  Todo
>

export const deleteTodo = ((args: { id: string }) =>
  rpc<Todo>('deleteTodo', args)) as ReactiveMutationFn<{ id: string }, Todo>
