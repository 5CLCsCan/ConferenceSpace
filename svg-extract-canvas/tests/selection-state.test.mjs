import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-selection-'))
  tempDirs.push(dir)
  return dir
}

test('selection state persists selected image metadata', async () => {
  const { loadSelectionState, saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const selection = {
    selectedShapes: [
      {
        id: 'shape:image',
        type: 'image',
        props: { assetId: 'asset:image', w: 320, h: 240 },
        asset: { id: 'asset:image', src: '/page-assets/default/source.png', mimeType: 'image/png' },
      },
    ],
    updatedAt: '2026-07-03T00:00:00.000Z',
  }

  await saveSelectionState({ projectDir, selection })
  const loaded = await loadSelectionState({ projectDir })

  assert.deepEqual(loaded, selection)
})

test('selection state persists selected crop target metadata', async () => {
  const { loadSelectionState, saveSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()
  const selection = {
    selectedShapes: [
      {
        id: 'shape:crop',
        type: 'geo',
        x: 10,
        y: 12,
        props: { geo: 'rectangle', w: 64, h: 64 },
        meta: { svgExtractTarget: true, svgExtractLabel: 'settings icon' },
        isSvgExtractTarget: true,
      },
    ],
    updatedAt: '2026-07-03T00:00:01.000Z',
  }

  await saveSelectionState({ projectDir, selection })
  const loaded = await loadSelectionState({ projectDir })

  assert.equal(loaded.selectedShapes[0].isSvgExtractTarget, true)
  assert.equal(loaded.selectedShapes[0].meta.svgExtractLabel, 'settings icon')
})

test('missing selection state returns an empty selection payload', async () => {
  const { loadSelectionState } = await import('../server/canvas-server.mjs')
  const projectDir = await tempProject()

  const loaded = await loadSelectionState({ projectDir })

  assert.deepEqual(loaded, { selectedShapes: [], updatedAt: null })
})
