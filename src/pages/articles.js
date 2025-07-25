import Head from 'next/head'
import Link from 'next/link'

export default function Articles() {
  const articles = [
    { id: 1, title: 'The Art of Minimalist Living', category: 'Lifestyle', date: 'March 15, 2024', excerpt: 'Discover how embracing minimalism can transform your daily life and create space for what truly matters.' },
    { id: 2, title: 'Sustainable Design Practices', category: 'Design', date: 'March 12, 2024', excerpt: 'Exploring eco-conscious design choices that blend aesthetics with environmental responsibility.' },
    { id: 3, title: 'Curating Your Personal Space', category: 'Interior', date: 'March 8, 2024', excerpt: 'Tips and insights on creating a home that reflects your personality while maintaining functionality.' },
    { id: 4, title: 'The Psychology of Color', category: 'Design', date: 'March 5, 2024', excerpt: 'Understanding how color choices in your environment can influence mood and productivity.' },
    { id: 5, title: 'Handmade vs Mass Production', category: 'Craft', date: 'March 1, 2024', excerpt: 'Why investing in handcrafted pieces adds value beyond monetary worth to your collection.' },
    { id: 6, title: 'Creating Calm Spaces', category: 'Wellness', date: 'February 28, 2024', excerpt: 'Design strategies for crafting serene environments that promote relaxation and mental clarity.' },
  ]
  
  return (
    <>
      <Head>
        <title>Articles - Russell Concept House</title>
        <meta name="description" content="Read our latest articles on design, lifestyle, and mindful living" />
      </Head>
      
      <section className="py-16">
        <div className="container-custom">
          <h1 className="text-5xl font-serif font-light mb-4">Articles</h1>
          <p className="text-lg text-neutral-600 mb-12">Thoughts and insights on design, craft, and conscious living</p>
          
          <div className="grid gap-12">
            {articles.map((article) => (
              <article key={article.id} className="group cursor-pointer pb-12 border-b border-neutral-100 last:border-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <p className="text-xs tracking-widest text-neutral-500 mb-2">
                      {article.category.toUpperCase()} • {article.date}
                    </p>
                    <h2 className="text-3xl font-serif font-light mb-3 group-hover:underline">
                      {article.title}
                    </h2>
                  </div>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-4 max-w-3xl">
                  {article.excerpt}
                </p>
                <Link href="#" className="text-sm tracking-wider hover:underline">
                  Read More →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}