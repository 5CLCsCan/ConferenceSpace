import { access, mkdir, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { spawn } from 'node:child_process'

function safeFileName(value, fallback = 'raw.svg') {
  return basename(String(value || fallback)).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback
}

function numberSetting(value, fallback) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : String(fallback)
}

async function assertExecutable(path) {
  try {
    await access(path)
  } catch {
    throw new Error(`VTracer executable not found: ${path}. Install vtracer and pass vtracerBin if needed.`)
  }
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
      else reject(new Error(`vtracer failed with exit code ${code}: ${stderr || stdout}`))
    })
  })
}

export function buildVTracerArgs({ cropPath, rawSvgPath, mode = 'color', settings = {} }) {
  const args = [
    '--input',
    cropPath,
    '--output',
    rawSvgPath,
    '--colormode',
    mode === 'bw' ? 'bw' : 'color',
    '--mode',
    settings.mode ?? 'spline',
    '--filter_speckle',
    numberSetting(settings.filterSpeckle, 4),
    '--color_precision',
    numberSetting(settings.colorPrecision, 6),
    '--path_precision',
    numberSetting(settings.pathPrecision, 2),
  ]
  if (settings.cornerThreshold !== undefined) {
    args.push('--corner_threshold', numberSetting(settings.cornerThreshold, 60))
  }
  return args
}

export async function vectorizeCrop({
  cropPath,
  outputDir,
  fileName = 'raw.svg',
  mode = 'color',
  settings = {},
  vtracerBin = process.env.VTRACER_BIN ?? 'vtracer',
} = {}) {
  if (!cropPath) throw new Error('vectorizeCrop requires cropPath')
  if (!outputDir) throw new Error('vectorizeCrop requires outputDir')
  if (vtracerBin.includes('/') || vtracerBin.startsWith('.')) await assertExecutable(vtracerBin)

  await mkdir(outputDir, { recursive: true })
  const rawSvgPath = join(outputDir, safeFileName(fileName))
  await run(vtracerBin, buildVTracerArgs({ cropPath, rawSvgPath, mode, settings }))
  const info = await stat(rawSvgPath)

  return {
    rawSvgPath,
    stats: {
      fileBytes: info.size,
      mode: mode === 'bw' ? 'bw' : 'color',
    },
  }
}
