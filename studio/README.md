# Russell Concept House - Sanity Studio

This is the Sanity Studio for managing content on Russell Concept House.

## Setup

1. Copy `.env.example` to `.env` and fill in your Cloudinary credentials:
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

This studio uses Cloudinary for image management. You'll need:
- A Cloudinary account
- Your cloud name, API key, and API secret
- Username and password for the Cloudinary account

## Content Types

- **Articles**: Blog posts and editorial content with rich text, images, and galleries

## Deployment

To deploy the studio:
```bash
npm run deploy
```