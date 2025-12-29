import { requireAdminSession } from '../../../../lib/admin/session'
import { requireWriteClient } from '../../../../lib/sanity.server'
import { slugify } from '../../../../lib/admin/articleUtils'

export default async function handler(req, res) {
  const session = requireAdminSession(req)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = requireWriteClient()

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store')
    const categories = await client.fetch(
      `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
        _id,
        title,
        slug,
        order
      }`
    )

    return res.status(200).json({ categories })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title } = req.body || {}
  const normalizedTitle = title ? String(title).trim() : ''
  if (!normalizedTitle) {
    return res.status(400).json({ error: 'Category title is required.' })
  }

  const slug = slugify(normalizedTitle)
  if (!slug) {
    return res.status(400).json({ error: 'Category slug is required.' })
  }

  const existing = await client.fetch(
    '*[_type == "category" && slug.current == $slug][0]',
    { slug }
  )

  if (existing) {
    return res.status(200).json({ category: existing })
  }

  const category = await client.create({
    _type: 'category',
    title: normalizedTitle,
    slug: { _type: 'slug', current: slug }
  })

  return res.status(201).json({ category })
}
