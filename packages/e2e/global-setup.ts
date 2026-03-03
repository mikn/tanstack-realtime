/**
 * Playwright globalSetup — no-op.
 *
 * The TanStack Start dev server (vinxi dev) launched by playwright.config.ts
 * webServer provides the SSE backend. No external Centrifugo process needed.
 */
export default async function setup(): Promise<void> {}

export const PORT_FILE = ''
export function startCentrifugo(): Promise<number> {
  return Promise.resolve(0)
}
export function stopCentrifugo(): void {}
