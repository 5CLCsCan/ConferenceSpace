import { mkdir } from 'node:fs/promises'
import { basename, join } from 'node:path'

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function safeFileName(value, fallback = 'crop.png') {
  return basename(String(value || fallback)).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback
}

function clampCrop(crop, imageWidth, imageHeight) {
  const x = Math.max(0, Math.floor(finiteNumber(crop?.x)))
  const y = Math.max(0, Math.floor(finiteNumber(crop?.y)))
  const requestedWidth = Math.max(0, Math.ceil(finiteNumber(crop?.width)))
  const requestedHeight = Math.max(0, Math.ceil(finiteNumber(crop?.height)))
  const width = Math.min(requestedWidth, Math.max(0, imageWidth - x))
  const height = Math.min(requestedHeight, Math.max(0, imageHeight - y))
  return { x, y, width, height }
}

export async function cropImage({ sourcePath, crop, outputDir, fileName = 'crop.png' } = {}) {
  if (!sourcePath) throw new Error('cropImage requires sourcePath')
  if (!outputDir) throw new Error('cropImage requires outputDir')

  const sharp = (await import('sharp')).default
  const source = sharp(sourcePath)
  const metadata = await source.metadata()
  const bounded = clampCrop(crop, metadata.width ?? 0, metadata.height ?? 0)
  if (bounded.width <= 0 || bounded.height <= 0) {
    throw new Error('Refusing to write empty crop')
  }

  await mkdir(outputDir, { recursive: true })
  const cropPath = join(outputDir, safeFileName(fileName))
  await source
    .extract({ left: bounded.x, top: bounded.y, width: bounded.width, height: bounded.height })
    .png()
    .toFile(cropPath)

  return {
    cropPath,
    width: bounded.width,
    height: bounded.height,
    crop: bounded,
  }
}
