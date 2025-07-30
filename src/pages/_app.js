import '@/styles/globals.css'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function App({ Component, pageProps }) {
  const [topImageUrl, setTopImageUrl] = useState(null)
  const router = useRouter()
  
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
    <Layout 
      topImageUrl={topImageUrl}
      isDarkPage={isDarkPage}
      isDetailPage={isDetailPage}
      isVideoProfile={isVideoProfile}
      isHomePage={isHomePage}
    >
      <Component {...pageProps} setTopImageUrl={setTopImageUrl} />
    </Layout>
  )
}