import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, test } from 'node:test'

const tempDirs = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), 'svg-extract-mcp-'))
  tempDirs.push(dir)
  return dir
}

test('MCP tools/list returns the SVG extraction tool surface', async () => {
  const { handleJsonRpcRequest } = await import('../mcp/server.mjs')
  const response = await handleJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  const names = response.result.tools.map((tool) => tool.name)

  assert.deepEqual(names, [
    'get_svg_extract_selection',
    'export_svg_extract_crop',
    'isolate_crop_background',
    'save_clean_raster_draft',
    'vectorize_crop',
    'optimize_svg',
    'render_svg_preview',
    'insert_svg_result',
    'save_export',
    'list_canvas_images',
    'suggest_extract_targets',
    'apply_extract_target_suggestions',
    'set_extract_target_status',
  ])
})

test('MCP tools/call rejects unknown tools', async () => {
  const { handleJsonRpcRequest } = await import('../mcp/server.mjs')
  const response = await handleJsonRpcRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'missing_tool', arguments: {} },
  })

  assert.equal(response.error.code, -32601)
  assert.match(response.error.message, /Unknown tool/)
})

test('safeProjectPath rejects paths outside the project canvas directory', async () => {
  const { safeProjectPath } = await import('../mcp/server.mjs')
  const projectDir = await tempProject()

  assert.throws(() => safeProjectPath({ projectDir, unsafePath: '/tmp/outside.svg' }), /outside canvas/)
})

test('get_svg_extract_selection returns persisted selection state', async () => {
  const { saveSelectionState } = await import('../server/canvas-server.mjs')
  const { handleJsonRpcRequest } = await import('../mcp/server.mjs')
  const projectDir = await tempProject()
  await saveSelectionState({
    projectDir,
    selection: {
      selectedShapes: [{ id: 'shape:crop', meta: { svgExtractTarget: true } }],
      updatedAt: '2026-07-03T00:00:00.000Z',
    },
  })

  const response = await handleJsonRpcRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_svg_extract_selection',
      arguments: { projectDir },
    },
  })

  assert.equal(response.result.content[0].type, 'json')
  assert.equal(response.result.content[0].json.selectedShapes[0].id, 'shape:crop')
})
