const SLUG_RE = /[^a-z0-9]+/g

export function slugify(value) {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .replace(SLUG_RE, '-')
    .replace(/(^-|-$)+/g, '')
}

export function parseTags(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map(tag => String(tag).trim()).filter(Boolean)
  }
  return String(raw)
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

export function toPortableText(input) {
  if (!input) return []
  const paragraphs = String(input)
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)

  return paragraphs.map(block => {
    let style = 'normal'
    let text = block

    if (text.startsWith('### ')) {
      style = 'h3'
      text = text.slice(4)
    } else if (text.startsWith('## ')) {
      style = 'h2'
      text = text.slice(3)
    } else if (text.startsWith('> ')) {
      style = 'blockquote'
      text = text.slice(2)
    }

    const { children, markDefs } = parseInlineLinks(text)

    return {
      _type: 'block',
      style,
      markDefs,
      children: children.length ? children : [{ _type: 'span', text: '', marks: [] }]
    }
  })
}

export function portableTextToPlainText(blocks = []) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map(block => {
      if (block?._type !== 'block') return ''
      const text = (block.children || [])
        .map(child => child.text)
        .filter(Boolean)
        .join('')
      if (!text) return ''
      if (block.style === 'h2') return `## ${text}`
      if (block.style === 'h3') return `### ${text}`
      if (block.style === 'blockquote') return `> ${text}`
      return text
    })
    .filter(Boolean)
    .join('\n\n')
}

function parseInlineLinks(text) {
  const children = []
  const markDefs = []
  let lastIndex = 0
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const [full, label, url] = match
    if (match.index > lastIndex) {
      children.push({
        _type: 'span',
        text: text.slice(lastIndex, match.index),
        marks: []
      })
    }

    const key = `link_${markDefs.length}`
    markDefs.push({ _key: key, _type: 'link', href: url })
    children.push({ _type: 'span', text: label, marks: [key] })

    lastIndex = match.index + full.length
  }

  if (lastIndex < text.length) {
    children.push({
      _type: 'span',
      text: text.slice(lastIndex),
      marks: []
    })
  }

  return { children, markDefs }
}
