const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const fetch = require('node-fetch');

// Load environment variables from project root
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// Configuration
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'cc0sr5iy',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
};

// Initialize Sanity client
const client = createClient(config);

// HTML to Portable Text converter
const htmlToPortableText = (html) => {
  if (!html) return [];
  
  // Basic conversion - you may want to enhance this
  const blocks = [];
  
  // Simple paragraph extraction
  const paragraphs = html.split(/<\/p>|<br\s*\/?>|\n\n/).filter(p => p.trim());
  
  paragraphs.forEach(p => {
    // Clean HTML tags for now
    const text = p.replace(/<[^>]*>/g, '').trim();
    if (text) {
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: text
        }],
        markDefs: []
      });
    }
  });
  
  return blocks;
};

// Upload image to Sanity
const uploadImageToSanity = async (imagePath, filename) => {
  try {
    let imageBuffer;
    
    if (imagePath.startsWith('http')) {
      // Download from URL
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      imageBuffer = await response.buffer();
    } else {
      // Read local file
      const fullPath = path.join(process.cwd(), 'src/data/wix-images', path.basename(imagePath));
      if (fsSync.existsSync(fullPath)) {
        imageBuffer = await fs.readFile(fullPath);
      } else {
        throw new Error(`Local image not found: ${fullPath}`);
      }
    }
    
    // Upload to Sanity
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename || path.basename(imagePath)
    });
    
    return asset;
  } catch (error) {
    console.error(`Failed to upload image ${imagePath}:`, error.message);
    return null;
  }
};

// Utilities
const parseDate = (dateString) => {
  if (!dateString) return new Date().toISOString();
  
  try {
    // Try parsing the date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.warn(`Could not parse date: ${dateString}`);
  }
  
  return new Date().toISOString();
};

const createExcerpt = (content, maxLength = 160) => {
  if (!content) return '';
  
  // Remove extra whitespace and truncate
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  
  // Try to cut at a word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

const categoryMapping = {
  'design': 'design',
  'objects': 'objects',
  'crafts': 'crafts',
  'art': 'art',
  'pottery': 'pottery',
  'textiles': 'textiles',
  'lifestyle': 'lifestyle',
  'interior': 'interior'
};

const inferCategory = (title, content, categories = []) => {
  const text = `${title} ${content} ${categories.join(' ')}`.toLowerCase();
  
  // Check for keywords to infer category
  if (text.includes('pottery') || text.includes('ceramic')) return 'pottery';
  if (text.includes('textile') || text.includes('fabric') || text.includes('weav')) return 'textiles';
  if (text.includes('design')) return 'design';
  if (text.includes('craft')) return 'crafts';
  if (text.includes('art') || text.includes('artist')) return 'art';
  if (text.includes('interior') || text.includes('space')) return 'interior';
  if (text.includes('lifestyle') || text.includes('living')) return 'lifestyle';
  
  return 'objects'; // Default category
};

// Create Sanity document from migration data
const createSanityDocumentFromMigration = (article) => {
  const doc = {
    _type: 'article',
    title: article.title,
    slug: {
      _type: 'slug',
      current: article.slug
    },
    publishedAt: parseDate(article.date),
    excerpt: createExcerpt(article.content),
    category: inferCategory(article.title, article.content),
    author: article.author || 'Russell Concept House',
    
    // For now, store content as plain text in a temporary field
    // We'll update this to proper block content later
    _tempContent: article.content,
    
    // Store migration metadata
    _migrationData: {
      source: 'backup',
      sourceFile: article.sourceFile,
      originalDate: article.date,
      imageCount: article.images ? article.images.length : 0,
      migrated: true,
      processedImages: article.processedImages || []
    }
  };
  
  return doc;
};

// Create Sanity document from RSS data
const createSanityDocumentFromRSS = (post) => {
  const doc = {
    _type: 'article',
    title: post.title,
    slug: {
      _type: 'slug',
      current: post.slug
    },
    publishedAt: parseDate(post.publishedAt || post.date),
    excerpt: post.excerpt || createExcerpt(post.content),
    category: inferCategory(post.title, post.content, post.categories),
    author: post.author || 'Russell Concept House',
    
    // Store additional RSS data
    _tempContent: post.content,
    _rssLink: post.link,
    _rssGuid: post.guid,
    
    // Store migration metadata
    _migrationData: {
      source: 'rss',
      originalDate: post.date,
      publishedAt: post.publishedAt,
      imageCount: post.images ? post.images.length : 0,
      migrated: true,
      categories: post.categories || [],
      processedImages: post.processedImages || []
    }
  };
  
  return doc;
};

// Create Sanity document from sitemap data
const createSanityDocumentFromSitemap = async (post) => {
  const doc = {
    _type: 'article',
    title: post.title,
    slug: {
      _type: 'slug',
      current: post.slug
    },
    publishedAt: parseDate(post.date),
    excerpt: post.description || createExcerpt(post.content),
    category: inferCategory(post.title, post.content),
    author: post.author || 'Russell Nicolau',
    
    // Convert HTML content to Portable Text
    content: htmlToPortableText(post.content),
    
    // Store migration metadata
    _migrationData: {
      source: 'sitemap',
      originalDate: post.date,
      imageCount: post.images ? post.images.length : 0,
      migrated: true,
      sourceUrl: post.url,
      fetchedAt: post.fetchedAt
    }
  };
  
  // Process main image (first image)
  if (post.images && post.images.length > 0) {
    console.log(`   📸 Uploading main image...`);
    
    // Check if images have localPath property
    const firstImage = post.images[0];
    const imagePath = firstImage.localPath || firstImage.url;
    
    const asset = await uploadImageToSanity(
      imagePath,
      `${post.slug}-main.jpg`
    );
    
    if (asset) {
      doc.mainImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        }
      };
    }
  }
  
  return doc;
};

// Load all data sources
const loadAllPosts = async () => {
  // Try to load complete sitemap data first (all 111 posts)
  try {
    const sitemapDataPath = path.join(process.cwd(), 'src/data/wix-all-111-posts.json');
    const sitemapData = JSON.parse(await fs.readFile(sitemapDataPath, 'utf-8'));
    
    // Check if it's an array directly (new format from sitemap scraper)
    if (Array.isArray(sitemapData)) {
      console.log(`🌐 Loaded ${sitemapData.length} posts from complete sitemap`);
      console.log(`   This contains all blog posts from the sitemap scraper\n`);
      
      // Convert sitemap data to expected format
      return sitemapData.filter(post => !post.error).map(post => ({
        ...post,
        _source: 'sitemap',
        slug: post.url.split('/').pop() // Extract slug from URL
      }));
    } else {
      // Handle old format with posts property
      console.log(`🌐 Loaded ${sitemapData.posts.length} posts from complete sitemap`);
      console.log(`   Successfully scraped: ${sitemapData.successfulScrapes}`);
      console.log(`   Failed scrapes: ${sitemapData.failedScrapes}`);
      console.log(`   This should contain all 111 blog posts\n`);
      
      return sitemapData.posts.filter(post => !post.error).map(post => ({
        ...post,
        _source: 'sitemap',
        slug: post.slug || post.url.split('/').pop()
      }));
    }
  } catch (error) {
    console.log('⚠️  Complete sitemap data not found, trying combined data...\n');
    
    // Try to load combined data
    try {
      const combinedDataPath = path.join(process.cwd(), 'src/data/wix-combined-posts.json');
      const combinedData = JSON.parse(await fs.readFile(combinedDataPath, 'utf-8'));
      
      console.log(`📊 Loaded ${combinedData.posts.length} posts from combined data`);
      console.log(`   Sources breakdown:`);
      console.log(`   - RSS only: ${combinedData.metadata.sources.rssOnly}`);
      console.log(`   - Migration only: ${combinedData.metadata.sources.migrationOnly}`);
      console.log(`   - Both sources: ${combinedData.metadata.sources.both}`);
      console.log(`   - Missing: ${combinedData.metadata.missingPosts} (out of expected 111)\n`);
      
      // Map source field correctly
      return combinedData.posts.map(post => ({
        ...post,
        _source: post.source === 'both' ? 'rss' : post.source // Prefer RSS if in both
      }));
    } catch (error) {
      // Fall back to loading individual sources
      console.log('⚠️  Combined data not found, loading individual sources...\n');
    
    const allPosts = new Map(); // Use slug as key to avoid duplicates
    let sources = [];
    
    // Try to load RSS data
    try {
      const rssDataPath = path.join(process.cwd(), 'src/data/wix-all-posts.json');
      const rssData = JSON.parse(await fs.readFile(rssDataPath, 'utf-8'));
      
      console.log(`📡 Loaded ${rssData.posts.length} posts from RSS feed`);
      sources.push(`RSS (${rssData.posts.length} posts)`);
      
      // Add RSS posts (these are preferred)
      rssData.posts.forEach(post => {
        allPosts.set(post.slug, {
          ...post,
          _source: 'rss'
        });
      });
    } catch (error) {
      console.log('⚠️  RSS data not found, skipping...');
    }
    
    // Try to load migration data
    try {
      const migrationDataPath = path.join(process.cwd(), 'src/data/wix-migration.json');
      const migrationData = JSON.parse(await fs.readFile(migrationDataPath, 'utf-8'));
      
      console.log(`📁 Loaded ${migrationData.articles.length} posts from backup`);
      sources.push(`Backup (${migrationData.articles.length} posts)`);
      
      // Add migration posts (only if not already present from RSS)
      migrationData.articles.forEach(article => {
        if (!allPosts.has(article.slug)) {
          allPosts.set(article.slug, {
            ...article,
            _source: 'migration'
          });
        }
      });
    } catch (error) {
      console.log('⚠️  Migration data not found, skipping...');
    }
    
    if (allPosts.size === 0) {
      throw new Error('No posts found in any data source!');
    }
    
    console.log(`\n📊 Total unique posts to import: ${allPosts.size}`);
    console.log(`   Sources: ${sources.join(', ')}\n`);
    
    return Array.from(allPosts.values());
    }
  }
};

// Import articles to Sanity
const importToSanity = async () => {
  console.log('🚀 Starting Sanity import...\n');
  
  // Check for API token
  if (!config.token) {
    console.error('❌ Error: SANITY_API_TOKEN not found in environment variables');
    console.log('\nPlease add your Sanity API token to .env:');
    console.log('SANITY_API_TOKEN=your-token-here\n');
    console.log('You can create a token at: https://www.sanity.io/manage/project/cc0sr5iy/api');
    process.exit(1);
  }
  
  try {
    // Load all posts from both sources
    const allPosts = await loadAllPosts();
    
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      bySource: {
        sitemap: { successful: 0, failed: 0, skipped: 0 },
        rss: { successful: 0, failed: 0, skipped: 0 },
        migration: { successful: 0, failed: 0, skipped: 0 }
      },
      errors: []
    };
    
    // Process each post
    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      const source = post._source;
      
      console.log(`\n📄 Processing post ${i + 1}/${allPosts.length} [${source.toUpperCase()}]`);
      console.log(`   Title: ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      
      try {
        // Check if article already exists
        const existingQuery = `*[_type == "article" && slug.current == $slug][0]`;
        const existing = await client.fetch(existingQuery, { slug: post.slug });
        
        if (existing) {
          console.log(`   ⚠️  Article already exists, skipping...`);
          results.skipped++;
          if (!results.bySource[source]) {
            results.bySource[source] = { successful: 0, failed: 0, skipped: 0 };
          }
          results.bySource[source].skipped++;
          continue;
        }
        
        // Create Sanity document based on source
        let doc;
        if (source === 'sitemap') {
          doc = await createSanityDocumentFromSitemap(post);
        } else if (source === 'rss') {
          doc = createSanityDocumentFromRSS(post);
        } else {
          doc = createSanityDocumentFromMigration(post);
        }
        
        // Create the document
        console.log(`   📝 Creating document...`);
        const created = await client.create(doc);
        
        console.log(`   ✅ Successfully created with ID: ${created._id}`);
        results.successful++;
        if (!results.bySource[source]) {
          results.bySource[source] = { successful: 0, failed: 0, skipped: 0 };
        }
        results.bySource[source].successful++;
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
        if (!results.bySource[source]) {
          results.bySource[source] = { successful: 0, failed: 0, skipped: 0 };
        }
        results.bySource[source].failed++;
        results.errors.push({
          post: post.title,
          source,
          error: error.message
        });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${results.successful}`);
    console.log(`⚠️  Skipped (already exist): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`\nTotal processed: ${allPosts.length}`);
    
    // Show breakdown by source
    console.log('\n📈 Breakdown by source:');
    if (results.bySource.sitemap.successful + results.bySource.sitemap.skipped + results.bySource.sitemap.failed > 0) {
      console.log(`   Sitemap: ${results.bySource.sitemap.successful} imported, ${results.bySource.sitemap.skipped} skipped, ${results.bySource.sitemap.failed} failed`);
    }
    console.log(`   RSS Feed: ${results.bySource.rss.successful} imported, ${results.bySource.rss.skipped} skipped, ${results.bySource.rss.failed} failed`);
    console.log(`   Backup: ${results.bySource.migration.successful} imported, ${results.bySource.migration.skipped} skipped, ${results.bySource.migration.failed} failed`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => {
        console.log(`   - [${err.source}] ${err.post}: ${err.error}`);
      });
    }
    
    if (results.successful > 0) {
      console.log('\n🎉 Next steps:');
      console.log('1. Visit your Sanity Studio to review the imported articles');
      console.log('2. Main images have been uploaded and set for homepage grid');
      console.log('3. Review and enhance the converted content as needed');
      console.log('4. Add additional images from the blog posts if needed');
      console.log('5. Review and update categories as needed');
    }
    
    console.log('\n📝 Note about images:');
    console.log('- First image from each post is set as mainImage for homepage grid');
    console.log('- Images were uploaded to Sanity asset pipeline');
    console.log('- Additional post images can be added to content later');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run import
const run = async () => {
  console.log('📋 Sanity Configuration:');
  console.log(`   Project ID: ${config.projectId}`);
  console.log(`   Dataset: ${config.dataset}`);
  console.log(`   API Version: ${config.apiVersion}`);
  console.log(`   Token: ${config.token ? '***' + config.token.slice(-4) : 'NOT SET'}`);
  console.log();
  
  await importToSanity();
};

run();