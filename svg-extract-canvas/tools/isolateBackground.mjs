import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import sharp from 'sharp'

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeFileName(fileName, fallback) {
  const raw = basename(nonEmptyString(fileName) ?? fallback)
  const extension = extname(raw) || extname(fallback)
  const base = raw
    .slice(0, raw.length - extname(raw).length)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'isolated'}${extension}`
}

function distanceFromRgb(data, offset, color) {
  const dr = data[offset] - color.r
  const dg = data[offset + 1] - color.g
  const db = data[offset + 2] - color.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function averageCornerColor(data, width, height) {
  const corners = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + width - 1) * 4,
  ]
  const sum = corners.reduce(
    (acc, offset) => ({
      r: acc.r + data[offset],
      g: acc.g + data[offset + 1],
      b: acc.b + data[offset + 2],
    }),
    { r: 0, g: 0, b: 0 },
  )
  return { r: sum.r / corners.length, g: sum.g / corners.length, b: sum.b / corners.length }
}

function connectedComponentCount(mask, width, height) {
  const visited = new Uint8Array(mask.length)
  let count = 0
  const queue = []

  for (let i = 0; i < mask.length; i += 1) {
    if (visited[i] || !mask[i]) continue
    count += 1
    visited[i] = 1
    queue.push(i)

    while (queue.length) {
      const current = queue.pop()
      const x = current % width
      const y = Math.floor(current / width)
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < width - 1 ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y < height - 1 ? current + width : -1,
      ]
      for (const next of neighbors) {
        if (next >= 0 && mask[next] && !visited[next]) {
          visited[next] = 1
          queue.push(next)
        }
      }
    }
  }

  return count
}

function edgeTouchRatio(mask, width, height) {
  let edgePixels = 0
  let touched = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x !== 0 && y !== 0 && x !== width - 1 && y !== height - 1) continue
      edgePixels += 1
      if (mask[y * width + x]) touched += 1
    }
  }
  return edgePixels ? touched / edgePixels : 0
}

function recommendedAction({ alphaCoverage, edgeTouchRatio, connectedComponentCount }) {
  const traceable =
    alphaCoverage >= 0.02 &&
    alphaCoverage <= 0.9 &&
    edgeTouchRatio <= 0.35 &&
    connectedComponentCount >= 1 &&
    connectedComponentCount <= 12
  return traceable ? 'trace-isolated' : 'recreate-then-trace'
}

export async function isolateCropBackground({
  cropPath,
  outputDir,
  fileName = 'isolated.png',
  maskOutputDir,
  threshold = 35,
} = {}) {
  if (!cropPath) throw new Error('isolateCropBackground requires cropPath')
  if (!outputDir) throw new Error('isolateCropBackground requires outputDir')

  const image = sharp(cropPath).ensureAlpha()
  const metadata = await image.metadata()
  const width = metadata.width
  const height = metadata.height
  if (!width || !height) throw new Error('Could not read crop dimensions')

  const input = await image.raw().toBuffer()
  const output = Buffer.from(input)
  const mask = new Uint8Array(width * height)
  const maskPixels = Buffer.alloc(width * height * 4)
  const background = averageCornerColor(input, width, height)

  let foregroundPixels = 0
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const offset = pixelIndex * 4
    const foreground = input[offset + 3] > 16 && (input[offset + 3] < 250 || distanceFromRgb(input, offset, background) >= threshold)
    mask[pixelIndex] = foreground ? 1 : 0
    output[offset + 3] = foreground ? input[offset + 3] || 255 : 0
    maskPixels[offset] = foreground ? 255 : 0
    maskPixels[offset + 1] = foreground ? 255 : 0
    maskPixels[offset + 2] = foreground ? 255 : 0
    maskPixels[offset + 3] = 255
    if (foreground) foregroundPixels += 1
  }

  const safeName = normalizeFileName(fileName, 'isolated.png')
  const isolatedPath = join(outputDir, safeName)
  const maskDir = maskOutputDir ?? join(dirname(outputDir), 'masks')
  const maskPath = join(maskDir, normalizeFileName(`${basename(safeName, extname(safeName))}-mask.png`, 'mask.png'))
  await mkdir(dirname(isolatedPath), { recursive: true })
  await mkdir(dirname(maskPath), { recursive: true })
  await sharp(output, { raw: { width, height, channels: 4 } }).png().toFile(isolatedPath)
  await sharp(maskPixels, { raw: { width, height, channels: 4 } }).png().toFile(maskPath)

  const alphaCoverage = foregroundPixels / (width * height)
  const edgeRatio = edgeTouchRatio(mask, width, height)
  const components = connectedComponentCount(mask, width, height)
  const action = recommendedAction({
    alphaCoverage,
    edgeTouchRatio: edgeRatio,
    connectedComponentCount: components,
  })

  return {
    isolatedPath,
    maskPath,
    width,
    height,
    stats: {
      hasTransparentBackground: foregroundPixels < width * height,
      alphaCoverage,
      edgeTouchRatio: edgeRatio,
      connectedComponentCount: components,
    },
    quality: { recommendedAction: action },
  }
}

function parseDataUrl(value) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(value ?? ''))
  if (!match) return null
  return match[2] ? Buffer.from(match[3] || '', 'base64') : Buffer.from(decodeURIComponent(match[3] || ''), 'utf8')
}

export async function saveCleanRasterDraft({ outputDir, fileName = 'draft.png', dataUrl, imageBytes } = {}) {
  if (!outputDir) throw new Error('saveCleanRasterDraft requires outputDir')
  const buffer = parseDataUrl(dataUrl) ?? (imageBytes ? Buffer.from(String(imageBytes), 'base64') : null)
  if (!buffer?.length) throw new Error('saveCleanRasterDraft requires dataUrl or base64 imageBytes')

  const normalized = await sharp(buffer).ensureAlpha().png().toBuffer()
  const metadata = await sharp(normalized).metadata()
  const draftPath = join(outputDir, normalizeFileName(fileName, 'draft.png'))
  await mkdir(dirname(draftPath), { recursive: true })
  await writeFile(draftPath, normalized)
  return { draftPath, width: metadata.width, height: metadata.height }
}
