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
  
  const mainImageSource = conversation.mainImagePublicId || conversation.mainImage
  const videoId = getYouTubeId(conversation.videoUrl)
  const conversationName = conversation.title.replace(/^A CONVERSATION WITH[:\s]*/i, '').trim()
  const videoEmbedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&hd=1` : null
  
  // Video Player Component
  const VideoPlayer = () => {
    return (
      <div className="video-player-container">
        {!isPlaying ? (
          <div className="custom-video-thumbnail" onClick={() => setIsPlaying(true)}>
            {mainImageSource && (
              <img 
                src={urlFor(mainImageSource).width(1200).quality(90).url()} 
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
        const nodes = (block.children || []).map((child, childIndex) => {
          if (!child?.text) return null
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
    const conversation = await getArticleBySlug(params.slug)
    
    if (!conversation || conversation.mediaType !== 'video') {
      return {
        notFound: true
      }
    }
    
    return {
      props: {
        conversation
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return {
      notFound: true,
      revalidate: 60
    }
  }
}
