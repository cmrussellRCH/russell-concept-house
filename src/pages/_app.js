import '@/styles/globals.css'
import '@/styles/articles.css'
import '@/styles/about.css'
import '@/styles/article-detail.css'
import '@/styles/conversations.css'
import '@/styles/conversation-detail.css'
import '@/styles/shop.css'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair'
})

export default function App({ Component, pageProps }) {
  const [topImageUrl, setTopImageUrl] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const handleStart = () => setIsNavigating(true)
    const handleDone = () => setIsNavigating(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleDone)
    router.events.on('routeChangeError', handleDone)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleDone)
      router.events.off('routeChangeError', handleDone)
    }
  }, [router.events])

  // Detect page type based on route
  const isConversationDetail = router.pathname === '/conversations/[slug]'
  const isArticleDetail = router.pathname === '/articles/[slug]'
  const isHomePage = router.pathname === '/'
  const isConversationsPage = router.pathname === '/conversations'
  
  // Determine if this should be a dark page
  const isDarkPage = isConversationDetail || isConversationsPage
  const isDetailPage = isConversationDetail || isArticleDetail
  const isVideoProfile = isConversationDetail
  
  return (
    <div className={`${inter.variable} ${playfair.variable} ${isNavigating ? 'is-navigating' : ''}`}>
      <Layout 
        topImageUrl={topImageUrl}
        isDarkPage={isDarkPage}
        isDetailPage={isDetailPage}
        isVideoProfile={isVideoProfile}
        isHomePage={isHomePage}
      >
        <Component {...pageProps} setTopImageUrl={setTopImageUrl} />
      </Layout>
    </div>
  )
}
