// Cloudinary configuration and utilities
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dt9bnjukm';

// Build Cloudinary URL with transformations
export function buildCloudinaryUrl(publicId, options = {}) {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    ...additionalOptions
  } = options;

  // Build transformation string
  const transformations = [];
  
  if (width || height) {
    let transform = '';
    if (width) transform += `w_${width}`;
    if (width && height) transform += ',';
    if (height) transform += `h_${height}`;
    if (crop) transform += `,c_${crop}`;
    if (gravity) transform += `,g_${gravity}`;
    transformations.push(transform);
  }
  
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  // Add any additional transformations
  Object.entries(additionalOptions).forEach(([key, value]) => {
    transformations.push(`${key}_${value}`);
  });

  const transformString = transformations.length > 0 
    ? transformations.join('/') + '/'
    : '';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}${publicId}`;
}

// Extract Cloudinary public ID from various URL formats
export function extractCloudinaryPublicId(url) {
  if (!url) return null;
  
  // If it's already a public ID (no URL parts)
  if (!url.includes('://')) return url;
  
  // Extract from Cloudinary URL
  const cloudinaryMatch = url.match(/\/v\d+\/(.+)$/);
  if (cloudinaryMatch) return cloudinaryMatch[1];
  
  // Extract from upload path
  const uploadMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (uploadMatch) return uploadMatch[1];
  
  // Return the URL as-is if we can't extract
  return url;
}

// Check if URL is from Cloudinary
export function isCloudinaryUrl(url) {
  return url && (
    url.includes('res.cloudinary.com') || 
    url.includes('cloudinary.com')
  );
}

// Get optimized image URL (works with both Sanity and Cloudinary)
export function getOptimizedImageUrl(image, options = {}) {
  // If it's a string URL
  if (typeof image === 'string') {
    if (isCloudinaryUrl(image)) {
      const publicId = extractCloudinaryPublicId(image);
      return buildCloudinaryUrl(publicId, options);
    }
    return image; // Return as-is if not Cloudinary
  }
  
  // If it's a Sanity image object with Cloudinary source
  if (image?.asset?.source?.name === 'cloudinary' && image.asset.source.id) {
    return buildCloudinaryUrl(image.asset.source.id, options);
  }
  
  // If it has a direct URL that's from Cloudinary
  if (image?.asset?.url && isCloudinaryUrl(image.asset.url)) {
    const publicId = extractCloudinaryPublicId(image.asset.url);
    return buildCloudinaryUrl(publicId, options);
  }
  
  // Return null if no valid image found
  return null;
}