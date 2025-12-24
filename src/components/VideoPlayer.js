import { useState } from 'react'
import { urlFor } from '../lib/sanity.client'

export default function VideoPlayer({ article, image, videoId, videoUrl }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const resolvedImage = image || article?.mainImagePublicId || article?.mainImage
  const resolvedVideoId = videoId || getYouTubeId(videoUrl || article?.videoUrl)
  
  const handlePlay = () => {
    setIsPlaying(true)
  }

  function getYouTubeId(url) {
    if (!url) return null
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?/ ]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }
  
  return (
    <div className="video-player-container">
      {!isPlaying ? (
        <div className="custom-thumbnail" onClick={handlePlay}>
          {resolvedImage && (
            <img 
              src={urlFor(resolvedImage).width(1200).url()} 
              alt={article?.title || 'Video thumbnail'}
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
          src={`https://www.youtube.com/embed/${resolvedVideoId}?autoplay=1&rel=0&modestbranding=1&vq=hd2160&hd=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="video-iframe"
        />
      )}
    </div>
  )
}
