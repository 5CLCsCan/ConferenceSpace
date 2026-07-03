import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-vectorize-'))
  tempDirs.push(dir)
  return dir
}

test('vectorizeCrop reports a clear error when vtracer is missing', async () => {
  const { vectorizeCrop } = await import('../tools/vectorize.mjs')
  const dir = await tempDir()
  const cropPath = join(dir, 'crop.png')
  await writeFile(cropPath, 'not a real png')

  await assert.rejects(
    () => vectorizeCrop({ cropPath, outputDir: dir, vtracerBin: join(dir, 'missing-vtracer') }),
    /VTracer executable not found/,
  )
})

test('vectorizeCrop invokes vtracer with expected arguments', async () => {
  const { vectorizeCrop } = await import('../tools/vectorize.mjs')
  const dir = await tempDir()
  const cropPath = join(dir, 'crop.png')
  const fakeVtracer = join(dir, 'vtracer')
  await writeFile(cropPath, 'png')
  await writeFile(
    fakeVtracer,
    `#!/usr/bin/env node
const fs = require('node:fs')
const out = process.argv[process.argv.indexOf('--output') + 1]
fs.writeFileSync(out, '<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>')
fs.writeFileSync('${join(dir, 'argv.json')}', JSON.stringify(process.argv.slice(2)))
`,
    { mode: 0o755 },
  )

  const result = await vectorizeCrop({
    cropPath,
    outputDir: dir,
    fileName: 'raw.svg',
    mode: 'bw',
    settings: { filterSpeckle: 4, colorPrecision: 5, pathPrecision: 2 },
    vtracerBin: fakeVtracer,
  })
  const argv = JSON.parse(await readFile(join(dir, 'argv.json'), 'utf8'))

  assert.equal(result.rawSvgPath, join(dir, 'raw.svg'))
  assert.equal(result.stats.fileBytes > 0, true)
  assert.equal(argv.includes('--input'), true)
  assert.equal(argv.includes('--output'), true)
  assert.equal(argv.includes('--colormode'), true)
  assert.equal(argv[argv.indexOf('--colormode') + 1], 'bw')
})
