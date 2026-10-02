import test from 'node:test'
import assert from 'node:assert/strict'
import { groupRelatedObservations, projectTypedValues, visibleSurfaceText } from '@hathq/sem-lang-structured-surface'
import { parseMarkdownSurface } from '../src/index.mjs'

test('CommonMark list items share the format-neutral grouping contract', () => {
  const markdown = '- [Alpha](https://shop.test/a?tracking=secret) ¥1,200\n- [Beta](https://shop.test/b) 2,500円'
  const surface = projectTypedValues(parseMarkdownSurface({ source: markdown, sourceRef: 'chat:1' }))
  const groups = groupRelatedObservations(surface)
  assert.equal(groups.groups.length, 2)
  assert.deepEqual(surface.nodes.filter(node => node.kind === 'reference').map(node => node.value), ['https://shop.test/a', 'https://shop.test/b'])
  assert.equal(visibleSurfaceText(surface).includes('Alpha'), false)
  assert.equal(visibleSurfaceText(surface).includes('Beta'), false)
  const alphaLabel = surface.nodes.find(node => node.value === 'Alpha')
  const alphaReference = surface.nodes.find(node => node.kind === 'reference' && node.value === 'https://shop.test/a')
  assert.equal(surface.relations.some(relation => relation.kind === 'labels' && relation.source === alphaLabel?.id && relation.target === alphaReference?.id), true)
})

test('embedded HTML remains opaque and is not recursively interpreted', () => {
  const surface = parseMarkdownSurface({ source: '<a href="https://outside.test">not a CommonMark link</a>', sourceRef: 'chat:2' })
  assert.equal(surface.nodes.some(node => node.kind === 'opaque' && node.formatName === 'embedded-html'), true)
  assert.equal(surface.nodes.some(node => node.kind === 'reference'), false)
})
