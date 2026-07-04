export const EXTRACT_BOX_META = {
  svgExtractTarget: true,
  svgExtractTargetVersion: 2,
  status: 'manual',
  label: '',
  confidence: 1,
}

const EPSILON = 0.5

function colorForStatus(status) {
  if (status === 'suggested') return 'orange'
  if (status === 'accepted') return 'green'
  if (status === 'rejected') return 'grey'
  return 'blue'
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

export function shapePageBounds(shape) {
  return {
    x: finiteNumber(shape?.x),
    y: finiteNumber(shape?.y),
    width: finiteNumber(shape?.props?.w ?? shape?.w),
    height: finiteNumber(shape?.props?.h ?? shape?.h),
  }
}

export function relativeBoundsForTarget({ targetBounds, sourceBounds }) {
  return {
    x: finiteNumber(targetBounds?.x) - finiteNumber(sourceBounds?.x),
    y: finiteNumber(targetBounds?.y) - finiteNumber(sourceBounds?.y),
    width: finiteNumber(targetBounds?.width ?? targetBounds?.w),
    height: finiteNumber(targetBounds?.height ?? targetBounds?.h),
  }
}

export function absoluteBoundsForTarget({ sourceBounds, sourceRelativeBounds }) {
  return {
    x: finiteNumber(sourceBounds?.x) + finiteNumber(sourceRelativeBounds?.x),
    y: finiteNumber(sourceBounds?.y) + finiteNumber(sourceRelativeBounds?.y),
    width: finiteNumber(sourceRelativeBounds?.width ?? sourceRelativeBounds?.w),
    height: finiteNumber(sourceRelativeBounds?.height ?? sourceRelativeBounds?.h),
  }
}

function normalizeBounds(bounds) {
  if (!bounds) return null
  return {
    x: finiteNumber(bounds.x),
    y: finiteNumber(bounds.y),
    width: finiteNumber(bounds.width ?? bounds.w),
    height: finiteNumber(bounds.height ?? bounds.h),
  }
}

function boundsDifferent(a, b) {
  if (!a || !b) return true
  return (
    Math.abs(finiteNumber(a.x) - finiteNumber(b.x)) > EPSILON ||
    Math.abs(finiteNumber(a.y) - finiteNumber(b.y)) > EPSILON ||
    Math.abs(finiteNumber(a.width ?? a.w) - finiteNumber(b.width ?? b.w)) > EPSILON ||
    Math.abs(finiteNumber(a.height ?? a.h) - finiteNumber(b.height ?? b.h)) > EPSILON
  )
}

export function createBoundExtractMeta({
  sourceShapeId = null,
  sourceShape = null,
  sourceBounds = null,
  targetBounds = null,
  sourceRelativeBounds = null,
  status = 'manual',
  label = '',
  confidence = 1,
} = {}) {
  const normalizedSourceBounds = normalizeBounds(sourceBounds ?? (sourceShape ? shapePageBounds(sourceShape) : null))
  const normalizedTargetBounds = normalizeBounds(targetBounds)
  const normalizedRelativeBounds =
    normalizeBounds(sourceRelativeBounds) ??
    (normalizedSourceBounds && normalizedTargetBounds
      ? relativeBoundsForTarget({ targetBounds: normalizedTargetBounds, sourceBounds: normalizedSourceBounds })
      : null)

  return {
    ...EXTRACT_BOX_META,
    sourceShapeId,
    status,
    label,
    confidence,
    sourceRelativeBounds: normalizedRelativeBounds,
    sourceLastBounds: normalizedSourceBounds,
    targetLastBounds: normalizedTargetBounds,
  }
}

export function createExtractBoxRecord({
  id,
  parentId = 'page:default',
  x = 0,
  y = 0,
  w = 128,
  h = 128,
  sourceShapeId = null,
  sourceShape = null,
  sourceBounds = null,
  sourceRelativeBounds = null,
  status = 'manual',
  label = '',
  confidence = 1,
}) {
  const normalizedSourceBounds = normalizeBounds(sourceBounds ?? (sourceShape ? shapePageBounds(sourceShape) : null))
  const normalizedRelativeBounds = normalizeBounds(sourceRelativeBounds)
  const targetBounds =
    normalizedSourceBounds && normalizedRelativeBounds
      ? absoluteBoundsForTarget({ sourceBounds: normalizedSourceBounds, sourceRelativeBounds: normalizedRelativeBounds })
      : { x, y, width: w, height: h }

  return {
    id,
    type: 'geo',
    parentId,
    x: targetBounds.x,
    y: targetBounds.y,
    rotation: 0,
    meta: createBoundExtractMeta({
      sourceShapeId,
      sourceBounds: normalizedSourceBounds,
      targetBounds,
      sourceRelativeBounds: normalizedRelativeBounds,
      status,
      label,
      confidence,
    }),
    props: {
      geo: 'rectangle',
      w: targetBounds.width,
      h: targetBounds.height,
      color: colorForStatus(status),
      dash: 'draw',
      growY: 0,
      url: '',
      scale: 1,
      labelColor: 'black',
      fill: 'none',
      size: 'm',
      font: 'draw',
      align: 'middle',
      verticalAlign: 'middle',
      richText: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
    },
  }
}

function currentPageShapes(editor) {
  if (typeof editor?.getCurrentPageShapes === 'function') return editor.getCurrentPageShapes()
  return Object.values(editor?.store?.getStoreSnapshot?.()?.store ?? {}).filter(
    (record) => record?.typeName === 'shape' && record?.parentId === editor.getCurrentPageId?.(),
  )
}

export function syncBoundExtractTargets(editor) {
  const updates = []

  for (const shape of currentPageShapes(editor)) {
    if (shape?.meta?.svgExtractTarget !== true || !shape?.meta?.sourceShapeId) continue
    const sourceShape = editor.getShape(shape.meta.sourceShapeId)
    if (!sourceShape) continue

    const sourceBounds = shapePageBounds(sourceShape)
    const targetBounds = shapePageBounds(shape)
    const lastSourceBounds = normalizeBounds(shape.meta.sourceLastBounds)
    const lastTargetBounds = normalizeBounds(shape.meta.targetLastBounds)
    const relativeBounds =
      normalizeBounds(shape.meta.sourceRelativeBounds) ??
      relativeBoundsForTarget({ targetBounds, sourceBounds })

    const sourceChanged = boundsDifferent(sourceBounds, lastSourceBounds)
    const targetChanged = boundsDifferent(targetBounds, lastTargetBounds)
    const nextRelativeBounds =
      sourceChanged && !targetChanged
        ? relativeBounds
        : relativeBoundsForTarget({ targetBounds, sourceBounds })
    const nextTargetBounds =
      sourceChanged && !targetChanged
        ? absoluteBoundsForTarget({ sourceBounds, sourceRelativeBounds: nextRelativeBounds })
        : targetBounds

    const needsShapeMove = boundsDifferent(targetBounds, nextTargetBounds)
    const needsMetaUpdate =
      boundsDifferent(nextRelativeBounds, shape.meta.sourceRelativeBounds) ||
      boundsDifferent(sourceBounds, shape.meta.sourceLastBounds) ||
      boundsDifferent(nextTargetBounds, shape.meta.targetLastBounds)

    if (!needsShapeMove && !needsMetaUpdate) continue

    updates.push({
      id: shape.id,
      type: shape.type,
      x: nextTargetBounds.x,
      y: nextTargetBounds.y,
      props: { ...shape.props, w: nextTargetBounds.width, h: nextTargetBounds.height },
      meta: {
        ...shape.meta,
        sourceRelativeBounds: nextRelativeBounds,
        sourceLastBounds: sourceBounds,
        targetLastBounds: nextTargetBounds,
      },
    })
  }

  if (updates.length > 0) editor.updateShapes(updates)
  return updates.length
}
