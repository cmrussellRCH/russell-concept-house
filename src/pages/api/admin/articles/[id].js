import { requireAdminSession } from '../../../../lib/admin/session'
import { requireWriteClient } from '../../../../lib/sanity.server'
import { parseTags, slugify, toPortableText } from '../../../../lib/admin/articleUtils'
import { resolveCategory } from '../../../../lib/admin/categoryUtils'
import { htmlToPortableText } from '../../../../lib/admin/portableText.server'

export default async function handler(req, res) {
  const session = requireAdminSession(req)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = requireWriteClient()
  const previewClient = client.withConfig({ perspective: 'previewDrafts' })
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid article id.' })
  }

  if (req.method === 'GET') {
    const article = await previewClient.getDocument(id)
    if (!article || article._type !== 'article') {
      return res.status(404).json({ error: 'Not found' })
    }

    return res.status(200).json({ article })
  }

  if (req.method === 'DELETE') {
    const existing = await previewClient.getDocument(id)
    if (!existing || existing._type !== 'article') {
      return res.status(404).json({ error: 'Not found' })
    }

    await client.delete(id)
    await revalidatePaths(res, existing.slug?.current, existing.mediaType)

    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    title,
    slug,
    category,
    categoryId,
    categoryLabel,
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
    clearMainImagePublicId,
    status
  } = req.body || {}

  const isDraft = status === 'draft'
  const isPublish = status === 'published'
  const isDraftId = id.startsWith('drafts.')
  const targetId = isDraft
    ? (isDraftId ? id : `drafts.${id}`)
    : (isDraftId ? id.replace(/^drafts\./, '') : id)

  if (!title || (!category && !categoryId)) {
    return res.status(400).json({ error: 'Title and category are required.' })
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
      '*[_type == "article" && slug.current == $slug && _id != $id && !(_id in path("drafts.**"))][0]._id',
      { slug: normalizedSlug, id: targetId }
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
  const publishedId = isDraftId ? id.replace(/^drafts\./, '') : id
  const resolvedCategory = await resolveCategory(client, {
    categoryId,
    categorySlug: category,
    categoryLabel
  })

  if (!resolvedCategory) {
    return res.status(400).json({ error: 'Category is required.' })
  }

  const resolvedCategorySlug = resolvedCategory.slug?.current || slugify(categoryLabel || category)

  let legacyMainImage = null
  let legacyGallery = null

  if (isDraft) {
    const draftDoc = await previewClient.getDocument(targetId)
    const publishedDoc = publishedId && publishedId !== targetId
      ? await previewClient.getDocument(publishedId)
      : null

    legacyMainImage = draftDoc?.mainImage || publishedDoc?.mainImage || null
    legacyGallery = (draftDoc?.gallery?.length ? draftDoc.gallery : publishedDoc?.gallery) || null
  }

  await client.createIfNotExists({ _id: targetId, _type: 'article' })

  const patchPayload = {
    title: String(title).trim(),
    slug: { _type: 'slug', current: normalizedSlug },
    category: resolvedCategorySlug,
    categoryRef: resolvedCategory?._id
      ? { _type: 'reference', _ref: resolvedCategory._id }
      : undefined,
    excerpt: excerpt ? String(excerpt).trim() : undefined,
    publishedAt: normalizedPublishedAt,
    author: author ? String(author).trim() : 'Russell Concept House',
    body: normalizedBodyHtml ? htmlToPortableText(normalizedBodyHtml) : toPortableText(bodyText || ''),
    mediaType: resolvedMediaType,
    tags: normalizedTags
  }

  if (isDraft) {
    if (normalizedAvailableAtUrl) {
      patchPayload.availableAtUrl = normalizedAvailableAtUrl
    }
    if (normalizedAvailableAtLabel) {
      patchPayload.availableAtLabel = normalizedAvailableAtLabel
    }
    if (normalizedVideoUrl) {
      patchPayload.videoUrl = normalizedVideoUrl
    }
    if (normalizedVideoDuration) {
      patchPayload.videoDuration = normalizedVideoDuration
    }
    patchPayload.galleryPublicIds = normalizedGallery
    if (legacyMainImage) {
      patchPayload.mainImage = legacyMainImage
    }
    if (legacyGallery) {
      patchPayload.gallery = legacyGallery
    }
  } else {
    patchPayload.availableAtUrl = normalizedAvailableAtUrl || undefined
    patchPayload.availableAtLabel = normalizedAvailableAtUrl
      ? (normalizedAvailableAtLabel || 'Available At')
      : undefined
    patchPayload.videoUrl = resolvedMediaType === 'video' ? normalizedVideoUrl || undefined : undefined
    patchPayload.videoDuration = resolvedMediaType === 'video' ? normalizedVideoDuration || undefined : undefined
    patchPayload.galleryPublicIds = resolvedMediaType === 'video' ? [] : normalizedGallery
  }

  const patch = client.patch(targetId).set(patchPayload)

  if (clearMainImagePublicId) {
    patch.unset(['mainImagePublicId'])
  } else if (mainImagePublicId) {
    patch.set({ mainImagePublicId: String(mainImagePublicId).trim() })
  } else if (!isDraft) {
    patch.unset(['mainImagePublicId'])
  }

  if (!isDraft && resolvedMediaType !== 'video') {
    patch.unset(['videoUrl', 'videoDuration'])
  }

  if (!isDraft && !normalizedAvailableAtUrl) {
    patch.unset(['availableAtUrl', 'availableAtLabel'])
  }

  const updated = await patch.commit({ autoGenerateArrayKeys: true })

  if (!isDraft) {
    await revalidatePaths(res, updated.slug?.current, updated.mediaType)
  }

  if (isPublish && isDraftId) {
    await client.delete(id)
  }

  return res.status(200).json({ article: updated })
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
