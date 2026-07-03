import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-bound-'))
  tempDirs.push(dir)
  return dir
}

async function writePng(filePath, color) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp({ create: { width: 20, height: 20, channels: 4, background: color } }).png().toFile(filePath)
}

function snapshotWithTwoImages({ sourceA, sourceB }) {
  return {
    schema: { schemaVersion: 2, sequences: {} },
    store: {
      'asset:a': { id: 'asset:a', typeName: 'asset', type: 'image', props: { src: sourceA, w: 20, h: 20, mimeType: 'image/png' } },
      'asset:b': { id: 'asset:b', typeName: 'asset', type: 'image', props: { src: sourceB, w: 20, h: 20, mimeType: 'image/png' } },
      'shape:image-a': { id: 'shape:image-a', typeName: 'shape', type: 'image', x: 0, y: 0, props: { assetId: 'asset:a', w: 20, h: 20 } },
      'shape:image-b': { id: 'shape:image-b', typeName: 'shape', type: 'image', x: 100, y: 0, props: { assetId: 'asset:b', w: 20, h: 20 } },
    },
  }
}

async function callTool(name, args) {
  const { handleJsonRpcRequest } = await import('../mcp/server.mjs')
  const response = await handleJsonRpcRequest({
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1_000_000),
    method: 'tools/call',
    params: { name, arguments: args },
  })
  if (response.error) throw new Error(response.error.message)
  return response.result.content[0].json
}

test('createExtractBoxRecord writes bound v2 metadata', async () => {
  const { createExtractBoxRecord } = await import('../src/extractBox.js')

  const box = createExtractBoxRecord({
    id: 'shape:box',
    x: 14,
    y: 25,
    w: 8,
    h: 9,
    sourceShapeId: 'shape:image',
    sourceShape: { id: 'shape:image', type: 'image', x: 10, y: 20, props: { w: 40, h: 40 } },
    label: 'settings',
  })

  assert.equal(box.meta.svgExtractTarget, true)
  assert.equal(box.meta.svgExtractTargetVersion, 2)
  assert.equal(box.meta.sourceShapeId, 'shape:image')
  assert.equal(box.meta.status, 'manual')
  assert.equal(box.meta.label, 'settings')
  assert.equal(box.meta.confidence, 1)
  assert.deepEqual(box.meta.sourceRelativeBounds, { x: 4, y: 5, width: 8, height: 9 })
  assert.deepEqual(box.meta.sourceLastBounds, { x: 10, y: 20, width: 40, height: 40 })
})

test('export_svg_extract_crop ignores generic rectangles', async () => {
  const { saveCanvasSnapshot, saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const sourceA = join(projectDir, 'canvas/pages/default/assets/a.png')
  const sourceB = join(projectDir, 'canvas/pages/default/assets/b.png')
  await writePng(sourceA, { r: 255, g: 0, b: 0, alpha: 1 })
  await writePng(sourceB, { r: 0, g: 0, b: 255, alpha: 1 })
  await saveCanvasSnapshot({ projectDir, snapshot: snapshotWithTwoImages({ sourceA, sourceB }) })
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [{ id: 'shape:plain', type: 'geo', x: 0, y: 0, props: { geo: 'rectangle', w: 10, h: 10 } }],
      updatedAt: new Date().toISOString(),
    },
  })

  await assert.rejects(() => callTool('export_svg_extract_crop', { projectDir }), /at least one selected extract box/)
})

test('export_svg_extract_crop batches bound frames across multiple source images', async () => {
  const { saveCanvasSnapshot, saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const sourceA = join(projectDir, 'canvas/pages/default/assets/a.png')
  const sourceB = join(projectDir, 'canvas/pages/default/assets/b.png')
  await writePng(sourceA, { r: 255, g: 0, b: 0, alpha: 1 })
  await writePng(sourceB, { r: 0, g: 0, b: 255, alpha: 1 })
  await saveCanvasSnapshot({ projectDir, snapshot: snapshotWithTwoImages({ sourceA, sourceB }) })
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [
        { id: 'shape:box-a', type: 'geo', x: 2, y: 2, props: { geo: 'rectangle', w: 8, h: 8 }, meta: { svgExtractTarget: true, svgExtractTargetVersion: 2, sourceShapeId: 'shape:image-a', status: 'manual' } },
        { id: 'shape:box-b', type: 'geo', x: 104, y: 4, props: { geo: 'rectangle', w: 8, h: 8 }, meta: { svgExtractTarget: true, svgExtractTargetVersion: 2, sourceShapeId: 'shape:image-b', status: 'accepted' } },
        { id: 'shape:box-suggested', type: 'geo', x: 112, y: 4, props: { geo: 'rectangle', w: 4, h: 4 }, meta: { svgExtractTarget: true, svgExtractTargetVersion: 2, sourceShapeId: 'shape:image-b', status: 'suggested' } },
      ],
      updatedAt: new Date().toISOString(),
    },
  })

  const result = await callTool('export_svg_extract_crop', {
    projectDir,
    outputDir: join(projectDir, 'canvas/pages/default/crops'),
    fileName: 'icon.png',
  })

  assert.equal(result.crops.length, 2)
  assert.deepEqual(result.crops.map((crop) => crop.sourceShapeId).sort(), ['shape:image-a', 'shape:image-b'])
})

test('export_svg_extract_crop uses image-relative bounds after source image moves', async () => {
  const { saveCanvasSnapshot, saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const sourceA = join(projectDir, 'canvas/pages/default/assets/a.png')
  const sourceB = join(projectDir, 'canvas/pages/default/assets/b.png')
  await writePng(sourceA, { r: 255, g: 0, b: 0, alpha: 1 })
  await writePng(sourceB, { r: 0, g: 0, b: 255, alpha: 1 })
  const snapshot = snapshotWithTwoImages({ sourceA, sourceB })
  snapshot.store['shape:image-a'].x = 100
  snapshot.store['shape:image-a'].y = 100
  await saveCanvasSnapshot({ projectDir, snapshot })
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [
        {
          id: 'shape:box-a',
          type: 'geo',
          x: 2,
          y: 3,
          props: { geo: 'rectangle', w: 4, h: 5 },
          meta: {
            svgExtractTarget: true,
            svgExtractTargetVersion: 2,
            sourceShapeId: 'shape:image-a',
            sourceRelativeBounds: { x: 2, y: 3, width: 4, height: 5 },
            status: 'manual',
          },
          isSvgExtractTarget: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    },
  })

  const crop = await callTool('export_svg_extract_crop', {
    projectDir,
    outputDir: join(projectDir, 'canvas/pages/default/crops'),
    fileName: 'moved-image.png',
  })

  assert.equal(crop.sourceShapeId, 'shape:image-a')
  assert.equal(crop.crop.x, 2)
  assert.equal(crop.crop.y, 3)
  assert.equal(crop.width, 4)
  assert.equal(crop.height, 5)
})
