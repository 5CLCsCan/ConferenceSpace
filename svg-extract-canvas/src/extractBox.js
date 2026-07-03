export const EXTRACT_BOX_META = { svgExtractTarget: true, svgExtractTargetVersion: 1 }

export function createExtractBoxRecord({ id, parentId = 'page:default', x = 0, y = 0, w = 128, h = 128 }) {
  return {
    id,
    type: 'geo',
    parentId,
    x,
    y,
    rotation: 0,
    meta: { ...EXTRACT_BOX_META },
    props: {
      geo: 'rectangle',
      w,
      h,
      color: 'blue',
      dash: 'draw',
      fill: 'none',
      size: 'm',
    },
  }
}
