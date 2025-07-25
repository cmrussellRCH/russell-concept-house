import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-seasalt">
      <header className="border-b border-silver">
        <nav className="container-custom py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-serif tracking-tight text-black-olive">
              Russell Concept House
            </Link>
            
            <ul className="flex items-center space-x-8">
              <li>
                <Link href="/" className="nav-link">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/articles" className="nav-link">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/shop" className="nav-link">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="nav-link">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
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
    </div>
  )
}