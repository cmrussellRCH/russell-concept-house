import { v4 as uuidv4 } from 'uuid'
import { requireAdminSession } from '../../../../lib/admin/session'
import { requireWriteClient } from '../../../../lib/sanity.server'
import { parseTags, slugify, toPortableText } from '../../../../lib/admin/articleUtils'
import { htmlToPortableText } from '../../../../lib/admin/portableText.server'

const CATEGORY_OPTIONS = [
  'design',
  'objects',
  'crafts',
  'art',
  'pottery',
  'textiles',
  'lifestyle',
  'interior'
]

export default async function handler(req, res) {
  const session = requireAdminSession(req)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = requireWriteClient()
  const previewClient = client.withConfig({ perspective: 'previewDrafts' })

  if (req.method === 'GET') {
    const articles = await previewClient.fetch(
      `*[_type == "article"] | order(coalesce(publishedAt, _updatedAt) desc) {
        _id,
        title,
        slug,
        publishedAt,
        category,
        mediaType,
        _updatedAt,
        mainImagePublicId,
        mainImage {
          asset-> { url }
        }
      }`
    )

    return res.status(200).json({ articles })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    title,
    slug,
    category,
    excerpt,
    publishedAt,
    author,
    bodyHtml,
    bodyText,
    availableAtLabel,
    availableAtUrl,
    mediaType,
    videoUrl,
    videoDuration,
    tags,
    mainImagePublicId,
    galleryPublicIds,
    status
  } = req.body || {}

  const isDraft = status === 'draft'

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required.' })
  }

  if (!isDraft && !mainImagePublicId) {
    return res.status(400).json({ error: 'Cloudinary main image is required.' })
  }

  if (!CATEGORY_OPTIONS.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' })
  }

  const normalizedSlug = slugify(slug || title)
  if (!normalizedSlug) {
    return res.status(400).json({ error: 'Slug is required.' })
  }

  const resolvedMediaType = mediaType === 'video' ? 'video' : 'images'
  if (!isDraft && resolvedMediaType === 'video' && !videoUrl) {
    return res.status(400).json({ error: 'Video URL is required for video articles.' })
  }

  if (!isDraft) {
    const existing = await client.fetch(
      '*[_type == "article" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id',
      { slug: normalizedSlug }
    )
    if (existing) {
      return res.status(409).json({ error: 'Slug is already in use.' })
    }
  }

  const normalizedTags = parseTags(tags)
  const parsedPublishedAt = publishedAt ? new Date(publishedAt) : new Date()
  const normalizedPublishedAt = Number.isNaN(parsedPublishedAt.getTime())
    ? new Date().toISOString()
    : parsedPublishedAt.toISOString()
  const normalizedBodyHtml = bodyHtml ? String(bodyHtml) : ''
  const normalizedAvailableAtUrl = availableAtUrl ? String(availableAtUrl).trim() : ''
  const normalizedAvailableAtLabel = availableAtLabel ? String(availableAtLabel).trim() : ''
  const normalizedVideoUrl = videoUrl ? String(videoUrl).trim() : ''
  const normalizedVideoDuration = videoDuration ? String(videoDuration).trim() : ''
  const normalizedGallery = Array.isArray(galleryPublicIds)
    ? galleryPublicIds.map(id => String(id).trim()).filter(Boolean)
    : []

  const document = {
    _id: isDraft ? `drafts.${uuidv4()}` : undefined,
    _type: 'article',
    title: String(title).trim(),
    slug: { _type: 'slug', current: normalizedSlug },
    category,
    mainImagePublicId: mainImagePublicId ? String(mainImagePublicId).trim() : undefined,
    excerpt: excerpt ? String(excerpt).trim() : undefined,
    publishedAt: normalizedPublishedAt,
    author: author ? String(author).trim() : 'Russell Concept House',
    body: normalizedBodyHtml ? htmlToPortableText(normalizedBodyHtml) : toPortableText(bodyText || ''),
    availableAtUrl: normalizedAvailableAtUrl || undefined,
    availableAtLabel: isDraft
      ? (normalizedAvailableAtLabel || undefined)
      : normalizedAvailableAtUrl
        ? (normalizedAvailableAtLabel || 'Available At')
        : undefined,
    mediaType: resolvedMediaType,
    videoUrl: isDraft
      ? (normalizedVideoUrl || undefined)
      : resolvedMediaType === 'video'
        ? (normalizedVideoUrl || undefined)
        : undefined,
    videoDuration: isDraft
      ? (normalizedVideoDuration || undefined)
      : resolvedMediaType === 'video'
        ? (normalizedVideoDuration || undefined)
        : undefined,
    galleryPublicIds: isDraft ? normalizedGallery : (resolvedMediaType === 'video' ? [] : normalizedGallery),
    tags: normalizedTags
  }

  const created = await client.create(document, { autoGenerateArrayKeys: true })

  if (!isDraft) {
    await revalidatePaths(res, created.slug?.current, created.mediaType)
  }

  return res.status(201).json({ article: created })
}

async function revalidatePaths(res, slug, mediaType) {
  try {
    if (slug) {
      await res.revalidate(`/articles/${slug}`)
      if (mediaType === 'video') {
        await res.revalidate(`/conversations/${slug}`)
        await res.revalidate('/conversations')
      }
    }
    await res.revalidate('/articles')
    await res.revalidate('/')
  } catch (error) {
    console.error('Revalidation error:', error)
  }
}
