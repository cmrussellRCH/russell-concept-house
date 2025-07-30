import { useState } from 'react'
import { urlFor } from '../lib/sanity.client'

export default function VideoPlayer({ article, videoId }) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  const handlePlay = () => {
    setIsPlaying(true)
  }
  
  return (
    <div className="video-player-container">
      {!isPlaying ? (
        <div className="custom-thumbnail" onClick={handlePlay}>
          {article.mainImage && (
            <img 
              src={urlFor(article.mainImage).width(1200).url()} 
              alt={article.title}
              className="thumbnail-image"
              loading="lazy"
            />
          )}
          <button className="custom-play-button" aria-label="Play video">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="rgba(0,0,0,0.7)"/>
              <path d="M38 30v40l35-20z" fill="white"/>
            </svg>
          </button>
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&vq=hd2160&hd=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="video-iframe"
        />
      )}
    </div>
  )
}