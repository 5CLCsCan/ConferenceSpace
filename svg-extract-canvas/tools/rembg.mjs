import { access, mkdir, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { spawn } from 'node:child_process'

const INSTALL_HINT = 'Install rembg with `pip install "rembg[cpu,cli]"`, or pass rembgBin to a local executable.'

function safeFileName(value, fallback = 'rembg.png') {
  return basename(String(value || fallback)).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback
}

async function executableExists(command) {
  if (command.includes('/') || command.startsWith('.')) {
    try {
      await access(command)
      return true
    } catch {
      return false
    }
  }

  return new Promise((resolve) => {
    const child = spawn(command, ['--version'], { stdio: 'ignore' })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`rembg failed with exit code ${code}: ${stderr || stdout}`))
    })
  })
}

async function pngStats(filePath) {
  const sharp = (await import('sharp')).default
  const image = sharp(filePath).ensureAlpha()
  const metadata = await image.metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const pixels = await image.raw().toBuffer()
  let transparentPixels = 0
  let partialAlphaPixels = 0

  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] < 16) transparentPixels += 1
    else if (pixels[offset] < 250) partialAlphaPixels += 1
  }

  return {
    width,
    height,
    hasAlpha: true,
    transparentPixelRatio: width > 0 && height > 0 ? transparentPixels / (width * height) : 0,
    partialAlphaPixelRatio: width > 0 && height > 0 ? partialAlphaPixels / (width * height) : 0,
  }
}

export function buildRembgArgs({ cropPath, rembgPath, model } = {}) {
  const args = ['i']
  if (model) args.push('-m', String(model))
  args.push(cropPath, rembgPath)
  return args
}

export async function removeBackgroundWithRembg({
  cropPath,
  outputDir,
  fileName = 'rembg.png',
  rembgBin,
  model,
} = {}) {
  if (!cropPath) throw new Error('removeBackgroundWithRembg requires cropPath')
  if (!outputDir) throw new Error('removeBackgroundWithRembg requires outputDir')

  const command = rembgBin || process.env.REMBG_BIN || 'rembg'
  if (!(await executableExists(command))) {
    return {
      available: false,
      skipped: true,
      reason: `rembg executable not found: ${command}`,
      install: INSTALL_HINT,
    }
  }

  await mkdir(outputDir, { recursive: true })
  const rembgPath = join(outputDir, safeFileName(fileName))
  await run(command, buildRembgArgs({ cropPath, rembgPath, model }))
  const info = await stat(rembgPath)

  return {
    available: true,
    skipped: false,
    rembgPath,
    stats: {
      ...(await pngStats(rembgPath)),
      fileBytes: info.size,
      model: model || null,
    },
  }
}
