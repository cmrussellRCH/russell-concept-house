import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Layout({ children }) {
  const router = useRouter()
  const isHomePage = router.pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navClasses = isHomePage 
    ? scrolled 
      ? "fixed top-0 left-0 right-0 z-50 bg-seasalt border-b border-silver transition-all duration-300"
      : "fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300"
    : "border-b border-silver"

  const logoClasses = isHomePage && !scrolled
    ? "text-2xl font-serif tracking-tight text-white"
    : "text-2xl font-serif tracking-tight text-black-olive"

  const linkClasses = isHomePage && !scrolled
    ? "text-sm font-light tracking-wide text-white hover:text-gray-200 transition-colors duration-200"
    : "nav-link"

  return (
    <div className="min-h-screen flex flex-col bg-seasalt">
      <header className={navClasses}>
        <nav className="container-custom py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className={logoClasses}>
              Russell Concept House
            </Link>
            
            <ul className="flex items-center space-x-8">
              <li>
                <Link href="/" className={linkClasses}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/articles" className={linkClasses}>
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/shop" className={linkClasses}>
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClasses}>
                  About
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      
      <main className={isHomePage ? "" : "flex-1"}>
        {children}
      </main>
      
      {!isHomePage && (
        <footer className="border-t border-silver mt-24">
          <div className="container-custom py-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-dim-gray mb-4 md:mb-0">
                © 2024 Russell Concept House. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-sm text-dim-gray hover:text-black-olive transition-colors">
                  Instagram
                </a>
                <a href="#" className="text-sm text-dim-gray hover:text-black-olive transition-colors">
                  Pinterest
                </a>
                <a href="#" className="text-sm text-dim-gray hover:text-black-olive transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}