import { access, mkdir, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = dirname(MODULE_DIR)

const TRACE_PROFILES = {
  icon: {
    mode: 'spline',
    filterSpeckle: 1,
    colorPrecision: 8,
    pathPrecision: 3,
    cornerThreshold: 45,
    segmentLength: 4,
    spliceThreshold: 45,
    hierarchical: 'cutout',
  },
  logo: {
    mode: 'spline',
    filterSpeckle: 1,
    colorPrecision: 8,
    pathPrecision: 4,
    cornerThreshold: 50,
    segmentLength: 3,
    spliceThreshold: 35,
    hierarchical: 'cutout',
  },
  photo: {
    mode: 'spline',
    filterSpeckle: 4,
    colorPrecision: 6,
    pathPrecision: 2,
    hierarchical: 'stacked',
  },
}

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

function bundledVtracerPath({ cwd = PROJECT_DIR, platform = process.platform, arch = process.arch } = {}) {
  return join(cwd, 'vendor', 'vtracer', `${platform}-${arch}`, platform === 'win32' ? 'vtracer.exe' : 'vtracer')
}

async function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ['--version'], { stdio: 'ignore' })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

function traceProfile(settings = {}) {
  const profileName = typeof settings.profile === 'string' ? settings.profile : 'icon'
  return { name: TRACE_PROFILES[profileName] ? profileName : 'icon', settings: TRACE_PROFILES[profileName] ?? TRACE_PROFILES.icon }
}

export async function resolvePreferredVtracerBin({
  explicitBin,
  cwd = PROJECT_DIR,
  platform = process.platform,
  arch = process.arch,
  pathLookup = commandExists,
} = {}) {
  if (explicitBin) return explicitBin

  const bundled = bundledVtracerPath({ cwd, platform, arch })
  try {
    await access(bundled)
    return bundled
  } catch {}

  if (await pathLookup('vtracer')) return 'vtracer'
  return 'vtracer'
}

export function buildVTracerArgs({ cropPath, rawSvgPath, mode = 'color', settings = {} }) {
  const profile = traceProfile(settings).settings
  const args = [
    '--input',
    cropPath,
    '--output',
    rawSvgPath,
    '--colormode',
    mode === 'bw' ? 'bw' : 'color',
    '--mode',
    settings.mode ?? profile.mode ?? 'spline',
    '--filter_speckle',
    numberSetting(settings.filterSpeckle, profile.filterSpeckle ?? 4),
    '--color_precision',
    numberSetting(settings.colorPrecision, profile.colorPrecision ?? 6),
    '--path_precision',
    numberSetting(settings.pathPrecision, profile.pathPrecision ?? 2),
  ]

  const cornerThreshold = settings.cornerThreshold ?? profile.cornerThreshold
  if (cornerThreshold !== undefined) {
    args.push('--corner_threshold', numberSetting(cornerThreshold, 60))
  }

  const segmentLength = settings.segmentLength ?? profile.segmentLength
  if (segmentLength !== undefined) {
    args.push('--segment_length', numberSetting(segmentLength, 4))
  }

  const spliceThreshold = settings.spliceThreshold ?? profile.spliceThreshold
  if (spliceThreshold !== undefined) {
    args.push('--splice_threshold', numberSetting(spliceThreshold, 45))
  }

  if (mode !== 'bw') {
    args.push('--hierarchical', String(settings.hierarchical ?? profile.hierarchical ?? 'stacked'))
  }

  return args
}

export async function vectorizeCrop({
  cropPath,
  outputDir,
  fileName = 'raw.svg',
  mode = 'color',
  settings = {},
  vtracerBin,
} = {}) {
  if (!cropPath) throw new Error('vectorizeCrop requires cropPath')
  if (!outputDir) throw new Error('vectorizeCrop requires outputDir')

  const resolvedVtracerBin = await resolvePreferredVtracerBin({
    explicitBin: vtracerBin ?? process.env.VTRACER_BIN ?? null,
  })
  if (resolvedVtracerBin === 'vtracer' && !(await commandExists(resolvedVtracerBin))) {
    throw new Error(
      'VTracer executable not found. Run `npm run install:vtracer`, install `vtracer` globally, or set VTRACER_BIN.',
    )
  }
  if (resolvedVtracerBin.includes('/') || resolvedVtracerBin.startsWith('.')) await assertExecutable(resolvedVtracerBin)

  await mkdir(outputDir, { recursive: true })
  const rawSvgPath = join(outputDir, safeFileName(fileName))
  await run(resolvedVtracerBin, buildVTracerArgs({ cropPath, rawSvgPath, mode, settings }))
  const info = await stat(rawSvgPath)
  const profile = traceProfile(settings)

  return {
    rawSvgPath,
    stats: {
      fileBytes: info.size,
      mode: mode === 'bw' ? 'bw' : 'color',
      profile: profile.name,
    },
  }
}
