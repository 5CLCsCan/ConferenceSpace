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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-suggestions-'))
  tempDirs.push(dir)
  return dir
}

async function writeImage(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp({ create: { width: 24, height: 24, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .toFile(filePath)
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

async function seedCanvas(projectDir) {
  const { saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const source = join(projectDir, 'canvas/pages/default/assets/source.png')
  await writeImage(source)
  const snapshot = {
    schema: { schemaVersion: 2, sequences: {} },
    store: {
      'asset:source': { id: 'asset:source', typeName: 'asset', type: 'image', props: { src: source, w: 24, h: 24, mimeType: 'image/png' } },
      'shape:image': { id: 'shape:image', typeName: 'shape', type: 'image', parentId: 'page:default', x: 30, y: 40, props: { assetId: 'asset:source', w: 24, h: 24 } },
    },
  }
  await saveCanvasSnapshot({ projectDir, snapshot })
  return snapshot
}

test('list_canvas_images returns pasted image records', async () => {
  const projectDir = await tempProject()
  await seedCanvas(projectDir)

  const result = await callTool('list_canvas_images', { projectDir })

  assert.equal(result.images.length, 1)
  assert.equal(result.images[0].id, 'shape:image')
  assert.equal(result.images[0].bounds.x, 30)
  assert.equal(result.images[0].asset.mimeType, 'image/png')
})

test('suggest_extract_targets normalizes candidates without mutating canvas', async () => {
  const projectDir = await tempProject()
  await seedCanvas(projectDir)
  const before = await readFile(join(projectDir, 'canvas/pages/default/svg-extract-canvas.json'), 'utf8')

  const result = await callTool('suggest_extract_targets', {
    projectDir,
    suggestions: [{ sourceShapeId: 'shape:image', box: { x: 3, y: 4, w: 10, h: 11 }, label: 'search', confidence: 0.75 }],
  })
  const after = await readFile(join(projectDir, 'canvas/pages/default/svg-extract-canvas.json'), 'utf8')

  assert.equal(result.suggestions.length, 1)
  assert.equal(result.suggestions[0].label, 'search')
  assert.equal(before, after)
})

test('apply_extract_target_suggestions inserts bound suggested boxes', async () => {
  const projectDir = await tempProject()
  await seedCanvas(projectDir)

  const result = await callTool('apply_extract_target_suggestions', {
    projectDir,
    suggestions: [{ sourceShapeId: 'shape:image', box: { x: 3, y: 4, w: 10, h: 11 }, label: 'search', confidence: 0.75 }],
  })

  const snapshot = JSON.parse(await readFile(join(projectDir, 'canvas/pages/default/svg-extract-canvas.json'), 'utf8')).snapshot
  const inserted = result.shapeIds.map((id) => snapshot.store[id])

  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].meta.sourceShapeId, 'shape:image')
  assert.equal(inserted[0].meta.status, 'suggested')
  assert.equal(inserted[0].meta.label, 'search')
})

test('set_extract_target_status marks suggestions accepted or rejected', async () => {
  const projectDir = await tempProject()
  await seedCanvas(projectDir)
  const applied = await callTool('apply_extract_target_suggestions', {
    projectDir,
    suggestions: [{ sourceShapeId: 'shape:image', box: { x: 3, y: 4, w: 10, h: 11 }, label: 'search', confidence: 0.75 }],
  })

  const result = await callTool('set_extract_target_status', {
    projectDir,
    shapeIds: applied.shapeIds,
    status: 'accepted',
  })

  const snapshot = JSON.parse(await readFile(join(projectDir, 'canvas/pages/default/svg-extract-canvas.json'), 'utf8')).snapshot
  assert.deepEqual(result.updated, applied.shapeIds)
  assert.equal(snapshot.store[applied.shapeIds[0]].meta.status, 'accepted')
  assert.equal(snapshot.store[applied.shapeIds[0]].props.color, 'green')
})
