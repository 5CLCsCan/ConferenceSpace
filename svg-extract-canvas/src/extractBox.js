export const EXTRACT_BOX_META = {
  svgExtractTarget: true,
  svgExtractTargetVersion: 2,
  status: 'manual',
  label: '',
  confidence: 1,
}

function colorForStatus(status) {
  if (status === 'suggested') return 'orange'
  if (status === 'accepted') return 'green'
  if (status === 'rejected') return 'grey'
  return 'blue'
}

export function createExtractBoxRecord({
  id,
  parentId = 'page:default',
  x = 0,
  y = 0,
  w = 128,
  h = 128,
  sourceShapeId = null,
  status = 'manual',
  label = '',
  confidence = 1,
}) {
  return {
    id,
    type: 'geo',
    parentId,
    x,
    y,
    rotation: 0,
    meta: { ...EXTRACT_BOX_META, sourceShapeId, status, label, confidence },
    props: {
      geo: 'rectangle',
      w,
      h,
      color: colorForStatus(status),
      dash: 'draw',
      fill: 'none',
      size: 'm',
    },
  }
}
