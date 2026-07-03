import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { optimize } from 'svgo'

function safeFileName(value, fallback = 'optimized.svg') {
  return basename(String(value || fallback)).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback
}

function parseSvgDimension(svg, attributeName) {
  const match = svg.match(new RegExp(`\\s${attributeName}\\s*=\\s*["']([0-9]+(?:\\.[0-9]+)?)["']`, 'i'))
  return match ? Number(match[1]) : null
}

function ensureViewBox(svg) {
  if (/\sviewBox\s*=/i.test(svg)) return svg
  const width = parseSvgDimension(svg, 'width')
  const height = parseSvgDimension(svg, 'height')
  if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) {
    throw new Error('Invalid SVG: missing viewBox')
  }
  return svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${width} ${height}"`)
}

function assertSafeSvg(svg) {
  if (/<script[\s>]/i.test(svg)) throw new Error('Unsafe SVG: script elements are not allowed')
  if (/\son[a-z]+\s*=/i.test(svg)) throw new Error('Unsafe SVG: event handler attributes are not allowed')
  if (/(href|xlink:href)\s*=\s*["']\s*(https?:|data:|javascript:)/i.test(svg)) {
    throw new Error('Unsafe SVG: external, data, or javascript references are not allowed')
  }
  if (!/<svg[\s>]/i.test(svg)) throw new Error('Invalid SVG: missing <svg> root')
  if (!/\sviewBox\s*=/i.test(svg)) throw new Error('Invalid SVG: missing viewBox')
}

function countMatches(svg, pattern) {
  return [...svg.matchAll(pattern)].length
}

export async function optimizeSvg({ rawSvgPath, outputDir, fileName = 'optimized.svg' } = {}) {
  if (!rawSvgPath) throw new Error('optimizeSvg requires rawSvgPath')
  if (!outputDir) throw new Error('optimizeSvg requires outputDir')

  const rawSvg = ensureViewBox(await readFile(rawSvgPath, 'utf8'))
  assertSafeSvg(rawSvg)
  const result = optimize(rawSvg, {
    path: rawSvgPath,
    multipass: true,
    plugins: ['preset-default'],
  })
  const svg = result.data
  assertSafeSvg(svg)

  await mkdir(outputDir, { recursive: true })
  const svgPath = join(outputDir, safeFileName(fileName))
  await writeFile(svgPath, svg)
  const info = await stat(svgPath)

  return {
    svgPath,
    warnings: [],
    stats: {
      fileBytes: info.size,
      pathCount: countMatches(svg, /<path[\s>]/gi),
      shapeCount: countMatches(svg, /<(path|rect|circle|ellipse|polygon|polyline)[\s>]/gi),
    },
  }
}
