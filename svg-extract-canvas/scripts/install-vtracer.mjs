import { chmod, copyFile, mkdir, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import https from 'node:https'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = dirname(SCRIPT_DIR)

function binaryNameForPlatform(platform) {
  return platform === 'win32' ? 'vtracer.exe' : 'vtracer'
}

export function resolveBundledVtracerPath({
  cwd = PROJECT_DIR,
  platform = process.platform,
  arch = process.arch,
} = {}) {
  return join(cwd, 'vendor', 'vtracer', `${platform}-${arch}`, binaryNameForPlatform(platform))
}

function releaseAssetName({ platform = process.platform, arch = process.arch } = {}) {
  const archPart = arch === 'arm64' ? 'aarch64' : arch === 'x64' ? 'x86_64' : null
  const osPart =
    platform === 'darwin'
      ? 'apple-darwin'
      : platform === 'linux'
        ? 'unknown-linux-musl'
        : platform === 'win32'
          ? 'pc-windows-msvc.zip'
          : null

  if (!archPart || !osPart) {
    throw new Error(`Unsupported platform for bundled VTracer install: ${platform}-${arch}`)
  }

  return platform === 'win32'
    ? `vtracer-${archPart}-${osPart}`
    : `vtracer-${archPart}-${osPart}.tar.gz`
}

function runCapture(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'] })
    let stdout = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.on('error', () => resolve(null))
    child.on('close', (code) => resolve(code === 0 ? stdout.trim() : null))
  })
}

async function commandPath(command) {
  const path = await runCapture('which', [command])
  return path || null
}

async function ensureExecutable(path) {
  const info = await stat(path)
  if (!info.isFile()) throw new Error(`Not a file: ${path}`)
  await chmod(path, 0o755)
}

function download(url, outputPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        return resolve(download(response.headers.location, outputPath, headers))
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error(`Download failed with status ${response.statusCode}`))
      }
      const file = createWriteStream(outputPath)
      response.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    })
    request.on('error', reject)
  })
}

async function extractTarGz(archivePath, outputDir) {
  await new Promise((resolve, reject) => {
    const child = spawn('tar', ['-xzf', archivePath, '-C', outputDir], { stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tar failed with exit code ${code}`))))
  })
}

async function installFromExisting(sourcePath, bundledPath) {
  await mkdir(dirname(bundledPath), { recursive: true })
  await copyFile(sourcePath, bundledPath)
  await ensureExecutable(bundledPath)
  return bundledPath
}

async function fetchLatestReleaseTag() {
  const body = await new Promise((resolve, reject) => {
    https
      .get(
        'https://api.github.com/repos/visioncortex/vtracer/releases/latest',
        { headers: { 'User-Agent': 'svg-extract-canvas-installer' } },
        (response) => {
          if (response.statusCode !== 200) {
            response.resume()
            return reject(new Error(`GitHub API failed with status ${response.statusCode}`))
          }
          let data = ''
          response.on('data', (chunk) => {
            data += chunk
          })
          response.on('end', () => resolve(data))
        },
      )
      .on('error', reject)
  })
  const release = JSON.parse(body)
  if (!release?.tag_name) throw new Error('Missing tag_name in latest release payload')
  return String(release.tag_name).replace(/^v/, '')
}

async function installFromRelease({ cwd = PROJECT_DIR, platform = process.platform, arch = process.arch } = {}) {
  if (platform === 'win32') throw new Error('Automatic Windows download is not implemented yet')

  const bundledPath = resolveBundledVtracerPath({ cwd, platform, arch })
  const assetName = releaseAssetName({ platform, arch })
  const version = process.env.VTRACER_VERSION || (await fetchLatestReleaseTag())
  const tmpDir = join(cwd, '.tmp')
  const archivePath = join(tmpDir, assetName)
  const extractDir = join(tmpDir, `vtracer-${platform}-${arch}`)
  await mkdir(tmpDir, { recursive: true })
  await mkdir(extractDir, { recursive: true })
  await download(`https://github.com/visioncortex/vtracer/releases/download/${version}/${assetName}`, archivePath, {
    'User-Agent': 'svg-extract-canvas-installer',
  })
  await extractTarGz(archivePath, extractDir)
  return installFromExisting(join(extractDir, basename(bundledPath)), bundledPath)
}

export async function installBundledVtracer({ cwd = PROJECT_DIR, optional = false } = {}) {
  const bundledPath = resolveBundledVtracerPath({ cwd })
  try {
    await ensureExecutable(bundledPath)
    return bundledPath
  } catch {}

  const explicit = process.env.VTRACER_BIN
  if (explicit) return installFromExisting(explicit, bundledPath)

  const fromPath = await commandPath('vtracer')
  if (fromPath) return installFromExisting(fromPath, bundledPath)

  try {
    return await installFromRelease({ cwd })
  } catch (error) {
    if (optional) {
      console.warn(`[svg-extract-canvas] Skipping bundled VTracer install: ${error.message}`)
      return null
    }
    throw error
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const optional = process.argv.includes('--optional')
  installBundledVtracer({ optional })
    .then((installedPath) => {
      if (installedPath) console.log(`[svg-extract-canvas] VTracer ready at ${installedPath}`)
    })
    .catch((error) => {
      console.error(`[svg-extract-canvas] ${error.message}`)
      process.exitCode = 1
    })
}
