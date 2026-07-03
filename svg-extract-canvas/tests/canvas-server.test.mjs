import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-canvas-'))
  tempDirs.push(dir)
  return dir
}

function requestFor({ method, url, body }) {
  const request = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : [])
  request.method = method
  request.url = url
  return request
}

function responseRecorder() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode
      this.headers = headers
    },
    end(chunk = '') {
      this.body += String(chunk)
    },
  }
}

async function callApi(handler, options) {
  const response = responseRecorder()
  const handled = await handler(requestFor(options), response)
  return { handled, statusCode: response.statusCode, body: JSON.parse(response.body) }
}

async function writePng(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .toFile(filePath)
}

test('loadCanvasSnapshot creates a default canvas snapshot', async () => {
  const { loadCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()

  const snapshot = await loadCanvasSnapshot({ projectDir })

  assert.equal(typeof snapshot.schema, 'object')
  assert.equal(snapshot.schema.schemaVersion, 2)
  assert.equal(typeof snapshot.schema.sequences, 'object')
  assert.equal(typeof snapshot.store, 'object')
})

test('saveCanvasSnapshot and loadCanvasSnapshot roundtrip canvas content', async () => {
  const { canvasFilePath, loadCanvasSnapshot, saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const snapshot = await loadCanvasSnapshot({ projectDir })

  snapshot.store['shape:test'] = {
    id: 'shape:test',
    typeName: 'shape',
    type: 'geo',
    parentId: 'page:default',
    x: 10,
    y: 20,
    rotation: 0,
    index: 'a1',
    props: { w: 100, h: 80, geo: 'rectangle' },
    meta: { svgExtractTarget: true },
  }

  await saveCanvasSnapshot({ projectDir, snapshot })
  const loaded = await loadCanvasSnapshot({ projectDir })
  const rawFile = JSON.parse(await readFile(canvasFilePath({ projectDir }), 'utf8'))

  assert.deepEqual(loaded.store['shape:test'], snapshot.store['shape:test'])
  assert.deepEqual(rawFile.snapshot.store['shape:test'], snapshot.store['shape:test'])
})

test('canvas snapshots are isolated by project directory', async () => {
  const { loadCanvasSnapshot, saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const projectA = await tempProject()
  const projectB = await tempProject()
  const snapshotA = await loadCanvasSnapshot({ projectDir: projectA })

  snapshotA.store['shape:only-a'] = {
    id: 'shape:only-a',
    typeName: 'shape',
    type: 'text',
    parentId: 'page:default',
    x: 0,
    y: 0,
    rotation: 0,
    index: 'a1',
    props: { richText: { type: 'doc', content: [] }, w: 100 },
    meta: {},
  }

  await saveCanvasSnapshot({ projectDir: projectA, snapshot: snapshotA })

  const loadedA = await loadCanvasSnapshot({ projectDir: projectA })
  const loadedB = await loadCanvasSnapshot({ projectDir: projectB })

  assert.ok(loadedA.store['shape:only-a'])
  assert.equal(loadedB.store['shape:only-a'], undefined)
})

test('POST /api/extract writes versioned crops for accepted frames', async () => {
  const { createCanvasApiHandler, saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const sourcePath = join(projectDir, 'canvas/pages/default/assets/source.png')
  await writePng(sourcePath)
  await saveCanvasSnapshot({
    projectDir,
    snapshot: {
      schema: { schemaVersion: 2, sequences: {} },
      store: {
        'asset:source': {
          id: 'asset:source',
          typeName: 'asset',
          type: 'image',
          props: { src: sourcePath, w: 20, h: 20, mimeType: 'image/png' },
        },
        'shape:image': {
          id: 'shape:image',
          typeName: 'shape',
          type: 'image',
          parentId: 'page:default',
          x: 0,
          y: 0,
          props: { assetId: 'asset:source', w: 20, h: 20 },
        },
        'shape:target': {
          id: 'shape:target',
          typeName: 'shape',
          type: 'geo',
          parentId: 'page:default',
          x: 2,
          y: 3,
          props: { geo: 'rectangle', w: 8, h: 9 },
          meta: {
            svgExtractTarget: true,
            svgExtractTargetVersion: 2,
            sourceShapeId: 'shape:image',
            sourceRelativeBounds: { x: 2, y: 3, width: 8, height: 9 },
            status: 'accepted',
            label: 'api icon',
          },
        },
      },
    },
  })
  const handler = createCanvasApiHandler({ projectDir })

  const result = await callApi(handler, { method: 'POST', url: '/api/extract', body: { pageId: 'page:default' } })

  assert.equal(result.handled, true)
  assert.equal(result.statusCode, 200)
  assert.equal(result.body.version, 'v001')
  assert.equal(result.body.cropCount, 1)
  assert.match(result.body.crops[0].cropPath, /extractions\/v001\/crops\/01-api-icon\.png$/)
})
