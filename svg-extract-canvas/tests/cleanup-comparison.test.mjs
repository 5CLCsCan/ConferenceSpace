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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-cleanup-'))
  tempDirs.push(dir)
  return dir
}

async function writeCrop(filePath) {
  const sharp = (await import('sharp')).default
  await mkdir(dirname(filePath), { recursive: true })
  await sharp(
    Buffer.from(
      '<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><path d="M12 4l8 14H4z" fill="#2563eb"/></svg>',
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
fs.copyFileSync(process.argv.at(-2), process.argv.at(-1))
`,
    { mode: 0o755 },
  )
}

async function writeFakeVTracer(filePath) {
  await writeFile(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs')
const out = process.argv[process.argv.indexOf('--output') + 1]
fs.writeFileSync(out, '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 4l8 14H4z" fill="#2563eb"/></svg>')
`,
    { mode: 0o755 },
  )
}

test('compareCleanupPaths writes manifest for local, rembg, and Codex draft candidates', async () => {
  const { compareCleanupPaths } = await import('../tools/compareCleanupPaths.mjs')
  const projectDir = await tempProject()
  const cropPath = join(projectDir, 'canvas/pages/default/crops/icon.png')
  const rembgBin = join(projectDir, 'fake-rembg')
  const vtracerBin = join(projectDir, 'fake-vtracer')
  const sharp = (await import('sharp')).default
  await writeCrop(cropPath)
  await writeFakeRembg(rembgBin)
  await writeFakeVTracer(vtracerBin)
  const draftPng = await sharp({
    create: { width: 24, height: 24, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: Buffer.from('<svg width="24" height="24"><circle cx="12" cy="12" r="7" fill="#2563eb"/></svg>') }])
    .png()
    .toBuffer()

  const result = await compareCleanupPaths({
    projectDir,
    cropPath,
    outputDir: join(projectDir, 'canvas/pages/default/experiments/icon'),
    fileName: 'icon',
    codexDraftDataUrl: `data:image/png;base64,${draftPng.toString('base64')}`,
    rembgBin,
    vtracerBin,
  })
  const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))

  assert.equal(result.candidates.length, 3)
  assert.deepEqual(result.candidates.map((candidate) => candidate.name), ['local-isolated', 'rembg', 'codex-draft'])
  assert.equal(manifest.candidates.length, 3)
  assert.equal(manifest.candidates.every((candidate) => candidate.svgPath && candidate.previewPath), true)
  assert.match(manifest.candidates[0].rasterPath, /local\/icon-local\.png$/)
  assert.match(manifest.candidates[1].rasterPath, /rembg\/icon-rembg\.png$/)
  assert.match(manifest.candidates[2].rasterPath, /drafts\/icon-codex-draft\.png$/)
})
