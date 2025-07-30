import Head from 'next/head'

export default function Shop() {
  return (
    <>
      <Head>
        <title>Shop - Russell Concept House</title>
        <meta name="description" content="Shop our curated collection of design pieces and home goods" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300&display=swap');
          
          .shop-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafafa;
          }
          
          .coming-soon {
            text-align: center;
            padding: 2rem;
          }
          
          .coming-soon-text {
            font-size: 3rem;
            font-weight: 300;
            letter-spacing: 0.05em;
            color: #222;
            font-family: 'Playfair Display', serif;
            margin-bottom: 1rem;
          }
          
          .coming-soon-year {
            font-size: 1.25rem;
            font-weight: 300;
            letter-spacing: 0.1em;
            color: #666;
            font-family: 'Inter', sans-serif;
          }
          
          @media (max-width: 768px) {
            .coming-soon-text {
              font-size: 2rem;
            }
            
            .coming-soon-year {
              font-size: 1rem;
            }
          }
        `}</style>
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