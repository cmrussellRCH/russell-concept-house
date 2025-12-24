import Head from 'next/head'

export default function Shop() {
  return (
    <>
      <Head>
        <title>Shop - Russell Concept House</title>
        <meta name="description" content="Shop our curated collection of design pieces and home goods" />
        
      </Head>
      
      <div className="shop-container">
        <div className="coming-soon">
          <h1 className="coming-soon-text">Coming Soon</h1>
          <p className="coming-soon-year">2026</p>
        </div>
      </div>
    </>
  )
}
