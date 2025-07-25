import Head from 'next/head'

export default function Shop() {
  const products = [
    { id: 1, name: 'Ceramic Vase Collection', price: '$120', category: 'Home Decor' },
    { id: 2, name: 'Handwoven Throw Blanket', price: '$85', category: 'Textiles' },
    { id: 3, name: 'Minimalist Wall Art', price: '$200', category: 'Art' },
    { id: 4, name: 'Oak Wood Side Table', price: '$450', category: 'Furniture' },
    { id: 5, name: 'Linen Cushion Set', price: '$65', category: 'Textiles' },
    { id: 6, name: 'Brass Desk Lamp', price: '$180', category: 'Lighting' },
    { id: 7, name: 'Stoneware Dinnerware Set', price: '$150', category: 'Tableware' },
    { id: 8, name: 'Woven Storage Basket', price: '$45', category: 'Storage' },
  ]
  
  const categories = ['All', 'Home Decor', 'Textiles', 'Art', 'Furniture', 'Lighting', 'Tableware', 'Storage']
  
  return (
    <>
      <Head>
        <title>Shop - Russell Concept House</title>
        <meta name="description" content="Shop our curated collection of design pieces and home goods" />
      </Head>
      
      <section className="py-16">
        <div className="container-custom">
          <h1 className="text-5xl font-serif font-light mb-4">Shop</h1>
          <p className="text-lg text-dim-gray mb-12">Carefully selected pieces for thoughtful living</p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-4 mb-12 pb-8 border-b border-platinum">
            {categories.map((category) => (
              <button
                key={category}
                className={`text-sm tracking-wider px-4 py-2 transition-colors ${
                  category === 'All' 
                    ? 'bg-black-olive text-seasalt' 
                    : 'text-dim-gray hover:text-black-olive hover:bg-platinum'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-square bg-platinum mb-4 overflow-hidden">
                  <div className="w-full h-full bg-silver group-hover:scale-105 transition-transform duration-700"></div>
                </div>
                <p className="text-xs tracking-widest text-dim-gray mb-2">
                  {product.category.toUpperCase()}
                </p>
                <h3 className="font-light mb-1 group-hover:underline">{product.name}</h3>
                <p className="text-dim-gray">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}