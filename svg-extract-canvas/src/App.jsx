import { useCallback, useEffect, useState } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { extractCanvasSnapshot } from './canvasSnapshot.js'
import { createExtractBoxRecord, shapePageBounds, syncBoundExtractTargets } from './extractBox.js'

const CANVAS_ENDPOINT = '/api/canvas'
const SELECTION_ENDPOINT = '/api/selection'
const VIEW_STATE_ENDPOINT = '/api/view-state'
const EXTRACT_ENDPOINT = '/api/extract'
const CLEANUP_PREVIEW_ENDPOINT = '/api/cleanup-preview'

const buttonStyle = {
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: 'white',
  borderRadius: 6,
  padding: '8px 10px',
  font: '600 13px system-ui',
}

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
  const [extractStatus, setExtractStatus] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [cleanupPreview, setCleanupPreview] = useState(null)
  const [previewSettings, setPreviewSettings] = useState({ rembgModel: '', vtracerBin: '' })
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
      let syncingBoundTargets = false

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
        if (!syncingBoundTargets) {
          syncingBoundTargets = true
          try {
            syncBoundExtractTargets(editor)
          } finally {
            syncingBoundTargets = false
          }
        }
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
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!editor) return
            const images = selectedImageShapes(editor)
            if (images.length !== 1) {
              setActionError('Select exactly one image before creating an extract box.')
              setExtractStatus(null)
              return
            }
            setActionError(null)
            setExtractStatus(null)
            const imageBounds = shapePageBounds(images[0])
            const size = Math.max(24, Math.min(128, imageBounds.width * 0.25, imageBounds.height * 0.25))
            const id = createShapeId()
            editor.createShape(
              createExtractBoxRecord({
                id,
                parentId: editor.getCurrentPageId(),
                x: imageBounds.x + (imageBounds.width - size) / 2,
                y: imageBounds.y + (imageBounds.height - size) / 2,
                w: size,
                h: size,
                sourceShapeId: images[0].id,
                sourceShape: images[0],
              }),
            )
            editor.select(id)
          }}
          style={buttonStyle}
        >
          Extract Box
        </button>
        <button
          type="button"
          disabled={!editor || isExtracting}
          onClick={async () => {
            if (!editor) return
            setIsExtracting(true)
            setActionError(null)
            setExtractStatus(null)
            try {
              syncBoundExtractTargets(editor)
              const saveResponse = await fetch(CANVAS_ENDPOINT, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(editor.store.getStoreSnapshot()),
              })
              if (!saveResponse.ok) throw new Error(`Canvas save failed: ${saveResponse.status}`)

              const extractResponse = await fetch(EXTRACT_ENDPOINT, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  pageId: editor.getCurrentPageId(),
                  selectedShapeIds: editor.getSelectedShapeIds().map((id) => String(id)),
                }),
              })
              const result = await extractResponse.json()
              if (!extractResponse.ok) throw new Error(result.error ?? `Extract failed: ${extractResponse.status}`)
              setExtractStatus(`Extracted ${result.cropCount} crops to ${result.version}`)
            } catch (extractError) {
              setActionError(extractError.message)
            } finally {
              setIsExtracting(false)
            }
          }}
          style={{
            ...buttonStyle,
            opacity: !editor || isExtracting ? 0.65 : 1,
          }}
        >
          {isExtracting ? 'Extracting...' : 'Extract'}
        </button>
        <button
          type="button"
          disabled={!editor || isPreviewing}
          onClick={async () => {
            if (!editor) return
            setIsPreviewing(true)
            setActionError(null)
            setExtractStatus(null)
            try {
              syncBoundExtractTargets(editor)
              const saveResponse = await fetch(CANVAS_ENDPOINT, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(editor.store.getStoreSnapshot()),
              })
              if (!saveResponse.ok) throw new Error(`Canvas save failed: ${saveResponse.status}`)

              const previewResponse = await fetch(CLEANUP_PREVIEW_ENDPOINT, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  pageId: editor.getCurrentPageId(),
                  selectedShapeIds: editor.getSelectedShapeIds().map((id) => String(id)),
                  rembgModel: previewSettings.rembgModel || undefined,
                  vtracerBin: previewSettings.vtracerBin || undefined,
                }),
              })
              const result = await previewResponse.json()
              if (!previewResponse.ok) throw new Error(result.error ?? `Preview failed: ${previewResponse.status}`)
              setCleanupPreview(result)
              setExtractStatus(`Previewed ${result.items.length} cleanup set${result.items.length === 1 ? '' : 's'} in ${result.version}`)
            } catch (previewError) {
              setActionError(previewError.message)
            } finally {
              setIsPreviewing(false)
            }
          }}
          style={{
            ...buttonStyle,
            borderColor: '#0f766e',
            background: '#0f766e',
            opacity: !editor || isPreviewing ? 0.65 : 1,
          }}
        >
          {isPreviewing ? 'Previewing...' : 'Preview Cleanup'}
        </button>
      </div>
      <CleanupPreviewPanel
        preview={cleanupPreview}
        settings={previewSettings}
        onSettingsChange={setPreviewSettings}
        onClose={() => setCleanupPreview(null)}
      />
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
      {extractStatus ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 54,
            right: 12,
            zIndex: 10,
            maxWidth: 300,
            border: '1px solid #16a34a',
            background: '#fff',
            color: '#166534',
            borderRadius: 6,
            padding: '8px 10px',
            font: '500 13px system-ui',
            boxShadow: '0 8px 24px rgb(15 23 42 / 12%)',
          }}
        >
          {extractStatus}
        </div>
      ) : null}
      <Tldraw snapshot={snapshot} onMount={handleMount} />
    </div>
  )
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : null
}

function CandidateCard({ candidate }) {
  const alpha = formatPercent(candidate.stats?.alphaCoverage ?? candidate.stats?.transparentPixelRatio)
  const edge = formatPercent(candidate.stats?.edgeTouchRatio)
  return (
    <article
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          borderBottom: '1px solid #e4e4e7',
        }}
      >
        <strong style={{ font: '700 13px system-ui', color: '#18181b' }}>{candidate.name}</strong>
        <span style={{ font: '500 12px system-ui', color: candidate.skipped || candidate.vectorizeError ? '#b45309' : '#047857' }}>
          {candidate.skipped ? 'missing' : candidate.vectorizeError ? 'raster only' : 'ready'}
        </span>
      </div>
      {candidate.skipped ? (
        <p style={{ margin: 0, padding: 10, font: '500 12px/1.4 system-ui', color: '#92400e' }}>{candidate.reason}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 8 }}>
          {candidate.rasterUrl ? <PreviewImage label="Raster" src={candidate.rasterUrl} /> : null}
          {candidate.maskUrl ? <PreviewImage label="Mask" src={candidate.maskUrl} /> : null}
          {candidate.previewUrl ? <PreviewImage label="SVG Preview" src={candidate.previewUrl} /> : null}
          {candidate.svgUrl ? (
            <a href={candidate.svgUrl} target="_blank" rel="noreferrer" style={{ font: '600 12px system-ui', color: '#2563eb' }}>
              Open SVG
            </a>
          ) : null}
        </div>
      )}
      <div style={{ padding: '0 10px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {candidate.quality?.recommendedAction ? <Metric label={candidate.quality.recommendedAction} /> : null}
        {alpha ? <Metric label={`alpha ${alpha}`} /> : null}
        {edge ? <Metric label={`edge ${edge}`} /> : null}
        {candidate.stats?.connectedComponentCount ? <Metric label={`${candidate.stats.connectedComponentCount} components`} /> : null}
      </div>
      {candidate.vectorizeError ? (
        <p style={{ margin: 0, padding: '0 10px 10px', font: '500 12px/1.4 system-ui', color: '#92400e' }}>
          {candidate.vectorizeError}
        </p>
      ) : null}
    </article>
  )
}

function Metric({ label }) {
  return (
    <span
      style={{
        padding: '3px 6px',
        borderRadius: 999,
        background: '#f4f4f5',
        color: '#3f3f46',
        font: '600 11px system-ui',
      }}
    >
      {label}
    </span>
  )
}

function PreviewImage({ label, src }) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          height: 112,
          border: '1px solid #e4e4e7',
          borderRadius: 4,
          background:
            'linear-gradient(45deg, #f4f4f5 25%, transparent 25%), linear-gradient(-45deg, #f4f4f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4f4f5 75%), linear-gradient(-45deg, transparent 75%, #f4f4f5 75%)',
          backgroundColor: '#fff',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <img src={src} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <figcaption style={{ marginTop: 4, font: '600 11px system-ui', color: '#52525b' }}>{label}</figcaption>
    </figure>
  )
}

function CleanupPreviewPanel({ preview, settings, onSettingsChange, onClose }) {
  return (
    <aside
      style={{
        position: 'fixed',
        top: 64,
        right: 12,
        bottom: 16,
        zIndex: 9,
        width: 380,
        maxWidth: 'calc(100vw - 24px)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #d4d4d8',
        borderRadius: 8,
        background: '#fafafa',
        boxShadow: '0 12px 40px rgb(15 23 42 / 14%)',
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: 12, borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, font: '700 14px system-ui', color: '#18181b' }}>Cleanup Preview</h2>
          <p style={{ margin: '3px 0 0', font: '500 12px system-ui', color: '#71717a' }}>
            {preview ? `${preview.items.length} item${preview.items.length === 1 ? '' : 's'} from ${preview.version}` : 'Select frames, then preview cleanup.'}
          </p>
        </div>
        {preview ? (
          <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', font: '700 18px system-ui', cursor: 'pointer' }}>
            x
          </button>
        ) : null}
      </header>
      <div style={{ padding: 12, display: 'grid', gap: 8, borderBottom: '1px solid #e4e4e7' }}>
        <label style={{ display: 'grid', gap: 4, font: '600 12px system-ui', color: '#3f3f46' }}>
          rembg model
          <input
            value={settings.rembgModel}
            onChange={(event) => onSettingsChange((current) => ({ ...current, rembgModel: event.target.value }))}
            placeholder="default"
            style={{ padding: '7px 8px', border: '1px solid #d4d4d8', borderRadius: 5, font: '500 12px system-ui' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4, font: '600 12px system-ui', color: '#3f3f46' }}>
          VTracer binary
          <input
            value={settings.vtracerBin}
            onChange={(event) => onSettingsChange((current) => ({ ...current, vtracerBin: event.target.value }))}
            placeholder="auto"
            style={{ padding: '7px 8px', border: '1px solid #d4d4d8', borderRadius: 5, font: '500 12px system-ui' }}
          />
        </label>
      </div>
      <div style={{ padding: 12, overflow: 'auto', display: 'grid', gap: 12 }}>
        {preview?.items?.length ? (
          preview.items.map((item) => (
            <section key={`${item.extractBoxId}-${item.index}`} style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ margin: 0, font: '700 13px system-ui', color: '#18181b' }}>{item.label || item.extractBoxId}</h3>
                <a href={item.manifestUrl} target="_blank" rel="noreferrer" style={{ font: '600 12px system-ui', color: '#2563eb' }}>
                  Manifest
                </a>
              </div>
              <PreviewImage label="Original crop" src={item.cropUrl} />
              {item.candidates.map((candidate) => (
                <CandidateCard key={`${item.extractBoxId}-${candidate.name}`} candidate={candidate} />
              ))}
            </section>
          ))
        ) : (
          <p style={{ margin: 0, font: '500 13px/1.45 system-ui', color: '#52525b' }}>
            Preview shows original crops beside local masks, rembg output, and SVG renderings.
          </p>
        )}
      </div>
    </aside>
  )
}
