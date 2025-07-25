import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const featuredArticles = [
    { 
      id: 1, 
      title: 'Lighting by Olivia Bossy', 
      category: 'Design', 
      aspectRatio: '3/4',
      height: '450px',
      gradient: 'from-silver to-dim-gray'
    },
    { 
      id: 2, 
      title: 'Opal Beer Glass', 
      category: 'Objects', 
      aspectRatio: '1/1',
      height: '300px',
      gradient: 'from-platinum to-silver'
    },
    { 
      id: 3, 
      title: 'Pewter Collection', 
      category: 'Crafts', 
      aspectRatio: '4/3',
      height: '350px',
      gradient: 'from-dim-gray to-black-olive'
    },
    { 
      id: 4, 
      title: 'Porcelain Branches', 
      category: 'Art', 
      aspectRatio: '3/4',
      height: '400px',
      gradient: 'from-seasalt to-platinum'
    },
    { 
      id: 5, 
      title: 'Ceramic Studies', 
      category: 'Pottery', 
      aspectRatio: '1/1',
      height: '320px',
      gradient: 'from-silver to-platinum'
    },
    { 
      id: 6, 
      title: 'Woven Textiles', 
      category: 'Textiles', 
      aspectRatio: '4/3',
      height: '300px',
      gradient: 'from-platinum to-dim-gray'
    }
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[50px]">
            {featuredArticles.map((article, index) => (
              <article 
                key={article.id} 
                className={`group cursor-pointer animate-fadeIn opacity-0`}
                style={{
                  gridRowEnd: `span ${Math.ceil(parseInt(article.height) / 50) + 2}`,
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div 
                  className="relative overflow-hidden mb-4 rounded-sm"
                  style={{ height: article.height }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient} opacity-90 group-hover:opacity-80 transition-opacity duration-700`}></div>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                  <div className="absolute bottom-0 left-0 p-6 text-seasalt opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-xs tracking-widest mb-2">{article.category.toUpperCase()}</p>
                    <h3 className="text-2xl font-serif">{article.title}</h3>
                  </div>
                </div>
                <p className="text-xs tracking-widest text-dim-gray mb-2">{article.category.toUpperCase()}</p>
                <h3 className="text-lg font-serif group-hover:underline">{article.title}</h3>
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