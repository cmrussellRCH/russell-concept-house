# Wix Content Migration

## Overview

This directory contains scripts to migrate content from your Wix backup to the new Russell Concept House website.

## Prerequisites

1. Your Wix backup should be located at: `~/Desktop/RussellConceptBackup/`
2. The backup should contain:
   - Articles: `backup/www.russellconcept.com/articles/page/*.html`
   - Images: `backup/static.wixstatic.com/media/*`

## Usage

### 1. Check your backup (optional)

First, verify that your backup is accessible:

```bash
node src/scripts/check-wix-backup.js
```

### 2. Run the migration

```bash
npm run migrate-wix
```

This will:
- Read all HTML article files
- Extract titles, dates, content, and images
- Copy images to `public/images/wix-import/`
- Rename images with simpler names (e.g., `article-title-image-1.jpg`)
- Create a mapping of old to new image URLs
- Generate a migration report

### 3. Check the results

After migration, you'll find:
- **Images**: `public/images/wix-import/`
- **Migration data**: `src/data/wix-migration.json`

The JSON file contains:
- All extracted article data
- Image URL mappings
- Migration summary and any errors

## What the script extracts

For each article:
- **Title**: From h1, h2, or page title
- **Date**: Searches for various date formats
- **Content**: Main article text (up to 5000 characters)
- **Images**: All images from the article
- **Slug**: URL-friendly version of the title

## Next Steps

After migration, you can:
1. Review the migration data in `src/data/wix-migration.json`
2. Import the data into Sanity CMS
3. Update any broken image links
4. Edit and enhance the content as needed

## Troubleshooting

If the migration fails:
1. Check that the backup path is correct
2. Ensure you have read permissions for the backup files
3. Check the console output for specific error messages
4. Review the errors section in the migration JSON file