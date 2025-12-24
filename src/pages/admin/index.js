import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/admin/AdminLayout'
import ArticleForm from '../../components/admin/ArticleForm'
import { requireAdminSession } from '../../lib/admin/session'
import { requireWriteClient } from '../../lib/sanity.server'
import { urlFor } from '../../lib/sanity.client'

export default function AdminDashboard({ articles, selectedArticle, selectedId, isNew }) {
  const router = useRouter()
  const queryId = typeof router.query.id === 'string' ? router.query.id : selectedId
  const isCreating = router.query.new === '1' || isNew
  const activeId = isCreating ? null : queryId
  const isEditingDraft = Boolean(selectedArticle?._id?.startsWith('drafts.'))

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleCreate = async (payload) => {
    const response = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'published' })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Unable to create article.')
    }

    const data = await response.json()
    if (data?.article?._id) {
      router.push(`/admin?id=${data.article._id}`)
    } else {
      router.push('/admin')
    }
  }

  const handleCreateDraft = async (payload) => {
    const response = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'draft' })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Unable to save draft.')
    }

    const data = await response.json()
    if (data?.article?._id) {
      router.push(`/admin?id=${data.article._id}`)
    } else {
      router.push('/admin')
    }
  }

  const handleUpdate = async (payload) => {
    if (!selectedArticle?._id) return
    const response = await fetch(`/api/admin/articles/${selectedArticle._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'published' })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Unable to update article.')
    }

    const data = await response.json()
    if (data?.article?._id) {
      router.replace(`/admin?id=${data.article._id}`)
    }
  }

  const handleSaveDraft = async (payload) => {
    if (!selectedArticle?._id) {
      return handleCreateDraft(payload)
    }

    const response = await fetch(`/api/admin/articles/${selectedArticle._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'draft' })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Unable to save draft.')
    }

    const data = await response.json()
    if (data?.article?._id) {
      router.replace(`/admin?id=${data.article._id}`)
    }
  }

  const handlePublish = async (payload) => {
    if (!selectedArticle?._id) return
    const response = await fetch(`/api/admin/articles/${selectedArticle._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'published' })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Unable to publish article.')
    }

    const data = await response.json()
    if (data?.article?._id) {
      router.replace(`/admin?id=${data.article._id}`)
    }
  }

  const handleDelete = async () => {
    if (!selectedArticle?._id) return
    const confirmed = window.confirm('Delete this article? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/articles/${selectedArticle._id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Unable to delete article.')
      }

      router.replace('/admin')
    } catch (error) {
      window.alert(error.message || 'Unable to delete article.')
    }
  }

  return (
    <AdminLayout
      title="Articles"
      subtitle="Create and update articles that sync directly to Sanity."
      actions={
        <>
          <Link href="/admin?new=1" className="admin-button">New Article</Link>
          <button className="admin-button secondary" type="button" onClick={handleLogout}>Log Out</button>
        </>
      }
    >
      <div className="admin-split">
        <aside className="admin-sidebar">
          <div className="admin-card admin-list">
            {articles.length === 0 && (
              <p className="admin-note">No articles yet. Create your first article to get started.</p>
            )}
            {articles.map(article => {
              const mainImageSource = article.mainImagePublicId || article.mainImage
              const thumbnailUrl = mainImageSource
                ? urlFor(mainImageSource).width(160).height(120).quality(80).url()
                : null
              const isActive = activeId === article._id
              const isDraft = article._id.startsWith('drafts.')

              return (
                <Link
                  key={article._id}
                  href={{ pathname: '/admin', query: { id: article._id } }}
                  className={`admin-row${isActive ? ' is-active' : ''}`}
                >
                  <div className="admin-row-media">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={article.title} loading="lazy" />
                    ) : (
                      <span className="admin-row-placeholder">No image</span>
                    )}
                  </div>
                  <div className="admin-row-content">
                    <div className="admin-row-title">{article.title}</div>
                    <div className="admin-row-meta">
                      {isDraft && <span className="admin-badge warning">Draft</span>}
                      <span className="admin-badge">{article.category || 'uncategorized'}</span>
                      {article.mediaType && <span className="admin-badge">{article.mediaType}</span>}
                      {article.publishedAt && (
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </aside>

        <section className="admin-panel">
          {isCreating && (
            <>
              <ArticleForm
                key="new"
                submitLabel="Create Article"
                onSubmit={handleCreate}
                onSaveDraft={handleCreateDraft}
                draftLabel="Save Draft"
              />
            </>
          )}

          {!isCreating && selectedArticle && (
            <>
              <ArticleForm
                key={selectedArticle._id}
                initialArticle={selectedArticle}
                submitLabel={isEditingDraft ? 'Publish Article' : 'Save Changes'}
                onSubmit={isEditingDraft ? handlePublish : handleUpdate}
                onSaveDraft={handleSaveDraft}
                draftLabel="Save Draft"
                onDelete={handleDelete}
                deleteLabel="Delete Article"
              />
            </>
          )}

          {!isCreating && !selectedArticle && (
            <div className="admin-card admin-panel-empty">
              <p className="admin-note">Select an article to edit, or create a new article to get started.</p>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}

export async function getServerSideProps({ req, query }) {
  const session = requireAdminSession(req)
  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false
      }
    }
  }

  const client = requireWriteClient()
  const articles = await client.fetch(
    `*[_type == "article"] | order(coalesce(publishedAt, _updatedAt) desc) {
      _id,
      title,
      slug,
      category,
      mediaType,
      publishedAt,
      _updatedAt,
      mainImagePublicId,
      mainImage { asset-> { _id, url } }
    }`
  )

  const isNew = query?.new === '1'
  const selectedId = typeof query?.id === 'string' ? query.id : null
  let selectedArticle = null

  if (!isNew && selectedId) {
    selectedArticle = await client.fetch(
      `*[_type == "article" && _id == $id][0] {
        _id,
        title,
        slug,
        category,
        mainImagePublicId,
        mainImage { asset-> { url } },
        excerpt,
        publishedAt,
        author,
        body,
        mediaType,
        videoUrl,
        videoDuration,
        tags,
        galleryPublicIds,
        gallery[] { asset-> { url } }
      }`,
      { id: selectedId }
    )
  }

  return {
    props: {
      articles,
      selectedArticle,
      selectedId,
      isNew
    }
  }
}
