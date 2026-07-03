import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { cropImage } from './crop.mjs'

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function pageWorkDir(projectDir, pageId = 'default') {
  return join(resolve(nonEmptyString(projectDir) ?? process.cwd()), 'canvas', 'pages', encodeURIComponent(pageId.replace(/^page:/, '')))
}

function projectCanvasDir(projectDir) {
  return join(resolve(nonEmptyString(projectDir) ?? process.cwd()), 'canvas')
}

function isSafeChildPath(parent, child) {
  const pathToChild = relative(parent, child)
  return pathToChild && !pathToChild.startsWith('..') && !pathToChild.includes(`..${sep}`)
}

function safeProjectPath({ projectDir, unsafePath }) {
  const root = projectCanvasDir(projectDir)
  const resolved = resolve(String(unsafePath))
  if (!isSafeChildPath(root, resolved)) throw new Error(`Refusing path outside canvas directory: ${resolved}`)
  return resolved
}

function parseDataUrl(value) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(value ?? ''))
  if (!match) return null
  return {
    mimeType: match[1] || 'application/octet-stream',
    buffer: match[2] ? Buffer.from(match[3] || '', 'base64') : Buffer.from(decodeURIComponent(match[3] || ''), 'utf8'),
  }
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'
  return '.png'
}

function safeFileStem(value, fallback = 'icon') {
  const stem = basename(nonEmptyString(value) ?? fallback, '.png')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return stem || fallback
}

function shapeBounds(shape) {
  return {
    x: finiteNumber(shape?.x),
    y: finiteNumber(shape?.y),
    width: finiteNumber(shape?.props?.w ?? shape?.asset?.w),
    height: finiteNumber(shape?.props?.h ?? shape?.asset?.h),
  }
}

function relativeBoundsFromTarget({ target, sourceBounds }) {
  const relativeBounds = target?.meta?.sourceRelativeBounds
  if (
    relativeBounds &&
    Number.isFinite(Number(relativeBounds.x)) &&
    Number.isFinite(Number(relativeBounds.y)) &&
    Number.isFinite(Number(relativeBounds.width ?? relativeBounds.w)) &&
    Number.isFinite(Number(relativeBounds.height ?? relativeBounds.h))
  ) {
    return {
      x: finiteNumber(relativeBounds.x),
      y: finiteNumber(relativeBounds.y),
      width: finiteNumber(relativeBounds.width ?? relativeBounds.w),
      height: finiteNumber(relativeBounds.height ?? relativeBounds.h),
    }
  }

  const targetBounds = shapeBounds(target)
  return {
    x: targetBounds.x - sourceBounds.x,
    y: targetBounds.y - sourceBounds.y,
    width: targetBounds.width,
    height: targetBounds.height,
  }
}

function normalizedSelectedShapeIds(selectedShapeIds) {
  if (!Array.isArray(selectedShapeIds)) return []
  return selectedShapeIds.map((id) => nonEmptyString(id)).filter(Boolean)
}

function isExtractTarget(record) {
  return record?.typeName === 'shape' && record?.meta?.svgExtractTarget === true
}

function isRejectedTarget(record) {
  return (nonEmptyString(record?.meta?.status) ?? 'manual') === 'rejected'
}

function extractTargets(snapshot, selectedShapeIds = []) {
  const selectedIds = normalizedSelectedShapeIds(selectedShapeIds)
  const selectedIdSet = new Set(selectedIds)
  const allTargets = Object.values(snapshot?.store ?? {}).filter(isExtractTarget)
  const selectedTargets = selectedIdSet.size > 0 ? allTargets.filter((record) => selectedIdSet.has(record.id)) : []
  const selectionMode = selectedTargets.length > 0 ? 'selected' : 'all'
  const candidateTargets = selectionMode === 'selected' ? selectedTargets : allTargets

  return {
    targets: candidateTargets.filter((record) => !isRejectedTarget(record)),
    selectionMode,
    selectedShapeIds: selectedIds,
  }
}

function imageShapeForTarget(snapshot, target) {
  const sourceShapeId = nonEmptyString(target?.meta?.sourceShapeId)
  if (!sourceShapeId) throw new Error(`Extract target is missing sourceShapeId: ${target?.id}`)
  const sourceShape = snapshot?.store?.[sourceShapeId]
  if (sourceShape?.typeName !== 'shape' || sourceShape?.type !== 'image') {
    throw new Error(`Bound source image not found: ${sourceShapeId}`)
  }
  const asset = snapshot?.store?.[sourceShape.props?.assetId]
  if (asset?.typeName !== 'asset' || asset?.type !== 'image') {
    throw new Error(`Bound source image is missing an image asset: ${sourceShapeId}`)
  }
  return { sourceShape, asset }
}

async function nextExtractionVersion(extractionsDir) {
  await mkdir(extractionsDir, { recursive: true })
  const entries = await readdir(extractionsDir, { withFileTypes: true })
  const maxVersion = entries
    .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map((entry) => Number(entry.name.slice(1)))
    .reduce((max, value) => Math.max(max, value), 0)
  const versionNumber = maxVersion + 1
  return {
    versionNumber,
    version: `v${String(versionNumber).padStart(3, '0')}`,
  }
}

async function materializeAsset({ projectDir, pageId, sourceShape, asset }) {
  const src = nonEmptyString(asset?.props?.src)
  if (!src) throw new Error(`Image asset is missing src: ${asset?.id}`)

  const dataUrl = parseDataUrl(src)
  if (!dataUrl) return safeProjectPath({ projectDir, unsafePath: src })

  const extension = extensionForMimeType(dataUrl.mimeType)
  const fileName = `${safeFileStem(asset.props?.name ?? sourceShape.id, 'source-image')}${extension}`
  const sourcePath = join(pageWorkDir(projectDir, pageId), 'assets', fileName)
  await mkdir(dirname(sourcePath), { recursive: true })
  await writeFile(sourcePath, dataUrl.buffer)
  return sourcePath
}

function targetFileName({ target, index }) {
  const label = safeFileStem(target?.meta?.label, safeFileStem(target?.id, 'target'))
  return `${String(index + 1).padStart(2, '0')}-${label}.png`
}

export async function batchExtractCrops({
  projectDir,
  pageId = 'default',
  snapshot,
  selectedShapeIds = [],
  createdAt = new Date().toISOString(),
} = {}) {
  const resolvedProjectDir = resolve(nonEmptyString(projectDir) ?? process.cwd())
  const canvasSnapshot = snapshot ?? JSON.parse(await readFile(join(pageWorkDir(resolvedProjectDir, pageId), 'svg-extract-canvas.json'), 'utf8')).snapshot
  const extractionSelection = extractTargets(canvasSnapshot, selectedShapeIds)
  const { targets } = extractionSelection
  if (targets.length === 0) {
    throw new Error(extractionSelection.selectionMode === 'selected' ? 'No extractable selected frames found' : 'No extractable frames found')
  }

  const pageDir = pageWorkDir(resolvedProjectDir, pageId)
  const extractionsDir = join(pageDir, 'extractions')
  const { version, versionNumber } = await nextExtractionVersion(extractionsDir)
  const outputDir = safeProjectPath({ projectDir: resolvedProjectDir, unsafePath: join(extractionsDir, version) })
  const cropsDir = join(outputDir, 'crops')
  const sourceCache = new Map()
  const crops = []

  for (const [index, target] of targets.entries()) {
    const { sourceShape, asset } = imageShapeForTarget(canvasSnapshot, target)
    const sourceBounds = shapeBounds(sourceShape)
    const relativeBounds = relativeBoundsFromTarget({ target, sourceBounds })
    const assetWidth = finiteNumber(asset.props?.w, sourceBounds.width)
    const assetHeight = finiteNumber(asset.props?.h, sourceBounds.height)
    const scaleX = sourceBounds.width > 0 ? assetWidth / sourceBounds.width : 1
    const scaleY = sourceBounds.height > 0 ? assetHeight / sourceBounds.height : 1

    let sourcePath = sourceCache.get(sourceShape.id)
    if (!sourcePath) {
      sourcePath = await materializeAsset({ projectDir: resolvedProjectDir, pageId, sourceShape, asset })
      sourceCache.set(sourceShape.id, sourcePath)
    }

    const crop = await cropImage({
      sourcePath,
      outputDir: cropsDir,
      fileName: targetFileName({ target, index }),
      crop: {
        x: relativeBounds.x * scaleX,
        y: relativeBounds.y * scaleY,
        width: relativeBounds.width * scaleX,
        height: relativeBounds.height * scaleY,
      },
    })

    crops.push({
      ...crop,
      sourceShapeId: sourceShape.id,
      extractBoxId: target.id,
      label: nonEmptyString(target.meta?.label) ?? '',
      status: nonEmptyString(target.meta?.status) ?? 'manual',
      sourceRelativeBounds: relativeBounds,
    })
  }

  const manifest = {
    version,
    versionNumber,
    createdAt,
    pageId,
    selectionMode: extractionSelection.selectionMode,
    selectedShapeIds: extractionSelection.selectedShapeIds,
    cropCount: crops.length,
    outputDir,
    cropsDir,
    crops,
  }
  const manifestPath = join(outputDir, 'manifest.json')
  await mkdir(outputDir, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  return { ...manifest, manifestPath }
}
