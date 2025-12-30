import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { getArticles, urlFor } from '../lib/sanity.client'
import { isCloudinaryUrl } from '../lib/cloudinary'
import Layout from '../components/Layout'

export default function ArticlesPage({ articles }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoaded, setIsLoaded] = useState(false)
  const pageRef = useRef(null)
  const gridRef = useRef(null)
  const hoverPrimaryRef = useRef(null)
  const hoverSecondaryRef = useRef(null)
  const activeHoverRef = useRef('primary')

  useEffect(() => {
    // Wait for fonts to load before enabling transitions
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setIsLoaded(true)
      })
    } else {
      // Fallback for browsers without font loading API
      const timer = setTimeout(() => {
        setIsLoaded(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!pageRef.current || !gridRef.current) {
      return
    }

    const updateGridOffset = () => {
      const offset = gridRef.current.getBoundingClientRect().top + window.scrollY
      pageRef.current.style.setProperty('--articles-grid-offset', String(offset))
    }

    updateGridOffset()
    window.addEventListener('resize', updateGridOffset)
    return () => {
      window.removeEventListener('resize', updateGridOffset)
    }
  }, [isLoaded])

  const setHoverBackground = (imageUrl) => {
    if (!hoverPrimaryRef.current || !hoverSecondaryRef.current) {
      return
    }

    const primary = hoverPrimaryRef.current
    const secondary = hoverSecondaryRef.current

    if (!imageUrl) {
      primary.style.opacity = '0'
      secondary.style.opacity = '0'
      return
    }

    const active = activeHoverRef.current === 'primary' ? primary : secondary
    const next = active === primary ? secondary : primary
    const nextValue = `url(${imageUrl})`
    const activeValue = active.style.getPropertyValue('--articles-hover-image')

    if (activeValue === nextValue) {
      active.style.opacity = '1'
      next.style.opacity = '0'
      return
    }

    next.style.setProperty('--articles-hover-image', nextValue)
    next.style.opacity = '1'
    active.style.opacity = '0'
    activeHoverRef.current = active === primary ? 'secondary' : 'primary'
  }

  useEffect(() => {
    if (!pageRef.current) {
      return
    }

    let frame = null
    const updateScrollVar = () => {
      frame = null
      pageRef.current.style.setProperty('--articles-scroll', String(window.scrollY))
    }

    const handleScroll = () => {
      if (frame !== null) {
        return
      }
      frame = window.requestAnimationFrame(updateScrollVar)
    }

    updateScrollVar()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  // Get unique categories from articles
  const allCategories = ['all', ...new Set(
    articles
      .map(article => article.categoryRef?.slug?.current || article.category)
      .filter(Boolean)
      .filter(cat => cat.toLowerCase() !== 'conversations')
  )]
  
  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => (article.categoryRef?.slug?.current || article.category) === selectedCategory)

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format title with weight variation and smaller "by"
  const formatTitle = (title) => {
    const parts = title.split(' by ')
    if (parts.length === 2) {
      return (
        <>
          <span className="product-name-bold">{parts[0].toUpperCase()}</span> <span className="title-by">by</span> <span className="designer-name-light">{parts[1].toUpperCase()}</span>
        </>
      )
    }
    return title.toUpperCase()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const pageTitle = 'Articles | Russell Concept House'
  const pageDescription = 'Explore 100+ curated articles featuring lighting, objects, and designers highlighted by Russell Concept House.'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/articles`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Russell Concept House" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/articles`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>
      
      <div 
        ref={pageRef}
        className={`articles-page ${isLoaded ? '' : 'no-transitions'}`}
        style={{ minHeight: '100vh', background: '#fafafa' }}
      >
        <div className="articles-wrapper" style={{ minHeight: '100vh', position: 'relative' }}>
            <div className="articles-hover-bg" aria-hidden="true" ref={hoverPrimaryRef}></div>
            <div className="articles-hover-bg" aria-hidden="true" ref={hoverSecondaryRef}></div>
            {/* Content Layer */}
            <div className="content-layer" style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
              {/* Header Section */}
              <header className="header-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Filter Section */}
                <div className="filter-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                  <div className="category-filter-wrapper lg:contents">
                    <div className="categories-container">
                      <span className="categories-label">
                        {selectedCategory === 'all' ? 'Categories' : selectedCategory.toUpperCase()}
                      </span>
                      <div className="category-list">
                        {allCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                          >
                            {cat.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Mobile scroll indicator */}
                    <div className="scroll-indicator lg:hidden"></div>
                  </div>
                </div>
              </header>

              {/* Articles Grid */}
              <div 
                className="articles-grid"
                ref={gridRef}
                style={{
                  padding: '2rem 2rem 4rem',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}
              >
                {filteredArticles.map((article, index) => {
                  const displayIndex = filteredArticles.length - index
                  const mainImageSource = article.mainImagePublicId || article.mainImage
                  const isCloudinarySource = typeof mainImageSource === 'string'
                    || isCloudinaryUrl(mainImageSource?.asset?.url)
                  const backgroundUrl = mainImageSource
                    ? (isCloudinarySource
                      ? urlFor(mainImageSource).width(1400).quality(75).url()
                      : urlFor(mainImageSource).width(1200).blur(27).url())
                    : null

                  return (
                    <Link key={article._id} href={`/articles/${article.slug.current}`} className="article-link">
                      <div 
                        className={`article-row ${isLoaded ? 'fonts-loaded' : ''}`}
                        onMouseEnter={() => setHoverBackground(backgroundUrl)}
                        onMouseLeave={() => setHoverBackground(null)}
                        onFocus={() => setHoverBackground(backgroundUrl)}
                        onBlur={() => setHoverBackground(null)}
                        onTouchStart={() => setHoverBackground(backgroundUrl)}
                        onTouchEnd={() => setHoverBackground(null)}
                        onTouchCancel={() => setHoverBackground(null)}
                      >
                      <div className="article-inner">
                        <span className="article-number">
                          {String(displayIndex).padStart(2, '0')}
                        </span>
                        
                        <div className="article-main">
                          <h2 className="article-title">
                            {article.mediaType === 'video' && (
                              <svg 
                                className="video-icon" 
                                width="28" 
                                height="28" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5"
                                style={{ display: 'inline-block', marginRight: '0.75rem', verticalAlign: 'middle' }}
                              >
                                <circle cx="12" cy="12" r="10"/>
                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                              </svg>
                            )}
                            {formatTitle(article.title)}
                          </h2>
                          <div className="article-meta">
                            <span>{(article.categoryRef?.title || article.category || 'Uncategorized').toUpperCase()}</span>
                            <span>{formatDate(article.publishedAt)}</span>
                            {article.mediaType === 'video' && <span>VIDEO</span>}
                          </div>
                          {article.excerpt && (
                            <p className="article-excerpt">{article.excerpt}</p>
                          )}
                        </div>
                        
                        <svg 
                          className="article-arrow" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Counter */}
              <div className="counter">
                {filteredArticles.length} ARTICLES
              </div>
            </div>
          </div>
      </div>
    </>
  )
}

// Remove getLayout to prevent double Layout wrapper

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
