import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const galleryItems = [
    // Row 1: 1 tall + 2 stacked squares
    {
      id: 1,
      title: 'Lighting by Olivia Bossy',
      type: 'tall',
      gradient: 'from-zinc-900 to-zinc-700',
      row: 1,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[600px] lg:h-[800px]'
    },
    {
      id: 2,
      title: 'Opal Beer Glass',
      type: 'square',
      gradient: 'from-stone-800 to-amber-900',
      row: 1,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[295px] lg:h-[395px]'
    },
    {
      id: 3,
      title: 'Pewter Collection',
      type: 'square',
      gradient: 'from-gray-400 to-gray-100',
      row: 1,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[295px] lg:h-[395px]'
    },
    // Row 2: 2 medium side by side
    {
      id: 4,
      title: 'Porcelain Branches',
      type: 'medium',
      gradient: 'from-emerald-900 to-emerald-700',
      row: 2,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[400px] lg:h-[500px]'
    },
    {
      id: 5,
      title: 'Ceramic Studies',
      type: 'medium',
      gradient: 'from-neutral-900 to-neutral-600',
      row: 2,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[400px] lg:h-[500px]'
    },
    // Row 3: 1 wide panoramic
    {
      id: 6,
      title: 'Woven Textiles',
      type: 'wide',
      gradient: 'from-amber-800 to-yellow-600',
      row: 3,
      col: 'col-span-6',
      height: 'h-[300px] lg:h-[400px]'
    },
    // Row 4: 3 smaller images
    {
      id: 7,
      title: 'Glass Forms',
      type: 'small',
      gradient: 'from-slate-800 to-slate-600',
      row: 4,
      col: 'col-span-6 lg:col-span-2',
      height: 'h-[280px] lg:h-[350px]'
    },
    {
      id: 8,
      title: 'Bronze Vessels',
      type: 'small',
      gradient: 'from-orange-900 to-amber-700',
      row: 4,
      col: 'col-span-6 lg:col-span-2',
      height: 'h-[280px] lg:h-[350px]'
    },
    {
      id: 9,
      title: 'Stone Sculptures',
      type: 'small',
      gradient: 'from-gray-900 to-gray-700',
      row: 4,
      col: 'col-span-6 lg:col-span-2',
      height: 'h-[280px] lg:h-[350px]'
    },
    // Pattern repeats
    {
      id: 10,
      title: 'Indigo Dyes',
      type: 'tall',
      gradient: 'from-indigo-950 to-indigo-800',
      row: 5,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[600px] lg:h-[800px]'
    },
    {
      id: 11,
      title: 'Wood Carvings',
      type: 'square',
      gradient: 'from-orange-950 to-orange-800',
      row: 5,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[295px] lg:h-[395px]'
    },
    {
      id: 12,
      title: 'Metal Works',
      type: 'square',
      gradient: 'from-zinc-700 to-zinc-500',
      row: 5,
      col: 'col-span-6 lg:col-span-3',
      height: 'h-[295px] lg:h-[395px]'
    }
  ]

  return (
    <>
      <Head>
        <title>Russell Concept House</title>
        <meta name="description" content="Contemporary design and artisanal objects" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Full-screen gallery grid */}
      <div className="min-h-screen">
        <div className="grid grid-cols-6 gap-1 lg:gap-0.5">
          {/* Row 1: 1 tall image + 2 stacked squares */}
          <div className="col-span-6 lg:col-span-3 h-[600px] lg:h-[800px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-700 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Lighting by Olivia Bossy</h3>
            </div>
          </div>
          <div className="col-span-6 lg:col-span-3 grid grid-rows-2 gap-1 lg:gap-0.5">
            <div className="relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-amber-900 transition-transform duration-700 group-hover:scale-[1.02]"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Opal Beer Glass</h3>
              </div>
            </div>
            <div className="relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-100 transition-transform duration-700 group-hover:scale-[1.02]"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-black text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Pewter Collection</h3>
              </div>
            </div>
          </div>

          {/* Row 2: 2 medium side by side */}
          <div className="col-span-6 lg:col-span-3 h-[400px] lg:h-[500px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-700 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Porcelain Branches</h3>
            </div>
          </div>
          <div className="col-span-6 lg:col-span-3 h-[400px] lg:h-[500px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-600 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Ceramic Studies</h3>
            </div>
          </div>

          {/* Row 3: 1 wide panoramic */}
          <div className="col-span-6 h-[300px] lg:h-[400px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800 to-yellow-600 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Woven Textiles</h3>
            </div>
          </div>

          {/* Row 4: 3 smaller images */}
          <div className="col-span-6 lg:col-span-2 h-[280px] lg:h-[350px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-600 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Glass Forms</h3>
            </div>
          </div>
          <div className="col-span-6 lg:col-span-2 h-[280px] lg:h-[350px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900 to-amber-700 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Bronze Vessels</h3>
            </div>
          </div>
          <div className="col-span-6 lg:col-span-2 h-[280px] lg:h-[350px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Stone Sculptures</h3>
            </div>
          </div>

          {/* Pattern repeats */}
          <div className="col-span-6 lg:col-span-3 h-[600px] lg:h-[800px] relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-indigo-800 transition-transform duration-700 group-hover:scale-[1.02]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Indigo Dyes</h3>
            </div>
          </div>
          <div className="col-span-6 lg:col-span-3 grid grid-rows-2 gap-1 lg:gap-0.5">
            <div className="relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-950 to-orange-800 transition-transform duration-700 group-hover:scale-[1.02]"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Wood Carvings</h3>
              </div>
            </div>
            <div className="relative overflow-hidden group cursor-pointer animate-fadeIn opacity-0" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-500 transition-transform duration-700 group-hover:scale-[1.02]"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-white text-2xl lg:text-3xl font-serif font-light tracking-wide px-6 text-center">Metal Works</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}