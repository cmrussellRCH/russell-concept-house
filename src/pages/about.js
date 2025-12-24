import Head from 'next/head'
import Link from 'next/link'

export default function About() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const pageTitle = 'About Russell Concept House'
  const pageDescription = 'Russell Concept House curates objects that balance timeless beauty with thoughtful functionality, supporting designers who honor craftsmanship and innovation.'
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Russell Concept House" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
      </Head>
      

      {/* About Us */}
      <section className="content-section" style={{ background: '#fafafa', padding: '11rem 0 4rem' }}>
        <div className="container-custom">
          <h2 className="section-title">About Us</h2>
          <div className="story-grid">
            <div className="story-content">
              <p>
                Russell Concept House (RCH) curates beautiful objects sourced from the best designers in the world. We don&apos;t curate for aesthetic beauty alone; we believe the objects we surround ourselves with should inspire and elevate our daily lives.
              </p>
              <p>
                Good design imbues ordinary moments with a sense of grace, grounding us in the present and offering a reprieve from the relentless pace of modern life. At RCH, we champion objects that blend timeless beauty with thoughtful functionality, supporting creative minds who honor traditional craftsmanship while embracing innovation.
              </p>
              <p>
                Each piece in our collection is chosen not just for its visual appeal, but for its ability to inspire, calm, and transform the spaces we inhabit. We celebrate designers who understand that true luxury lies not in excess, but in the quiet confidence of well-crafted simplicity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="content-section" style={{ background: '#fafafa', padding: '3.5rem 0 4rem' }}>
        <div className="container-custom">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-number">01</div>
              <h3 className="value-title">Quality Over Quantity</h3>
              <p className="value-description">
                We believe in owning fewer, better things. Each piece should be worthy of the space it occupies in your life.
              </p>
            </div>
            <div className="value-card">
              <div className="value-number">02</div>
              <h3 className="value-title">Sustainable Practice</h3>
              <p className="value-description">
                Environmental consciousness guides our selections. We prioritize materials and methods that respect our planet.
              </p>
            </div>
            <div className="value-card">
              <div className="value-number">03</div>
              <h3 className="value-title">Timeless Design</h3>
              <p className="value-description">
                Trends come and go, but good design endures. We seek pieces that will be as relevant tomorrow as they are today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Removed Our Friends section */}

      {/* Get in Touch */}
      <section className="contact-section">
        <div className="container-custom">
          <h2 className="section-title">Get in Touch</h2>
          <p style={{ marginBottom: '2rem', color: '#666', fontFamily: 'var(--font-inter), sans-serif', fontWeight: 300, fontSize: '0.95rem' }}>
            If you&apos;re a designer and would like your work featured on RCH, just reach out below!
          </p>
          <div className="contact-info">
            <a href="mailto:info@russellconcept.com">info@russellconcept.com</a>
          </div>
        </div>
      </section>
    </>
  )
}
