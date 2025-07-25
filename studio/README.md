# Russell Concept House - Sanity Studio

This is the Sanity Studio for managing content on Russell Concept House.

## Setup

1. Copy `.env.example` to `.env` and fill in your Cloudinary cloud name:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The studio will be available at http://localhost:3333

## Cloudinary Integration

This studio uses Cloudinary as an asset source for image management. When you click the "Select" button on any image field, you'll see Cloudinary as one of the sources alongside the default upload option.

You'll need:
- A Cloudinary account
- Your cloud name (found in your Cloudinary dashboard)

The plugin allows you to:
- Browse and select images from your Cloudinary media library
- Upload new images directly to Cloudinary
- Use Cloudinary's image transformations

## Content Types

- **Articles**: Blog posts and editorial content with rich text, images, and galleries

## Deployment

To deploy the studio:
```bash
npm run deploy
```