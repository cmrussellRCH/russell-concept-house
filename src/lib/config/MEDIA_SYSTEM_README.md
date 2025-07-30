# Flexible Media System

This directory contains a flexible media configuration system that prepares for future CDN migrations while maintaining full compatibility with existing code.

## What's New

### 1. Media Configuration (`media.js`)
- Central configuration for media URLs
- Easy to switch providers in the future
- Currently configured for Cloudinary
- Supports both full URLs (existing) and relative paths (future)

### 2. UniversalImage Component (`components/UniversalImage.js`)
- Drop-in replacement for `<img>` tags
- Handles both existing Cloudinary URLs and future relative paths
- Adds lazy loading and optimization options
- Ready for future CDN migrations

### 3. Sanity Helpers (`utils/sanityImage.js`)
- Maintains existing `urlFor` functionality
- Adds optional `getImagePath` for future flexibility

## Important: No Breaking Changes

**All existing code continues to work exactly as before.** This system is designed to:
- ✅ Keep all existing functionality intact
- ✅ Require no immediate changes to workflow
- ✅ Allow gradual migration when ready
- ✅ Prepare for future CDN switches

## When to Use

### Keep Using Existing Methods For:
- All current article images
- Sanity-managed content
- Any existing features

### Consider New System For:
- Brand new features
- Non-Sanity images
- Future development

## Future Migration

When ready to switch CDNs:
1. Update `mediaConfig.provider` in `media.js`
2. Add new provider configuration
3. All UniversalImage components automatically use new provider
4. No code changes needed in components

## Examples

See `media-usage-example.js` for implementation examples.