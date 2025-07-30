import Head from 'next/head'
import Link from 'next/link'
import { client, urlFor } from '../lib/sanity.client'
import { formatDate } from '../lib/utils/dateFormatter'
import Layout from '../components/Layout'

export default function ConversationsPage({ conversations }) {
  const conversationCount = conversations.length

  return (
    <>
      <Head>
        <title>Conversations - Russell Concept House</title>
        <meta name="description" content="Video conversations with designers and makers" />
        <style>{`
          /* ===== CONVERSATIONS LISTING PAGE ===== */
          /* Ensure full page dark background */
          html:has(.conversations-page),
          body:has(.conversations-page) {
            background: #2d2b29 !important;
          }

          .conversations-page {
            background: #2d2b29;
            color: #f7f5f3;
            min-height: 100vh;
            margin: 0;
            padding: 0;
          }

          .conversations-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 8rem 4rem 4rem;
          }

          .conversations-list {
            display: flex;
            flex-direction: column;
          }

          .conversation-row {
            display: flex;
            align-items: flex-start;
            padding: 2.5rem 0;
            border-bottom: 1px solid rgba(247, 245, 243, 0.1);
            cursor: pointer;
            gap: 2rem;
            text-decoration: none;
            transition: all 0.3s ease;
          }

          .conversation-row:hover {
            border-bottom-color: rgba(247, 245, 243, 0.3);
          }

          .row-number {
            width: 40px;
            flex-shrink: 0;
            font-size: 0.875rem;
            color: rgba(247, 245, 243, 0.5);
            line-height: 1.6;
            padding-top: 0.25rem;
            font-family: 'Inter', sans-serif;
          }

          .row-content {
            flex: 1;
            display: flex;
            gap: 2rem;
          }

          .conversation-image {
            position: relative;
            width: 280px;
            height: 180px;
            flex-shrink: 0;
            overflow: hidden;
            background: #000;
            border-radius: 2px;
          }

          .conversation-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .play-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            pointer-events: none;
          }

          .conversation-row:hover .play-indicator {
            transform: translate(-50%, -50%) scale(1.1);
            background: rgba(0, 0, 0, 0.9);
          }

          .play-icon {
            width: 24px;
            height: 24px;
            color: #f7f5f3;
            margin-left: 3px;
          }

          .conversation-details {
            flex: 1;
            padding-right: 2rem;
          }

          .conversation-row .conversation-title {
            font-size: 1.75rem;
            font-weight: 400;
            line-height: 1.3;
            margin-bottom: 0.75rem;
            color: #f7f5f3;
            font-family: 'Playfair Display', serif;
          }

          .conversation-excerpt {
            font-size: 1rem;
            line-height: 1.6;
            color: rgba(247, 245, 243, 0.7);
            margin-bottom: 1rem;
            font-family: 'Inter', sans-serif;
          }

          .conversation-meta {
            display: flex;
            gap: 2rem;
            font-size: 0.875rem;
            color: rgba(247, 245, 243, 0.5);
            font-family: 'Inter', sans-serif;
          }

          .conversation-category {
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .video-duration {
            font-weight: 500;
            color: rgba(247, 245, 243, 0.7);
          }

          .conversations-footer {
            margin-top: 4rem;
            padding-top: 2rem;
            font-size: 0.875rem;
            color: rgba(247, 245, 243, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-family: 'Inter', sans-serif;
          }

          /* Override header colors for dark page */
          .conversations-page header {
            background: rgba(45, 43, 41, 0.95) !important;
            border-bottom-color: rgba(247, 245, 243, 0.1) !important;
          }

          .conversations-page header a,
          .conversations-page header .logo-text,
          .conversations-page header .menu-item,
          .conversations-page header .menu-number {
            color: #f7f5f3 !important;
          }

          .conversations-page header .menu-item:hover {
            color: rgba(247, 245, 243, 0.7) !important;
          }

          /* Override footer for dark page */
          .conversations-page footer {
            background: #2d2b29 !important;
            color: #f7f5f3 !important;
            border-top: 1px solid rgba(247, 245, 243, 0.1) !important;
          }

          .conversations-page footer p,
          .conversations-page footer a {
            color: rgba(247, 245, 243, 0.6) !important;
          }

          .conversations-page footer a:hover {
            color: #f7f5f3 !important;
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 768px) {
            .conversation-row {
              flex-direction: column;
              gap: 1rem;
            }
            
            .row-number {
              display: none;
            }
            
            .row-content {
              flex-direction: column;
              width: 100%;
            }
            
            .conversation-image {
              width: 100%;
              height: 200px;
            }

            .conversations-container {
              padding: 6rem 1rem 2rem;
            }
          }
        `}</style>
      </Head>

      <div className="conversations-page">
        <div className="conversations-container">
          <div className="conversations-list">
            {conversations.map((article, index) => (
              <Link href={`/conversations/${article.slug.current}`} key={article._id}>
                <div className="conversation-row">
                  <div className="row-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <div className="row-content">
                    <div className="conversation-image">
                      {article.mainImage && (
                        <img 
                          src={urlFor(article.mainImage).width(560).height(360).quality(90).url()} 
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
            ))}
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
      }
    }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return {
      props: {
        conversations: []
      }
    }
  }
}