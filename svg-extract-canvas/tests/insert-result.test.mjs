import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-insert-'))
  tempDirs.push(dir)
  return dir
}

test('renderSvgPreview renders a PNG preview for a safe SVG', async () => {
  const { renderSvgPreview } = await import('../tools/renderPreview.mjs')
  const projectDir = await tempProject()
  const svgPath = join(projectDir, 'icon.svg')
  await writeFile(svgPath, '<svg viewBox="0 0 10 10"><path d="M0 0h10v10z" fill="#000"/></svg>')

  const result = await renderSvgPreview({ svgPath, outputDir: join(projectDir, 'previews') })
  const bytes = await readFile(result.previewPath)

  assert.equal(result.width, 10)
  assert.equal(result.height, 10)
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG')
})

test('insertSvgResult records result metadata without removing existing shapes', async () => {
  const { loadCanvasSnapshot, saveCanvasSnapshot } = await import('../server/canvas-server.mjs')
  const { insertSvgResult } = await import('../mcp/server.mjs')
  const projectDir = await tempProject()
  const snapshot = await loadCanvasSnapshot({ projectDir })
  snapshot.store['shape:source'] = {
    id: 'shape:source',
    typeName: 'shape',
    type: 'image',
    parentId: 'page:default',
    x: 20,
    y: 30,
    rotation: 0,
    index: 'a1',
    props: { w: 100, h: 80, assetId: 'asset:source' },
    meta: {},
  }
  await saveCanvasSnapshot({ projectDir, snapshot })

  const result = await insertSvgResult({
    projectDir,
    sourceShapeId: 'shape:source',
    svgPath: join(projectDir, 'canvas/pages/default/exports/icon.svg'),
    previewPath: join(projectDir, 'canvas/pages/default/previews/icon.png'),
    x: 160,
    y: 30,
  })
  const loaded = await loadCanvasSnapshot({ projectDir })

  assert.ok(loaded.store['shape:source'])
  assert.equal(loaded.store[result.shapeId].meta.svgExtractResult, true)
  assert.equal(loaded.store[result.shapeId].meta.sourceShapeId, 'shape:source')
})
