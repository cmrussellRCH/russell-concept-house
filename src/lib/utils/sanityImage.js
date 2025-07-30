import imageUrlBuilder from '@sanity/image-url';
import { client } from '../sanity.client';

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  // This continues to work exactly as before
  return builder.image(source);
}

// New helper for future use (optional)
export function getImagePath(source) {
  // Extracts just the asset ID for future flexibility
  if (typeof source === 'string') return source;
  return source?.asset?._ref || source?.asset?.url || '';
}