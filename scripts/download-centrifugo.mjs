/**
 * Download the Centrifugo binary for the current platform and cache it at
 * .cache/centrifugo/centrifugo (Linux/macOS) or .cache/centrifugo/centrifugo.exe (Windows).
 *
 * Usage:
 *   node scripts/download-centrifugo.mjs          # latest release
 *   node scripts/download-centrifugo.mjs v5.4.8   # specific version
 *
 * The cached binary is used by the centrifugo-e2e Vitest project.
 * Run this once before running: npx vitest run --project centrifugo-e2e
 */

import { execSync } from 'child_process'
import { mkdirSync, existsSync, chmodSync, writeFileSync, readFileSync, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import { pipeline } from 'stream/promises'

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
// GitHub API helpers
// ---------------------------------------------------------------------------

async function getLatestVersion() {
  console.log('Fetching latest Centrifugo release from GitHub…')
  const res = await fetch(
    'https://api.github.com/repos/centrifugal/centrifugo/releases/latest',
    { headers: { 'User-Agent': 'tanstack-realtime-download-script' } },
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.tag_name // e.g. "v5.4.8"
}

function buildDownloadUrl(version, os, arch) {
  // Strip leading 'v' for the filename
  const ver = version.replace(/^v/, '')
  const ext = os === 'windows' ? 'zip' : 'tar.gz'
  const filename = `centrifugo_${ver}_${os}_${arch}.${ext}`
  return {
    url: `https://github.com/centrifugal/centrifugo/releases/download/${version}/${filename}`,
    filename,
    ext,
  }
}

// ---------------------------------------------------------------------------
// Download + extract
// ---------------------------------------------------------------------------

async function downloadFile(url, dest) {
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}\nURL: ${url}`)
  const out = createWriteStream(dest)
  await pipeline(res.body, out)
}

function extract(archivePath, ext, destDir) {
  if (ext === 'tar.gz') {
    execSync(`tar -xzf "${archivePath}" -C "${destDir}" centrifugo`, { stdio: 'inherit' })
  } else {
    // zip (Windows) — use PowerShell
    execSync(
      `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'inherit' },
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const requestedVersion = process.argv[2] ?? null

  // Resolve version
  const version = requestedVersion ?? await getLatestVersion()

  // Check if already cached at this version
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
  await downloadFile(url, tmp)

  console.log(`Extracting to ${CACHE_DIR}…`)
  extract(tmp, ext, CACHE_DIR)

  if (!IS_WINDOWS) chmodSync(BINARY, 0o755)

  writeFileSync(VERSION_FILE, version, 'utf8')
  console.log(`✓ Centrifugo ${version} ready at ${BINARY}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
