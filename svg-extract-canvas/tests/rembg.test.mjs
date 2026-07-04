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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-rembg-'))
  tempDirs.push(dir)
  return dir
}

async function writeCrop(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp(
    Buffer.from(
      '<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="#fff"/><circle cx="8" cy="8" r="5" fill="#111"/></svg>',
    ),
  )
    .png()
    .toFile(filePath)
}

async function writeFakeRembg(filePath) {
  await writeFile(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs')
const output = process.argv.at(-1)
fs.copyFileSync(process.argv.at(-2), output)
`,
    { mode: 0o755 },
  )
}

test('removeBackgroundWithRembg returns install guidance when rembg is missing', async () => {
  const { removeBackgroundWithRembg } = await import('../tools/rembg.mjs')
  const projectDir = await tempProject()
  const cropPath = join(projectDir, 'canvas/pages/default/crops/icon.png')
  await writeCrop(cropPath)

  const result = await removeBackgroundWithRembg({
    cropPath,
    outputDir: join(projectDir, 'canvas/pages/default/rembg'),
    rembgBin: join(projectDir, 'missing-rembg'),
  })

  assert.equal(result.available, false)
  assert.equal(result.skipped, true)
  assert.match(result.reason, /rembg executable not found/)
  assert.match(result.install, /pip install/)
})

test('removeBackgroundWithRembg writes transparent PNG with fake CLI', async () => {
  const { removeBackgroundWithRembg } = await import('../tools/rembg.mjs')
  const projectDir = await tempProject()
  const cropPath = join(projectDir, 'canvas/pages/default/crops/icon.png')
  const rembgBin = join(projectDir, 'fake-rembg')
  await writeCrop(cropPath)
  await writeFakeRembg(rembgBin)

  const result = await removeBackgroundWithRembg({
    cropPath,
    outputDir: join(projectDir, 'canvas/pages/default/rembg'),
    fileName: 'icon-rembg.png',
    rembgBin,
  })

  const bytes = await readFile(result.rembgPath)

  assert.equal(result.available, true)
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG')
  assert.match(result.rembgPath, /rembg\/icon-rembg\.png$/)
  assert.equal(result.stats.hasAlpha, true)
  assert.equal(result.stats.width, 16)
  assert.equal(result.stats.height, 16)
})
