import { JSDOM } from 'jsdom'

const BLOCK_TAGS = {
  P: 'normal',
  H2: 'h2',
  H3: 'h3',
  BLOCKQUOTE: 'blockquote'
}

const INLINE_TAGS = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'SPAN', 'BR'])

function normalizeText(value) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ')
}

function isBlockElement(node) {
  if (!node || node.nodeType !== 1) return false
  return Boolean(BLOCK_TAGS[node.tagName] || node.tagName === 'DIV')
}

function addMark(marks, mark) {
  if (marks.includes(mark)) return marks
  return [...marks, mark]
}

function parseInlineNodes(node, markDefs, activeMarks) {
  if (!node) return []

  if (node.nodeType === 3) {
    const text = normalizeText(node.nodeValue || '')
    if (!text) return []
    return [{ _type: 'span', text, marks: activeMarks }]
  }

  if (node.nodeType !== 1) return []

  const tag = node.tagName

  if (tag === 'BR') {
    return [{ _type: 'span', text: '\n', marks: activeMarks }]
  }

  let nextMarks = activeMarks
  if (tag === 'B' || tag === 'STRONG') {
    nextMarks = addMark(activeMarks, 'strong')
  } else if (tag === 'I' || tag === 'EM') {
    nextMarks = addMark(activeMarks, 'em')
  } else if (tag === 'A') {
    const href = node.getAttribute('href')
    if (href) {
      const key = `link_${markDefs.length}`
      markDefs.push({ _key: key, _type: 'link', href })
      nextMarks = addMark(activeMarks, key)
    }
  } else if (!INLINE_TAGS.has(tag)) {
    nextMarks = activeMarks
  }

  const children = []
  node.childNodes.forEach((child) => {
    children.push(...parseInlineNodes(child, markDefs, nextMarks))
  })
  return children
}

function buildBlock(node, style) {
  const markDefs = []
  const children = []
  node.childNodes.forEach((child) => {
    children.push(...parseInlineNodes(child, markDefs, []))
  })

  const hasContent = children.some(child => child.text && child.text.trim() !== '')
  if (!hasContent) return null

  return {
    _type: 'block',
    style,
    markDefs,
    children
  }
}

function nodesToBlocks(nodes) {
  const blocks = []

  nodes.forEach((node) => {
    if (node.nodeType === 3) {
      const text = normalizeText(node.nodeValue || '')
      if (text.trim()) {
        blocks.push({
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{ _type: 'span', text, marks: [] }]
        })
      }
      return
    }

    if (node.nodeType !== 1) return

    const tag = node.tagName
    if (BLOCK_TAGS[tag]) {
      const block = buildBlock(node, BLOCK_TAGS[tag])
      if (block) blocks.push(block)
      return
    }

    if (tag === 'DIV') {
      const hasBlockChildren = Array.from(node.childNodes).some(child => isBlockElement(child))
      if (hasBlockChildren) {
        blocks.push(...nodesToBlocks(Array.from(node.childNodes)))
        return
      }
      const block = buildBlock(node, 'normal')
      if (block) blocks.push(block)
      return
    }

    const fallbackBlock = buildBlock(node, 'normal')
    if (fallbackBlock) blocks.push(fallbackBlock)
  })

  return blocks
}

export function htmlToPortableText(html) {
  if (!html) return []
  const dom = new JSDOM(`<body>${html}</body>`)
  const { document } = dom.window
  const blocks = nodesToBlocks(Array.from(document.body.childNodes))
  return blocks
}
