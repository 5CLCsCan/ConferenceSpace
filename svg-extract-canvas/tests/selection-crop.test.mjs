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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-selection-crop-'))
  tempDirs.push(dir)
  return dir
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

async function simpleIconDataUrl() {
  const fixture = new URL('../fixtures/simple-icon.png', import.meta.url)
  const bytes = await readFile(fixture)
  return `data:image/png;base64,${bytes.toString('base64')}`
}

test('export_svg_extract_crop crops from selected pasted image and extract box', async () => {
  const { saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [
        {
          id: 'shape:image',
          type: 'image',
          x: 10,
          y: 20,
          props: { w: 64, h: 64 },
          asset: {
            id: 'asset:image',
            type: 'image',
            mimeType: 'image/png',
            w: 32,
            h: 32,
            src: await simpleIconDataUrl(),
          },
        },
        {
          id: 'shape:extract',
          type: 'geo',
          x: 26,
          y: 36,
          props: { w: 16, h: 16 },
          meta: { svgExtractTarget: true },
          isSvgExtractTarget: true,
        },
      ],
      updatedAt: '2026-07-03T00:00:00.000Z',
    },
  })

  const crop = await callTool('export_svg_extract_crop', {
    projectDir,
    fileName: 'from-selection.png',
  })

  assert.equal(crop.width, 8)
  assert.equal(crop.height, 8)
  assert.equal(crop.crop.x, 8)
  assert.equal(crop.crop.y, 8)
  assert.match(crop.cropPath, /canvas\/pages\/default\/crops\/from-selection\.png$/)
})

test('export_svg_extract_crop rejects ambiguous selections', async () => {
  const { saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [{ id: 'shape:extract', meta: { svgExtractTarget: true }, isSvgExtractTarget: true }],
      updatedAt: '2026-07-03T00:00:00.000Z',
    },
  })

  await assert.rejects(
    () => callTool('export_svg_extract_crop', { projectDir }),
    /Expected exactly one selected image/,
  )
})
