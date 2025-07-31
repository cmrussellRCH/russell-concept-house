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

  // Extract purchase link from content
  const extractPurchaseLink = (content) => {
    if (!content) return null
    
    for (const block of content) {
      if (block._type === 'block' && block.children) {
        for (const child of block.children) {
          if (child.marks?.includes('link') && child.text) {
            // Find the link mark
            const linkMark = block.markDefs?.find(mark => 
              mark._type === 'link' && child.marks.includes(mark._key)
            )
            if (linkMark?.href) {
              return {
                url: linkMark.href,
                text: child.text
              }
            }
          }
        }
      }
    }
    return null
  }

  const renderContent = (content, purchaseLink) => {
    if (!content) return null
    
    return content.map((block, index) => {
      if (block._type === 'block') {
        const text = block.children?.map(child => {
          // Skip rendering purchase links in the body
          if (purchaseLink && child.marks?.includes('link')) {
            const linkMark = block.markDefs?.find(mark => 
              mark._type === 'link' && child.marks.includes(mark._key)
            )
            if (linkMark?.href === purchaseLink.url) {
              return null
            }
          }
          return child.text
        }).filter(Boolean).join('')
        
        if (!text) return null
        
        return (
          <p key={index} className="paragraph">
            {text}
          </p>
        )
      }
      return null
    })
  }

  const allImages = [
    article.mainImage,
    ...(article.gallery || [])
  ].filter(img => img?.asset)

  const { productName, brandName } = parseTitle(article.title)
  const purchaseLink = extractPurchaseLink(article.body)
  
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

  return (
    <div className={isVideoProfile ? 'video-profile article-detail-page' : 'article-detail-page'}>
        <Head>
          <title>{article.title} - Russell Concept House</title>
          <meta name="description" content={article.excerpt || article.title} />
          <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap');
          
          /* Article-specific page styles */
          .article-detail-page {
            background: ${isVideoProfile ? '#2d2b29' : '#fcfcfc'};
            color: ${isVideoProfile ? '#f7f5f3' : '#000'};
            min-height: 100vh;
          }
          
          /* Two column layout for article detail pages */
          .article-two-column-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 6rem 2rem 6rem;
            display: grid;
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          
          @media (min-width: 1024px) {
            .article-two-column-container {
              grid-template-columns: 1fr 1.2fr;
              gap: 6rem;
              padding: 8rem 2rem 8rem;
            }
          }
          
          /* Text column */
          .text-column {
            max-width: 600px;
            width: 100%;
          }
          
          /* Text content wrapper to align with image */
          .text-content-wrapper {
            padding-top: 2rem;
          }
          
          @media (min-width: 1024px) {
            .text-content-wrapper {
              padding-top: 3rem;
            }
          }
          
          /* Image column wrapper - no background */
          .image-column-wrapper {
            position: relative;
            min-height: 100vh;
          }
          
          @media (min-width: 1024px) {
            .image-column-wrapper {
              margin-right: calc(-50vw + 50%);
              padding-right: calc(50vw - 50%);
            }
          }
          
          .image-column-content {
            height: 100%;
          }
          
          /* Image box component - now full height */
          .image-box {
            background: #f8f8f8;
            min-height: 100vh;
            padding: 2rem;
            border-radius: 0;
          }
          
          @media (min-width: 1024px) {
            .image-box {
              padding: 3rem;
            }
          }
          
          /* Content wrapper for image and controls */
          .image-content-wrapper {
            width: 100%;
          }
          
          /* Scale wrapper for images */
          .image-scale-wrapper {
            transform: scale(1.1);
            transform-origin: top;
          }
          
          @media (min-width: 1024px) {
            .image-scale-wrapper {
              transform: scale(1.2);
            }
          }
          
          /* Override main-image-container for two-column layout */
          .article-two-column-container .main-image-container {
            max-width: 100%;
            min-height: auto;
            padding: 0;
          }
          
          /* Ensure image fills the box properly */
          .article-two-column-container .main-image {
            width: 100%;
            max-height: 60vh;
          }
          
          /* Minimal Navigation for Detail Pages */
          .detail-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            z-index: 100;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .nav-content {
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          /* Light theme for regular articles */
          .detail-nav.light {
            background: rgba(255, 255, 255, 0.95);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .detail-nav.light .nav-link,
          .detail-nav.light span {
            color: #000;
          }
          
          /* Dark theme for video conversations */
          .detail-nav.dark {
            background: rgba(45, 43, 41, 0.95);
            border-bottom: 1px solid rgba(247, 245, 243, 0.1);
          }
          
          .detail-nav.dark .nav-link,
          .detail-nav.dark span {
            color: #f7f5f3;
          }
          
          .nav-left .nav-link {
            text-decoration: none;
            font-size: 0.875rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: opacity 0.3s ease, transform 0.2s ease;
          }
          
          .nav-left .nav-link:hover {
            opacity: 0.7;
            transform: translateX(-2px);
          }
          
          .nav-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.875rem;
          }
          
          .nav-right .category,
          .nav-right .duration {
            font-size: 0.75rem; /* Reduced by 2px from 0.875rem (14px) to 0.75rem (12px) */
          }
          
          /* Even smaller text for video profile pages */
          .detail-nav.dark .nav-right .category,
          .detail-nav.dark .nav-right .duration {
            font-size: 0.625rem; /* 10px - reduced by another 2px for video pages */
          }
          
          .category {
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 500;
          }
          
          .divider {
            opacity: 0.5;
          }
          
          .main-container {
            min-height: 100vh;
            margin-top: 0;
            padding-top: 5rem;
          }
          
          .article-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          
          .content-wrapper {
            margin-top: 4rem;
          }
          
          .article-body {
            margin-top: 3rem;
          }
          
          .article-header {
            margin-bottom: 3rem;
          }
          
          .article-title {
            line-height: 1.2;
            margin-bottom: 1rem;
            font-family: 'Playfair Display', serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          
          .product-name {
            display: inline;
            font-size: clamp(2rem, 3vw, 2.5rem);
            font-weight: 400;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }
          
          .brand-line {
            display: inline;
            margin-left: 1rem;
            font-size: clamp(2rem, 3vw, 2.5rem);
            font-weight: 300;
          }
          
          .by-text {
            font-size: 1rem;
            font-weight: 300;
            text-transform: lowercase;
            opacity: 0.7;
          }
          
          .article-meta {
            font-size: 0.875rem;
            color: #666;
            font-family: 'Inter', sans-serif;
          }
          
          .article-date {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
          }
          
          .paragraph {
            font-size: calc(1.125rem - 2px);
            line-height: 1.75;
            color: #333;
            margin-bottom: 1.5rem;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }
          
          .purchase-section {
            margin: 3rem 0;
            padding: 2rem 0;
            border-top: 1px solid #e5e5e5;
          }
          
          .purchase-link {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: #000;
            color: #fff;
            text-decoration: none;
            transition: all 0.3s ease;
            border-radius: 2px;
          }
          
          .purchase-link:hover {
            background: #333;
            transform: translateX(5px);
          }
          
          .purchase-text {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }
          
          .brand-name {
            font-size: 1.125rem;
            font-weight: 400;
            font-family: 'Inter', sans-serif;
          }
          
          .arrow-icon {
            margin-left: 0.25rem;
            transition: transform 0.3s ease;
          }
          
          .purchase-link:hover .arrow-icon {
            transform: translate(3px, -3px);
          }
          
          /* RCH Attribution */
          .rch-attribution {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e5e5;
          }
          
          .attribution-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #999;
            margin-bottom: 0.25rem;
            font-family: 'Inter', sans-serif;
          }
          
          .attribution-name {
            font-size: 0.875rem;
            color: #666;
            font-family: 'Inter', sans-serif;
          }
          
          .author-section {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e0e0e0;
            font-size: 0.875rem;
            color: #666;
          }
          
          /* Image gallery styles for non-video articles */
          .image-gallery-section {
            margin: 3rem 0;
            background: #f8f8f8;
            padding: 3rem 0;
            width: 100vw;
            margin-left: calc(-50vw + 50%);
          }
          
          .main-image-container {
            max-width: 1200px;
            margin: 0 auto;
            min-height: 400px;
          }
          
          .main-image {
            max-width: 100%;
            max-height: 70vh;
            width: auto;
            height: auto;
            object-fit: contain;
            transition: all 0.3s cubic-bezier(0.43, 0.13, 0.23, 0.96);
            border-radius: 4px;
          }
          
          /* Image controls container */
          .image-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin-top: 1rem;
            width: 100%;
            gap: 2rem;
          }
          
          /* Image counter positioning */
          .image-counter {
            font-size: 0.875rem;
            color: #666;
            background: rgba(255, 255, 255, 0.9);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
          }
          
          .thumbnails {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
          }
          
          .thumbnail {
            flex: 0 0 80px;
            height: 80px;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.3s ease;
            border-radius: 4px;
            overflow: hidden;
            background: #fff;
          }
          
          .thumbnail.active {
            opacity: 1;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          /* Hero video section - NOT full bleed */
          .hero-video-section {
            width: 100%;
            max-width: 1200px;
            margin: 3rem auto 4rem auto;
            padding: 0 2rem;
          }
          
          /* Container maintains proper 16:9 aspect ratio */
          .hero-video-container {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%; /* This MUST be 56.25% for 16:9 */
            background: #000;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            border: 1px solid #f0f0f0;
          }
          
          /* The iframe fills the container properly */
          .hero-video-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
          
          @media (max-width: 1200px) {
            .article-container {
              padding: 0 1rem;
            }
          }
          
          @media (max-width: 1023px) {
            .article-two-column-container {
              padding: 5rem 1rem 0;
            }
            
            .image-column-wrapper {
              margin-top: 3rem;
              min-height: auto;
            }
            
            .image-box {
              min-height: auto;
            }
          }
          
          @media (max-width: 768px) {
            .article-title {
              white-space: normal;
            }
            
            .product-name {
              font-size: 1.75rem;
            }
            
            .brand-line {
              font-size: 1.75rem;
              display: block;
              margin-left: 0;
              margin-top: 0.5rem;
            }
            
            .hero-video-section {
              margin: 2rem auto;
              padding: 0 1rem;
            }
            
            .hero-video-container {
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            }
            
            .image-controls {
              margin-top: 1rem;
              flex-direction: column;
              gap: 1rem;
            }
            
            .main-image {
              max-width: 100%;
            }
            
            .image-box {
              padding: 1.5rem;
            }
          }

          /* ===== VIDEO PROFILE STYLES ===== */
          .video-profile {
            background: #2d2b29;
            color: #f7f5f3;
            min-height: 100vh;
          }

          /* Removed duplicate navigation styles */

          .video-profile-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 5rem 2rem 0;
          }

          .video-profile-header {
            padding: 6rem 0 2rem;
            margin-bottom: 3rem;
          }

          .video-profile-title {
            font-size: clamp(2.5rem, 4vw, 3.5rem);
            font-weight: 300;
            line-height: 1.2;
            color: #f7f5f3;
            font-family: 'Playfair Display', serif;
            margin-bottom: 1rem;
          }

          .video-profile-date {
            color: rgba(247, 245, 243, 0.6);
            font-size: 0.875rem;
            font-family: 'Inter', sans-serif;
          }

          .video-section {
            margin-bottom: 4rem;
          }

          .video-player-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          }

          .video-content {
            margin-bottom: 4rem;
          }

          .video-profile .paragraph {
            color: rgba(247, 245, 243, 0.9);
            font-size: 1.125rem;
            line-height: 1.8;
            margin-bottom: 1.5rem;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }

          .video-profile .article-signature {
            margin-top: 4rem;
            padding-top: 3rem;
            border-top: 1px solid rgba(247, 245, 243, 0.1);
            text-align: center;
          }

          .signature-label {
            font-size: 0.75rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(247, 245, 243, 0.5);
            display: block;
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
          }

          .signature-name {
            font-size: 1rem;
            color: rgba(247, 245, 243, 0.7);
            font-family: 'Inter', sans-serif;
          }

          @media (max-width: 768px) {
            .profile-name {
              font-size: 2.5rem;
            }
            
            .content-columns {
              grid-template-columns: 1fr;
              gap: 2rem;
            }
            
            .content-card {
              padding: 2rem;
              margin: -2rem 1rem 2rem;
            }
          }
          /* ===== UPDATED VIDEO PROFILE STYLES ===== */
          .video-profile {
            background: #2d2b29;
            color: #f7f5f3;
            min-height: 100vh;
          }

          /* Removed duplicate video navigation styles */

          /* Video Profile Container - Updated */
          .video-profile-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 5rem 2rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
          }

          /* Video Header */
          .video-header {
            text-align: center;
            margin-bottom: 2rem;
            width: 100%;
          }

          .video-title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #f7f5f3;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
            font-family: 'Playfair Display', serif;
          }

          .video-metadata {
            color: rgba(247, 245, 243, 0.7);
            font-size: 0.9rem;
            font-family: 'Inter', sans-serif;
          }

          .video-metadata .duration {
            margin-left: 0.5rem;
          }

          /* Video Player */
          .video-player-section {
            width: 100%;
            margin-bottom: 3rem;
          }

          .video-embed-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          }

          .video-embed-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }

          /* Video Description */
          .video-description {
            max-width: 700px;
            margin: 0 auto;
            width: 100%;
          }

          .video-description .paragraph {
            color: rgba(247, 245, 243, 0.85);
            font-size: 1.05rem;
            line-height: 1.7;
            margin-bottom: 1.5rem;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }

          .video-description a {
            color: #f7f5f3;
            text-decoration: underline;
            text-underline-offset: 2px;
          }

          .video-description a:hover {
            opacity: 0.8;
          }

          /* Signature Section */
          .video-signature {
            margin-top: 4rem;
            padding-top: 3rem;
            border-top: 1px solid rgba(247, 245, 243, 0.1);
            text-align: center;
            width: 100%;
            max-width: 700px;
          }

          .video-signature .signature-label {
            font-size: 0.75rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(247, 245, 243, 0.5);
            display: block;
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
          }

          .video-signature .signature-name {
            font-size: 1rem;
            color: rgba(247, 245, 243, 0.7);
            font-family: 'Inter', sans-serif;
          }

          /* Remove all existing conflicting video profile styles */
          .video-profile-header,
          .profile-label,
          .profile-title,
          .profile-name,
          .profile-subtitle,
          .profile-date,
          .video-hero-section,
          .profile-content,
          .content-card,
          .opening-statement,
          .content-columns,
          .column {
            /* These are removed in favor of new structure */
          }

          @media (max-width: 768px) {
            .video-profile-container {
              padding: 0 1rem;
              padding-top: 5rem;
            }

            .video-title {
              font-size: 1.8rem;
            }

            .video-description .paragraph {
              font-size: 1rem;
            }
          }
        `}</style>
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
            <span className="category">{isVideoProfile ? 'VIDEO' : 'ART'}</span>
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
              ) : article.mainImage && (
                <VideoPlayer 
                  image={article.mainImage} 
                  videoUrl={article.videoUrl}
                />
              )}
            </div>
          </section>
          
          {/* Video Description */}
          {article.body && (
            <section className="video-description">
              {renderContent(article.body, purchaseLink)}
            </section>
          )}
          
        </div>
      ) : (
        // Regular Article Layout - Two Column
        <div className="article-two-column-container">
          
          {/* Mobile Layout - Hidden on desktop */}
          <div className="md:hidden px-4 pt-8">
            {/* Mobile Title */}
            <h1 className="text-3xl font-light mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {article.title}
            </h1>
            
            {/* Mobile Date */}
            <div className="text-sm text-gray-600 mb-6">
              {formatDate(article.publishedAt)}
            </div>
            
            {/* Mobile Images */}
            {allImages.length > 0 && (
              <div className="mb-8 -mx-4">
                <img 
                  src={urlFor(allImages[selectedImage])
                    .width(800)
                    .quality(90)
                    .url()}
                  alt={`${article.title} - Image ${selectedImage + 1}`}
                  className="w-full mb-4"
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
                renderContent(article.body, purchaseLink)
              ) : (
                <p className="text-dim-gray">Content coming soon...</p>
              )}
              
              {purchaseLink && (
                <div className="purchase-section">
                  <a href={purchaseLink.url} className="purchase-link" target="_blank" rel="noopener noreferrer">
                    <span className="purchase-text">Available at</span>
                    <span className="brand-name">{brandName || purchaseLink.text}</span>
                    <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 7h10v10M7 17L17 7"/>
                    </svg>
                  </a>
                </div>
              )}
              
              <div className="rch-attribution">
                <p className="attribution-label">RCH Team</p>
                <p className="attribution-name">Russell Concept House Editorial</p>
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
                {brandName && (
                  <span className="brand-line">
                    <span className="by-text">by</span> {brandName}
                  </span>
                )}
              </h1>
              <div className="article-meta article-date">
                {formatDate(article.publishedAt)}
              </div>
            </header>

            {/* Article Body */}
            <div className="article-body">
              {article.body ? (
                renderContent(article.body, purchaseLink)
              ) : (
                <p className="text-dim-gray">Content coming soon...</p>
              )}
            </div>

            {purchaseLink && (
              <div className="purchase-section">
                <a href={purchaseLink.url} className="purchase-link" target="_blank" rel="noopener noreferrer">
                  <span className="purchase-text">Available at</span>
                  <span className="brand-name">{brandName || purchaseLink.text}</span>
                  <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 7h10v10M7 17L17 7"/>
                  </svg>
                </a>
              </div>
            )}
            
            {/* RCH Team Attribution */}
            <div className="rch-attribution">
              <p className="attribution-label">RCH Team</p>
              <p className="attribution-name">Russell Concept House Editorial</p>
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
      fallback: false
    }
  } catch (error) {
    console.error('Error generating paths:', error)
    return {
      paths: [],
      fallback: false
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
      }
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return {
      notFound: true
    }
  }
}