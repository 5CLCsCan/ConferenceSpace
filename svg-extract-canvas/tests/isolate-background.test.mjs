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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-isolate-'))
  tempDirs.push(dir)
  return dir
}

async function writeCleanIcon(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#fff"/>
    <circle cx="16" cy="16" r="9" fill="#111"/>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(filePath)
}

async function writeNoisyCrop(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  const pixels = Buffer.alloc(32 * 32 * 4)
  for (let i = 0; i < 32 * 32; i += 1) {
    const value = i % 2 === 0 ? 118 : 136
    pixels[i * 4] = value
    pixels[i * 4 + 1] = value
    pixels[i * 4 + 2] = value
    pixels[i * 4 + 3] = 255
  }
  await sharp(pixels, { raw: { width: 32, height: 32, channels: 4 } }).png().toFile(filePath)
}

test('isolateCropBackground writes transparent output for a clean icon', async () => {
  const { isolateCropBackground } = await import('../tools/isolateBackground.mjs')
  const projectDir = await tempProject()
  const cropPath = join(projectDir, 'canvas/pages/default/crops/icon.png')
  const outputDir = join(projectDir, 'canvas/pages/default/isolated')
  await writeCleanIcon(cropPath)

  const result = await isolateCropBackground({ cropPath, outputDir, fileName: 'icon.png' })
  const metadata = await (await import('sharp')).default(result.isolatedPath).metadata()

  assert.equal(metadata.hasAlpha, true)
  assert.equal(result.quality.recommendedAction, 'trace-isolated')
  assert.equal(result.stats.hasTransparentBackground, true)
  assert.match(result.maskPath, /masks\/icon-mask\.png$/)
})

test('isolateCropBackground recommends recreation for noisy low-confidence crops', async () => {
  const { isolateCropBackground } = await import('../tools/isolateBackground.mjs')
  const projectDir = await tempProject()
  const cropPath = join(projectDir, 'canvas/pages/default/crops/noisy.png')
  const outputDir = join(projectDir, 'canvas/pages/default/isolated')
  await writeNoisyCrop(cropPath)

  const result = await isolateCropBackground({ cropPath, outputDir, fileName: 'noisy.png' })

  assert.equal(result.quality.recommendedAction, 'recreate-then-trace')
})

test('saveCleanRasterDraft writes a Codex-created transparent PNG draft', async () => {
  const { saveCleanRasterDraft } = await import('../tools/isolateBackground.mjs')
  const projectDir = await tempProject()
  const sharp = (await import('sharp')).default
  const png = await sharp({
    create: { width: 8, height: 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .png()
    .toBuffer()

  const result = await saveCleanRasterDraft({
    outputDir: join(projectDir, 'canvas/pages/default/drafts'),
    fileName: 'draft.png',
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
  })

  assert.equal((await readFile(result.draftPath)).subarray(1, 4).toString('ascii'), 'PNG')
  assert.equal(result.width, 8)
  assert.equal(result.height, 8)
})
