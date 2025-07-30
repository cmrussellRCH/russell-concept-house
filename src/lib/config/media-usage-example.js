/**
 * Media System Usage Examples
 * 
 * This file demonstrates how to use the new flexible media system
 * when you're ready to migrate. For now, keep using existing methods.
 */

import UniversalImage from '@/components/UniversalImage';
import { urlFor } from '@/lib/sanity.client';

// Example 1: Using with existing Sanity images (no changes needed)
export function ExistingArticleImage({ article }) {
  return (
    <>
      {/* Current way - keep this for now */}
      <img 
        src={urlFor(article.mainImage).width(800).url()} 
        alt={article.title} 
      />

      {/* Future way - when ready to migrate */}
      <UniversalImage
        src={urlFor(article.mainImage).width(800).url()}
        alt={article.title}
        width={800}
        height={600}
        priority
      />
    </>
  );
}

// Example 2: Using with direct Cloudinary URLs
export function DirectCloudinaryImage() {
  return (
    <UniversalImage
      src="https://res.cloudinary.com/dt9bnjukm/image/upload/v1234567890/sample.jpg"
      alt="Sample image"
      width={1200}
      height={800}
    />
  );
}

// Example 3: Future use with relative paths (after migration)
export function FutureRelativePathImage() {
  return (
    <UniversalImage
      src="products/woody-hook/main.jpg" // Just the path
      alt="Woody Hook"
      width={600}
      height={400}
      quality="auto"
    />
  );
}

// Example 4: Switching providers in the future
// Just change mediaConfig.provider in media.js from 'cloudinary' to 'newProvider'
// and add the new provider configuration. All UniversalImage components will
// automatically use the new provider without code changes.