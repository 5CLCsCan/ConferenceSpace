import { mkdir } from 'node:fs/promises'
import { basename, join } from 'node:path'

function safeFileName(value, fallback = 'preview.png') {
  return basename(String(value || fallback)).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback
}

export async function renderSvgPreview({ svgPath, outputDir, fileName = 'preview.png' } = {}) {
  if (!svgPath) throw new Error('renderSvgPreview requires svgPath')
  if (!outputDir) throw new Error('renderSvgPreview requires outputDir')

  const sharp = (await import('sharp')).default
  await mkdir(outputDir, { recursive: true })
  const image = sharp(svgPath)
  const metadata = await image.metadata()
  const previewPath = join(outputDir, safeFileName(fileName))
  await image.png().toFile(previewPath)
  return {
    previewPath,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  }
}
