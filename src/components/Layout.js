import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Layout({ children, hideHeader = false, isVideoProfile = false, isDetailPage = false, isDarkPage: isDarkPageProp = false, isHomePage: isHomePageProp = false }) {
  const router = useRouter()
  const isHomePage = isHomePageProp || router.pathname === '/'
  const isArticlesPage = router.pathname === '/articles'
  const isArticleDetail = router.pathname === '/articles/[slug]'
  const isConversationsPage = router.pathname === '/conversations'
  // Use the isDarkPage prop if provided, otherwise fall back to existing logic
  const isDarkPage = isDarkPageProp || isConversationsPage || isVideoProfile
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Ensure mobile menu is closed on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [router.pathname])

  // Dynamic classes for homepage and dark pages
  const logoClasses = isDarkPage
    ? 'text-2xl font-light font-serif tracking-wide text-white hover:text-gray-200 transition-colors duration-600 ease-in-out'
    : isHomePage 
    ? 'text-2xl font-light font-serif tracking-wide text-black-olive hover:text-dim-gray transition-colors duration-600 ease-in-out'
    : 'text-2xl font-light font-serif tracking-wide text-black-olive hover:text-dim-gray transition-colors duration-600 ease-in-out'
    
  const linkClasses = isDarkPage
    ? 'text-sm tracking-wider text-white hover:text-gray-200 transition-colors duration-600 ease-in-out'
    : isHomePage
    ? 'text-sm tracking-wider text-dim-gray hover:text-black-olive transition-colors duration-600 ease-in-out'
    : 'text-sm tracking-wider text-dim-gray hover:text-black-olive transition-colors duration-600 ease-in-out'

  const navClasses = isDarkPage
    ? 'fixed top-0 left-0 right-0 z-50 bg-[#2d2b29]/95 backdrop-blur-sm shadow-sm transition-[background-color,backdrop-filter,box-shadow] duration-600 ease-in-out mobile-nav-header'
    : isHomePage
    ? `fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-900 ease-out mobile-nav-header ${
        scrolled ? 'shadow-sm scrolled' : ''
      }`
    : isArticlesPage
    ? `fixed top-0 left-0 right-0 z-50 transition-opacity duration-600 ease-in-out mobile-nav-header ${
        hideHeader ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${scrolled ? 'scrolled' : ''}`
    : `fixed top-0 left-0 right-0 z-50 bg-seasalt/85 backdrop-blur-sm shadow-sm transition-[background-color,backdrop-filter,box-shadow] duration-600 ease-in-out mobile-nav-header ${scrolled ? 'scrolled' : ''}`


  return (
    <div className={`min-h-screen flex flex-col ${isDarkPage ? 'bg-[#2d2b29]' : 'bg-seasalt'}`}>
      <style jsx>{`
        .menu-item {
          position: relative;
          display: inline-block;
        }
        
        .menu-item::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background-color: currentColor;
          transition: width 0.3s ease;
        }
        
        .menu-item:hover::after {
          width: 100%;
        }
        
        .menu-item.active::after {
          width: 100%;
        }
        
        .menu-number {
          font-size: 0.7rem;
          margin-right: 0.5rem;
          opacity: 0.6;
        }
        
        .dark-page .menu-number {
          opacity: 0.4;
        }
        
        .logo-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          height: 40px;
          min-width: 250px;
        }
        
        .logo-text {
          transition: opacity 0.3s ease;
        }
        
        .logo-image {
          position: absolute;
          left: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          height: 30px;
          width: auto;
        }
        
        .logo-wrapper:hover .logo-text {
          opacity: 0;
        }
        
        .logo-wrapper:hover .logo-image {
          opacity: 1;
        }
        
        .dark-page .logo-image {
          filter: invert(1) brightness(2);
        }
        
        /* Hamburger Menu Styles */
        .hamburger {
          width: 28px;
          height: 24px;
          position: relative;
          cursor: pointer;
          display: inline-block;
        }
        
        .hamburger span {
          display: block;
          position: absolute;
          height: 2px;
          width: 100%;
          background: #000;
          opacity: 1;
          left: 0;
          transform: rotate(0deg);
          transition: all 0.3s ease;
        }
        
        .hamburger.dark span {
          background: #f7f5f3;
        }
        
        .hamburger span:nth-child(1) {
          top: 0px;
        }
        
        .hamburger span:nth-child(2) {
          top: 10px;
        }
        
        .hamburger span:nth-child(3) {
          top: 20px;
        }
        
        .hamburger.open span:nth-child(1) {
          top: 10px;
          transform: rotate(135deg);
        }
        
        .hamburger.open span:nth-child(2) {
          opacity: 0;
          left: -60px;
        }
        
        .hamburger.open span:nth-child(3) {
          top: 10px;
          transform: rotate(-135deg);
        }
        
        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 998;
          pointer-events: none;
        }
        
        .mobile-menu-overlay.active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        
        /* Mobile Menu */
          .mobile-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 80%;
            max-width: 350px;
            height: 100%;
            background: #fbfbfa;
            z-index: 999;
            transition: right 0.3s ease;
            overflow-y: auto;
            box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
          }
        
        .mobile-menu.dark {
          background: #2d2b29;
        }
        
        .mobile-menu.open {
          right: 0;
        }
        
        .mobile-nav {
          padding: 6rem 2rem 2rem;
        }
        
        .mobile-menu-item {
          display: block;
          padding: 1.5rem 0;
          font-size: 1.125rem;
          letter-spacing: 0.05em;
          color: #000;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .mobile-menu.dark .mobile-menu-item {
          color: #f7f5f3;
          border-bottom-color: rgba(247, 245, 243, 0.1);
        }
        
        .mobile-menu-item:hover {
          padding-left: 0.5rem;
        }
        
        .mobile-menu-item.active {
          font-weight: 500;
        }
        
        .mobile-menu-item .menu-number {
          font-size: 0.75rem;
          margin-right: 0.75rem;
          opacity: 0.5;
        }
        
        /* Mobile navigation styles */
        @media (max-width: 1023px) {
          nav {
            padding: 1rem 1.5rem !important;
          }
          
          /* Enhanced mobile nav with frosted glass effect */
          .mobile-nav-header {
            background-color: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: box-shadow 0.3s ease-in-out;
          }
          
          .mobile-nav-header.scrolled {
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
          }
          
          /* Dark mode mobile nav */
          .dark-page.mobile-nav-header {
            background-color: rgba(45, 43, 41, 0.95) !important;
          }
          
          /* Articles page specific - transparent nav on mobile */
          .articles-page-nav {
            background-color: transparent !important;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          .articles-page-nav.scrolled {
            box-shadow: none;
          }

          /* Home page nav keeps frosted background on mobile */
          .home-page-nav {
            background-color: #fbfbfa !important;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }

          .home-page-nav.scrolled {
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
      {!isDetailPage && (
        <header
          className={`${navClasses} ${isDarkPage ? 'dark-page' : ''} ${isArticlesPage ? 'articles-page-nav' : ''} ${isHomePage ? 'home-page-nav' : ''}`}
          style={isHomePage ? { backgroundColor: '#fbfbfa' } : undefined}
        >
          <nav className="w-full px-8 lg:px-16 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="logo-wrapper">
                <span className={`logo-text ${logoClasses}`}>Russell Concept House</span>
                <img 
                  src="/LOGO/UPDATED_BLACK_BIGGER_2.png"
                  alt="Russell Concept House"
                  className="logo-image"
                  loading="lazy"
                />
              </Link>
              
              {/* Desktop Navigation */}
              <ul className="hidden lg:flex items-center space-x-10">
                <li>
                  <Link href="/" className={linkClasses}>
                    <span className={`menu-item ${router.pathname === '/' ? 'active' : ''}`}>
                      <span className="menu-number">01</span>
                      HOME
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className={linkClasses}>
                    <span className={`menu-item ${router.pathname === '/articles' || router.pathname.startsWith('/articles/') ? 'active' : ''}`}>
                      <span className="menu-number">02</span>
                      ARTICLES
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/conversations" className={linkClasses}>
                    <span className={`menu-item ${router.pathname === '/conversations' ? 'active' : ''}`}>
                      <span className="menu-number">03</span>
                      CONVERSATIONS
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className={linkClasses}>
                    <span className={`menu-item ${router.pathname === '/shop' ? 'active' : ''}`}>
                      <span className="menu-number">04</span>
                      SHOP
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={linkClasses}>
                    <span className={`menu-item ${router.pathname === '/about' ? 'active' : ''}`}>
                      <span className="menu-number">05</span>
                      ABOUT
                    </span>
                  </Link>
                </li>
              </ul>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 focus:outline-none"
                aria-label="Toggle menu"
              >
                <div className={`hamburger ${mobileMenuOpen ? 'open' : ''} ${isDarkPage ? 'dark' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
          </nav>
        </header>
      )}
      
      {/* Mobile Menu Overlay */}
      {!isDetailPage && (
        <>
          <div 
            className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''} ${isDarkPage ? 'dark' : ''}`}>
            <nav className="mobile-nav">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className={`mobile-menu-item ${router.pathname === '/' ? 'active' : ''}`}>
                  <span className="menu-number">01</span>
                  HOME
                </span>
              </Link>
              <Link href="/articles" onClick={() => setMobileMenuOpen(false)}>
                <span className={`mobile-menu-item ${router.pathname === '/articles' || router.pathname.startsWith('/articles/') ? 'active' : ''}`}>
                  <span className="menu-number">02</span>
                  ARTICLES
                </span>
              </Link>
              <Link href="/conversations" onClick={() => setMobileMenuOpen(false)}>
                <span className={`mobile-menu-item ${router.pathname === '/conversations' ? 'active' : ''}`}>
                  <span className="menu-number">03</span>
                  CONVERSATIONS
                </span>
              </Link>
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                <span className={`mobile-menu-item ${router.pathname === '/shop' ? 'active' : ''}`}>
                  <span className="menu-number">04</span>
                  SHOP
                </span>
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                <span className={`mobile-menu-item ${router.pathname === '/about' ? 'active' : ''}`}>
                  <span className="menu-number">05</span>
                  ABOUT
                </span>
              </Link>
            </nav>
          </div>
        </>
      )}
      
      <main className={`${isHomePage ? "" : "flex-1"} ${isDarkPage ? 'bg-[#2d2b29]' : ''}`}>
        {children}
      </main>
      
      {!isHomePage && (
        <footer
          className={`border-t mt-24 ${isDarkPage ? 'bg-[#2d2b29] border-white/10' : 'border-silver'}`}
          style={isArticlesPage || isArticleDetail ? { backgroundColor: '#fbfbfa' } : undefined}
        >
          <div className="container-custom py-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className={`text-sm mb-4 md:mb-0 ${isDarkPage ? 'text-white/60' : 'text-dim-gray'}`}>
                © 2026 Russell Concept House. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="https://www.instagram.com/russellconcepthouse" target="_blank" rel="noopener noreferrer" className={`text-sm transition-colors ${isDarkPage ? 'text-white/60 hover:text-white' : 'text-dim-gray hover:text-black-olive'}`}>
                  Instagram
                </a>
                <Link href="/about" className={`text-sm transition-colors ${isDarkPage ? 'text-white/60 hover:text-white' : 'text-dim-gray hover:text-black-olive'}`}>
                  Contact
                </Link>
                <Link href="/admin/login" className={`text-sm transition-colors ${isDarkPage ? 'text-white/60 hover:text-white' : 'text-dim-gray hover:text-black-olive'}`}>
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
