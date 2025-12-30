import Head from 'next/head'

export default function About() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.russellconcept.com'
  const pageTitle = 'About Russell Concept House'
  const pageDescription = 'Russell Concept House is an online publication, archive, and storefront dedicated to handcrafted objects and the people who make them.'
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
      

      {/* Why We're Here */}
      <section className="content-section" style={{ background: '#fafafa', padding: '11rem 0 4rem' }}>
        <div className="container-custom">
          <h2 className="section-title">Why We&apos;re Here</h2>
          <div className="story-grid">
            <div className="story-content">
              <p>
                Russell Concept House is an online publication, archive, and storefront dedicated to handcrafted objects and the people who make them. We feature work from independent designers and studios around the world, including furniture, lighting, ceramics, glassware, textiles, and more.
              </p>
              <p>
                We&apos;re drawn to work where the maker&apos;s hand is evident. Pieces shaped by intention, material knowledge, and years of refinement. What we feature isn&apos;t chosen for aesthetic appeal alone. Each piece represents someone&apos;s practice, their particular way of seeing and working. We look for objects that carry that weight. Things you can feel were made by someone, for someone.
              </p>
              <p>
                RCH is a place to discover new makers, revisit established ones, and build a reference for design that&apos;s built to last. Soon, it will also be a place to bring those pieces home.
              </p>
              <p>
                <em>Founded by Colleen Russell, 2022</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conversations */}
      <section className="content-section" style={{ background: '#fafafa', padding: '2rem 0 4rem' }}>
        <div className="container-custom">
          <h2 className="section-title">Conversations</h2>
          <div className="story-grid">
            <div className="story-content">
              <p>
                We don&apos;t just feature finished work. We go deeper. Our Conversations series documents how things get made: the material choices, the false starts, the decisions that shape a final piece. Through short films and personal interviews, we explore process as much as product. The journey often reveals more than the destination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Guides Us */}
      <section className="content-section" style={{ background: '#fafafa', padding: '2rem 0 4rem' }}>
        <div className="container-custom">
          <h2 className="section-title">What Guides Us</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3 className="value-title"><em>Fewer, Better</em></h3>
              <p className="value-description">
                We&apos;d rather show ten things we believe in than a hundred we don&apos;t. Every piece here has earned its place.
              </p>
            </div>
            <div className="value-card">
              <h3 className="value-title"><em>Made to Last</em></h3>
              <p className="value-description">
                We seek work that will matter in ten years, not ten weeks. Design that outlives trends because it was never beholden to them.
              </p>
            </div>
            <div className="value-card">
              <h3 className="value-title"><em>Process Over Product</em></h3>
              <p className="value-description">
                The story of how something was made is part of what it is. We&apos;re as interested in the making as the made.
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
