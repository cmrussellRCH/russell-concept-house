// Utility functions for color analysis and dynamic styling

export async function getImageBrightness(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = function() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Sample from the top portion of the image where header overlays
      canvas.width = img.width
      canvas.height = Math.min(img.height * 0.2, 200) // Top 20% or 200px max
      
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let totalBrightness = 0
      let pixelCount = 0
      
      // Sample every 10th pixel for performance
      for (let i = 0; i < data.length; i += 40) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Calculate perceived brightness using standard formula
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
        totalBrightness += brightness
        pixelCount++
      }
      
      const averageBrightness = totalBrightness / pixelCount / 255
      resolve(averageBrightness)
    }
    
    img.onerror = function() {
      // Default to dark on error
      resolve(0.5)
    }
    
    img.src = imageUrl
  })
}

export function getDynamicHeaderClasses(brightness, scrolled, isHomePage) {
  const isDark = brightness < 0.5
  
  if (!isHomePage || scrolled) {
    return {
      nav: scrolled 
        ? "fixed top-0 left-0 right-0 z-50 bg-seasalt border-b border-silver transition-all duration-300"
        : "border-b border-silver",
      logo: "text-2xl font-serif tracking-tight text-black-olive",
      link: "nav-link"
    }
  }
  
  // Dynamic classes based on image brightness
  return {
    nav: "fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300",
    logo: `text-2xl font-serif tracking-tight transition-colors duration-300 ${
      isDark ? 'text-white' : 'text-black-olive'
    }`,
    link: `text-sm font-light tracking-wide transition-colors duration-200 ${
      isDark 
        ? 'text-white hover:text-gray-200' 
        : 'text-black-olive hover:text-dim-gray'
    }`
  }
}

// Get the dominant color from an image section
export async function getDominantColor(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = function() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Sample a smaller version for performance
      canvas.width = 100
      canvas.height = 20
      
      ctx.drawImage(img, 0, 0, img.width, img.height * 0.2, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let r = 0, g = 0, b = 0
      let pixelCount = 0
      
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        pixelCount++
      }
      
      resolve({
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount),
        b: Math.round(b / pixelCount)
      })
    }
    
    img.onerror = function() {
      resolve({ r: 128, g: 128, b: 128 })
    }
    
    img.src = imageUrl
  })
}