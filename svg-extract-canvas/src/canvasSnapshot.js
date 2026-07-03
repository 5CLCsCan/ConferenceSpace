export function isCanvasSnapshot(value) {
  return Boolean(value && typeof value === 'object' && value.schema && value.store)
}

export function extractCanvasSnapshot(payload) {
  const snapshot = payload?.snapshot ?? payload
  return isCanvasSnapshot(snapshot) ? snapshot : null
}
