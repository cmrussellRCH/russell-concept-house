function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderSpan(child, markDefs) {
  if (!child || child._type !== 'span') return ''
  const marks = Array.isArray(child.marks) ? child.marks : []
  let result = escapeHtml(child.text || '')

  marks.forEach((mark) => {
    if (mark === 'strong') {
      result = `<strong>${result}</strong>`
      return
    }
    if (mark === 'em') {
      result = `<em>${result}</em>`
      return
    }
    const linkDef = markDefs.find(def => def._key === mark && def._type === 'link')
    if (linkDef?.href) {
      const href = escapeAttribute(linkDef.href)
      result = `<a href="${href}">${result}</a>`
    }
  })

  return result
}

export function portableTextToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map((block) => {
      if (!block || block._type !== 'block') return ''
      const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
      const style = block.style || 'normal'
      const tag = style === 'h2' ? 'h2' : style === 'h3' ? 'h3' : style === 'blockquote' ? 'blockquote' : 'p'
      const children = Array.isArray(block.children) ? block.children : []
      const content = children.map(child => renderSpan(child, markDefs)).join('')
      return `<${tag}>${content}</${tag}>`
    })
    .filter(Boolean)
    .join('')
}
