import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const featuredArticles = [
    { id: 1, title: 'The Art of Minimalist Living', category: 'Lifestyle', image: '/api/placeholder/400/500' },
    { id: 2, title: 'Sustainable Design Practices', category: 'Design', image: '/api/placeholder/400/500' },
    { id: 3, title: 'Curating Your Personal Space', category: 'Interior', image: '/api/placeholder/400/500' },
  ]
  
  const featuredProducts = [
    { id: 1, name: 'Ceramic Vase Collection', price: '$120', image: '/api/placeholder/400/400' },
    { id: 2, name: 'Handwoven Throw Blanket', price: '$85', image: '/api/placeholder/400/400' },
    { id: 3, name: 'Minimalist Wall Art', price: '$200', image: '/api/placeholder/400/400' },
    { id: 4, name: 'Oak Wood Side Table', price: '$450', image: '/api/placeholder/400/400' },
  ]
  
  return (
    <>
      <Head>
        <title>Russell Concept House - Curated Design & Lifestyle</title>
        <meta name="description" content="Discover thoughtfully curated design pieces and lifestyle articles at Russell Concept House" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-platinum">
        <div className="container-custom text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Thoughtfully Curated
          </h1>
          <p className="text-lg md:text-xl text-dim-gray font-light max-w-2xl mx-auto mb-10">
            Discover a collection of design pieces and lifestyle articles that inspire mindful living and timeless aesthetics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="button-primary">
              Explore Collection
            </Link>
            <Link href="/articles" className="button-secondary">
              Read Articles
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Articles */}
      <section className="py-24">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-light mb-2">Featured Articles</h2>
              <p className="text-dim-gray">Insights on design, lifestyle, and mindful living</p>
            </div>
            <Link href="/articles" className="text-sm tracking-wider hover:underline">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArticles.map((article) => (
              <article key={article.id} className="group cursor-pointer">
                <div className="aspect-[4/5] bg-platinum mb-4 overflow-hidden">
                  <div className="w-full h-full bg-silver group-hover:scale-105 transition-transform duration-700"></div>
                </div>
                <p className="text-xs tracking-widest text-dim-gray mb-2">{article.category.toUpperCase()}</p>
                <h3 className="text-xl font-serif group-hover:underline">{article.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-24 bg-platinum">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-light mb-2">Curated Pieces</h2>
              <p className="text-dim-gray">Handpicked items for conscious living</p>
            </div>
            <Link href="/shop" className="text-sm tracking-wider hover:underline">
              Shop All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-square bg-seasalt mb-4 overflow-hidden">
                  <div className="w-full h-full bg-silver group-hover:scale-105 transition-transform duration-700"></div>
                </div>
                <h3 className="font-light mb-1 group-hover:underline">{product.name}</h3>
                <p className="text-dim-gray">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-24">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-light mb-4">Stay Informed</h2>
            <p className="text-dim-gray mb-8">
              Subscribe to receive updates on new arrivals and exclusive articles
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 border border-silver focus:border-black-olive focus:outline-none transition-colors"
              />
              <button type="submit" className="button-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}