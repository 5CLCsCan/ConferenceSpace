import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
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
