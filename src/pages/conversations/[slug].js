import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getArticleBySlug, getArticles, urlFor } from '../../lib/sanity.client'
import { formatDate } from '../../lib/utils/dateFormatter'

export default function ConversationPage({ conversation }) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-light mb-4">Conversation not found</h1>
          <p className="text-dim-gray">This conversation may have been removed or is no longer available.</p>
        </div>
      </div>
    )
  }
  
  // YouTube ID extraction
  function getYouTubeId(url) {
    if (!url) return null
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }
  
  const videoId = getYouTubeId(conversation.videoUrl)
  const conversationName = conversation.title.replace(/^A CONVERSATION WITH[:\s]*/i, '').trim()
  const videoEmbedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&hd=1` : null
  
  // Video Player Component
  const VideoPlayer = () => {
    return (
      <div className="video-player-container">
        {!isPlaying ? (
          <div className="custom-video-thumbnail" onClick={() => setIsPlaying(true)}>
            {conversation.mainImage && (
              <img 
                src={urlFor(conversation.mainImage).width(1200).quality(90).url()} 
                alt={conversation.title}
                className="video-thumbnail-image"
                loading="lazy"
              />
            )}
            <button className="video-play-button" aria-label="Play video">
              <svg width="100" height="100" viewBox="0 0 100 100" className="play-icon">
                <circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.8)" stroke="white" strokeWidth="2"/>
                <path d="M38 28v44l38-22z" fill="white"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="youtube-player">
            <iframe
              src={`${videoEmbedUrl}&autoplay=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="youtube-iframe"
              title={conversation.title}
            />
          </div>
        )}
      </div>
    )
  }
  
  // Render content function (for body text)
  const renderContent = (body) => {
    if (!body || !Array.isArray(body)) return null
    
    return body.map((block, index) => {
      if (block._type === 'block') {
        const text = block.children?.map(child => child.text).filter(Boolean).join('')
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
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const canonicalUrl = `${siteUrl}/conversations/${conversation.slug.current}`
  const pageTitle = `${conversation.title} | Russell Concept House`
  const pageDescription = conversation.excerpt || `Watch the conversation with ${conversationName} curated by Russell Concept House.`

  return (

    <div className="conversation-detail-page">
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="video.other" />
          <meta property="og:site_name" content="Russell Concept House" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:url" content={canonicalUrl} />
          {conversation.mainImage?.asset?.url && (
            <meta property="og:image" content={conversation.mainImage.asset.url} />
          )}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          {conversation.mainImage?.asset?.url && (
            <meta name="twitter:image" content={conversation.mainImage.asset.url} />
          )}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap');
            
            /* Conversation-specific page styles */
            .conversation-detail-page {
              background: #2d2b29;
              color: #f7f5f3;
              min-height: 100vh;
            }
            
            /* Minimal Navigation */
            .conversation-detail-nav {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1.5rem 2rem;
              background: rgba(45, 43, 41, 0.95);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              border-bottom: 1px solid rgba(247, 245, 243, 0.1);
              z-index: 100;
            }
            
            .nav-content {
              max-width: 1600px;
              margin: 0 auto;
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .nav-left .nav-link {
              color: rgba(247, 245, 243, 0.7);
              text-decoration: none;
              font-size: 0.875rem;
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              transition: all 0.3s ease;
            }
            
            .nav-left .nav-link:hover {
              color: #f7f5f3;
              transform: translateX(-2px);
            }
            
            .nav-right {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              font-size: 0.875rem;
              color: rgba(247, 245, 243, 0.7);
            }
            
            .category {
              text-transform: uppercase;
              letter-spacing: 0.1em;
              font-weight: 500;
            }
            
            .divider {
              opacity: 0.5;
            }
            
            /* Main Content */
            .conversation-detail {
              padding-top: 5rem;
              min-height: 100vh;
              background: #2d2b29;
            }
            
            .conversation-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 2rem 2rem 4rem;
            }
            
            /* Header */
            .conversation-header {
              text-align: center;
              margin-bottom: 3rem;
              width: 100%;
            }
            
            .conversation-title {
              font-family: 'Playfair Display', serif;
              font-size: clamp(2rem, 5vw, 4rem);
              font-weight: 300;
              letter-spacing: -0.02em;
              line-height: 1.1;
              margin-bottom: 0.5rem;
              color: #f7f5f3;
            }
            
            .title-sub {
              display: block;
              font-size: 0.875rem;
              font-family: 'Inter', sans-serif;
              font-weight: 300;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: rgba(247, 245, 243, 0.5);
              margin-bottom: 0.5rem;
            }
            
            .conversation-date {
              display: inline-block;
              font-size: 0.875rem;
              color: rgba(247, 245, 243, 0.5);
              margin-top: 1rem;
            }
            
            /* Video Section */
            .video-section {
              width: 100vw;
              position: relative;
              left: 50%;
              right: 50%;
              margin-left: -50vw;
              margin-right: -50vw;
              margin-bottom: 4rem;
            }
            
            .video-wrapper {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 2rem;
            }
            
            .video-player-container {
              position: relative;
              width: 100%;
              aspect-ratio: 16/9;
              background: #000;
              overflow: hidden;
            }
            
            .custom-video-thumbnail {
              position: relative;
              width: 100%;
              height: 100%;
              cursor: pointer;
            }
            
            .video-thumbnail-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .video-play-button {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80px;
              height: 80px;
              background: none;
              border: none;
              cursor: pointer;
              transition: transform 0.3s ease;
            }
            
            .video-play-button:hover {
              transform: translate(-50%, -50%) scale(1.1);
            }
            
            .play-icon {
              width: 100%;
              height: 100%;
            }
            
            .youtube-player {
              position: relative;
              width: 100%;
              height: 100%;
            }
            
            .youtube-iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            
            /* Content Section */
            .conversation-content {
              width: 100%;
              max-width: 700px;
              margin: 0 auto;
            }
            
            .intro-text {
              font-size: 1.125rem;
              line-height: 1.6;
              margin-bottom: 2rem;
              color: rgba(247, 245, 243, 0.8);
              font-weight: 300;
            }
            
            .body-text {
              font-size: 1rem;
              line-height: 1.8;
              color: rgba(247, 245, 243, 0.7);
            }
            
            .body-text .paragraph {
              margin-bottom: 1.5rem;
            }
            
            .contact-info {
              margin-top: 3rem;
              padding-top: 2rem;
              border-top: 1px solid rgba(247, 245, 243, 0.1);
            }
            
            .contact-info h3 {
              font-size: 0.875rem;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-bottom: 0.5rem;
              color: rgba(247, 245, 243, 0.5);
            }
            
            .contact-info p {
              color: rgba(247, 245, 243, 0.7);
            }
            
            /* Footer */
            .conversation-footer {
              margin-top: 4rem;
              text-align: center;
              padding-top: 2rem;
              border-top: 1px solid rgba(247, 245, 243, 0.1);
            }
            
            .rch-label {
              font-size: 0.75rem;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: rgba(247, 245, 243, 0.4);
              margin-bottom: 0.5rem;
            }
            
            .rch-name {
              font-size: 0.875rem;
              color: rgba(247, 245, 243, 0.6);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .conversation-container {
                padding: 1rem 1rem 3rem;
              }
              
              .conversation-title {
                font-size: 2rem;
              }
              
              .video-wrapper {
                padding: 0 1rem;
              }
              
              .video-play-button {
                width: 60px;
                height: 60px;
              }
            }
          `}</style>
        </Head>
        
        {/* Minimal Navigation Bar */}
        <nav className="conversation-detail-nav">
          <div className="nav-content">
            <div className="nav-left">
              <Link href="/conversations" className="nav-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Conversations
              </Link>
            </div>
            <div className="nav-right">
              <span className="category">VIDEO</span>
              <span className="divider">•</span>
              <span className="duration">{conversation.videoDuration || '0:00'}</span>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="conversation-detail">
          <div className="conversation-container">
            {/* Header */}
            <header className="conversation-header">
              <span className="title-sub">A Conversation With</span>
              <h1 className="conversation-title">{conversationName}</h1>
              <time className="conversation-date">{formatDate(conversation.publishedAt)}</time>
            </header>
            
            {/* Video */}
            <section className="video-section">
              <div className="video-wrapper">
                {videoEmbedUrl && <VideoPlayer />}
              </div>
            </section>
            
            {/* Content */}
            <section className="conversation-content">
              {conversation.excerpt && (
                <p className="intro-text">{conversation.excerpt}</p>
              )}
              
              <div className="body-text">
                {renderContent(conversation.body)}
              </div>
              
              {conversation.contactInfo && (
                <div className="contact-info">
                  <h3>Visit</h3>
                  <p>{conversation.contactInfo}</p>
                </div>
              )}
            </section>
          </div>
        </main>
    </div>
  )
}

export async function getStaticPaths() {
  try {
    const conversations = await getArticles()
    const videoConversations = conversations.filter(article => article.mediaType === 'video')
    
    const paths = videoConversations.map(conversation => ({
      params: { slug: conversation.slug.current }
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
    const conversation = await getArticleBySlug(params.slug)
    
    if (!conversation || conversation.mediaType !== 'video') {
      return {
        notFound: true
      }
    }
    
    return {
      props: {
        conversation
      }
    }
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return {
      notFound: true
    }
  }
}
