import { getMediaUrl } from '../lib/config/media';

export default function UniversalImage({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  quality = 'auto',
  priority = false,
  ...props 
}) {
  // Handle both old full URLs and new relative paths
  const imageUrl = getMediaUrl(src, { width, height, quality });
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}