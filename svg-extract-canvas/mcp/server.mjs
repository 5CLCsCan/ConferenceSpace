import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { loadCanvasSnapshot, loadSelectionState, saveCanvasSnapshot } from '../server/canvas-server.mjs'
import { absoluteBoundsForTarget, createExtractBoxRecord } from '../src/extractBox.js'

const ERROR = {
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
}

export const TOOL_NAMES = [
  'get_svg_extract_selection',
  'export_svg_extract_crop',
  'isolate_crop_background',
  'save_clean_raster_draft',
  'vectorize_crop',
  'optimize_svg',
  'render_svg_preview',
  'insert_svg_result',
  'save_export',
  'list_canvas_images',
  'suggest_extract_targets',
  'apply_extract_target_suggestions',
  'set_extract_target_status',
]

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function projectCanvasDir(projectDir) {
  return join(resolve(nonEmptyString(projectDir) ?? process.cwd()), 'canvas')
}

function isSafeChildPath(parent, child) {
  const pathToChild = relative(parent, child)
  return pathToChild && !pathToChild.startsWith('..') && !pathToChild.includes(`..${sep}`)
}

export function safeProjectPath({ projectDir, unsafePath }) {
  const root = projectCanvasDir(projectDir)
  const resolved = resolve(String(unsafePath))
  if (!isSafeChildPath(root, resolved)) {
    throw new Error(`Refusing path outside canvas directory: ${resolved}`)
  }
  return resolved
}

function toolDefinition(name, description) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        projectDir: { type: 'string' },
      },
    },
  }
}

function listTools() {
  return {
    tools: [
      toolDefinition('get_svg_extract_selection', 'Read the current SVG extraction canvas selection.'),
      toolDefinition('export_svg_extract_crop', 'Crop a selected screenshot region into a PNG.'),
      toolDefinition('isolate_crop_background', 'Remove or flatten crop backgrounds before vectorization.'),
      toolDefinition('save_clean_raster_draft', 'Save a Codex-created clean raster draft for tracing.'),
      toolDefinition('vectorize_crop', 'Vectorize a crop into raw SVG with VTracer.'),
      toolDefinition('optimize_svg', 'Sanitize and optimize an SVG.'),
      toolDefinition('render_svg_preview', 'Render an SVG to a PNG preview.'),
      toolDefinition('insert_svg_result', 'Insert an SVG preview/result next to the source canvas object.'),
      toolDefinition('save_export', 'Copy a final SVG into the page export directory.'),
      toolDefinition('list_canvas_images', 'List pasted image shapes on the canvas.'),
      toolDefinition('suggest_extract_targets', 'Normalize Codex-proposed icon target suggestions without mutating the canvas.'),
      toolDefinition('apply_extract_target_suggestions', 'Insert Codex-proposed icon target boxes for user review.'),
      toolDefinition('set_extract_target_status', 'Mark suggested extract boxes as accepted or rejected.'),
    ],
  }
}

function jsonContent(json) {
  return { content: [{ type: 'json', json }] }
}

function textContent(text) {
  return { content: [{ type: 'text', text }] }
}

function pageWorkDir(projectDir, pageId = 'default') {
  return join(resolve(nonEmptyString(projectDir) ?? process.cwd()), 'canvas', 'pages', encodeURIComponent(pageId.replace(/^page:/, '')))
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'
  return '.png'
}

function parseDataUrl(value) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(value ?? ''))
  if (!match) return null
  const mimeType = match[1] || 'application/octet-stream'
  const payload = match[3] || ''
  return {
    mimeType,
    buffer: match[2] ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8'),
  }
}

function shapeBounds(shape) {
  return {
    x: finiteNumber(shape?.x),
    y: finiteNumber(shape?.y),
    width: finiteNumber(shape?.props?.w ?? shape?.asset?.w),
    height: finiteNumber(shape?.props?.h ?? shape?.asset?.h),
  }
}

function intersectBounds(a, b) {
  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

function isImageSelectionShape(shape) {
  return Boolean(shape?.asset?.src && (shape.type === 'image' || shape.asset.type === 'image'))
}

function selectedExtractBoxes(selection) {
  return selection.selectedShapes.filter((shape) => {
    if (shape?.isSvgExtractTarget !== true && shape?.meta?.svgExtractTarget !== true) return false
    const status = nonEmptyString(shape?.meta?.status) ?? 'manual'
    return status === 'manual' || status === 'accepted'
  })
}

function canvasImageShapeRecords(snapshot) {
  return Object.values(snapshot?.store ?? {}).filter((record) => record?.typeName === 'shape' && record?.type === 'image')
}

function assetRecordForImageShape(snapshot, imageShape) {
  return snapshot?.store?.[imageShape?.props?.assetId] ?? null
}

function selectionShapeFromCanvas(snapshot, imageShape) {
  const asset = assetRecordForImageShape(snapshot, imageShape)
  return {
    id: imageShape.id,
    type: imageShape.type,
    parentId: imageShape.parentId ?? null,
    x: imageShape.x ?? null,
    y: imageShape.y ?? null,
    rotation: imageShape.rotation ?? null,
    props: imageShape.props ?? null,
    meta: imageShape.meta ?? null,
    isSvgExtractTarget: imageShape?.meta?.svgExtractTarget === true,
    asset: asset
      ? {
          id: asset.id,
          type: asset.type,
          name: asset.props?.name ?? null,
          src: asset.props?.src ?? null,
          w: asset.props?.w ?? null,
          h: asset.props?.h ?? null,
          mimeType: asset.props?.mimeType ?? null,
        }
      : null,
  }
}

function inferImageShapeFromCanvas({ selection, snapshot, extractBox }) {
  const overlappingImages = canvasImageShapeRecords(snapshot)
    .map((shape) => selectionShapeFromCanvas(snapshot, shape))
    .filter((shape) => {
      if (!isImageSelectionShape(shape)) return false
      const overlap = intersectBounds(shapeBounds(shape), shapeBounds(extractBox))
      return overlap.width > 0 && overlap.height > 0
    })

  if (overlappingImages.length !== 1) {
    throw new Error(`Expected exactly one overlapping image in canvas, found ${overlappingImages.length}`)
  }
  return overlappingImages[0]
}

function imageShapeFromSelectionOrCanvas({ selection, snapshot, shapeId }) {
  const record = snapshot?.store?.[shapeId]
  if (record?.typeName === 'shape' && record?.type === 'image') {
    return selectionShapeFromCanvas(snapshot, record)
  }
  const selected = selection.selectedShapes.find((shape) => shape?.id === shapeId && isImageSelectionShape(shape))
  if (selected) return selected
  if (!record || record.typeName !== 'shape' || record.type !== 'image') {
    throw new Error(`Bound source image not found: ${shapeId}`)
  }
}

function imageShapeForExtractBox({ selection, snapshot, extractBox }) {
  const sourceShapeId = nonEmptyString(extractBox?.meta?.sourceShapeId)
  if (sourceShapeId) return imageShapeFromSelectionOrCanvas({ selection, snapshot, shapeId: sourceShapeId })

  const version = Number(extractBox?.meta?.svgExtractTargetVersion ?? 1)
  if (version <= 1) return inferImageShapeFromCanvas({ selection, snapshot, extractBox })

  throw new Error(`Extract box is missing bound sourceShapeId: ${extractBox?.id}`)
}

function extractBoxBoundsForImage({ extractBox, imageBounds }) {
  const relativeBounds = extractBox?.meta?.sourceRelativeBounds
  if (
    relativeBounds &&
    Number.isFinite(Number(relativeBounds.x)) &&
    Number.isFinite(Number(relativeBounds.y)) &&
    Number.isFinite(Number(relativeBounds.width ?? relativeBounds.w)) &&
    Number.isFinite(Number(relativeBounds.height ?? relativeBounds.h))
  ) {
    return absoluteBoundsForTarget({ sourceBounds: imageBounds, sourceRelativeBounds: relativeBounds })
  }
  return shapeBounds(extractBox)
}

async function materializeSelectionAsset({ projectDir, imageShape, pageId = 'default' }) {
  const src = nonEmptyString(imageShape?.asset?.src)
  if (!src) throw new Error('Selected image is missing asset source')

  const dataUrl = parseDataUrl(src)
  if (!dataUrl) {
    const resolved = resolve(src)
    safeProjectPath({ projectDir, unsafePath: resolved })
    return resolved
  }

  const assetsDir = join(pageWorkDir(projectDir, pageId), 'assets')
  const extension = extensionForMimeType(dataUrl.mimeType)
  const fileName = normalizeFileName(`${imageShape.id || 'selected-image'}${extension}`, `selected-image${extension}`)
  const sourcePath = join(assetsDir, fileName)
  await mkdir(dirname(sourcePath), { recursive: true })
  await writeFile(sourcePath, dataUrl.buffer)
  return sourcePath
}

async function exportCropFromSelection(args = {}) {
  const { cropImage } = await import('../tools/crop.mjs')
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const pageId = nonEmptyString(args.pageId) ?? 'default'
  const outputDir = nonEmptyString(args.outputDir) ?? join(pageWorkDir(projectDir, pageId), 'crops')
  safeProjectPath({ projectDir, unsafePath: outputDir })

  const selection = await loadSelectionState({ projectDir })
  const extractBoxes = selectedExtractBoxes(selection)
  if (extractBoxes.length === 0) throw new Error('Expected at least one selected extract box, found 0')
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const sourceCache = new Map()

  const crops = []
  for (const [index, extractBox] of extractBoxes.entries()) {
    const imageShape = imageShapeForExtractBox({ selection, snapshot, extractBox })
    const imageBounds = shapeBounds(imageShape)
    const assetWidth = finiteNumber(imageShape.asset?.w, imageBounds.width)
    const assetHeight = finiteNumber(imageShape.asset?.h, imageBounds.height)
    const scaleX = imageBounds.width > 0 ? assetWidth / imageBounds.width : 1
    const scaleY = imageBounds.height > 0 ? assetHeight / imageBounds.height : 1
    let sourcePath = sourceCache.get(imageShape.id)
    if (!sourcePath) {
      sourcePath = await materializeSelectionAsset({ projectDir, imageShape, pageId })
      sourceCache.set(imageShape.id, sourcePath)
    }
    const boxBounds = extractBoxBoundsForImage({ extractBox, imageBounds })
    const overlap = intersectBounds(imageBounds, boxBounds)
    if (overlap.width <= 0 || overlap.height <= 0) {
      throw new Error(`Selected extract box does not overlap the selected image: ${extractBox.id}`)
    }

    const crop = await cropImage({
      sourcePath,
      outputDir,
      fileName:
        extractBoxes.length === 1
          ? nonEmptyString(args.fileName) ?? 'selected-crop.png'
          : `${index + 1}-${normalizeFileName(nonEmptyString(args.fileName), 'selected-crop.png')}`,
      crop: {
        x: (overlap.x - imageBounds.x) * scaleX,
        y: (overlap.y - imageBounds.y) * scaleY,
        width: overlap.width * scaleX,
        height: overlap.height * scaleY,
      },
    })
    crops.push({
      ...crop,
      sourceShapeId: imageShape.id,
      extractBoxId: extractBox.id,
    })
  }

  return crops.length === 1 ? crops[0] : { crops }
}

async function callTool(name, args = {}) {
  switch (name) {
    case 'get_svg_extract_selection':
      return jsonContent(await loadSelectionState({ projectDir: args.projectDir }))
    case 'export_svg_extract_crop': {
      const { cropImage } = await import('../tools/crop.mjs')
      if (!args.sourcePath && !args.crop) return jsonContent(await exportCropFromSelection(args))
      const safeArgs = { ...args }
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await cropImage(safeArgs))
    }
    case 'isolate_crop_background': {
      const { isolateCropBackground } = await import('../tools/isolateBackground.mjs')
      const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
      const pageId = nonEmptyString(args.pageId) ?? 'default'
      const safeArgs = { ...args }
      if (args.cropPath) safeProjectPath({ projectDir, unsafePath: args.cropPath })
      safeArgs.outputDir = safeProjectPath({
        projectDir,
        unsafePath: nonEmptyString(args.outputDir) ?? join(pageWorkDir(projectDir, pageId), 'isolated'),
      })
      if (args.maskOutputDir) safeArgs.maskOutputDir = safeProjectPath({ projectDir, unsafePath: args.maskOutputDir })
      return jsonContent(await isolateCropBackground(safeArgs))
    }
    case 'save_clean_raster_draft': {
      const { saveCleanRasterDraft } = await import('../tools/isolateBackground.mjs')
      const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
      const pageId = nonEmptyString(args.pageId) ?? 'default'
      const safeArgs = {
        ...args,
        outputDir: safeProjectPath({
          projectDir,
          unsafePath: nonEmptyString(args.outputDir) ?? join(pageWorkDir(projectDir, pageId), 'drafts'),
        }),
      }
      if (args.sourceCropPath) safeProjectPath({ projectDir, unsafePath: args.sourceCropPath })
      return jsonContent(await saveCleanRasterDraft(safeArgs))
    }
    case 'vectorize_crop': {
      const { vectorizeCrop } = await import('../tools/vectorize.mjs')
      const safeArgs = { ...args }
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await vectorizeCrop(safeArgs))
    }
    case 'optimize_svg': {
      const { optimizeSvg } = await import('../tools/optimizeSvg.mjs')
      const safeArgs = { ...args }
      if (args.rawSvgPath) safeProjectPath({ projectDir: args.projectDir, unsafePath: args.rawSvgPath })
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await optimizeSvg(safeArgs))
    }
    case 'render_svg_preview': {
      const { renderSvgPreview } = await import('../tools/renderPreview.mjs')
      const safeArgs = { ...args }
      if (args.svgPath) safeProjectPath({ projectDir: args.projectDir, unsafePath: args.svgPath })
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await renderSvgPreview(safeArgs))
    }
    case 'insert_svg_result':
      return jsonContent(await insertSvgResult(args))
    case 'save_export':
      return jsonContent(await saveExport(args))
    case 'list_canvas_images':
      return jsonContent(await listCanvasImages(args))
    case 'suggest_extract_targets':
      return jsonContent(await suggestExtractTargets(args))
    case 'apply_extract_target_suggestions':
      return jsonContent(await applyExtractTargetSuggestions(args))
    case 'set_extract_target_status':
      return jsonContent(await setExtractTargetStatus(args))
    default:
      throw Object.assign(new Error(`Unknown tool: ${name}`), { code: ERROR.METHOD_NOT_FOUND })
  }
}

function extractTargetColorForStatus(status) {
  if (status === 'suggested') return 'orange'
  if (status === 'accepted') return 'green'
  if (status === 'rejected') return 'grey'
  return 'blue'
}

function normalizeFileName(fileName, fallback) {
  const raw = basename(nonEmptyString(fileName) ?? fallback)
  const extension = extname(raw) || extname(fallback)
  const base = raw
    .slice(0, raw.length - extname(raw).length)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'export'}${extension}`
}

export async function saveExport(args = {}) {
  if (!nonEmptyString(args.svgPath)) throw new Error('save_export requires svgPath')
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const pageId = nonEmptyString(args.pageId) ?? 'default'
  const exportDir = join(projectDir, 'canvas', 'pages', encodeURIComponent(pageId.replace(/^page:/, '')), 'exports')
  const fileName = normalizeFileName(args.fileName, 'export.svg')
  const outputPath = join(exportDir, fileName)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, await readFile(args.svgPath))
  return { svgPath: outputPath, fileName }
}

export async function insertSvgResult(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const shapeId = `shape:svg-result-${Date.now()}`
  snapshot.store[shapeId] = {
    id: shapeId,
    typeName: 'shape',
    type: 'text',
    parentId: nonEmptyString(args.parentId) ?? 'page:default',
    x: Number.isFinite(args.x) ? args.x : 0,
    y: Number.isFinite(args.y) ? args.y : 0,
    rotation: 0,
    index: `a${Date.now()}`,
    props: {
      richText: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'SVG result ready' }] }],
      },
      w: 240,
    },
    meta: {
      svgExtractResult: true,
      svgPath: nonEmptyString(args.svgPath),
      previewPath: nonEmptyString(args.previewPath),
      sourceShapeId: nonEmptyString(args.sourceShapeId),
    },
  }
  await saveCanvasSnapshot({ projectDir, snapshot })
  return { shapeId, snapshotPath: 'canvas/pages/default/svg-extract-canvas.json' }
}

export async function listCanvasImages(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const snapshot = await loadCanvasSnapshot({ projectDir })
  return {
    images: canvasImageShapeRecords(snapshot).map((record) => {
      const shape = selectionShapeFromCanvas(snapshot, record)
      return {
        id: shape.id,
        pageId: shape.parentId ?? 'page:default',
        bounds: shapeBounds(shape),
        asset: shape.asset,
      }
    }),
  }
}

function normalizeSuggestion({ suggestion, imageShape }) {
  const box = suggestion?.box ?? {}
  const width = finiteNumber(box.w ?? box.width)
  const height = finiteNumber(box.h ?? box.height)
  if (width <= 0 || height <= 0) throw new Error('Suggestion box must have positive width and height')
  return {
    sourceShapeId: imageShape.id,
    box: {
      x: finiteNumber(box.x),
      y: finiteNumber(box.y),
      w: width,
      h: height,
    },
    label: nonEmptyString(suggestion?.label) ?? '',
    confidence: Math.max(0, Math.min(1, finiteNumber(suggestion?.confidence, 0))),
  }
}

export async function suggestExtractTargets(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const images = new Map(canvasImageShapeRecords(snapshot).map((record) => [record.id, selectionShapeFromCanvas(snapshot, record)]))
  const requestedIds = Array.isArray(args.imageShapeIds) ? new Set(args.imageShapeIds.map(String)) : null
  const candidates = Array.isArray(args.suggestions) ? args.suggestions : []

  const suggestions = candidates
    .filter((suggestion) => !requestedIds || requestedIds.has(String(suggestion?.sourceShapeId)))
    .map((suggestion) => {
      const imageShape = images.get(String(suggestion?.sourceShapeId))
      if (!imageShape) throw new Error(`Suggestion references missing source image: ${suggestion?.sourceShapeId}`)
      return normalizeSuggestion({ suggestion, imageShape })
    })

  return { suggestions }
}

export async function applyExtractTargetSuggestions(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const pageId = nonEmptyString(args.pageId) ?? 'page:default'
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const normalized = await suggestExtractTargets(args)
  const images = new Map(canvasImageShapeRecords(snapshot).map((record) => [record.id, selectionShapeFromCanvas(snapshot, record)]))
  const shapeIds = []

  normalized.suggestions.forEach((suggestion, index) => {
    const imageShape = images.get(suggestion.sourceShapeId)
    const imageBounds = shapeBounds(imageShape)
    const shapeId = `shape:svg-suggestion-${Date.now()}-${index}`
    snapshot.store[shapeId] = {
      ...createExtractBoxRecord({
        id: shapeId,
        parentId: imageShape.parentId ?? pageId,
        x: imageBounds.x + suggestion.box.x,
        y: imageBounds.y + suggestion.box.y,
        w: suggestion.box.w,
        h: suggestion.box.h,
        sourceShapeId: suggestion.sourceShapeId,
        sourceBounds: imageBounds,
        sourceRelativeBounds: suggestion.box,
        status: 'suggested',
        label: suggestion.label,
        confidence: suggestion.confidence,
      }),
      typeName: 'shape',
    }
    shapeIds.push(shapeId)
  })

  await saveCanvasSnapshot({ projectDir, snapshot })
  return { shapeIds, suggestions: normalized.suggestions }
}

export async function setExtractTargetStatus(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const status = nonEmptyString(args.status)
  if (!['suggested', 'accepted', 'rejected', 'manual'].includes(status)) {
    throw new Error('set_extract_target_status requires status suggested, accepted, rejected, or manual')
  }
  const shapeIds = Array.isArray(args.shapeIds) ? args.shapeIds.map(String) : [String(args.shapeId ?? '')]
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const updated = []

  for (const shapeId of shapeIds.filter(Boolean)) {
    const shape = snapshot.store[shapeId]
    if (!shape?.meta?.svgExtractTarget) throw new Error(`Extract target not found: ${shapeId}`)
    shape.meta = { ...shape.meta, status }
    shape.props = { ...shape.props, color: extractTargetColorForStatus(status) }
    updated.push(shapeId)
  }

  await saveCanvasSnapshot({ projectDir, snapshot })
  return { updated, status }
}

export async function handleJsonRpcRequest(message) {
  try {
    if (message.method === 'initialize') {
      return { jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', serverInfo: { name: 'SVG Extract Canvas MCP', version: '0.1.0' }, capabilities: { tools: {} } } }
    }
    if (message.method === 'tools/list') {
      return { jsonrpc: '2.0', id: message.id, result: listTools() }
    }
    if (message.method === 'tools/call') {
      const name = nonEmptyString(message.params?.name)
      if (!name) throw Object.assign(new Error('tools/call requires params.name'), { code: ERROR.INVALID_PARAMS })
      const result = await callTool(name, message.params?.arguments ?? {})
      return { jsonrpc: '2.0', id: message.id, result }
    }
    return { jsonrpc: '2.0', id: message.id, error: { code: ERROR.METHOD_NOT_FOUND, message: `Unknown method: ${message.method}` } }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: error?.code ?? ERROR.INTERNAL_ERROR,
        message: String(error?.message ?? error),
      },
    }
  }
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

export function startStdioServer() {
  const rl = readline.createInterface({ input: process.stdin })
  rl.on('line', async (line) => {
    if (!line.trim()) return
    writeMessage(await handleJsonRpcRequest(JSON.parse(line)))
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startStdioServer()
}
