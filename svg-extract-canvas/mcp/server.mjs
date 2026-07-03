import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { loadCanvasSnapshot, loadSelectionState, saveCanvasSnapshot } from '../server/canvas-server.mjs'

const ERROR = {
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
}

export const TOOL_NAMES = [
  'get_svg_extract_selection',
  'export_svg_extract_crop',
  'vectorize_crop',
  'optimize_svg',
  'render_svg_preview',
  'insert_svg_result',
  'save_export',
]

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function projectCanvasDir(projectDir) {
  return join(resolve(nonEmptyString(projectDir) ?? process.cwd()), 'canvas')
}

function isSafeChildPath(parent, child) {
  const pathToChild = relative(parent, child)
  return pathToChild && !pathToChild.startsWith('..') && !pathToChild.includes(`..${sep}`)
}

export function safeProjectPath({ projectDir, unsafePath }) {
  const root = projectCanvasDir(projectDir)
  const resolved = resolve(String(unsafePath))
  if (!isSafeChildPath(root, resolved)) {
    throw new Error(`Refusing path outside canvas directory: ${resolved}`)
  }
  return resolved
}

function toolDefinition(name, description) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        projectDir: { type: 'string' },
      },
    },
  }
}

function listTools() {
  return {
    tools: [
      toolDefinition('get_svg_extract_selection', 'Read the current SVG extraction canvas selection.'),
      toolDefinition('export_svg_extract_crop', 'Crop a selected screenshot region into a PNG.'),
      toolDefinition('vectorize_crop', 'Vectorize a crop into raw SVG with VTracer.'),
      toolDefinition('optimize_svg', 'Sanitize and optimize an SVG.'),
      toolDefinition('render_svg_preview', 'Render an SVG to a PNG preview.'),
      toolDefinition('insert_svg_result', 'Insert an SVG preview/result next to the source canvas object.'),
      toolDefinition('save_export', 'Copy a final SVG into the page export directory.'),
    ],
  }
}

function jsonContent(json) {
  return { content: [{ type: 'json', json }] }
}

function textContent(text) {
  return { content: [{ type: 'text', text }] }
}

async function callTool(name, args = {}) {
  switch (name) {
    case 'get_svg_extract_selection':
      return jsonContent(await loadSelectionState({ projectDir: args.projectDir }))
    case 'export_svg_extract_crop': {
      const { cropImage } = await import('../tools/crop.mjs')
      const safeArgs = { ...args }
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await cropImage(safeArgs))
    }
    case 'vectorize_crop': {
      const { vectorizeCrop } = await import('../tools/vectorize.mjs')
      const safeArgs = { ...args }
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await vectorizeCrop(safeArgs))
    }
    case 'optimize_svg': {
      const { optimizeSvg } = await import('../tools/optimizeSvg.mjs')
      const safeArgs = { ...args }
      if (args.rawSvgPath) safeProjectPath({ projectDir: args.projectDir, unsafePath: args.rawSvgPath })
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await optimizeSvg(safeArgs))
    }
    case 'render_svg_preview': {
      const { renderSvgPreview } = await import('../tools/renderPreview.mjs')
      const safeArgs = { ...args }
      if (args.svgPath) safeProjectPath({ projectDir: args.projectDir, unsafePath: args.svgPath })
      if (args.outputDir) safeArgs.outputDir = safeProjectPath({ projectDir: args.projectDir, unsafePath: args.outputDir })
      return jsonContent(await renderSvgPreview(safeArgs))
    }
    case 'insert_svg_result':
      return jsonContent(await insertSvgResult(args))
    case 'save_export':
      return jsonContent(await saveExport(args))
    default:
      throw Object.assign(new Error(`Unknown tool: ${name}`), { code: ERROR.METHOD_NOT_FOUND })
  }
}

function normalizeFileName(fileName, fallback) {
  const raw = basename(nonEmptyString(fileName) ?? fallback)
  const extension = extname(raw) || extname(fallback)
  const base = raw
    .slice(0, raw.length - extname(raw).length)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'export'}${extension}`
}

export async function saveExport(args = {}) {
  if (!nonEmptyString(args.svgPath)) throw new Error('save_export requires svgPath')
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const pageId = nonEmptyString(args.pageId) ?? 'default'
  const exportDir = join(projectDir, 'canvas', 'pages', encodeURIComponent(pageId.replace(/^page:/, '')), 'exports')
  const fileName = normalizeFileName(args.fileName, 'export.svg')
  const outputPath = join(exportDir, fileName)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, await readFile(args.svgPath))
  return { svgPath: outputPath, fileName }
}

export async function insertSvgResult(args = {}) {
  const projectDir = resolve(nonEmptyString(args.projectDir) ?? process.cwd())
  const snapshot = await loadCanvasSnapshot({ projectDir })
  const shapeId = `shape:svg-result-${Date.now()}`
  snapshot.store[shapeId] = {
    id: shapeId,
    typeName: 'shape',
    type: 'text',
    parentId: nonEmptyString(args.parentId) ?? 'page:default',
    x: Number.isFinite(args.x) ? args.x : 0,
    y: Number.isFinite(args.y) ? args.y : 0,
    rotation: 0,
    index: `a${Date.now()}`,
    props: {
      richText: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'SVG result ready' }] }],
      },
      w: 240,
    },
    meta: {
      svgExtractResult: true,
      svgPath: nonEmptyString(args.svgPath),
      previewPath: nonEmptyString(args.previewPath),
      sourceShapeId: nonEmptyString(args.sourceShapeId),
    },
  }
  await saveCanvasSnapshot({ projectDir, snapshot })
  return { shapeId, snapshotPath: 'canvas/pages/default/svg-extract-canvas.json' }
}

export async function handleJsonRpcRequest(message) {
  try {
    if (message.method === 'initialize') {
      return { jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', serverInfo: { name: 'SVG Extract Canvas MCP', version: '0.1.0' }, capabilities: { tools: {} } } }
    }
    if (message.method === 'tools/list') {
      return { jsonrpc: '2.0', id: message.id, result: listTools() }
    }
    if (message.method === 'tools/call') {
      const name = nonEmptyString(message.params?.name)
      if (!name) throw Object.assign(new Error('tools/call requires params.name'), { code: ERROR.INVALID_PARAMS })
      const result = await callTool(name, message.params?.arguments ?? {})
      return { jsonrpc: '2.0', id: message.id, result }
    }
    return { jsonrpc: '2.0', id: message.id, error: { code: ERROR.METHOD_NOT_FOUND, message: `Unknown method: ${message.method}` } }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: error?.code ?? ERROR.INTERNAL_ERROR,
        message: String(error?.message ?? error),
      },
    }
  }
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

export function startStdioServer() {
  const rl = readline.createInterface({ input: process.stdin })
  rl.on('line', async (line) => {
    if (!line.trim()) return
    writeMessage(await handleJsonRpcRequest(JSON.parse(line)))
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startStdioServer()
}
