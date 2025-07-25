# Complete Wix to Sanity Migration Guide

## Overview

This guide covers the complete process of migrating all 111 blog posts from your Wix site to Sanity CMS before the Wix site goes down.

## Step 1: Capture All Content

### Option A: Scrape RSS Feed (Recommended - Gets ALL 111 posts)

1. **Test the RSS feed is accessible:**
   ```bash
   node src/scripts/test-rss-feed.js
   ```

2. **Scrape all posts from RSS:**
   ```bash
   npm run scrape-rss
   ```
   
   This will:
   - Fetch all 111 posts from https://www.russellconcept.com/blog-feed.xml
   - Download all images to `public/images/wix-rss/`
   - Save data to `src/data/wix-all-posts.json`

### Option B: Use Backup Data (Only has 33 posts)

If you've already run the migration from backup:
```bash
npm run migrate-wix
```

This captures posts from your local backup but only has 33 posts.

## Step 2: Set Up Sanity API Token

1. Go to: https://www.sanity.io/manage/project/cc0sr5iy/api
2. Click "Tokens" → "Add API token"
3. Name: "Content Import Token"
4. Permissions: **Editor**
5. Copy the token
6. Add to `.env`:
   ```
   SANITY_API_TOKEN=your-token-here
   ```

## Step 3: Import to Sanity

```bash
npm run import-to-sanity
```

The import script will:
- Check BOTH data sources (RSS and backup)
- Prefer RSS data when available (more complete)
- Avoid creating duplicates
- Show progress for each post
- Report success/failure statistics

## Data Priority

The import script uses this priority:
1. **RSS data** (wix-all-posts.json) - Contains all 111 posts
2. **Backup data** (wix-migration.json) - Only 33 posts

If a post exists in both sources, RSS data is used.

## What Gets Imported

For each post:
- Title
- Slug (URL-friendly version)
- Published date
- Excerpt (auto-generated)
- Category (inferred from content)
- Content (temporarily as plain text)
- Author
- Metadata (source, image count, etc.)

## Post-Import Steps

After successful import:

1. **Review in Sanity Studio:**
   ```bash
   cd studio
   npm run dev
   ```
   Visit http://localhost:3333

2. **Add Images:**
   - Use Cloudinary integration in Sanity Studio
   - Reference downloaded images in `public/images/`

3. **Convert Content:**
   - Plain text needs to be converted to rich text blocks
   - Can be done manually or with a script

4. **Verify Categories:**
   - Categories are auto-inferred
   - Review and adjust as needed

## Troubleshooting

### RSS Feed Issues
- If RSS feed is down, work with backup data
- Check feed URL: https://www.russellconcept.com/blog-feed.xml
- Use test script to diagnose

### Import Failures
- Check your Sanity API token
- Verify internet connection
- Review error messages for specific issues

### Missing Posts
- RSS should have all 111 posts
- Backup only has 33 posts
- If posts are missing from RSS, they may need manual recovery

## Complete Workflow

```bash
# 1. Test RSS feed
node src/scripts/test-rss-feed.js

# 2. Scrape all content
npm run scrape-rss

# 3. Set up Sanity token in .env

# 4. Import everything
npm run import-to-sanity

# 5. Review in Sanity Studio
cd studio
npm run dev
```

## Important Notes

- **Act quickly** - The Wix site could go down anytime
- **RSS is complete** - Prioritize RSS scraping over backup
- **Images are downloaded** - All images are saved locally
- **Duplicates are prevented** - Safe to run import multiple times
- **Metadata is preserved** - Source, dates, and links are saved

## Data Locations

- RSS posts: `src/data/wix-all-posts.json`
- Backup posts: `src/data/wix-migration.json`
- RSS images: `public/images/wix-rss/`
- Backup images: `public/images/wix-import/`