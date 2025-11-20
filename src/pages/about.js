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
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=Playfair+Display:wght@300;400&display=swap');
          
          .about-hero {
            height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          
          .hero-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #f5f5f0 0%, #e8e8e3 100%);
            z-index: 0;
          }
          
          .hero-content {
            position: relative;
            z-index: 10;
            text-align: center;
            max-width: 800px;
            padding: 0 2rem;
          }
          
          .hero-title {
            font-size: clamp(3rem, 6vw, 5rem);
            font-weight: 300;
            letter-spacing: -0.02em;
            margin-bottom: 1.5rem;
            font-family: 'Playfair Display', serif;
          }
          
          .hero-subtitle {
            font-size: 1.125rem;
            color: #666;
            font-weight: 300;
            line-height: 1.6;
            font-family: 'Inter', sans-serif;
          }
          
          .content-section {
            padding: 4.5rem 0;
          }

          .content-section--spaced {
            padding-top: 6rem;
          }
          
          .section-title {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 2rem;
            font-family: 'Playfair Display', serif;
          }
          
          .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
          }
          
          .value-card {
            padding: 1.5rem 0;
            border-top: 1px solid #e0e0e0;
          }
          
          .value-number {
            font-size: 0.75rem;
            color: #999;
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
          }
          
          .value-title {
            font-size: 1.25rem;
            font-weight: 300;
            margin-bottom: 0.75rem;
            font-family: 'Playfair Display', serif;
          }
          
          .value-description {
            color: #666;
            line-height: 1.6;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }
          
          .story-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            align-items: center;
            margin: 2rem 0;
          }
          
          .story-image {
            aspect-ratio: 3/4;
            background: #f0f0ed;
            position: relative;
            overflow: hidden;
          }
          
          .story-content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 1rem;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
            font-size: 0.95rem;
          }
          
          .friend-link {
            font-size: 0.75rem;
            color: #000;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: gap 0.3s ease;
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.05em;
          }
          
          .friend-card:hover .friend-link {
            gap: 1rem;
          }
          
          .contact-section {
            text-align: center;
            padding: 3rem 0;
            max-width: 600px;
            margin: 0 auto;
          }
          
          .contact-info {
            margin-top: 2rem;
          }
          
          .contact-info a {
            display: block;
            color: #666;
            text-decoration: none;
            margin-bottom: 0.5rem;
            transition: color 0.2s ease;
            font-family: 'Inter', sans-serif;
            font-weight: 300;
          }
          
          .contact-info a:hover {
            color: #000;
          }
          
          @media (max-width: 768px) {
            .story-grid {
              grid-template-columns: 1fr;
            }
            
            .values-grid {
              gap: 2rem;
            }
            
            .friends-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
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
          <p style={{ marginBottom: '2rem', color: '#666', fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '0.95rem' }}>
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
