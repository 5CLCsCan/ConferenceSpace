import { useCallback, useEffect, useState } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { extractCanvasSnapshot } from './canvasSnapshot.js'
import { createExtractBoxRecord } from './extractBox.js'

const CANVAS_ENDPOINT = '/api/canvas'
const SELECTION_ENDPOINT = '/api/selection'
const VIEW_STATE_ENDPOINT = '/api/view-state'

function getShapeSelection(editor) {
  return editor.getSelectedShapeIds().map((id) => {
    const shape = editor.getShape(id)
    const asset = shape?.props?.assetId ? editor.getAsset(shape.props.assetId) : null
    return {
      id,
      type: shape?.type ?? null,
      parentId: shape?.parentId ?? null,
      x: shape?.x ?? null,
      y: shape?.y ?? null,
      rotation: shape?.rotation ?? null,
      props: shape?.props ?? null,
      meta: shape?.meta ?? null,
      isSvgExtractTarget: shape?.meta?.svgExtractTarget === true,
      asset: asset
        ? {
            id: asset.id,
            type: asset.type,
            name: asset.props?.name ?? null,
            src: asset.props?.src ?? null,
            w: asset.props?.w ?? null,
            h: asset.props?.h ?? null,
            mimeType: asset.props?.mimeType ?? null,
          }
        : null,
    }
  })
}

function selectedImageShapes(editor) {
  return editor
    .getSelectedShapeIds()
    .map((id) => editor.getShape(id))
    .filter((shape) => shape?.type === 'image' && shape?.props?.assetId)
}

export default function App() {
  const [snapshot, setSnapshot] = useState()
  const [viewState, setViewState] = useState()
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function loadCanvas() {
      try {
        const [canvasResponse, viewStateResponse] = await Promise.all([
          fetch(CANVAS_ENDPOINT, { signal: controller.signal }),
          fetch(VIEW_STATE_ENDPOINT, { signal: controller.signal }),
        ])
        if (!canvasResponse.ok) throw new Error(`Canvas load failed: ${canvasResponse.status}`)
        if (!viewStateResponse.ok) throw new Error(`View state load failed: ${viewStateResponse.status}`)

        const [canvasPayload, viewStatePayload] = await Promise.all([
          canvasResponse.json(),
          viewStateResponse.json(),
        ])
        setSnapshot(extractCanvasSnapshot(canvasPayload))
        setViewState(viewStatePayload.viewState ?? null)
      } catch (loadError) {
        if (loadError.name === 'AbortError') return
        setError(loadError)
        setSnapshot(null)
        setViewState(null)
      }
    }
    loadCanvas()
    return () => controller.abort()
  }, [])

  const handleMount = useCallback(
    (editor) => {
      window.__svgExtractEditor = editor
      setEditor(editor)
      let saveTimer = null

      if (viewState?.currentPageId && editor.getPage(viewState.currentPageId)) {
        editor.setCurrentPage(viewState.currentPageId)
        if (viewState.camera) editor.setCamera(viewState.camera, { immediate: true, force: true })
      }

      async function saveCanvas() {
        const body = JSON.stringify(editor.store.getStoreSnapshot())
        await fetch(CANVAS_ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body,
        })
      }

      function scheduleSave() {
        window.clearTimeout(saveTimer)
        saveTimer = window.setTimeout(() => saveCanvas().catch(console.error), 500)
      }

      async function syncSelectionAndView() {
        const selectedShapes = getShapeSelection(editor)
        await fetch(SELECTION_ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ selectedShapes, updatedAt: new Date().toISOString() }),
        })
        const camera = editor.getCamera()
        await fetch(VIEW_STATE_ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            version: 1,
            currentPageId: editor.getCurrentPageId(),
            camera: { x: camera.x, y: camera.y, z: camera.z },
            updatedAt: new Date().toISOString(),
          }),
        })
      }

      const selectionTimer = window.setInterval(() => {
        syncSelectionAndView().catch(console.error)
      }, 250)
      const unsubscribe = editor.store.listen(scheduleSave, { source: 'user', scope: 'document' })

      return () => {
        window.clearTimeout(saveTimer)
        window.clearInterval(selectionTimer)
        unsubscribe()
        if (window.__svgExtractEditor === editor) delete window.__svgExtractEditor
        setEditor(null)
      }
    },
    [viewState],
  )

  if (snapshot === undefined || viewState === undefined) {
    return <main className="svg-extract-loading">Loading canvas...</main>
  }
  if (error || !snapshot) {
    return <main className="svg-extract-error">Canvas could not be loaded.</main>
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <button
        type="button"
        onClick={() => {
          if (!editor) return
          const images = selectedImageShapes(editor)
          if (images.length !== 1) {
            setActionError('Select exactly one image before creating an extract box.')
            return
          }
          setActionError(null)
          const bounds = editor.getViewportPageBounds()
          const id = createShapeId()
          editor.createShape(
            createExtractBoxRecord({
              id,
              parentId: editor.getCurrentPageId(),
              x: bounds.center.x - 64,
              y: bounds.center.y - 64,
              w: 128,
              h: 128,
              sourceShapeId: images[0].id,
            }),
          )
          editor.select(id)
        }}
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 10,
          border: '1px solid #2563eb',
          background: '#2563eb',
          color: 'white',
          borderRadius: 6,
          padding: '8px 10px',
          font: '600 13px system-ui',
        }}
      >
        Extract Box
      </button>
      {actionError ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 54,
            right: 12,
            zIndex: 10,
            maxWidth: 260,
            border: '1px solid #dc2626',
            background: '#fff',
            color: '#991b1b',
            borderRadius: 6,
            padding: '8px 10px',
            font: '500 13px system-ui',
            boxShadow: '0 8px 24px rgb(15 23 42 / 12%)',
          }}
        >
          {actionError}
        </div>
      ) : null}
      <Tldraw snapshot={snapshot} onMount={handleMount} />
    </div>
  )
}
