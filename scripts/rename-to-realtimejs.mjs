#!/usr/bin/env node
/**
 * WP-D codemod: rebrand workspace packages from the `@tanstack/*` scope to
 * `@realtimejs/*` and fix relative directory references that moved as part of
 * the accompanying `git mv` directory renames.
 *
 * USAGE:
 *   node scripts/rename-to-realtimejs.mjs           # apply changes
 *   node scripts/rename-to-realtimejs.mjs --dry-run # report only, no writes
 *
 * Scope / safety:
 * - Only the EXACT workspace package names listed in NAME_MAP are rewritten.
 *   External `@tanstack/*` packages (db, store, react-db, react-query,
 *   react-store, eslint-config, …) are NEVER touched because they are not in
 *   the map and the replacement is anchored to full names with a boundary.
 * - Replacements run LONGEST name first so that e.g.
 *   `@tanstack/react-realtime-devtools` is rewritten before
 *   `@tanstack/react-realtime`, and `@tanstack/realtime-adapter-sse` before the
 *   bare `@tanstack/realtime`.
 * - REBRAND_PLAN.md (documents the old→new map) and CHANGELOG.md (release
 *   history) are excluded from blanket replacement so they keep historical
 *   names intact.
 * - Relative path fixes only target the specific `../<oldPkgDir>/src/...`
 *   imports that exist inside packages/__tests__ — they are matched with an
 *   explicit list, not a blanket directory rename, to avoid clobbering doc
 *   example snippets that happen to contain a `realtime/` path segment.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')

// ── Package NAME rename map (longest-first ordering is enforced below) ──────
const NAME_MAP = {
  '@tanstack/react-realtime-devtools': '@realtimejs/react-devtools',
  '@tanstack/vue-realtime-devtools': '@realtimejs/vue-devtools',
  '@tanstack/solid-realtime-devtools': '@realtimejs/solid-devtools',
  '@tanstack/realtime-adapter-centrifugo': '@realtimejs/adapter-centrifugo',
  '@tanstack/realtime-adapter-sse': '@realtimejs/adapter-sse',
  '@tanstack/realtime-reactive-drizzle': '@realtimejs/reactive-drizzle',
  '@tanstack/realtime-preset-start': '@realtimejs/preset-start',
  '@tanstack/react-realtime': '@realtimejs/react',
  '@tanstack/vue-realtime': '@realtimejs/vue',
  '@tanstack/solid-realtime': '@realtimejs/solid',
  '@tanstack/realtime-docs': '@realtimejs/docs',
  '@tanstack/realtime-e2e': '@realtimejs/e2e',
  // Bare core name LAST so every longer `@tanstack/realtime-*` is gone first.
  '@tanstack/realtime': '@realtimejs/core',
}

// Sort entries by descending key length so longer prefixes win.
const NAME_ENTRIES = Object.entries(NAME_MAP).sort(
  (a, b) => b[0].length - a[0].length,
)

// ── Directory-path renames (old package dir → new package dir) ──────────────
// The accompanying `git mv`s rename packages/<old> → packages/<new>. Any file
// that references a package directory by path (relative imports in
// packages/__tests__ and the e2e vite configs, the `paths`/`include` of
// tsconfig.check.json, vitest alias replacements, knip workspace keys, and the
// pkg-pr-new publish list in CI) must be updated to the new directory name.
//
// Keys are matched ONLY when preceded by the literal `packages/` prefix so the
// rename is anchored to a real workspace-package path — never a bare token in a
// URL, endpoint, channel name, or local module import. Longest-first ordering
// ensures `react-realtime-devtools` is rewritten before `react-realtime`, and
// `realtime-adapter-sse` etc. before the bare `realtime` directory. The required
// `packages/` prefix is what prevents the bare `realtime` entry from clobbering
// app-level strings such as `/api/realtime`, `'../realtime'`, or
// `https://tanstack.com/realtime`, as well as unrelated dirs like
// `realtime-preset-workerd`.
const DIR_NAME_MAP = {
  'react-realtime-devtools': 'react-devtools',
  'vue-realtime-devtools': 'vue-devtools',
  'solid-realtime-devtools': 'solid-devtools',
  'realtime-adapter-centrifugo': 'adapter-centrifugo',
  'realtime-adapter-sse': 'adapter-sse',
  'realtime-reactive-drizzle': 'reactive-drizzle',
  'realtime-preset-start': 'preset-start',
  'react-realtime': 'react',
  'vue-realtime': 'vue',
  'solid-realtime': 'solid',
  realtime: 'core',
}
const DIR_ENTRIES = Object.entries(DIR_NAME_MAP).sort(
  (a, b) => b[0].length - a[0].length,
)

const EXT = new Set([
  '.ts',
  '.tsx',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.mjs',
  '.html',
  // `.vue` SFCs in the e2e app import the workspace packages from <script>.
  '.vue',
])
// NOTE: `.js` files are intentionally NOT processed (the only one referencing a
// renamed package directory is eslint.config.js, whose block `name:` fields
// contain unrelated "tanstack/realtime/..." strings that must not be touched).
// Its single real path glob is updated by hand.

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.nx'])
const SKIP_FILES = new Set([
  'pnpm-lock.yaml',
  'REBRAND_PLAN.md',
  'CHANGELOG.md',
  // This codemod literally contains the old↔new maps; never rewrite itself.
  'rename-to-realtimejs.mjs',
])

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      yield* walk(full)
    } else {
      yield full
    }
  }
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

let filesChanged = 0
let nameHits = 0
let pathHits = 0

for (const file of walk(ROOT)) {
  const base = file.slice(file.lastIndexOf(sep) + 1)
  const dotIdx = base.lastIndexOf('.')
  const ext = dotIdx === -1 ? '' : base.slice(dotIdx)
  if (!EXT.has(ext)) continue
  if (SKIP_FILES.has(base)) continue

  const original = readFileSync(file, 'utf8')
  let next = original

  // Package-name replacements (longest first). Anchor the match so the name is
  // not immediately followed by a name char (- / A-Z a-z 0-9) which would mean
  // it is actually a longer, different package (handled by the ordering, but
  // belt-and-suspenders for the bare core name).
  for (const [from, to] of NAME_ENTRIES) {
    // Plain form (`@tanstack/realtime`) as it appears in imports / JSON.
    const re = new RegExp(escapeRe(from) + '(?![A-Za-z0-9_-])', 'g')
    next = next.replace(re, () => {
      nameHits++
      return to
    })
    // Escaped-slash form (`@tanstack\/realtime`) as it appears inside JS regex
    // literals — e.g. the vitest source-alias `find:` patterns.
    const fromEsc = from.replace('/', '\\/')
    const toEsc = to.replace('/', '\\/')
    const reEsc = new RegExp(escapeRe(fromEsc) + '(?![A-Za-z0-9_-])', 'g')
    next = next.replace(reEsc, () => {
      nameHits++
      return toEsc
    })
  }

  // Directory-path renames (longest first). Match `<oldDir>` ONLY when it is
  // immediately preceded by the literal `packages/` path prefix and followed by
  // either `/` (deeper path) or a closing boundary (`"`, `'`, backtick, or
  // end-of-input) so JSON keys like "packages/realtime" are caught while bare
  // tokens are not. Anchoring on `packages/` (instead of a generic boundary
  // char) is what keeps the bare `realtime` entry from clobbering app-level
  // strings such as `/api/realtime`, `'../realtime'`, `LISTEN realtime`, or
  // `https://tanstack.com/realtime`. Longest-first ordering still prevents
  // `realtime` from matching inside `realtime-*` dirs.
  const rel = relative(ROOT, file)
  for (const [from, to] of DIR_ENTRIES) {
    const re = new RegExp(
      '(packages/)' + escapeRe(from) + '(/|(?=["\'`])|$)',
      'gm',
    )
    next = next.replace(re, (_m, pre, post) => {
      pathHits++
      return pre + to + post
    })
  }

  if (next !== original) {
    filesChanged++
    if (!DRY_RUN) writeFileSync(file, next)
    console.log(`${DRY_RUN ? '[dry] ' : ''}updated ${rel}`)
  }
}

console.log(
  `\n${DRY_RUN ? '[dry-run] ' : ''}files changed: ${filesChanged}, name replacements: ${nameHits}, rel-path fixes: ${pathHits}`,
)
