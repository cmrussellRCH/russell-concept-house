import { slugify } from './articleUtils'

export function formatCategoryTitle(value) {
  if (!value) return ''
  return String(value)
    .trim()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function resolveCategory(client, { categoryId, categorySlug, categoryLabel }) {
  if (categoryId) {
    const existing = await client.getDocument(categoryId)
    return existing && existing._type === 'category' ? existing : null
  }

  const slugValue = slugify(categorySlug || categoryLabel)
  if (!slugValue) return null

  const existing = await client.fetch(
    '*[_type == "category" && slug.current == $slug][0]',
    { slug: slugValue }
  )

  if (existing) return existing

  const titleValue = categoryLabel ? String(categoryLabel).trim() : formatCategoryTitle(slugValue)
  const created = await client.create({
    _type: 'category',
    title: titleValue || formatCategoryTitle(slugValue),
    slug: { _type: 'slug', current: slugValue }
  })

  return created
}
