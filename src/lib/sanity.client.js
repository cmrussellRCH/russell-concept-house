import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { getOptimizedImageUrl, isCloudinaryUrl } from './cloudinary'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'cc0sr5iy',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: true, // Use CDN for read operations
})

// Image URL builder
const builder = imageUrlBuilder(client)

function buildCloudinaryProxy(source) {
  const getUrl = (options = {}) => getOptimizedImageUrl(source, options)

  return {
    width: (w) => ({ 
      height: (h) => ({ 
        quality: (q) => ({ 
          blur: (b) => ({
            url: () => getUrl({ width: w, height: h, quality: q, e_blur: b })
          }),
          url: () => getUrl({ width: w, height: h, quality: q })
        }),
        blur: (b) => ({
          url: () => getUrl({ width: w, height: h, e_blur: b })
        }),
        url: () => getUrl({ width: w, height: h })
      }),
      quality: (q) => ({ 
        blur: (b) => ({
          url: () => getUrl({ width: w, quality: q, e_blur: b })
        }),
        url: () => getUrl({ width: w, quality: q })
      }),
      blur: (b) => ({
        url: () => getUrl({ width: w, e_blur: b })
      }),
      url: () => getUrl({ width: w })
    }),
    height: (h) => ({ 
      quality: (q) => ({ 
        url: () => getUrl({ height: h, quality: q })
      }),
      url: () => getUrl({ height: h })
    }),
    quality: (q) => ({ 
      blur: (b) => ({
        url: () => getUrl({ quality: q, e_blur: b })
      }),
      url: () => getUrl({ quality: q })
    }),
    blur: (b) => ({
      url: () => getUrl({ e_blur: b })
    }),
    url: () => getUrl()
  }
}

export function urlFor(source) {
  if (!source) return { url: () => null }

  if (typeof source === 'string') {
    return buildCloudinaryProxy(source)
  }

  if (source?.cloudinaryPublicId) {
    return buildCloudinaryProxy(source.cloudinaryPublicId)
  }

  // Check if it's a Cloudinary image
  if (source?.asset?.url && isCloudinaryUrl(source.asset.url)) {
    return buildCloudinaryProxy(source)
  }
  
  // Use Sanity's image builder for non-Cloudinary images
  return builder.image(source)
}

// Query helpers
export async function getArticles(limit = null) {
  const query = limit 
    ? `*[_type == "article"] | order((defined(mainImage) || defined(mainImagePublicId)) desc, publishedAt desc) [0..${limit-1}] {
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        category,
        categoryRef->{ title, slug },
        author,
        mediaType,
        mainImagePublicId,
        mainImage {
          asset-> {
            _id,
            url,
            source,
            metadata { dimensions }
          }
        }
      }`
    : `*[_type == "article"] | order((defined(mainImage) || defined(mainImagePublicId)) desc, publishedAt desc) {
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        category,
        categoryRef->{ title, slug },
        author,
        mediaType,
        mainImagePublicId,
        mainImage {
          asset-> {
            _id,
            url,
            source,
            metadata { dimensions }
          }
        }
      }`
  
  const articles = await client.fetch(query)
  return articles
}

export async function getArticleBySlug(slug) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    category,
    categoryRef->{ title, slug },
    author->{
      name
    },
    mainImagePublicId,
    galleryPublicIds,
    availableAtLabel,
    availableAtUrl,
    mainImage {
      asset-> {
        _id,
        url,
        source
      }
    },
    body,
    mediaType,
    videoUrl,
    videoDuration,
    contactInfo,
    gallery[] {
      asset-> {
        _id,
        url,
        source
      }
    }
  }`
  
  return await client.fetch(query, { slug })
}

export async function getCategories() {
  // Get unique categories from all articles
  const query = `array::unique(*[_type == "article"].category)`
  return await client.fetch(query)
}
