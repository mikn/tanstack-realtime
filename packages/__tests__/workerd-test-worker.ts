/**
 * Minimal worker entry point required by @cloudflare/vitest-pool-workers.
 * No Durable Objects or special bindings — the workerd tests are pure
 * client-side compatibility checks that don't use SELF.fetch().
 */
export default {
  async fetch(): Promise<Response> {
    return new Response('ok')
  },
}
