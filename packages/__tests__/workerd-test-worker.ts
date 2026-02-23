/**
 * Minimal worker entry point required by @cloudflare/vitest-pool-workers.
 * No Durable Objects or special bindings — the workerd tests are pure
 * client-side compatibility checks that don't use SELF.fetch().
 */
export default {
  fetch(): Promise<Response> {
    return Promise.resolve(new Response('ok'))
  },
}
