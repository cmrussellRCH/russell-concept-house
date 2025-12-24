import { useEffect, useMemo, useState } from 'react'
import { getOptimizedImageUrl } from '../../lib/cloudinary'
import { slugify } from '../../lib/admin/articleUtils'
import { portableTextToHtml } from '../../lib/admin/portableText'
import RichTextEditor from './RichTextEditor'

const CATEGORY_OPTIONS = [
  { label: 'Design', value: 'design' },
  { label: 'Objects', value: 'objects' },
  { label: 'Crafts', value: 'crafts' },
  { label: 'Art', value: 'art' },
  { label: 'Pottery', value: 'pottery' },
  { label: 'Textiles', value: 'textiles' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Interior', value: 'interior' }
]

function toDateTimeLocal(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export default function ArticleForm({ initialArticle, onSubmit, submitLabel, onDelete, deleteLabel = 'Delete' }) {
  const [form, setForm] = useState(() => {
    const publishedAt = toDateTimeLocal(initialArticle?.publishedAt)

    return {
      title: initialArticle?.title || '',
      slug: initialArticle?.slug?.current || '',
      category: initialArticle?.category || 'design',
      mainImagePublicId: initialArticle?.mainImagePublicId || '',
      excerpt: initialArticle?.excerpt || '',
      publishedAt: publishedAt || toDateTimeLocal(),
      author: initialArticle?.author || 'Russell Concept House',
      bodyHtml: portableTextToHtml(initialArticle?.body || []),
      mediaType: initialArticle?.mediaType || 'images',
      videoUrl: initialArticle?.videoUrl || '',
      videoDuration: initialArticle?.videoDuration || '',
      tags: (initialArticle?.tags || []).join(', '),
      galleryPublicIds: initialArticle?.galleryPublicIds || []
    }
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clearMainImagePublicId, setClearMainImagePublicId] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)

  const existingMainImageUrl = initialArticle?.mainImage?.asset?.url || ''
  const existingGalleryUrls = (initialArticle?.gallery || []).map(image => image?.asset?.url).filter(Boolean)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER

  useEffect(() => {
    if (!slugTouched) {
      setForm(prev => ({ ...prev, slug: slugify(prev.title) }))
    }
  }, [form.title, slugTouched])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.cloudinary) {
      setWidgetReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    script.onload = () => setWidgetReady(true)
    script.onerror = () => setError('Cloudinary widget failed to load.')
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const canUpload = Boolean(cloudName && uploadPreset && widgetReady)

  const openUploadWidget = (options, onUpload) => {
    if (!cloudName || !uploadPreset) {
      setError('Cloudinary widget is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.')
      return
    }
    if (!widgetReady || !window.cloudinary) {
      setError('Cloudinary widget is still loading. Please try again.')
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder,
        multiple: false,
        sources: ['local', 'url', 'camera'],
        ...options
      },
      (uploadError, result) => {
        if (uploadError) {
          setError('Upload failed. Please try again.')
          return
        }
        if (result?.event === 'success') {
          onUpload(result.info)
        }
      }
    )

    widget.open()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setIsSubmitting(true)

    try {
        await onSubmit({
          ...form,
          clearMainImagePublicId
        })
      setStatus('Saved successfully.')
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mainImagePreview = form.mainImagePublicId
    ? getOptimizedImageUrl(form.mainImagePublicId, { width: 1200, quality: 'auto' })
    : ''

  const galleryPreviews = useMemo(
    () => form.galleryPublicIds.map(id => getOptimizedImageUrl(id, { width: 800, quality: 'auto' })),
    [form.galleryPublicIds]
  )

  return (
    <form className="admin-card admin-grid" onSubmit={handleSubmit}>
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="title">Title</label>
          <input
            id="title"
            className="admin-input"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="admin-input"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true)
              setForm({ ...form, slug: event.target.value })
            }}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="category">Category</label>
          <select
            id="category"
            className="admin-select"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            {CATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="publishedAt">Published At</label>
          <input
            id="publishedAt"
            className="admin-input"
            type="datetime-local"
            value={form.publishedAt}
            onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="author">Author</label>
          <input
            id="author"
            className="admin-input"
            value={form.author}
            onChange={(event) => setForm({ ...form, author: event.target.value })}
          />
        </div>
      </div>

      <div className="admin-divider" />

      <div className="admin-field">
        <label className="admin-label" htmlFor="excerpt">Excerpt</label>
        <textarea
          id="excerpt"
          className="admin-textarea"
          value={form.excerpt}
          onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
        />
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="body">Body</label>
        <RichTextEditor
          id="body"
          value={form.bodyHtml}
          onChange={(nextValue) => setForm(prev => ({ ...prev, bodyHtml: nextValue }))}
          placeholder="Write the article body. Use the toolbar for bold, italics, and links."
        />
      </div>

      <div className="admin-divider" />

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="mediaType">Media Type</label>
          <select
            id="mediaType"
            className="admin-select"
            value={form.mediaType}
            onChange={(event) => setForm({ ...form, mediaType: event.target.value })}
          >
            <option value="images">Images</option>
            <option value="video">Video</option>
          </select>
          <p className="admin-note">Choose images for Cloudinary uploads or video for YouTube links.</p>
        </div>
      </div>

      <div className="admin-grid admin-media-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="admin-field">
          <label className="admin-label">Main Image (Cloudinary)</label>
          <div className="admin-inline-actions">
            <button
              type="button"
              className="admin-button secondary"
              disabled={!canUpload}
              onClick={() => openUploadWidget({ multiple: false }, (info) => {
                setClearMainImagePublicId(false)
                setForm({ ...form, mainImagePublicId: info.public_id })
              })}
            >
              Upload main image
            </button>
            {form.mainImagePublicId && (
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => {
                  setClearMainImagePublicId(true)
                  setForm({ ...form, mainImagePublicId: '' })
                }}
              >
                Clear Cloudinary image
              </button>
            )}
          </div>
          {!canUpload && (
            <p className="admin-note">Cloudinary upload requires NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.</p>
          )}
          {(mainImagePreview || existingMainImageUrl) && (
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {mainImagePreview && (
                <div>
                  <p className="admin-label" style={{ marginBottom: '0.5rem' }}>Cloudinary preview</p>
                  <div className="admin-image-card hero">
                    <img src={mainImagePreview} alt="Cloudinary preview" />
                  </div>
                </div>
              )}
              {existingMainImageUrl && (
                <div>
                  <p className="admin-label" style={{ marginBottom: '0.5rem' }}>Existing Sanity image</p>
                  <div className="admin-image-card hero">
                    <img src={existingMainImageUrl} alt="Existing main" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-field">
          {form.mediaType === 'video' ? (
            <>
              <label className="admin-label">Video</label>
              <div className="admin-grid" style={{ gap: '1rem' }}>
                <div className="admin-field">
                  <label className="admin-label" htmlFor="videoUrl">YouTube Video URL</label>
                  <input
                    id="videoUrl"
                    className="admin-input"
                    value={form.videoUrl}
                    onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label" htmlFor="videoDuration">Video Duration</label>
                  <input
                    id="videoDuration"
                    className="admin-input"
                    value={form.videoDuration}
                    onChange={(event) => setForm({ ...form, videoDuration: event.target.value })}
                    placeholder="3:08"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <label className="admin-label">Gallery Images (Cloudinary)</label>
              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="admin-button secondary"
                  disabled={!canUpload}
                  onClick={() => openUploadWidget({ multiple: true }, (info) => {
                    setForm(prev => ({
                      ...prev,
                      galleryPublicIds: [...prev.galleryPublicIds, info.public_id]
                    }))
                  })}
                >
                  Add gallery images
                </button>
                {form.galleryPublicIds.length > 0 && (
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => setForm({ ...form, galleryPublicIds: [] })}
                  >
                    Clear gallery
                  </button>
                )}
              </div>
              {galleryPreviews.length > 0 && (
                <div className="admin-image-grid">
                  {galleryPreviews.map((src, index) => (
                    <div className="admin-image-card full" key={`${src}-${index}`}>
                      <img src={src} alt={`Gallery ${index + 1}`} />
                      <div className="admin-image-actions">
                        <span>Image {index + 1}</span>
                        <button
                          type="button"
                          className="admin-button secondary"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              galleryPublicIds: prev.galleryPublicIds.filter((_, idx) => idx !== index)
                            }))
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {existingGalleryUrls.length > 0 && (
                <div>
                  <p className="admin-label" style={{ marginBottom: '0.5rem' }}>Existing Sanity gallery</p>
                  <div className="admin-image-grid">
                    {existingGalleryUrls.map((src, index) => (
                      <div className="admin-image-card full" key={`${src}-${index}`}>
                        <img src={src} alt={`Existing ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="admin-divider" />

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="tags">Tags</label>
          <input
            id="tags"
            className="admin-input"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            placeholder="lighting, interiors, sculptural"
          />
          <p className="admin-note">Comma-separated tags.</p>
        </div>
      </div>

      {error && <p className="admin-note" style={{ color: '#b42318' }}>{error}</p>}
      {status && <p className="admin-note" style={{ color: '#2f6f3e' }}>{status}</p>}

      <div className="admin-inline-actions">
        <button type="submit" className="admin-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        {onDelete && (
          <button type="button" className="admin-button danger" onClick={onDelete}>
            {deleteLabel}
          </button>
        )}
      </div>
    </form>
  )
}
