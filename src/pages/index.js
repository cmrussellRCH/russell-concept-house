import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { getArticles, urlFor } from '../lib/sanity.client'

export default function Home({ articles, setTopImageUrl }) {
  const [scrolled, setScrolled] = useState(false)
  const [loadedImages, setLoadedImages] = useState({})
  const [columnCount, setColumnCount] = useState(3)
  const containerRef = useRef(null)
  const imageRefs = useRef({})

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      
      // Find which image is at the top of the viewport
      let topImage = null
      let minDistance = Infinity
      
      Object.entries(imageRefs.current).forEach(([articleId, ref]) => {
        if (ref && ref.getBoundingClientRect) {
          const rect = ref.getBoundingClientRect()
          const distance = Math.abs(rect.top)
          
          // Check if image is visible and closer to top
          if (rect.bottom > 0 && distance < minDistance) {
            minDistance = distance
            const article = articles.find(a => a._id === articleId)
            if (article?.mainImage?.asset) {
              topImage = urlFor(article.mainImage).width(800).url()
            }
          }
        }
      })
      
      if (setTopImageUrl) {
        setTopImageUrl(topImage)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [articles, setTopImageUrl])

  // Calculate column count based on screen width
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth
      if (width < 640) setColumnCount(1)
      else if (width < 1024) setColumnCount(2)
      else setColumnCount(3)
    }
    
    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  // Load images and track their dimensions
  useEffect(() => {
    articles.forEach((article) => {
      if (article.mainImage?.asset) {
        const img = new Image()
        img.onload = () => {
          setLoadedImages(prev => ({
            ...prev,
            [article._id]: {
              width: img.width,
              height: img.height,
              aspectRatio: img.height / img.width
            }
          }))
        }
        img.src = urlFor(article.mainImage).width(800).url()
      }
    })
  }, [articles])

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

  return (
    <>
      <Head>
        <title>Russell Concept House</title>
        <meta name="description" content="Contemporary design and artisanal objects" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* DEPLOYMENT TEST - Remove this after confirming */}
      <div style={{
        background: '#ff6b6b',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        fontSize: '14px',
        marginTop: '80px'
      }}>
        🚀 Deployment Test - Updated: {new Date().toLocaleString()}
      </div>
      
      {/* Masonry gallery grid */}
      <div className="min-h-screen p-1 bg-gradient-to-b from-seasalt via-white to-platinum/20" ref={containerRef}>
        <div className="flex gap-1">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 flex flex-col gap-1">
              {column.map((article, index) => {
                const hasImage = article.mainImage?.asset
                const imageData = loadedImages[article._id]
                const aspectRatio = imageData?.aspectRatio || 1.5
                
                return (
                  <Link
                    key={article._id}
                    href={`/articles/${article.slug.current}`}
                    className="relative overflow-hidden group cursor-pointer animate-fadeIn"
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
                            ref={el => imageRefs.current[article._id] = el}
                            src={urlFor(article.mainImage)
                              .width(800)
                              .quality(85)
                              .url()}
                            alt={article.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
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
      }
      // Note: revalidate removed for static export
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