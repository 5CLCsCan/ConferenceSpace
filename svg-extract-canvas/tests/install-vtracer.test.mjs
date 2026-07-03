import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-install-vtracer-'))
  tempDirs.push(dir)
  return dir
}

test('resolveBundledVtracerPath points at the project-local binary location', async () => {
  const { resolveBundledVtracerPath } = await import('../scripts/install-vtracer.mjs')
  const resolved = resolveBundledVtracerPath({ platform: 'darwin', arch: 'arm64' })

  assert.match(resolved, /vendor\/vtracer\/darwin-arm64\/vtracer$/)
})

test('resolvePreferredVtracerBin prefers the bundled binary when present', async () => {
  const { resolvePreferredVtracerBin } = await import('../tools/vectorize.mjs')
  const dir = await tempDir()
  const bundled = join(dir, 'vendor/vtracer/darwin-arm64/vtracer')
  await mkdir(join(dir, 'vendor/vtracer/darwin-arm64'), { recursive: true })
  await writeFile(bundled, '#!/bin/sh\n', { mode: 0o755 })

  const resolved = await resolvePreferredVtracerBin({
    cwd: dir,
    platform: 'darwin',
    arch: 'arm64',
    pathLookup: async () => null,
  })

  assert.equal(resolved, bundled)
})
