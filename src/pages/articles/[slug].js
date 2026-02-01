import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getArticleBySlug, getArticles, urlFor } from '../../lib/sanity.client'
import { useState, useEffect, useRef } from 'react'
import VideoPlayer from '../../components/VideoPlayer'

export default function ArticlePage({ article }) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-light mb-4">Article not found</h1>
          <p className="text-dim-gray">This article may have been removed or is no longer available.</p>
        </div>
      </div>
    )
  }
  
  // Redirect video conversations to the new route
  if (article.mediaType === 'video') {
    if (typeof window !== 'undefined') {
      window.location.href = `/conversations/${article.slug.current}`
    }
    return null
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const calculateReadTime = (content) => {
    if (!content) return '5 min read'
    const text = content.map(block => 
      block.children?.map(child => child.text).join('') || ''
    ).join(' ')
    const wordsPerMinute = 200
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }

  // Parse title to extract product name and brand
  const parseTitle = (title) => {
    const parts = title.split(' by ')
    if (parts.length === 2) {
      return {
        productName: parts[0].trim(),
        brandName: parts[1].trim()
      }
    }
    // If no "by" in title, return the whole title as product name
    return {
      productName: title,
      brandName: null
    }
  }

  const formatDesignerName = (name) => {
    if (!name) return ''
    const titleCaseExceptions = new Set(['CO', 'INC', 'LLC', 'LTD', 'PLC'])
    return name
      .split(' ')
      .map((word) => {
        if (word === '&') return '&'
        const match = word.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/)
        if (!match) return word
        const [, leading, letters, trailing] = match
        const isAllCaps = letters === letters.toUpperCase()
        if (!isAllCaps) return word
        const upper = letters.toUpperCase()
        if (upper.length <= 3 && !titleCaseExceptions.has(upper)) {
          return `${leading}${upper}${trailing}`
        }
        const titled = `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`
        return `${leading}${titled}${trailing}`
      })
      .join(' ')
  }

  const renderContent = (content) => {
    if (!content) return null
    
    return content.map((block, index) => {
      if (block._type === 'block') {
        const nodes = (block.children || []).map((child, childIndex) => {
          if (!child?.text) return null
          const linkMark = block.markDefs?.find(mark => 
            mark._type === 'link' && child.marks?.includes(mark._key)
          )

          let node = child.text
          const marks = Array.isArray(child.marks) ? child.marks : []
          marks.forEach((mark) => {
            if (mark === 'strong') {
              node = <strong>{node}</strong>
              return
            }
            if (mark === 'em') {
              node = <em>{node}</em>
              return
            }
            const markDef = block.markDefs?.find(def => def._key === mark && def._type === 'link')
            if (markDef?.href) {
              node = (
                <a href={markDef.href} target="_blank" rel="noreferrer noopener">
                  {node}
                </a>
              )
            }
          })

          return <span key={`${index}-${childIndex}`}>{node}</span>
        }).filter(Boolean)

        if (nodes.length === 0) return null

        return (
          <p key={index} className="paragraph">
            {nodes}
          </p>
        )
      }
      return null
    })
  }

  // Share functions
  const shareToInstagram = (url) => {
    // Instagram doesn't have direct URL sharing, show a message
    copyToClipboard(url);
    alert('Link copied! Share it on Instagram');
  };

  const shareToFacebook = (url) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToPinterest = (url, image) => {
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}`, '_blank');
  };

  const shareToReddit = (url, title) => {
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const mainImageSource = article.mainImagePublicId || article.mainImage
  const gallerySources = (article.galleryPublicIds && article.galleryPublicIds.length > 0)
    ? article.galleryPublicIds
    : (article.gallery || [])
  const allImages = [
    mainImageSource,
    ...gallerySources
  ].filter(Boolean)

  const { productName, brandName } = parseTitle(article.title)
  const designerName = formatDesignerName(brandName)
  const availableAtUrl = article.availableAtUrl || ''
  const availableAtLabel = article.availableAtLabel || 'Available At'
  const categoryLabel = article.categoryRef?.title || article.category || 'Uncategorized'
  const categoryDisplay = categoryLabel.toUpperCase()
  
  // Video profile setup
  const isVideoProfile = article?.mediaType === 'video' && article?.videoUrl
  const videoId = isVideoProfile ? getYouTubeVideoId(article.videoUrl) : null
  
  // Parse conversation title
  const conversationName = article.title.includes('A CONVERSATION WITH:') 
    ? article.title.replace('A CONVERSATION WITH:', '').trim()
    : article.title
  
  // Build enhanced YouTube embed URL
  let videoEmbedUrl = null
  if (isVideoProfile && videoId) {
    videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?` + 
      'rel=0&' +              // No related videos from other channels
      'modestbranding=1&' +   // Minimal YouTube branding
      'controls=1&' +         // Show controls (required)
      'showinfo=0&' +         // Hide title/uploader info
      'iv_load_policy=3&' +   // Hide annotations
      'autohide=1&' +         // Auto-hide controls when playing
      'disablekb=1&' +        // Disable keyboard controls
      'fs=1&' +               // Allow fullscreen
      'color=white&' +        // White progress bar
      'playsinline=1&' +      // Better mobile experience
      'vq=hd2160&' +          // Request 4K quality (2160p)
      'hd=1'                  // Enable HD playback
      
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const canonicalUrl = `${siteUrl}/articles/${article.slug.current}`
  const pageTitle = `${article.title} | Russell Concept House`
  const pageDescription = article.excerpt || article.title

  return (

    <div className={isVideoProfile ? 'video-profile article-detail-page' : 'article-detail-page'}>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="Russell Concept House" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:url" content={canonicalUrl} />
          {mainImageSource && (
            <meta property="og:image" content={urlFor(mainImageSource).width(1200).url()} />
          )}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          {mainImageSource && (
            <meta name="twitter:image" content={urlFor(mainImageSource).width(1200).url()} />
          )}
          
      </Head>

      {/* Minimal Navigation Bar */}
      <nav className={`detail-nav ${isVideoProfile ? 'dark' : 'light'}`}>
        <div className="nav-content">
          <div className="nav-left">
            <Link href={isVideoProfile ? "/conversations" : "/articles"} className="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {isVideoProfile ? 'Conversations' : 'Articles'}
            </Link>
          </div>
          <div className="nav-right">
            <span className="category">{isVideoProfile ? 'VIDEO' : categoryDisplay}</span>
            <span className="divider">•</span>
            <span className="duration">
              {isVideoProfile ? article.videoDuration : calculateReadTime(article.body)}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      {isVideoProfile ? (
        // Video Profile Layout - Centered Design
        <div className="video-profile-container">
          
          {/* Video Header */}
          <header className="video-header">
            <h1 className="video-title">{conversationName}</h1>
            <div className="video-metadata">
              <time>{formatDate(article.publishedAt)}</time>
              {article.videoDuration && (
                <span className="duration">• {article.videoDuration}</span>
              )}
            </div>
          </header>
          
          {/* Video Player */}
          <section className="video-player-section">
            <div className="video-embed-wrapper">
              {videoEmbedUrl ? (
                <iframe
                  src={videoEmbedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={article.title}
                />
              ) : mainImageSource && (
                <VideoPlayer 
                  image={mainImageSource} 
                  videoUrl={article.videoUrl}
                />
              )}
            </div>
          </section>
          
          {/* Video Description */}
          {article.body && (
            <section className="video-description">
              {renderContent(article.body)}
            </section>
          )}
          
        </div>
      ) : (
        // Regular Article Layout - Two Column
        <div className="article-two-column-container">
          
          {/* Mobile Layout - Hidden on desktop */}
          <div className="md:hidden px-4 pt-1 max-w-full overflow-hidden">
            {/* Mobile Title */}
            <h1 className="text-3xl font-light mb-2 break-words">
              {article.title}
            </h1>
            
            {/* Mobile Date */}
            <div className="text-sm text-gray-600 mb-2">
              Published on {formatDate(article.publishedAt)}
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-6">
              RCH Editorial Team
            </div>
            
            {/* Mobile Images */}
            {allImages.length > 0 && (
              <div className="mb-8 -mx-4 max-w-screen overflow-hidden">
                <img 
                  src={urlFor(allImages[selectedImage])
                    .width(800)
                    .quality(90)
                    .url()}
                  alt={`${article.title} - Image ${selectedImage + 1}`}
                  className="w-full h-auto object-contain max-w-full mb-4"
                  style={{ maxWidth: '100vw' }}
                />
                {/* Thumbnails for multiple images */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 justify-center mb-2 px-4">
                    {allImages.map((image, index) => (
                      <div
                        key={index}
                        className={`w-16 h-16 cursor-pointer ${index === selectedImage ? 'ring-2 ring-black' : 'opacity-70'}`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={urlFor(image).width(150).quality(70).url()}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile Body Text */}
            <div className="article-content">
              {article.body ? (
                renderContent(article.body)
              ) : (
                <p className="text-dim-gray">Content coming soon...</p>
              )}
              
              {availableAtUrl && (
                <div className="purchase-section">
                  <a href={availableAtUrl} className="purchase-link" target="_blank" rel="noopener noreferrer">
                    <span className="purchase-text">{availableAtLabel}</span>
                    <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 7h10v10M7 17L17 7"/>
                    </svg>
                  </a>
                </div>
              )}
              
              {/* Share Section */}
              <div className="share-section mt-16 pt-8 border-t border-gray-300">
                <div className="flex items-center justify-start gap-6">
                  {/* Instagram */}
                  <button 
                    onClick={() => shareToInstagram(window.location.href)}
                    className="text-gray-600 hover:text-black transition-colors"
                    aria-label="Share on Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                  </button>

                  {/* Facebook */}
                  <button 
                    onClick={() => shareToFacebook(window.location.href)}
                    className="text-gray-600 hover:text-black transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>

                  {/* Pinterest */}
                  <button 
                    onClick={() => shareToPinterest(window.location.href, mainImageSource ? urlFor(mainImageSource).url() : '')}
                    className="text-gray-600 hover:text-black transition-colors"
                    aria-label="Share on Pinterest"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                    </svg>
                  </button>

                  {/* Reddit */}
                  <button 
                    onClick={() => shareToReddit(window.location.href, article.title)}
                    className="text-gray-600 hover:text-black transition-colors"
                    aria-label="Share on Reddit"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.975 2.163 2.174 2.163 1.198 0 2.172-.97 2.172-2.163s-.975-2.164-2.172-2.164c-.92 0-1.704.574-2.021 1.379l-4.329-1.015c-.189-.046-.381.063-.44.249l-1.654 5.207c-2.838.034-5.409.798-7.3 2.025-.474-.438-1.103-.712-1.799-.712-1.465 0-2.656 1.187-2.656 2.646 0 .97.533 1.811 1.317 2.271-.052.282-.086.567-.086.857 0 3.911 4.808 7.093 10.719 7.093s10.72-3.182 10.72-7.093c0-.274-.029-.544-.075-.81.832-.447 1.405-1.312 1.405-2.318zm-17.224 1.816c0-.868.71-1.575 1.582-1.575.872 0 1.581.707 1.581 1.575s-.709 1.574-1.581 1.574-1.582-.706-1.582-1.574zm9.061 4.669c-.797.793-2.048 1.179-3.824 1.179l-.013-.003-.013.003c-1.777 0-3.028-.386-3.824-1.179-.145-.144-.145-.379 0-.523.145-.145.381-.145.526 0 .65.647 1.729.961 3.298.961l.013.003.013-.003c1.569 0 2.648-.315 3.298-.962.145-.145.381-.144.526 0 .145.145.145.379 0 .524zm-.189-3.095c-.872 0-1.581-.706-1.581-1.574 0-.868.709-1.575 1.581-1.575s1.581.707 1.581 1.575-.709 1.574-1.581 1.574z"/>
                    </svg>
                  </button>

                  {/* Copy Link */}
                  <button 
                    onClick={() => copyToClipboard(window.location.href)}
                    className="text-gray-600 hover:text-black transition-colors"
                    aria-label="Copy link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden md:contents">
          
          {/* LEFT COLUMN - Text Content */}
          <div className="text-column">
            <div className="text-content-wrapper">
              {/* Article Header - NO breadcrumb */}
              <header className="article-header">
              <h1 className="article-title">
                <span className="product-name">{productName}</span>
                {designerName && (
                  <span className="brand-line">
                    <span className="by-text">by</span>{' '}
                    <span className="designer-name">{designerName}</span>
                  </span>
                )}
              </h1>
              <div className="article-meta article-date">
                Published on {formatDate(article.publishedAt)}
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-2">
                RCH Editorial Team
              </div>
            </header>

            {/* Article Body */}
            <div className="article-body">
              {article.body ? (
                renderContent(article.body)
              ) : (
                <p className="text-dim-gray">Content coming soon...</p>
              )}
            </div>

            {availableAtUrl && (
              <div className="purchase-section">
                <a href={availableAtUrl} className="purchase-link" target="_blank" rel="noopener noreferrer">
                  <span className="purchase-text">{availableAtLabel}</span>
                  <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 7h10v10M7 17L17 7"/>
                  </svg>
                </a>
              </div>
            )}
            
            {/* Share Section - Desktop */}
            <div className="share-section mt-16 pt-8 border-t border-gray-300">
              <div className="flex items-center justify-start gap-6">
                {/* Instagram */}
                <button 
                  onClick={() => shareToInstagram(window.location.href)}
                  className="text-gray-600 hover:text-black transition-colors"
                  aria-label="Share on Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </button>

                {/* Facebook */}
                <button 
                  onClick={() => shareToFacebook(window.location.href)}
                  className="text-gray-600 hover:text-black transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* Pinterest */}
                <button 
                  onClick={() => shareToPinterest(window.location.href, mainImageSource ? urlFor(mainImageSource).url() : '')}
                  className="text-gray-600 hover:text-black transition-colors"
                  aria-label="Share on Pinterest"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                  </svg>
                </button>

                {/* Reddit */}
                <button 
                  onClick={() => shareToReddit(window.location.href, article.title)}
                  className="text-gray-600 hover:text-black transition-colors"
                  aria-label="Share on Reddit"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.975 2.163 2.174 2.163 1.198 0 2.172-.97 2.172-2.163s-.975-2.164-2.172-2.164c-.92 0-1.704.574-2.021 1.379l-4.329-1.015c-.189-.046-.381.063-.44.249l-1.654 5.207c-2.838.034-5.409.798-7.3 2.025-.474-.438-1.103-.712-1.799-.712-1.465 0-2.656 1.187-2.656 2.646 0 .97.533 1.811 1.317 2.271-.052.282-.086.567-.086.857 0 3.911 4.808 7.093 10.719 7.093s10.72-3.182 10.72-7.093c0-.274-.029-.544-.075-.81.832-.447 1.405-1.312 1.405-2.318zm-17.224 1.816c0-.868.71-1.575 1.582-1.575.872 0 1.581.707 1.581 1.575s-.709 1.574-1.581 1.574-1.582-.706-1.582-1.574zm9.061 4.669c-.797.793-2.048 1.179-3.824 1.179l-.013-.003-.013.003c-1.777 0-3.028-.386-3.824-1.179-.145-.144-.145-.379 0-.523.145-.145.381-.145.526 0 .65.647 1.729.961 3.298.961l.013.003.013-.003c1.569 0 2.648-.315 3.298-.962.145-.145.381-.144.526 0 .145.145.145.379 0 .524zm-.189-3.095c-.872 0-1.581-.706-1.581-1.574 0-.868.709-1.575 1.581-1.575s1.581.707 1.581 1.575-.709 1.574-1.581 1.574z"/>
                  </svg>
                </button>

                {/* Copy Link */}
                <button 
                  onClick={() => copyToClipboard(window.location.href)}
                  className="text-gray-600 hover:text-black transition-colors"
                  aria-label="Copy link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Full height with background */}
          {!videoEmbedUrl && allImages.length > 0 && (
            <div className="image-column-wrapper">
              <div className="image-column-content">
                <div className="image-box">
                  <div className="image-content-wrapper">
                    <div className="image-scale-wrapper">
                      <div className="main-image-container">
                        {allImages.length > 0 && allImages[selectedImage] && (
                          <img
                            src={urlFor(allImages[selectedImage])
                              .width(1600)
                              .quality(90)
                              .url()}
                            alt={`${article.title} - Image ${selectedImage + 1}`}
                            className="main-image"
                            loading="lazy"
                          />
                        )}
                      </div>
                      
                      {/* Image controls inside scale wrapper */}
                      {allImages.length > 1 && (
                        <div className="image-controls">
                          <div className="thumbnails">
                            {allImages.map((image, index) => (
                              <div
                                key={index}
                                className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                                onClick={() => setSelectedImage(index)}
                              >
                                <img
                                  src={urlFor(image)
                                    .width(150)
                                    .quality(70)
                                    .url()}
                                  alt={`${article.title} - Thumbnail ${index + 1}`}
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="image-counter">
                            {selectedImage + 1} / {allImages.length}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Hero Video Section - Full width if video */}
          {videoEmbedUrl && (
            <div className="col-span-full mt-8">
              <div className="hero-video-section">
                <div className="hero-video-container">
                  <iframe
                    src={videoEmbedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="hero-video-iframe"
                    title={article.title}
                  />
                </div>
              </div>
            </div>
          )}
          
          </div>
          
        </div>
      )}
    </div>
  )
}

export async function getStaticPaths() {
  try {
    const articles = await getArticles()
    
    // Only include non-video articles
    const nonVideoArticles = articles.filter(article => article.mediaType !== 'video')
    
    const paths = nonVideoArticles.map((article) => ({
      params: { slug: article.slug.current }
    }))

    return {
      paths,
      fallback: 'blocking'
    }
  } catch (error) {
    console.error('Error generating paths:', error)
    return {
      paths: [],
      fallback: 'blocking'
    }
  }
}

export async function getStaticProps({ params }) {
  try {
    const article = await getArticleBySlug(params.slug)
    
    if (!article) {
      return {
        notFound: true
      }
    }

    return {
      props: {
        article
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return {
      notFound: true,
      revalidate: 60
    }
  }
}
