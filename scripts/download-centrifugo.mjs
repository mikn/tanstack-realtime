/**
 * Download the Centrifugo binary for the current platform and cache it at
 * .cache/centrifugo/centrifugo (Linux/macOS) or .cache/centrifugo/centrifugo.exe (Windows).
 *
 * Uses `curl` for HTTP requests so that HTTPS_PROXY / HTTP_PROXY environment
 * variables are respected automatically — Node.js built-in fetch does not
 * honour proxy env vars.
 *
 * Usage:
 *   node scripts/download-centrifugo.mjs          # latest release
 *   node scripts/download-centrifugo.mjs v5.4.8   # specific version
 *
 * The cached binary is used by the centrifugo-e2e Vitest project.
 * Run this once before running: npx vitest run --project centrifugo-e2e
 * (or just run `npm run test:e2e` — it downloads automatically on first use)
 */

import { execSync } from 'child_process'
import { mkdirSync, existsSync, chmodSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const CACHE_DIR = join(root, '.cache', 'centrifugo')
const VERSION_FILE = join(CACHE_DIR, '.version')
const IS_WINDOWS = process.platform === 'win32'
const BINARY = join(CACHE_DIR, IS_WINDOWS ? 'centrifugo.exe' : 'centrifugo')

// ---------------------------------------------------------------------------
// Platform mapping
// ---------------------------------------------------------------------------

function getPlatformSlug() {
  const os =
    process.platform === 'win32'
      ? 'windows'
      : process.platform === 'darwin'
        ? 'darwin'
        : 'linux'

  const arch =
    process.arch === 'arm64'
      ? 'arm64'
      : process.arch === 'arm'
        ? 'armv6l'
        : 'amd64'

  return { os, arch }
}

// ---------------------------------------------------------------------------
// curl-based helpers (proxy-aware)
// ---------------------------------------------------------------------------

function curlJson(url) {
  const out = execSync(
    `curl -sL --fail -H "User-Agent: tanstack-realtime-download-script" "${url}"`,
    { encoding: 'utf8' },
  )
  return JSON.parse(out)
}

function curlDownload(url, dest) {
  console.log(`Downloading ${url}`)
  execSync(`curl -sL --fail -o "${dest}" "${url}"`, { stdio: ['ignore', 'ignore', 'inherit'] })
}

function getLatestVersion() {
  console.log('Fetching latest Centrifugo release from GitHub…')
  const data = curlJson('https://api.github.com/repos/centrifugal/centrifugo/releases/latest')
  return data.tag_name // e.g. "v5.4.8"
}

function buildDownloadUrl(version, os, arch) {
  const ver = version.replace(/^v/, '')
  const ext = os === 'windows' ? 'zip' : 'tar.gz'
  const filename = `centrifugo_${ver}_${os}_${arch}.${ext}`
  return {
    url: `https://github.com/centrifugal/centrifugo/releases/download/${version}/${filename}`,
    filename,
    ext,
  }
}

function extract(archivePath, ext, destDir) {
  if (ext === 'tar.gz') {
    execSync(`tar -xzf "${archivePath}" -C "${destDir}" centrifugo`, { stdio: 'inherit' })
  } else {
    execSync(
      `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'inherit' },
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const requestedVersion = process.argv[2] ?? null
  const version = requestedVersion ?? getLatestVersion()

  // Skip if already cached at this version
  if (existsSync(BINARY) && existsSync(VERSION_FILE)) {
    const cached = readFileSync(VERSION_FILE, 'utf8').trim()
    if (cached === version) {
      console.log(`✓ Centrifugo ${version} already cached at ${BINARY}`)
      return
    }
    console.log(`Cached version is ${cached}, want ${version} — re-downloading.`)
  }

  const { os, arch } = getPlatformSlug()
  const { url, filename, ext } = buildDownloadUrl(version, os, arch)

  mkdirSync(CACHE_DIR, { recursive: true })

  const tmp = join(tmpdir(), filename)
  curlDownload(url, tmp)

  console.log(`Extracting to ${CACHE_DIR}…`)
  extract(tmp, ext, CACHE_DIR)

  if (!IS_WINDOWS) chmodSync(BINARY, 0o755)

  writeFileSync(VERSION_FILE, version, 'utf8')
  console.log(`✓ Centrifugo ${version} ready at ${BINARY}`)
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
