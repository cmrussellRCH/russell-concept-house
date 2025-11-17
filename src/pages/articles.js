import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getArticles, urlFor } from '../lib/sanity.client'
import Layout from '../components/Layout'

export default function ArticlesPage({ articles }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoaded, setIsLoaded] = useState(false)

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

  // Get unique categories from articles
  const allCategories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean).filter(cat => cat.toLowerCase() !== 'conversations'))]
  
  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory)

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

  return (
    <>
      <Head>
        <title>Articles - Russell Concept House</title>
        <style>{`
          /* Critical layout styles - must load immediately */
          .articles-grid {
            padding: 2rem 2rem 4rem !important;
            max-width: 1400px !important;
            margin: 0 auto !important;
          }
          
          .articles-wrapper {
            min-height: 100vh !important;
            position: relative !important;
          }
          
          .content-layer {
            position: relative !important;
            z-index: 10 !important;
            background: transparent !important;
          }
          
          .header-section {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          
          .filter-section {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
          }
          
          .article-row {
            width: 100% !important;
          }
          
          /* Ensure fonts are loaded before showing content */
          .articles-page {
            min-height: 100vh;
            background: #fafafa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Prevent font loading flicker */
          .article-title,
          .article-meta,
          .article-excerpt,
          .article-number,
          .categories-label,
          .category-btn,
          .counter {
            font-synthesis: none;
            text-rendering: optimizeLegibility;
          }
          
          /* Disable transitions on page load but keep background transitions */
          .no-transitions .article-row,
          .no-transitions .category-list,
          .no-transitions .categories-label,
          .no-transitions .article-title,
          .no-transitions .article-arrow {
            transition: none !important;
          }
          
          /* Always allow background transitions */
          .article-row::before {
            transition: opacity 0.3s ease-in-out !important;
          }
          
          /* Link wrapper styles */
          .article-link {
            display: block;
            text-decoration: none;
            color: inherit;
          }
          
          /* CSS-only hover background effect */
          .article-row {
            position: relative;
          }
          
          .article-row::before {
            content: '';
            position: fixed;
            top: -50px;
            left: -50px;
            width: calc(100vw + 100px);
            height: calc(100vh + 100px);
            background: 
              linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), /* White overlay at 40% */
              var(--bg-image, none); /* Background image */
            background-size: cover;
            background-position: center;
            filter: blur(15px) saturate(1.2);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
            z-index: -1;
          }
          
          .article-row:hover::before,
          .article-row:active::before {
            opacity: 1;
          }
          
          /* Additional selectors for touch interaction on mobile */
          @media (pointer: coarse) {
            .article-link:active .article-row::before {
              opacity: 1;
            }
          }
          
          .header-section {
            position: relative;
            padding: 2rem 0;
            padding-top: 8rem;
            background: transparent;
            z-index: 20;
          }
          
          .header-minimal {
            text-align: center;
            margin-bottom: 1rem;
            width: 100%;
          }
          
          .header-title {
            font-size: 3rem;
            font-weight: 300;
            color: #000;
            font-family: 'Playfair Display', serif;
            letter-spacing: -0.02em;
            transition: color 0.3s ease-in-out;
          }
          
          .filter-section {
            position: relative;
          }
          
          .categories-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 0.5rem 0;
            background: transparent;
            position: relative;
            min-width: 200px;
          }
          
          .categories-label {
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            color: #000;
            text-transform: uppercase;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
            position: relative;
            padding: 0 1.5rem;
            margin-left: 2px;
            transition: color 0.3s ease-in-out, opacity 0.3s ease-in-out;
          }
          
          .categories-label::before {
            content: '[';
            position: absolute;
            left: 0;
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }
          
          .categories-label::after {
            content: ']';
            position: absolute;
            right: 0;
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }
          
          .categories-container:hover .categories-label {
            opacity: 0;
            pointer-events: none;
          }
          
          .categories-container:hover .categories-label::before,
          .categories-container:hover .categories-label::after {
            opacity: 0;
          }
          
          .category-list {
            display: flex;
            gap: 1rem;
            align-items: center;
            max-width: 0;
            overflow: hidden;
            opacity: 0;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out;
            padding-left: 0;
            white-space: nowrap;
          }
          
          .categories-container:hover .category-list {
            max-width: 1000px;
            opacity: 1;
          }
          
          /* Mobile category filter improvements */
          @media (max-width: 768px) {
            .categories-container:hover .category-list,
            .categories-container .category-list {
              max-width: 100%;
              opacity: 1;
            }
            
            .categories-container:hover .categories-label,
            .categories-label {
              opacity: 1;
              pointer-events: all;
            }
            
            /* Mobile category filter wrapper */
            .category-filter-wrapper {
              position: relative;
              width: 100%;
              margin: 0 -1rem;
              padding: 0 1rem;
            }
            
            .categories-container {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            
            .categories-container::-webkit-scrollbar {
              display: none;
            }
            
            .category-list {
              position: relative;
              padding: 0 1rem;
              gap: 0.75rem;
            }
            
            /* Minimal category button styles - underline approach */
            .category-btn {
              padding: 0.5rem 0.25rem;
              padding-bottom: 0.75rem;
              border-bottom: 2px solid transparent;
              transition: all 0.2s ease;
              background: none;
              color: #9ca3af;
              font-size: 0.875rem;
              font-weight: 400;
            }
            
            .category-btn.active {
              border-bottom-color: #000;
              color: #000;
              font-weight: 500;
            }
            
            /* Scroll indicator gradient */
            .scroll-indicator {
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 2rem;
              background: linear-gradient(to left, #fafafa, transparent);
              pointer-events: none;
              z-index: 10;
            }
          }
          
          .category-btn {
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: #000;
            background: none;
            border: none;
            padding: 0.25rem 0.5rem;
            cursor: pointer;
            white-space: nowrap;
            text-transform: uppercase;
          }
          
          .category-btn:hover {
            color: #000;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 15px;
          }
          
          .category-btn.active {
            color: #000;
            font-weight: 500;
          }
          
          .article-row {
            padding: 3rem 2rem;
            margin: 0 -2rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            cursor: pointer;
            position: relative;
          }
          
          /* Mobile touch area improvements */
          @media (max-width: 768px) {
            .article-row {
              padding: 2rem 1rem;
              margin: 0 -1rem;
              touch-action: pan-y;
              width: 100%;
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
            }
            
            /* Make background image show on touch for mobile */
            .article-row:active::before,
            .article-link:active .article-row::before {
              opacity: 1;
              transition: opacity 0.2s ease-in-out;
            }
            
            /* Fix touch area - ensure link is proper block */
            .article-link {
              display: block;
              text-decoration: none;
              color: inherit;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Update text animations to use parent selector on mobile */
            .article-link:active .article-title {
              transform: translateX(5px);
            }
            
            .article-link:active .article-meta {
              opacity: 0.9;
            }
            
            .article-link:active .article-arrow {
              transform: translateX(5px);
            }
          }
          
          .article-row:hover {
            /* Remove all visual box effects - only arrow and background will change */
          }
          
          .article-inner {
            display: grid;
            grid-template-columns: 80px 1fr auto;
            gap: 2rem;
            align-items: baseline;
            position: relative;
          }
          
          .article-number {
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #000;
            font-weight: 300;
            transition: color 0.3s ease-in-out;
          }
          
          .article-main {
            flex: 1;
          }
          
          .article-title {
            font-size: clamp(1.75rem, 3.5vw, 3rem);
            font-weight: 300;
            line-height: 1.1;
            margin-bottom: 0.5rem;
            font-family: 'Playfair Display', serif;
            color: #000;
          }
          
          .article-title * {
            color: #000;
          }
          
          /* Typography weight variation styles */
          .product-name-bold {
            font-weight: 500;
          }
          
          .designer-name-light {
            font-weight: 300;
            opacity: 0.8;
          }
          
          .title-by {
            font-size: 0.7em;
            font-weight: 300;
            text-transform: lowercase;
          }
          
          .article-row:hover .article-title {
            /* Remove letter-spacing change to prevent text reflow */
          }
          
          .article-meta {
            display: flex;
            gap: 1.5rem;
            font-size: 0.875rem;
            color: #000;
            font-family: 'Inter', sans-serif;
            opacity: 1;
          }
          
          
          .article-excerpt {
            font-size: 1rem;
            line-height: 1.6;
            color: #000;
            margin-top: 0.5rem;
            max-width: 600px;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }
          
          
          /* Ensure text stays black on hover */
          .article-row:hover .article-title,
          .article-row:hover .article-title *,
          .article-row:hover .article-meta,
          .article-row:hover .article-excerpt,
          .article-row:hover .article-number {
            color: #000 !important;
          }
          
          /* Keep navigation black when hovering article rows */
          body:has(.article-row:hover) header .logo-text,
          body:has(.article-row:hover) header .menu-item,
          body:has(.article-row:hover) header nav a,
          body:has(.article-row:hover) header span {
            color: #000 !important;
          }
          
          /* Video icon styles */
          .video-icon {
            opacity: 0.8;
            transition: opacity 0.3s ease-in-out;
          }
          
          .article-row:hover .video-icon {
            opacity: 1;
          }
          
          /* Staggered animations for dramatic hover effect */
          .article-row.fonts-loaded .article-meta {
            transition: all 0.3s ease;
          }

          .article-row.fonts-loaded .article-title {
            transition: all 0.3s ease 0.05s; /* 50ms delay for stagger effect */
          }

          .article-row.fonts-loaded .article-excerpt {
            transition: all 0.3s ease 0.1s; /* 100ms delay for stagger effect */
          }
          
          /* Dramatic hover effects with subtle movement */
          .article-row:hover .article-meta,
          .article-link:active .article-meta {
            opacity: 0.5;
            transform: translateX(2px);
          }

          .article-row:hover .article-title,
          .article-link:active .article-title {
            transform: translateX(6px);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          }

          .article-row:hover .article-excerpt,
          .article-link:active .article-excerpt {
            opacity: 0.9;
            transform: translateX(4px);
          }
          
          /* Enhanced arrow animation */
          .article-row.fonts-loaded .article-arrow {
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.3s ease 0.15s; /* Slightly after description */
          }

          .article-row:hover .article-arrow,
          .article-link:active .article-arrow {
            opacity: 1;
            transform: translateX(0);
          }
          
          /* Performance optimization */
          .article-row.fonts-loaded .article-meta,
          .article-row.fonts-loaded .article-title,
          .article-row.fonts-loaded .article-excerpt,
          .article-row.fonts-loaded .article-arrow {
            will-change: transform, opacity;
          }
          
          .counter {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            color: #000;
            z-index: 100;
            transition: color 0.3s ease-in-out;
          }
          
          @media (max-width: 1024px) {
            .article-inner {
              grid-template-columns: 1fr auto;
            }
            
            .article-number {
              display: none;
            }
            
            .articles-grid {
              padding-top: 2rem;
            }
          }
          
          @media (max-width: 768px) {
            .articles-grid {
              padding: 1rem 1rem 3rem;
            }
            
            .article-row {
              padding: 2rem 1rem;
              margin: 0 -1rem;
            }
            
            .article-inner {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .article-title {
              font-size: 1.375rem;
              line-height: 1.3;
              margin-bottom: 0.75rem;
            }
            
            .article-excerpt {
              font-size: 1rem;
              line-height: 1.5;
            }
            
            .article-meta {
              font-size: 0.875rem;
              gap: 1rem;
              flex-wrap: wrap;
            }
            
            .article-arrow {
              display: none;
            }
            
            .counter {
              display: none;
            }
            
            .header-section {
              padding-top: 6rem;
            }
            
            .header-title {
              font-size: 2rem;
            }
            
            .categories-container {
              width: 100%;
              padding: 0 1rem;
            }
            
            .categories-label {
              font-size: 0.75rem;
            }
            
            .category-list {
              position: relative;
              left: 0;
              transform: none;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
              -ms-overflow-style: none;
              padding: 0;
              gap: 0.5rem;
            }
            
            .category-list::-webkit-scrollbar {
              display: none;
            }
            
            .category-btn {
              white-space: nowrap;
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
            }
          }
        `}</style>
      </Head>
      
      <div 
        className={`articles-page ${isLoaded ? '' : 'no-transitions'}`}
        style={{ minHeight: '100vh', background: '#fafafa' }}
      >
        <div className="articles-wrapper" style={{ minHeight: '100vh', position: 'relative' }}>
            {/* Content Layer */}
            <div className="content-layer" style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
              {/* Header Section */}
              <header className="header-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Filter Section */}
                <div className="filter-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                  <div className="category-filter-wrapper lg:contents">
                    <div className="categories-container">
                      <span className="categories-label">
                        {selectedCategory === 'all' ? 'All' : selectedCategory.toUpperCase()}
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
                style={{
                  padding: '2rem 2rem 4rem',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}
              >
                {filteredArticles.map((article, index) => (
                  <Link key={article._id} href={`/articles/${article.slug.current}`} className="article-link">
                    <div 
                      className={`article-row ${isLoaded ? 'fonts-loaded' : ''}`}
                      style={{
                        '--bg-image': article.mainImage?.asset 
                          ? `url(${urlFor(article.mainImage).width(1200).blur(27).url()})` 
                          : 'none'
                      }}
                    >
                      <div className="article-inner">
                        <span className="article-number">
                          {String(index + 1).padStart(2, '0')}
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
                            <span>{article.category?.toUpperCase() || 'UNCATEGORIZED'}</span>
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
                ))}
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
