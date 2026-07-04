import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempDist() {
  const root = await mkdtemp(join(tmpdir(), 'svg-extract-dist-'))
  const distDir = join(root, 'dist')
  await mkdir(join(distDir, 'assets'), { recursive: true })
  await writeFile(join(distDir, 'index.html'), '<!doctype html><div id="root"></div>')
  await writeFile(join(distDir, 'assets', 'app.js'), 'console.log("ok")')
  tempDirs.push(root)
  return distDir
}

test('resolveStaticPath serves built index and assets', async () => {
  const { resolveStaticPath } = await import('../server/canvas-server.mjs')
  const distDir = await tempDist()

  assert.equal(await resolveStaticPath({ distDir, pathname: '/' }), join(distDir, 'index.html'))
  assert.equal(await resolveStaticPath({ distDir, pathname: '/assets/app.js' }), join(distDir, 'assets', 'app.js'))
})

test('resolveStaticPath falls back to index for app routes', async () => {
  const { resolveStaticPath } = await import('../server/canvas-server.mjs')
  const distDir = await tempDist()

  assert.equal(await resolveStaticPath({ distDir, pathname: '/canvas/selection' }), join(distDir, 'index.html'))
})

test('resolveStaticPath rejects traversal outside dist', async () => {
  const { resolveStaticPath } = await import('../server/canvas-server.mjs')
  const distDir = await tempDist()

  assert.equal(await resolveStaticPath({ distDir, pathname: '/../package.json' }), null)
})

test('contentTypeForPath returns expected browser content types', async () => {
  const { contentTypeForPath } = await import('../server/canvas-server.mjs')

  assert.equal(contentTypeForPath('/tmp/index.html'), 'text/html; charset=utf-8')
  assert.equal(contentTypeForPath('/tmp/app.js'), 'text/javascript; charset=utf-8')
  assert.equal(contentTypeForPath('/tmp/style.css'), 'text/css; charset=utf-8')
  assert.equal(contentTypeForPath('/tmp/icon.svg'), 'image/svg+xml')
  assert.equal(contentTypeForPath('/tmp/icon.jpg'), 'image/jpeg')
})

test('projectFileUrl and resolveProjectFileUrl roundtrip canvas files safely', async () => {
  const { projectFileUrl, resolveProjectFileUrl } = await import('../server/canvas-server.mjs')
  const projectDir = await mkdtemp(join(tmpdir(), 'svg-extract-files-'))
  tempDirs.push(projectDir)
  const filePath = join(projectDir, 'canvas/pages/default/previews/icon.png')
  await mkdir(join(projectDir, 'canvas/pages/default/previews'), { recursive: true })
  await writeFile(filePath, 'png')

  const url = projectFileUrl({ projectDir, filePath })

  assert.equal(url, '/api/files/pages/default/previews/icon.png')
  assert.equal(await resolveProjectFileUrl({ projectDir, pathname: url }), filePath)
  assert.equal(await resolveProjectFileUrl({ projectDir, pathname: '/api/files/../package.json' }), null)
})
