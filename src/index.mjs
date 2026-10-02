import { fromMarkdown } from 'mdast-util-from-markdown'
import { STRUCTURED_SURFACE_LIMITS, createStructuredSurface, normalizeHttpReference } from '@hathq/sem-lang-structured-surface'

const GROUPING = new Set(['listItem', 'paragraph', 'blockquote'])
const MAX_DEPTH = 64

function cleanText(value) { return String(value ?? '').replace(/\s+/gu, ' ').trim() }
function spanOf(node) {
  const start = node.position?.start?.offset
  const end = node.position?.end?.offset
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) ? { start, end } : undefined
}
export function parseMarkdownSurface(input) {
  if (!input || typeof input.source !== 'string' || typeof input.sourceRef !== 'string' || !input.sourceRef.trim()) {
    throw new TypeError('markdown-surface-invalid-input')
  }
  const bounded = input.source.slice(0, STRUCTURED_SURFACE_LIMITS.inputCharacters)
  let truncated = bounded.length !== input.source.length
  const root = fromMarkdown(bounded)
  const nodes = [{ id: 'document', kind: 'document', formatName: 'commonmark', traits: [], attributes: {}, span: { start: 0, end: bounded.length } }]
  const relations = []
  let sequence = 0
  const add = (parent, kind, formatName, options = {}) => {
    if (nodes.length >= STRUCTURED_SURFACE_LIMITS.nodes || relations.length >= STRUCTURED_SURFACE_LIMITS.relations) { truncated = true; return null }
    const id = `markdown-${sequence++}`
    nodes.push({ id, kind, formatName, traits: options.traits ?? [], attributes: options.attributes ?? {},
      ...(options.value !== undefined ? { value: options.value } : {}),
      ...(options.valueType ? { valueType: options.valueType } : {}),
      ...(options.label ? { label: options.label } : {}),
      ...(options.span ? { span: options.span } : {}) })
    relations.push({ source: parent, target: id, kind: 'contains' })
    return id
  }
  const walkChildren = (children, parent, depth, inheritedTraits = []) => {
    if (depth > MAX_DEPTH) { truncated = true; return }
    let previous = null
    for (const child of children ?? []) {
      let id = null
      const nodeSpan = spanOf(child)
      if (child.type === 'text' || child.type === 'inlineCode' || child.type === 'code') {
        const value = cleanText(child.value)
        if (value) id = add(parent, 'text', child.type, { value, valueType: 'text', traits: inheritedTraits, span: nodeSpan })
      } else if (child.type === 'html') {
        id = add(parent, 'opaque', 'embedded-html', { traits: ['requires-explicit-format-adapter'], span: nodeSpan })
      } else {
        const traits = GROUPING.has(child.type) ? ['grouping-scope'] : []
        id = add(parent, 'element', child.type, { traits, span: nodeSpan })
        if (id) {
          const subtreeStart = nodes.length
          const childTraits = [...new Set([...inheritedTraits, ...(child.type === 'link' ? ['reference-label'] : [])])]
          walkChildren(child.children, id, depth + 1, childTraits)
          if (child.type === 'link') {
            const reference = normalizeHttpReference(child.url ?? '')
            if (reference) {
              const referenceId = add(id, 'reference', 'link', { value: reference, valueType: 'url', span: nodeSpan })
              if (referenceId && relations.length < STRUCTURED_SURFACE_LIMITS.relations) {
                relations.push({ source: id, target: referenceId, kind: 'references' })
                const labelIds = nodes.slice(subtreeStart)
                  .filter(node => node.kind === 'text' && node.traits.includes('reference-label'))
                  .map(node => node.id)
                for (const labelId of labelIds) {
                  if (relations.length >= STRUCTURED_SURFACE_LIMITS.relations) { truncated = true; break }
                  relations.push({ source: labelId, target: referenceId, kind: 'labels' })
                }
              }
            }
          } else if (child.type === 'image') {
            const alt = cleanText(child.alt)
            if (alt) add(id, 'text', 'alternative-text', { value: alt, valueType: 'text', traits: [...new Set([...inheritedTraits, 'alternative-text'])], span: nodeSpan })
          }
        }
      }
      if (id && previous && relations.length < STRUCTURED_SURFACE_LIMITS.relations) relations.push({ source: previous, target: id, kind: 'follows' })
      if (id) previous = id
    }
  }
  walkChildren(root.children, 'document', 0)
  return createStructuredSurface({
    source: { reference: input.sourceRef.trim(), revision: input.sourceRevision?.trim() || null, mediaType: 'text/markdown' },
    parser: { artifact: '@hathq/sem-lang-surface-markdown', version: '0.10.0', standard: 'CommonMark via mdast-util-from-markdown@2.0.3' },
    nodes, relations, truncated
  })
}
