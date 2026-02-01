import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { getArticles, urlFor } from '../lib/sanity.client'

function buildImageDimensions(articles) {
  const dimensions = {}
  articles.forEach((article) => {
    const sourceDimensions = article.mainImageDimensions || article.mainImage?.asset?.metadata?.dimensions
    const width = Number(sourceDimensions?.width)
    const height = Number(sourceDimensions?.height)
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      dimensions[article._id] = {
        width,
        height,
        aspectRatio: height / width
      }
    }
  })
  return dimensions
}

export default function Home({ articles }) {
  const [loadedImages, setLoadedImages] = useState(() => buildImageDimensions(articles))
  const [isMobileView, setIsMobileView] = useState(false)
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === 'undefined') return 3
    const width = window.innerWidth
    if (width < 640) return 1
    if (width < 1024) return 2
    return 3
  })
  const [hasScrolled, setHasScrolled] = useState(false)
  const mobileCardRefs = useRef(new Map())
  const visibleCardsRef = useRef(new Set())
  const containerRef = useRef(null)
  const headerOffsetRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 0) {
        setHasScrolled(true)
      }

      if (!isMobileView || visibleCardsRef.current.size === 0) {
        return
      }

      const header = document.querySelector('.mobile-nav-header')
      const headerHeight = header ? header.getBoundingClientRect().height : 80
      const fadeEnd = headerHeight + 80
      const fadeStart = fadeEnd + 260

      visibleCardsRef.current.forEach((node) => {
        if (!node || !node.getBoundingClientRect) return
        const rect = node.getBoundingClientRect()
        const progress = (rect.bottom - fadeEnd) / (fadeStart - fadeEnd)
        const opacity = Math.max(0, Math.min(1, progress))
        const translate = (1 - opacity) * 16
        node.style.setProperty('--reveal-opacity', opacity.toFixed(3))
        node.style.setProperty('--reveal-translate', `${translate.toFixed(1)}px`)
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasScrolled, isMobileView])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frame = null
    const updateOffset = () => {
      frame = null
      const header = document.querySelector('.mobile-nav-header')
      if (!header) return
      const height = header.getBoundingClientRect().height
      if (!height || Math.abs(headerOffsetRef.current - height) < 1) return
      headerOffsetRef.current = height
      container.style.setProperty('--home-header-offset', `${height}px`)
    }

    const handleUpdate = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(updateOffset)
    }

    updateOffset()
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('orientationchange', handleUpdate)
    window.addEventListener('load', handleUpdate)

    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('orientationchange', handleUpdate)
      window.removeEventListener('load', handleUpdate)
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  // Calculate column count based on screen width
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth
      const nextCount = width < 640 ? 1 : width < 1024 ? 2 : 3
      setColumnCount(prev => (prev === nextCount ? prev : nextCount))
      const nextIsMobile = width < 640
      setIsMobileView(prev => (prev === nextIsMobile ? prev : nextIsMobile))
    }
    
    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasScrolled) return
    if (!('IntersectionObserver' in window)) return
    if (!isMobileView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            visibleCardsRef.current.add(entry.target)
          } else {
            entry.target.classList.remove('is-visible')
            visibleCardsRef.current.delete(entry.target)
            entry.target.style.removeProperty('--reveal-opacity')
            entry.target.style.removeProperty('--reveal-translate')
          }
        })
      },
      {
        root: null,
        rootMargin: '0px 0px -35% 0px',
        threshold: 0.2
      }
    )

    mobileCardRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [hasScrolled, articles, loadedImages, isMobileView])

  useEffect(() => {
    if (isMobileView) return
    visibleCardsRef.current.forEach((node) => {
      if (!node) return
      node.classList.remove('is-visible')
      node.style.removeProperty('--reveal-opacity')
      node.style.removeProperty('--reveal-translate')
    })
    visibleCardsRef.current.clear()
  }, [isMobileView])

  // Distribute articles into columns using a balanced approach
  const distributeArticles = () => {
    const columns = Array.from({ length: columnCount }, () => [])
    const columnHeights = new Array(columnCount).fill(0)
    
    articles.forEach((article) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      columns[shortestColumnIndex].push(article)
      
      // Update column height (estimate based on aspect ratio or default)
      const imageData = loadedImages[article._id]
      const estimatedHeight = imageData ? imageData.aspectRatio * 300 : 400
      columnHeights[shortestColumnIndex] += estimatedHeight
    })
    
    return columns
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const columns = distributeArticles()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const pageTitle = 'Russell Concept House | Curated Objects & Lighting'
  const pageDescription = 'Russell Concept House curates objects from the world’s leading designers, blending timeless beauty with thoughtful function to elevate everyday life.'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Russell Concept House" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Masonry gallery grid */}
      <div
        className="min-h-screen px-1 pb-1 pt-0 bg-gradient-to-b from-seasalt via-white to-platinum/20"
        ref={containerRef}
        style={{ marginTop: 'var(--home-header-offset, 80px)' }}
      >
        <div className="flex flex-col gap-1 sm:hidden">
          {articles.map((article, index) => {
            const mainImageSource = article.mainImagePublicId || article.mainImage
            const hasImage = Boolean(mainImageSource)
            const imageData = loadedImages[article._id]
            const aspectRatio = imageData?.aspectRatio || 1.5

            return (
              <Link
                key={article._id}
                href={`/articles/${article.slug.current}`}
                className="relative overflow-hidden group cursor-pointer animate-fadeIn home-card"
                ref={(node) => {
                  if (node) {
                    mobileCardRefs.current.set(article._id, node)
                  } else {
                    mobileCardRefs.current.delete(article._id)
                  }
                }}
              >
                <div
                  className="relative w-full"
                  style={{
                    paddingBottom: `${aspectRatio * 100}%`
                  }}
                >
                  {hasImage ? (
                    <>
                      <img
                        src={urlFor(mainImageSource)
                          .width(800)
                          .quality(85)
                          .url()}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        loading="lazy"
                        onLoad={(event) => {
                          const { naturalWidth, naturalHeight } = event.currentTarget
                          if (!naturalWidth || !naturalHeight) return
                          setLoadedImages(prev => {
                            const existing = prev[article._id]
                            if (existing && existing.width === naturalWidth && existing.height === naturalHeight) {
                              return prev
                            }
                            return {
                              ...prev,
                              [article._id]: {
                                width: naturalWidth,
                                height: naturalHeight,
                                aspectRatio: naturalHeight / naturalWidth
                              }
                            }
                          })
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 home-card-gradient"></div>
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      index % 5 === 0 ? 'from-zinc-900 to-zinc-700' :
                      index % 5 === 1 ? 'from-stone-800 to-amber-900' :
                      index % 5 === 2 ? 'from-emerald-900 to-emerald-700' :
                      index % 5 === 3 ? 'from-indigo-950 to-indigo-800' :
                      'from-neutral-900 to-neutral-600'
                    } transition-transform duration-700 group-hover:scale-[1.02]`}></div>
                  )}

                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 home-card-overlay">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 home-card-overlay-content">
                      <p className="text-white/90 text-xs tracking-widest mb-2">
                        {article.category?.toUpperCase() || 'ARTICLE'} • {formatDate(article.publishedAt)}
                      </p>
                      <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-serif font-light tracking-wide mb-2">
                        {article.title}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="hidden sm:flex gap-1">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 flex flex-col gap-1">
              {column.map((article, index) => {
                const mainImageSource = article.mainImagePublicId || article.mainImage
                const hasImage = Boolean(mainImageSource)
                const imageData = loadedImages[article._id]
                const aspectRatio = imageData?.aspectRatio || 1.5

                return (
                  <Link
                    key={article._id}
                    href={`/articles/${article.slug.current}`}
                    className="relative overflow-hidden group cursor-pointer animate-fadeIn home-card"
                  >
                    <div
                      className="relative w-full"
                      style={{
                        paddingBottom: `${aspectRatio * 100}%`
                      }}
                    >
                      {hasImage ? (
                        <>
                          <img
                            src={urlFor(mainImageSource)
                              .width(800)
                              .quality(85)
                              .url()}
                            alt={article.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                            onLoad={(event) => {
                              const { naturalWidth, naturalHeight } = event.currentTarget
                              if (!naturalWidth || !naturalHeight) return
                              setLoadedImages(prev => {
                                const existing = prev[article._id]
                                if (existing && existing.width === naturalWidth && existing.height === naturalHeight) {
                                  return prev
                                }
                                return {
                                  ...prev,
                                  [article._id]: {
                                    width: naturalWidth,
                                    height: naturalHeight,
                                    aspectRatio: naturalHeight / naturalWidth
                                  }
                                }
                              })
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 home-card-gradient"></div>
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${
                          index % 5 === 0 ? 'from-zinc-900 to-zinc-700' :
                          index % 5 === 1 ? 'from-stone-800 to-amber-900' :
                          index % 5 === 2 ? 'from-emerald-900 to-emerald-700' :
                          index % 5 === 3 ? 'from-indigo-950 to-indigo-800' :
                          'from-neutral-900 to-neutral-600'
                        } transition-transform duration-700 group-hover:scale-[1.02]`}></div>
                      )}

                      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 home-card-overlay">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 home-card-overlay-content">
                          <p className="text-white/90 text-xs tracking-widest mb-2">
                            {article.category?.toUpperCase() || 'ARTICLE'} • {formatDate(article.publishedAt)}
                          </p>
                          <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-serif font-light tracking-wide mb-2">
                            {article.title}
                          </h3>
                          <p className="text-white/80 text-sm line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
        
        {articles.length === 0 && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-3xl font-serif font-light mb-4">No articles found</h2>
              <p className="text-dim-gray">Please check your Sanity Studio for published articles.</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export async function getStaticProps() {
  try {
    const articles = await getArticles()
    
    return {
      props: {
        articles: articles || []
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error fetching articles:', error)
    return {
      props: {
        articles: []
      }
    }
  }
}
