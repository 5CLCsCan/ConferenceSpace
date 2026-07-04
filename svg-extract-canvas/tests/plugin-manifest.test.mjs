import assert from 'node:assert/strict'
import { access, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'

const root = new URL('..', import.meta.url)
const path = (...parts) => join(root.pathname, ...parts)

async function assertFile(filePath) {
  const info = await stat(filePath)
  assert.equal(info.isFile(), true, `${filePath} should be a file`)
}

async function assertExecutable(filePath) {
  await assertFile(filePath)
  await access(filePath)
}

test('plugin manifest exposes the SVG extraction plugin', async () => {
  const manifest = JSON.parse(await readFile(path('.codex-plugin/plugin.json'), 'utf8'))

  assert.equal(manifest.name, 'svg-extract-canvas')
  assert.equal(manifest.version, '0.1.0')
  assert.equal(manifest.skills, './skills/')
  assert.equal(manifest.mcpServers, './.mcp.json')
  assert.equal(manifest.interface.displayName, 'SVG Extract Canvas')
})

test('MCP configuration points at the local MCP start script', async () => {
  const mcpConfig = JSON.parse(await readFile(path('.mcp.json'), 'utf8'))
  const server = mcpConfig.mcpServers.svg_extract_canvas

  assert.equal(server.command, 'bash')
  assert.deepEqual(server.args, ['./scripts/start-mcp.sh'])
  assert.equal(server.cwd, '.')
})

test('required plugin entrypoint files exist', async () => {
  await Promise.all([
    assertFile(path('package.json')),
    assertFile(path('vite.config.js')),
    assertFile(path('index.html')),
    assertFile(path('src/main.jsx')),
    assertFile(path('src/App.jsx')),
    assertFile(path('scripts/install-vtracer.mjs')),
    assertExecutable(path('scripts/start-canvas.sh')),
    assertExecutable(path('scripts/start-mcp.sh')),
  ])
})

test('required Codex skills exist', async () => {
  await Promise.all([
    assertFile(path('skills/svg-extract-open-canvas/SKILL.md')),
    assertFile(path('skills/svg-extract-icon/SKILL.md')),
    assertFile(path('skills/svg-extract-refine/SKILL.md')),
    assertFile(path('skills/svg-extract-export/SKILL.md')),
    assertFile(path('skills/svg-extract-suggest-targets/SKILL.md')),
    assertFile(path('skills/svg-extract-compare-cleanup-paths/SKILL.md')),
  ])
})
