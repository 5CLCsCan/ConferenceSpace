import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createExtractBoxRecord } from '../src/extractBox.js'

test('createExtractBoxRecord marks a rectangle as an SVG extraction target', () => {
  const record = createExtractBoxRecord({
    id: 'shape:extract',
    parentId: 'page:default',
    x: 10,
    y: 20,
    w: 64,
    h: 48,
  })

  assert.equal(record.type, 'geo')
  assert.equal(record.meta.svgExtractTarget, true)
  assert.equal(record.props.geo, 'rectangle')
  assert.equal(record.props.w, 64)
  assert.equal(record.props.h, 48)
})
