import { mkdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { isolateCropBackground, saveCleanRasterDraft } from './isolateBackground.mjs'
import { removeBackgroundWithRembg } from './rembg.mjs'
import { vectorizeCrop } from './vectorize.mjs'
import { optimizeSvg } from './optimizeSvg.mjs'
import { renderSvgPreview } from './renderPreview.mjs'

function safeStem(value, fallback = 'icon') {
  const raw = basename(String(value || fallback), extname(String(value || fallback)))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return raw || fallback
}

async function fileBytes(filePath) {
  return (await stat(filePath)).size
}

async function traceCandidate({ candidate, dirs, baseName, vtracerBin, vectorizeSettings = {} }) {
  const raw = await vectorizeCrop({
    cropPath: candidate.rasterPath,
    outputDir: dirs.raw,
    fileName: `${baseName}-${candidate.name}.raw.svg`,
    settings: vectorizeSettings,
    vtracerBin,
  })
  const optimized = await optimizeSvg({
    rawSvgPath: raw.rawSvgPath,
    outputDir: dirs.svg,
    fileName: `${baseName}-${candidate.name}.svg`,
  })
  const preview = await renderSvgPreview({
    svgPath: optimized.svgPath,
    outputDir: dirs.previews,
    fileName: `${baseName}-${candidate.name}.png`,
  })

  return {
    ...candidate,
    rawSvgPath: raw.rawSvgPath,
    svgPath: optimized.svgPath,
    previewPath: preview.previewPath,
    vectorizeStats: raw.stats,
    optimizeStats: optimized.stats,
    preview: { width: preview.width, height: preview.height },
  }
}

export async function compareCleanupPaths({
  projectDir,
  cropPath,
  outputDir,
  fileName = 'icon',
  codexDraftDataUrl,
  codexDraftImageBytes,
  rembgBin,
  rembgModel,
  vtracerBin,
  vectorizeSettings = {},
  createdAt = new Date().toISOString(),
} = {}) {
  if (!projectDir) throw new Error('compareCleanupPaths requires projectDir')
  if (!cropPath) throw new Error('compareCleanupPaths requires cropPath')
  if (!outputDir) throw new Error('compareCleanupPaths requires outputDir')

  const baseName = safeStem(fileName, 'icon')
  const dirs = {
    local: join(outputDir, 'local'),
    rembg: join(outputDir, 'rembg'),
    drafts: join(outputDir, 'drafts'),
    raw: join(outputDir, 'raw'),
    svg: join(outputDir, 'svg'),
    previews: join(outputDir, 'previews'),
  }
  await mkdir(outputDir, { recursive: true })

  const local = await isolateCropBackground({
    cropPath,
    outputDir: dirs.local,
    fileName: `${baseName}-local.png`,
    maskOutputDir: join(outputDir, 'masks'),
  })
  const candidates = [
    {
      name: 'local-isolated',
      source: 'local',
      rasterPath: local.isolatedPath,
      maskPath: local.maskPath,
      quality: local.quality,
      stats: local.stats,
    },
  ]

  const rembg = await removeBackgroundWithRembg({
    cropPath,
    outputDir: dirs.rembg,
    fileName: `${baseName}-rembg.png`,
    rembgBin,
    model: rembgModel,
  })
  if (rembg.available) {
    candidates.push({
      name: 'rembg',
      source: 'rembg',
      rasterPath: rembg.rembgPath,
      stats: rembg.stats,
    })
  } else {
    candidates.push({
      name: 'rembg',
      source: 'rembg',
      skipped: true,
      reason: rembg.reason,
      install: rembg.install,
    })
  }

  if (codexDraftDataUrl || codexDraftImageBytes) {
    const draft = await saveCleanRasterDraft({
      outputDir: dirs.drafts,
      fileName: `${baseName}-codex-draft.png`,
      dataUrl: codexDraftDataUrl,
      imageBytes: codexDraftImageBytes,
    })
    candidates.push({
      name: 'codex-draft',
      source: 'codex',
      rasterPath: draft.draftPath,
      stats: { width: draft.width, height: draft.height },
    })
  }

  const tracedCandidates = []
  for (const candidate of candidates) {
    if (candidate.skipped) {
      tracedCandidates.push(candidate)
      continue
    }
    try {
      tracedCandidates.push(await traceCandidate({ candidate, dirs, baseName, vtracerBin, vectorizeSettings }))
    } catch (error) {
      tracedCandidates.push({
        ...candidate,
        vectorizeError: String(error?.message ?? error),
      })
    }
  }

  const manifest = {
    createdAt,
    projectDir,
    cropPath,
    cropBytes: await fileBytes(cropPath),
    outputDir,
    candidates: tracedCandidates,
  }
  const manifestPath = join(outputDir, `${baseName}-cleanup-comparison.json`)
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  return {
    ...manifest,
    manifestPath,
  }
}
