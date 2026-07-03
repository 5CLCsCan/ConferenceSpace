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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-e2e-'))
  tempDirs.push(dir)
  return dir
}

async function copySimpleIconFixture(filePath) {
  await mkdir(dirname(filePath), { recursive: true })
  const fixture = new URL('../../fixtures/simple-icon.png', import.meta.url)
  await writeFile(filePath, await readFile(fixture))
}

async function writeFakeVTracer(filePath) {
  await writeFile(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs')
const out = process.argv[process.argv.indexOf('--output') + 1]
fs.writeFileSync(out, '<svg width="32" height="32" viewBox="0 0 32 32"><path d="M16 6a10 10 0 1 0 0.1 0z" fill="#111"/></svg>')
`,
    { mode: 0o755 },
  )
}

async function callTool(name, args) {
  const { handleJsonRpcRequest } = await import('../../mcp/server.mjs')
  const response = await handleJsonRpcRequest({
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1_000_000),
    method: 'tools/call',
    params: { name, arguments: args },
  })
  if (response.error) throw new Error(response.error.message)
  return response.result.content[0].json
}

test('full SVG extraction flow crops, vectorizes, optimizes, previews, and inserts result', async () => {
  const projectDir = await tempProject()
  const canvasPageDir = join(projectDir, 'canvas/pages/default')
  const sourcePath = join(canvasPageDir, 'assets/simple-icon.png')
  const vtracerBin = join(projectDir, 'fake-vtracer')
  await copySimpleIconFixture(sourcePath)
  await writeFakeVTracer(vtracerBin)

  const crop = await callTool('export_svg_extract_crop', {
    projectDir,
    sourcePath,
    outputDir: join(canvasPageDir, 'crops'),
    fileName: 'simple-icon-crop.png',
    crop: { x: 0, y: 0, width: 32, height: 32 },
  })
  const raw = await callTool('vectorize_crop', {
    projectDir,
    cropPath: crop.cropPath,
    outputDir: join(canvasPageDir, 'raw'),
    fileName: 'simple-icon-raw.svg',
    mode: 'color',
    vtracerBin,
  })
  const optimized = await callTool('optimize_svg', {
    projectDir,
    rawSvgPath: raw.rawSvgPath,
    outputDir: join(canvasPageDir, 'exports'),
    fileName: 'simple-icon.svg',
  })
  const preview = await callTool('render_svg_preview', {
    projectDir,
    svgPath: optimized.svgPath,
    outputDir: join(canvasPageDir, 'previews'),
    fileName: 'simple-icon.png',
  })
  const insertion = await callTool('insert_svg_result', {
    projectDir,
    svgPath: optimized.svgPath,
    previewPath: preview.previewPath,
    sourceShapeId: 'shape:source',
  })

  const svg = await readFile(optimized.svgPath, 'utf8')
  const previewBytes = await readFile(preview.previewPath)

  assert.match(svg, /viewBox=/)
  assert.doesNotMatch(svg, /<script/i)
  assert.equal(previewBytes.subarray(1, 4).toString('ascii'), 'PNG')
  assert.match(insertion.shapeId, /^shape:svg-result-/)
})
