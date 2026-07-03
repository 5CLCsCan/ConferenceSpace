import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_PAGE_ID = 'page:default'
const DEFAULT_PAGE_NAME = 'Default'
const CANVAS_FILE_NAME = 'svg-extract-canvas.json'
const VIEW_STATE_FILE_NAME = 'svg-extract-view-state.json'
const SELECTION_FILE_NAME = 'svg-extract-selection.json'

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function resolveProjectDir(projectDir = process.env.SVG_EXTRACT_PROJECT_DIR) {
  return resolve(nonEmptyString(projectDir) ?? process.cwd())
}

export function canvasRoot({ projectDir } = {}) {
  return join(resolveProjectDir(projectDir), 'canvas')
}

export function pageDir({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  const pageName = encodeURIComponent(String(pageId).replace(/^page:/, ''))
  return join(canvasRoot({ projectDir }), 'pages', pageName)
}

export function canvasFilePath({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  return join(pageDir({ projectDir, pageId }), CANVAS_FILE_NAME)
}

export function viewStateFilePath({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  return join(pageDir({ projectDir, pageId }), VIEW_STATE_FILE_NAME)
}

export function selectionFilePath({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  return join(pageDir({ projectDir, pageId }), SELECTION_FILE_NAME)
}

export function createDefaultCanvasSnapshot() {
  return {
    schema: {
      schemaVersion: 2,
      storeVersion: 4,
      recordVersions: {},
    },
    store: {
      [DEFAULT_PAGE_ID]: {
        id: DEFAULT_PAGE_ID,
        typeName: 'page',
        name: DEFAULT_PAGE_NAME,
        meta: {},
      },
      'instance_page_state:default': {
        id: 'instance_page_state:default',
        typeName: 'instance_page_state',
        pageId: DEFAULT_PAGE_ID,
        selectedShapeIds: [],
        hintingShapeIds: [],
        erasingShapeIds: [],
        editingShapeId: null,
        croppingShapeId: null,
        focusedGroupId: null,
        meta: {},
      },
    },
  }
}

export async function loadCanvasSnapshot({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  const filePath = canvasFilePath({ projectDir, pageId })
  try {
    const payload = JSON.parse(await readFile(filePath, 'utf8'))
    return payload.snapshot ?? payload
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    const snapshot = createDefaultCanvasSnapshot()
    await saveCanvasSnapshot({ projectDir, pageId, snapshot })
    return snapshot
  }
}

export async function saveCanvasSnapshot({ projectDir, pageId = DEFAULT_PAGE_ID, snapshot }) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.store || !snapshot.schema) {
    throw new Error('Expected a tldraw-style canvas snapshot with schema and store')
  }
  const filePath = canvasFilePath({ projectDir, pageId })
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify({ snapshot }, null, 2)}\n`)
  return { snapshot, filePath }
}

export async function loadViewState({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  const filePath = viewStateFilePath({ projectDir, pageId })
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return {
      viewState: {
        version: 1,
        currentPageId: DEFAULT_PAGE_ID,
        camera: { x: 0, y: 0, z: 1 },
      },
    }
  }
}

export async function saveViewState({ projectDir, pageId = DEFAULT_PAGE_ID, viewState }) {
  const filePath = viewStateFilePath({ projectDir, pageId })
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify({ viewState }, null, 2)}\n`)
  return { viewState, filePath }
}

export async function loadSelectionState({ projectDir, pageId = DEFAULT_PAGE_ID } = {}) {
  const filePath = selectionFilePath({ projectDir, pageId })
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return { selectedShapes: [], updatedAt: null }
  }
}

export async function saveSelectionState({ projectDir, pageId = DEFAULT_PAGE_ID, selection }) {
  const filePath = selectionFilePath({ projectDir, pageId })
  const payload = {
    selectedShapes: Array.isArray(selection?.selectedShapes) ? selection.selectedShapes : [],
    updatedAt: nonEmptyString(selection?.updatedAt) ?? new Date().toISOString(),
  }
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`)
  return { selection: payload, filePath }
}

async function readJsonRequest(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json' })
  response.end(`${JSON.stringify(payload)}\n`)
}

export function createCanvasApiHandler({ projectDir } = {}) {
  const rootProjectDir = resolveProjectDir(projectDir)

  return async function handleCanvasApi(request, response) {
    const url = new URL(request.url, 'http://127.0.0.1')

    try {
      if (url.pathname === '/api/canvas' && request.method === 'GET') {
        sendJson(response, 200, { snapshot: await loadCanvasSnapshot({ projectDir: rootProjectDir }) })
        return true
      }
      if (url.pathname === '/api/canvas' && request.method === 'PUT') {
        const body = await readJsonRequest(request)
        const snapshot = body.snapshot ?? body
        const saved = await saveCanvasSnapshot({ projectDir: rootProjectDir, snapshot })
        sendJson(response, 200, saved)
        return true
      }
      if (url.pathname === '/api/view-state' && request.method === 'GET') {
        sendJson(response, 200, await loadViewState({ projectDir: rootProjectDir }))
        return true
      }
      if (url.pathname === '/api/view-state' && request.method === 'PUT') {
        const body = await readJsonRequest(request)
        const viewState = body.viewState ?? body
        const saved = await saveViewState({ projectDir: rootProjectDir, viewState })
        sendJson(response, 200, saved)
        return true
      }
      if (url.pathname === '/api/selection' && request.method === 'GET') {
        sendJson(response, 200, await loadSelectionState({ projectDir: rootProjectDir }))
        return true
      }
      if (url.pathname === '/api/selection' && request.method === 'PUT') {
        const selection = await readJsonRequest(request)
        const saved = await saveSelectionState({ projectDir: rootProjectDir, selection })
        sendJson(response, 200, saved.selection)
        return true
      }
      return false
    } catch (error) {
      sendJson(response, 500, { error: String(error?.message ?? error) })
      return true
    }
  }
}

export function createStandaloneServer({ projectDir, port = Number(process.env.SVG_EXTRACT_PORT ?? 43227) } = {}) {
  const handleApi = createCanvasApiHandler({ projectDir })
  return createServer(async (request, response) => {
    if (await handleApi(request, response)) return
    if (request.url === '/' || request.url === '/index.html') {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<!doctype html><div id="root">SVG Extract Canvas server is running.</div>')
      return
    }
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('Not found')
  }).listen(port, '127.0.0.1', () => {
    console.log(`Local: http://127.0.0.1:${port}/`)
    console.log(`Project: ${resolveProjectDir(projectDir)}`)
  })
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntrypoint) {
  createStandaloneServer({ projectDir: process.env.SVG_EXTRACT_PROJECT_DIR })
}
