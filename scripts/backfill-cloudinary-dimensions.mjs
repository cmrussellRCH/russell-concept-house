import 'dotenv/config'
import { createClient } from '@sanity/client'
import { v2 as cloudinary } from 'cloudinary'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!projectId || !token) {
  throw new Error('Missing SANITY project configuration (projectId/token).')
}

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary configuration (cloudName/apiKey/apiSecret).')
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
})

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false
})

const query = `*[_type == "article" && defined(mainImagePublicId) && (!defined(mainImageDimensions.width) || !defined(mainImageDimensions.height))]{
  _id,
  mainImagePublicId
}`

const articles = await client.fetch(query)

if (!articles.length) {
  console.log('No articles missing Cloudinary dimensions.')
  process.exit(0)
}

console.log(`Found ${articles.length} articles missing Cloudinary dimensions.`)

for (const article of articles) {
  const publicId = article.mainImagePublicId
  if (!publicId) continue

  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'image' })
    const width = Number(resource.width)
    const height = Number(resource.height)

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      console.warn(`Skipping ${article._id}: invalid dimensions from Cloudinary.`)
      continue
    }

    await client
      .patch(article._id)
      .set({ mainImageDimensions: { width, height } })
      .commit()

    console.log(`Updated ${article._id} (${width}x${height}).`)
  } catch (error) {
    console.warn(`Failed ${article._id}: ${error.message}`)
  }
}
