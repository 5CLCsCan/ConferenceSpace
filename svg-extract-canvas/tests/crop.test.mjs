import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-crop-'))
  tempDirs.push(dir)
  return dir
}

async function writeFixturePng(filePath) {
  const sharp = (await import('sharp')).default
  await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(filePath)
}

test('cropImage writes a clamped PNG crop', async () => {
  const { cropImage } = await import('../tools/crop.mjs')
  const dir = await tempDir()
  const sourcePath = join(dir, 'source.png')
  await writeFixturePng(sourcePath)

  const result = await cropImage({
    sourcePath,
    outputDir: join(dir, 'crops'),
    fileName: 'icon.png',
    crop: { x: 8, y: 8, width: 10, height: 10 },
  })

  assert.equal(result.width, 2)
  assert.equal(result.height, 2)
  assert.match(result.cropPath, /icon\.png$/)
})

test('cropImage rejects empty crops after clamping', async () => {
  const { cropImage } = await import('../tools/crop.mjs')
  const dir = await tempDir()
  const sourcePath = join(dir, 'source.png')
  await writeFixturePng(sourcePath)

  await assert.rejects(
    () =>
      cropImage({
        sourcePath,
        outputDir: join(dir, 'crops'),
        crop: { x: 20, y: 20, width: 4, height: 4 },
      }),
    /empty crop/i,
  )
})
