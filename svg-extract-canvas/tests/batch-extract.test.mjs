import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-batch-'))
  tempDirs.push(dir)
  return dir
}

async function writeSourceImage(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp({ create: { width: 40, height: 40, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([
      {
        input: Buffer.from(
          '<svg width="40" height="40" viewBox="0 0 40 40"><rect x="4" y="4" width="8" height="8" fill="#f00"/><rect x="20" y="20" width="10" height="10" fill="#00f"/></svg>',
        ),
      },
    ])
    .png()
    .toFile(filePath)
}

function target({ id, x, y, width, height, sourceShapeId = 'shape:image', status = 'accepted', label = id }) {
  return {
    id,
    typeName: 'shape',
    type: 'geo',
    parentId: 'page:default',
    x,
    y,
    props: { geo: 'rectangle', w: width, h: height },
    meta: {
      svgExtractTarget: true,
      svgExtractTargetVersion: 2,
      sourceShapeId,
      status,
      label,
      sourceRelativeBounds: { x: x - 10, y: y - 20, width, height },
    },
  }
}

async function seedCanvas(projectDir) {
  const { saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const sourcePath = join(projectDir, 'canvas/pages/default/assets/source.png')
  await writeSourceImage(sourcePath)
  await saveCanvasSnapshot({
    projectDir,
    snapshot: {
      schema: { schemaVersion: 2, sequences: {} },
      store: {
        'asset:source': {
          id: 'asset:source',
          typeName: 'asset',
          type: 'image',
          props: { src: sourcePath, w: 40, h: 40, mimeType: 'image/png' },
        },
        'shape:image': {
          id: 'shape:image',
          typeName: 'shape',
          type: 'image',
          parentId: 'page:default',
          x: 10,
          y: 20,
          props: { assetId: 'asset:source', w: 80, h: 80 },
        },
        'shape:accepted': target({ id: 'shape:accepted', x: 18, y: 28, width: 16, height: 16, label: 'red icon' }),
        'shape:manual': target({ id: 'shape:manual', x: 50, y: 60, width: 20, height: 20, status: 'manual', label: 'blue icon' }),
        'shape:suggested': target({ id: 'shape:suggested', x: 12, y: 22, width: 8, height: 8, status: 'suggested' }),
        'shape:rejected': target({ id: 'shape:rejected', x: 12, y: 22, width: 8, height: 8, status: 'rejected' }),
      },
    },
  })
}

test('batchExtractCrops writes versioned crop folder and manifest', async () => {
  const { batchExtractCrops } = await import('../tools/batchExtract.mjs')
  const projectDir = await tempProject()
  await seedCanvas(projectDir)

  const first = await batchExtractCrops({ projectDir, createdAt: '2026-07-03T00:00:00.000Z' })
  const second = await batchExtractCrops({ projectDir, createdAt: '2026-07-03T00:01:00.000Z' })

  assert.equal(first.version, 'v001')
  assert.equal(second.version, 'v002')
  assert.match(first.outputDir, /canvas\/pages\/default\/extractions\/v001$/)
  assert.match(first.cropsDir, /canvas\/pages\/default\/extractions\/v001\/crops$/)
  assert.match(first.manifestPath, /canvas\/pages\/default\/extractions\/v001\/manifest\.json$/)
  assert.equal(first.cropCount, 3)
  assert.deepEqual(first.crops.map((crop) => crop.status).sort(), ['accepted', 'manual', 'suggested'])
  assert.deepEqual(first.crops.map((crop) => crop.label).sort(), ['blue icon', 'red icon', 'shape:suggested'])
  assert.deepEqual(first.crops.map((crop) => crop.sourceRelativeBounds.x), [8, 40, 2])
  assert.deepEqual(first.crops.map((crop) => crop.crop.width), [8, 10, 4])

  const manifest = JSON.parse(await readFile(first.manifestPath, 'utf8'))
  const cropBytes = await readFile(first.crops[0].cropPath)

  assert.equal(manifest.version, 'v001')
  assert.equal(manifest.cropCount, 3)
  assert.equal(cropBytes.subarray(1, 4).toString('ascii'), 'PNG')
})

test('batchExtractCrops rejects a canvas without extractable targets', async () => {
  const { batchExtractCrops } = await import('../tools/batchExtract.mjs')
  const { saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  await saveCanvasSnapshot({
    projectDir,
    snapshot: { schema: { schemaVersion: 2, sequences: {} }, store: {} },
  })

  await assert.rejects(() => batchExtractCrops({ projectDir }), /No extractable frames/)
})
