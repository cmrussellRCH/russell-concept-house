export default async function handler(req, res) {
  // Only allow POST or GET (Sanity webhooks typically POST)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const headerSecret = req.headers['x-revalidate-secret']
  const secret = headerSecret || req.query.secret
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid secret' })
  }

  // Sanity payloads often include body.slug.current
  const payload = req.body || {}
  const slug =
    payload?.slug?.current ||
    payload?.slug ||
    payload?.document?.slug?.current ||
    payload?.document?.slug

  const paths = ['/', '/articles', '/conversations']

  if (slug) {
    paths.push(`/articles/${slug}`)
    paths.push(`/conversations/${slug}`)
  }

  try {
    await Promise.all(paths.map((path) => res.revalidate(path)))
    return res.json({ revalidated: true, paths })
  } catch (err) {
    console.error('Error revalidating', err)
    return res.status(500).json({ message: 'Error revalidating' })
  }
}
