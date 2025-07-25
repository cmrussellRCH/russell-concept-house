const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@sanity/client');
require('dotenv').config();

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

const inferCategory = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  
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

// Create Sanity document
const createSanityDocument = (article) => {
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
    author: 'Russell Concept House',
    
    // For now, store content as plain text in a temporary field
    // We'll update this to proper block content later
    _tempContent: article.content,
    
    // Store migration metadata
    _migrationData: {
      sourceFile: article.sourceFile,
      originalDate: article.date,
      imageCount: article.images ? article.images.length : 0,
      migrated: true
    }
  };
  
  return doc;
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
    // Read migration data
    const migrationDataPath = path.join(process.cwd(), 'src/data/wix-migration.json');
    const migrationData = JSON.parse(await fs.readFile(migrationDataPath, 'utf-8'));
    
    console.log(`📁 Found ${migrationData.articles.length} articles to import\n`);
    
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each article
    for (let i = 0; i < migrationData.articles.length; i++) {
      const article = migrationData.articles[i];
      console.log(`\n📄 Processing article ${i + 1}/${migrationData.articles.length}`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      
      try {
        // Check if article already exists
        const existingQuery = `*[_type == "article" && slug.current == $slug][0]`;
        const existing = await client.fetch(existingQuery, { slug: article.slug });
        
        if (existing) {
          console.log(`   ⚠️  Article already exists, skipping...`);
          results.skipped++;
          continue;
        }
        
        // Create Sanity document
        const doc = createSanityDocument(article);
        
        // Create the document
        console.log(`   📝 Creating document...`);
        const created = await client.create(doc);
        
        console.log(`   ✅ Successfully created with ID: ${created._id}`);
        results.successful++;
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          article: article.title,
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
    console.log(`\nTotal processed: ${migrationData.articles.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => {
        console.log(`   - ${err.article}: ${err.error}`);
      });
    }
    
    if (results.successful > 0) {
      console.log('\n🎉 Next steps:');
      console.log('1. Visit your Sanity Studio to review the imported articles');
      console.log('2. Add images using the Cloudinary integration');
      console.log('3. Convert plain text content to rich text blocks');
      console.log('4. Review and update categories as needed');
    }
    
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