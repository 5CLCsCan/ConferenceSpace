import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-e2e-'))
  tempDirs.push(dir)
  return dir
}

async function copySimpleIconFixture(filePath) {
  await mkdir(dirname(filePath), { recursive: true })
  const fixture = new URL('../../fixtures/simple-icon.png', import.meta.url)
  await writeFile(filePath, await readFile(fixture))
}

async function writeFakeVTracer(filePath) {
  await writeFile(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs')
const out = process.argv[process.argv.indexOf('--output') + 1]
fs.writeFileSync(out, '<svg width="32" height="32" viewBox="0 0 32 32"><path d="M16 6a10 10 0 1 0 0.1 0z" fill="#111"/></svg>')
`,
    { mode: 0o755 },
  )
}

async function callTool(name, args) {
  const { handleJsonRpcRequest } = await import('../../mcp/server.mjs')
  const response = await handleJsonRpcRequest({
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1_000_000),
    method: 'tools/call',
    params: { name, arguments: args },
  })
  if (response.error) throw new Error(response.error.message)
  return response.result.content[0].json
}

test('full SVG extraction flow crops, vectorizes, optimizes, previews, and inserts result', async () => {
  const projectDir = await tempProject()
  const canvasPageDir = join(projectDir, 'canvas/pages/default')
  const sourcePath = join(canvasPageDir, 'assets/simple-icon.png')
  const vtracerBin = join(projectDir, 'fake-vtracer')
  await copySimpleIconFixture(sourcePath)
  await writeFakeVTracer(vtracerBin)

  const crop = await callTool('export_svg_extract_crop', {
    projectDir,
    sourcePath,
    outputDir: join(canvasPageDir, 'crops'),
    fileName: 'simple-icon-crop.png',
    crop: { x: 0, y: 0, width: 32, height: 32 },
  })
  const raw = await callTool('vectorize_crop', {
    projectDir,
    cropPath: crop.cropPath,
    outputDir: join(canvasPageDir, 'raw'),
    fileName: 'simple-icon-raw.svg',
    mode: 'color',
    vtracerBin,
  })
  const optimized = await callTool('optimize_svg', {
    projectDir,
    rawSvgPath: raw.rawSvgPath,
    outputDir: join(canvasPageDir, 'exports'),
    fileName: 'simple-icon.svg',
  })
  const preview = await callTool('render_svg_preview', {
    projectDir,
    svgPath: optimized.svgPath,
    outputDir: join(canvasPageDir, 'previews'),
    fileName: 'simple-icon.png',
  })
  const insertion = await callTool('insert_svg_result', {
    projectDir,
    svgPath: optimized.svgPath,
    previewPath: preview.previewPath,
    sourceShapeId: 'shape:source',
  })

  const svg = await readFile(optimized.svgPath, 'utf8')
  const previewBytes = await readFile(preview.previewPath)

  assert.match(svg, /viewBox=/)
  assert.doesNotMatch(svg, /<script/i)
  assert.equal(previewBytes.subarray(1, 4).toString('ascii'), 'PNG')
  assert.match(insertion.shapeId, /^shape:svg-result-/)
})

test('clean icon flow isolates background before vectorization', async () => {
  const projectDir = await tempProject()
  const canvasPageDir = join(projectDir, 'canvas/pages/default')
  const sourcePath = join(canvasPageDir, 'assets/simple-icon.png')
  const vtracerBin = join(projectDir, 'fake-vtracer')
  const sharp = (await import('sharp')).default
  await mkdir(dirname(sourcePath), { recursive: true })
  await sharp(
    Buffer.from(
      '<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#fff"/><circle cx="16" cy="16" r="9" fill="#111"/></svg>',
    ),
  )
    .png()
    .toFile(sourcePath)
  await writeFakeVTracer(vtracerBin)

  const crop = await callTool('export_svg_extract_crop', {
    projectDir,
    sourcePath,
    outputDir: join(canvasPageDir, 'crops'),
    fileName: 'simple-icon-crop.png',
    crop: { x: 0, y: 0, width: 32, height: 32 },
  })
  const isolated = await callTool('isolate_crop_background', {
    projectDir,
    cropPath: crop.cropPath,
    outputDir: join(canvasPageDir, 'isolated'),
    fileName: 'simple-icon-isolated.png',
  })
  const raw = await callTool('vectorize_crop', {
    projectDir,
    cropPath: isolated.isolatedPath,
    outputDir: join(canvasPageDir, 'raw'),
    fileName: 'simple-icon-isolated-raw.svg',
    vtracerBin,
  })

  assert.equal(isolated.quality.recommendedAction, 'trace-isolated')
  assert.match(raw.rawSvgPath, /raw\/simple-icon-isolated-raw\.svg$/)
})

test('noisy icon flow can save a clean raster draft before tracing', async () => {
  const projectDir = await tempProject()
  const canvasPageDir = join(projectDir, 'canvas/pages/default')
  const cropPath = join(canvasPageDir, 'crops/noisy.png')
  const vtracerBin = join(projectDir, 'fake-vtracer')
  const sharp = (await import('sharp')).default
  await mkdir(dirname(cropPath), { recursive: true })
  await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 128, g: 128, b: 128, alpha: 1 } } })
    .png()
    .toFile(cropPath)
  await writeFakeVTracer(vtracerBin)
  const draftPng = await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .png()
    .toBuffer()

  const isolated = await callTool('isolate_crop_background', {
    projectDir,
    cropPath,
    outputDir: join(canvasPageDir, 'isolated'),
    fileName: 'noisy-isolated.png',
  })
  const draft = await callTool('save_clean_raster_draft', {
    projectDir,
    outputDir: join(canvasPageDir, 'drafts'),
    fileName: 'noisy-clean.png',
    dataUrl: `data:image/png;base64,${draftPng.toString('base64')}`,
  })
  const raw = await callTool('vectorize_crop', {
    projectDir,
    cropPath: draft.draftPath,
    outputDir: join(canvasPageDir, 'raw'),
    fileName: 'noisy-clean-raw.svg',
    vtracerBin,
  })

  assert.equal(isolated.quality.recommendedAction, 'recreate-then-trace')
  assert.match(draft.draftPath, /drafts\/noisy-clean\.png$/)
  assert.match(raw.rawSvgPath, /raw\/noisy-clean-raw\.svg$/)
})

test('multi-image suggestion flow extracts only accepted targets', async () => {
  const { saveCanvasSnapshot, saveSelectionState } = await import('../../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const canvasPageDir = join(projectDir, 'canvas/pages/default')
  const sourceA = join(canvasPageDir, 'assets/a.png')
  const sourceB = join(canvasPageDir, 'assets/b.png')
  await copySimpleIconFixture(sourceA)
  await copySimpleIconFixture(sourceB)
  await saveCanvasSnapshot({
    projectDir,
    snapshot: {
      schema: { schemaVersion: 2, sequences: {} },
      store: {
        'asset:a': { id: 'asset:a', typeName: 'asset', type: 'image', props: { src: sourceA, w: 32, h: 32, mimeType: 'image/png' } },
        'asset:b': { id: 'asset:b', typeName: 'asset', type: 'image', props: { src: sourceB, w: 32, h: 32, mimeType: 'image/png' } },
        'shape:image-a': { id: 'shape:image-a', typeName: 'shape', type: 'image', parentId: 'page:default', x: 0, y: 0, props: { assetId: 'asset:a', w: 32, h: 32 } },
        'shape:image-b': { id: 'shape:image-b', typeName: 'shape', type: 'image', parentId: 'page:default', x: 64, y: 0, props: { assetId: 'asset:b', w: 32, h: 32 } },
      },
    },
  })
  const applied = await callTool('apply_extract_target_suggestions', {
    projectDir,
    suggestions: [
      { sourceShapeId: 'shape:image-a', box: { x: 4, y: 4, w: 16, h: 16 }, label: 'accepted', confidence: 0.9 },
      { sourceShapeId: 'shape:image-b', box: { x: 4, y: 4, w: 16, h: 16 }, label: 'rejected', confidence: 0.9 },
    ],
  })
  await callTool('set_extract_target_status', { projectDir, shapeId: applied.shapeIds[0], status: 'accepted' })
  await callTool('set_extract_target_status', { projectDir, shapeId: applied.shapeIds[1], status: 'rejected' })
  const snapshot = JSON.parse(await readFile(join(canvasPageDir, 'svg-extract-canvas.json'), 'utf8')).snapshot
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: applied.shapeIds.map((id) => snapshot.store[id]),
      updatedAt: new Date().toISOString(),
    },
  })

  const result = await callTool('export_svg_extract_crop', {
    projectDir,
    outputDir: join(canvasPageDir, 'crops'),
    fileName: 'accepted.png',
  })

  assert.equal(result.sourceShapeId, 'shape:image-a')
  assert.equal(result.extractBoxId, applied.shapeIds[0])
})
