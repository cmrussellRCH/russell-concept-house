import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About - Russell Concept House</title>
        <meta name="description" content="Learn about Russell Concept House and our mission to curate thoughtful design" />
      </Head>
      
      <section className="py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-serif font-light mb-12">About</h1>
            
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="aspect-[3/4] bg-platinum">
                <div className="w-full h-full bg-silver"></div>
              </div>
              
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-serif font-light mb-6">Our Philosophy</h2>
                <p className="text-dim-gray leading-relaxed mb-4">
                  Russell Concept House is more than a curated collection—it&apos;s a philosophy of living. We believe that the objects we surround ourselves with should inspire, comfort, and elevate our daily experiences.
                </p>
                <p className="text-dim-gray leading-relaxed">
                  Founded on principles of minimalism and sustainability, we seek out pieces that tell a story, honor craftsmanship, and stand the test of time.
                </p>
              </div>
            </div>
            
            <div className="prose prose-neutral max-w-none">
              <h2 className="text-3xl font-serif font-light mb-6">Our Story</h2>
              <p className="text-dim-gray leading-relaxed mb-6">
                What began as a personal quest for meaningful design has evolved into Russell Concept House—a space where thoughtful curation meets conscious living. Our journey started in a small studio apartment, where every object needed to earn its place through both beauty and function.
              </p>
              
              <p className="text-dim-gray leading-relaxed mb-6">
                Today, we work directly with artisans, designers, and small-batch producers who share our values. Each piece in our collection is chosen not just for its aesthetic appeal, but for the integrity of its creation and the joy it brings to everyday life.
              </p>
              
              <h2 className="text-3xl font-serif font-light mb-6 mt-12">Our Values</h2>
              
              <div className="grid md:grid-cols-3 gap-8 my-12">
                <div>
                  <h3 className="text-xl font-serif mb-3">Quality Over Quantity</h3>
                  <p className="text-dim-gray leading-relaxed">
                    We believe in owning fewer, better things. Each piece should be worthy of the space it occupies in your life.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-serif mb-3">Sustainable Practice</h3>
                  <p className="text-dim-gray leading-relaxed">
                    Environmental consciousness guides our selections. We prioritize materials and methods that respect our planet.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-serif mb-3">Timeless Design</h3>
                  <p className="text-dim-gray leading-relaxed">
                    Trends come and go, but good design endures. We seek pieces that will be as relevant tomorrow as they are today.
                  </p>
                </div>
              </div>
              
              <h2 className="text-3xl font-serif font-light mb-6 mt-12">Visit Us</h2>
              <p className="text-dim-gray leading-relaxed mb-6">
                Our showroom is open by appointment. We invite you to experience our collection in person, where you can touch the textures, appreciate the craftsmanship, and discover pieces that resonate with your own philosophy of living.
              </p>
              
              <div className="bg-platinum p-8 mt-12">
                <h3 className="text-xl font-serif mb-4">Get in Touch</h3>
                <p className="text-dim-gray mb-2">hello@russellconcepthouse.com</p>
                <p className="text-dim-gray mb-2">+1 (555) 123-4567</p>
                <p className="text-dim-gray">By appointment only</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}