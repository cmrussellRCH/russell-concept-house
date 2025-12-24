import Head from 'next/head'
import Link from 'next/link'
import { client, urlFor } from '../lib/sanity.client'
import { formatDate } from '../lib/utils/dateFormatter'
import Layout from '../components/Layout'

export default function ConversationsPage({ conversations }) {
  const conversationCount = conversations.length

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const pageTitle = 'Conversations | Russell Concept House'
  const pageDescription = 'Watch in-depth video conversations with designers and makers curated by Russell Concept House.'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/conversations`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Russell Concept House" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/conversations`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
      </Head>

      <div className="conversations-page">
        <div className="conversations-container">
          <div className="conversations-list">
            {conversations.map((article, index) => {
              const mainImageSource = article.mainImagePublicId || article.mainImage

              return (
                <Link href={`/conversations/${article.slug.current}`} key={article._id}>
                  <div className="conversation-row">
                  <div className="row-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <div className="row-content">
                    <div className="conversation-image">
                      {mainImageSource && (
                        <img 
                          src={urlFor(mainImageSource).width(560).height(360).quality(90).url()} 
                          alt={article.title}
                          loading="lazy"
                          width="280"
                          height="180"
                        />
                      )}
                      <div className="play-indicator">
                        <svg viewBox="0 0 24 24" className="play-icon">
                          <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    
                    <div className="conversation-details">
                      <h2 className="conversation-title">{article.title}</h2>
                      {article.excerpt && (
                        <p className="conversation-excerpt">{article.excerpt}</p>
                      )}
                      <div className="conversation-meta">
                        <span className="conversation-category">{article.category || 'CONVERSATION'}</span>
                        <span className="conversation-date">{formatDate(article.publishedAt)}</span>
                        {article.videoDuration && (
                          <span className="video-duration">RT {article.videoDuration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </Link>
              )
            })}
          </div>
          
          <footer className="conversations-footer">
            <span className="conversation-count">
              {conversationCount} {conversationCount === 1 ? 'Conversation' : 'Conversations'}
            </span>
          </footer>
        </div>
      </div>
    </>
  )
}

ConversationsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>
}

export async function getStaticProps() {
  try {
    const conversations = await client.fetch(
      `*[_type == "article" && mediaType == "video"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        mainImagePublicId,
        mainImage {
          asset-> {
            _id,
            url,
            source
          }
        },
        excerpt,
        publishedAt,
        category,
        videoDuration
      }`
    )
    
    return {
      props: {
        conversations: conversations || []
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return {
      props: {
        conversations: []
      },
      revalidate: 60
    }
  }
}
