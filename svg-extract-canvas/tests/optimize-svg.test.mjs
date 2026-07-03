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
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-optimize-'))
  tempDirs.push(dir)
  return dir
}

test('optimizeSvg rejects scripts and external references', async () => {
  const { optimizeSvg } = await import('../tools/optimizeSvg.mjs')
  const dir = await tempDir()
  const rawSvgPath = join(dir, 'unsafe.svg')
  await writeFile(rawSvgPath, '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>')

  await assert.rejects(() => optimizeSvg({ rawSvgPath, outputDir: dir }), /script/i)
})

test('optimizeSvg writes safe optimized SVG with viewBox and stats', async () => {
  const { optimizeSvg } = await import('../tools/optimizeSvg.mjs')
  const dir = await tempDir()
  const rawSvgPath = join(dir, 'raw.svg')
  await writeFile(
    rawSvgPath,
    '<svg width="10" height="10" viewBox="0 0 10 10"><metadata>x</metadata><path d="M0 0h10v10z"/></svg>',
  )

  const result = await optimizeSvg({ rawSvgPath, outputDir: dir, fileName: 'clean.svg' })
  const svg = await readFile(result.svgPath, 'utf8')

  assert.match(svg, /viewBox=/)
  assert.doesNotMatch(svg, /metadata/)
  assert.equal(result.stats.pathCount, 1)
  assert.equal(result.stats.fileBytes > 0, true)
})
