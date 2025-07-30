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

// Enhanced HTML to Portable Text converter
const htmlToPortableText = (html) => {
  if (!html) return [];
  
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const blocks = [];
  
  // Process each paragraph, heading, or text block
  $('p, h1, h2, h3, h4, h5, h6, div').each((i, elem) => {
    const tagName = elem.tagName.toLowerCase();
    const text = $(elem).text().trim();
    
    if (!text) return;
    
    // Determine block style based on tag
    let style = 'normal';
    if (tagName === 'h1') style = 'h1';
    else if (tagName === 'h2') style = 'h2';
    else if (tagName === 'h3') style = 'h3';
    else if (tagName === 'h4') style = 'h4';
    else if (tagName === 'h5') style = 'h5';
    else if (tagName === 'h6') style = 'h6';
    
    blocks.push({
      _type: 'block',
      style,
      _key: `block-${i}`,
      children: [{
        _type: 'span',
        _key: `span-${i}`,
        text,
        marks: []
      }],
      markDefs: []
    });
  });
  
  return blocks;
};

// Create clean excerpt from HTML
const createCleanExcerpt = (html, maxLength = 160) => {
  if (!html) return '';
  
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const text = $.text().trim();
  
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

// Upload image to Sanity
const uploadImageToSanity = async (imagePath, filename) => {
  try {
    let imageBuffer;
    let fullPath;
    
    if (imagePath.startsWith('http')) {
      // Download from URL
      console.log(`      Downloading from URL: ${imagePath}`);
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      imageBuffer = await response.buffer();
    } else {
      // Handle local path - remove leading slash and adjust path
      const cleanPath = imagePath.replace(/^\//, '');
      fullPath = path.join(process.cwd(), 'src/data', cleanPath.replace('images/', ''));
      
      console.log(`      Looking for local file: ${fullPath}`);
      
      if (fsSync.existsSync(fullPath)) {
        imageBuffer = await fs.readFile(fullPath);
        console.log(`      ✓ Found local file`);
      } else {
        console.log(`      ✗ Local file not found, trying URL fallback`);
        return null;
      }
    }
    
    // Upload to Sanity
    console.log(`      Uploading to Sanity...`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename || path.basename(imagePath)
    });
    
    console.log(`      ✓ Uploaded successfully: ${asset._id}`);
    return asset;
    
  } catch (error) {
    console.error(`      ✗ Error uploading image:`, error.message);
    return null;
  }
};

// Upload multiple images
const uploadImages = async (images, slugPrefix) => {
  const uploadedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const filename = `${slugPrefix}-${i + 1}${path.extname(image.localPath || image.url || '.jpg')}`;
    
    console.log(`   📸 Processing image ${i + 1}/${images.length}`);
    
    // Try local path first, then URL
    const imagePath = image.localPath || image.url;
    const asset = await uploadImageToSanity(imagePath, filename);
    
    if (asset) {
      uploadedImages.push({
        _type: 'image',
        _key: `img-${i}`,
        asset: {
          _type: 'reference',
          _ref: asset._id
        }
      });
    }
  }
  
  return uploadedImages;
};

// Import articles to Sanity
const importToSanity = async () => {
  console.log('🚀 Starting Sanity import (FIXED VERSION)...\n');
  
  // Check for API token
  if (!config.token) {
    console.error('❌ Error: SANITY_API_TOKEN not found in environment variables');
    console.log('\nPlease add your Sanity API token to .env:');
    console.log('SANITY_API_TOKEN=your-token-here\n');
    process.exit(1);
  }
  
  try {
    // Load articles from sitemap scraper output
    const dataPath = path.join(process.cwd(), 'src/data/wix-all-111-posts.json');
    const articles = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log(`📚 Loaded ${articles.length} articles from wix-all-111-posts.json\n`);
    
    // Ask user if they want to delete existing articles
    console.log('⚠️  WARNING: This will re-import all articles.');
    console.log('   It\'s recommended to delete existing articles first to avoid duplicates.\n');
    
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log(`\n📄 Processing article ${i + 1}/${articles.length}`);
      console.log(`   Title: ${article.title}`);
      console.log(`   URL: ${article.url}`);
      
      try {
        // Extract slug
        const slug = article.url.split('/').pop();
        
        // Check if article already exists
        const existingQuery = `*[_type == "article" && slug.current == $slug][0]`;
        const existing = await client.fetch(existingQuery, { slug });
        
        if (existing) {
          console.log(`   ⚠️  Article already exists, skipping...`);
          results.skipped++;
          continue;
        }
        
        // Upload images
        let mainImageRef = null;
        let imageGallery = [];
        
        if (article.images && article.images.length > 0) {
          console.log(`   Found ${article.images.length} images`);
          
          // Upload first image as main image
          const firstImage = article.images[0];
          const mainImagePath = firstImage.localPath || firstImage.url;
          const mainAsset = await uploadImageToSanity(mainImagePath, `${slug}-main.jpg`);
          
          if (mainAsset) {
            mainImageRef = {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: mainAsset._id
              }
            };
          }
          
          // Upload all images to gallery (including the first one)
          imageGallery = await uploadImages(article.images, slug);
        }
        
        // Create Sanity document
        const doc = {
          _type: 'article',
          title: article.title,
          slug: {
            _type: 'slug',
            current: slug
          },
          publishedAt: article.date ? new Date(article.date).toISOString() : new Date().toISOString(),
          excerpt: createCleanExcerpt(article.content),
          category: 'design', // You might want to infer this from content
          author: article.author || 'Russell Nicolau',
          mainImage: mainImageRef,
          content: htmlToPortableText(article.content),
          imageGallery: imageGallery,
          _migrationData: {
            sourceUrl: article.url,
            importedAt: new Date().toISOString(),
            imageCount: article.images?.length || 0
          }
        };
        
        // Create the document
        console.log(`   📝 Creating document in Sanity...`);
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
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${results.successful}`);
    console.log(`⚠️  Skipped (already exist): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`\nTotal processed: ${articles.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => {
        console.log(`   - ${err.article}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Next steps:');
    console.log('1. Check your Sanity Studio to verify the imported articles');
    console.log('2. Images should now be visible in the Media library');
    console.log('3. Each article should have a main image and image gallery');
    console.log('4. Body content should be properly formatted');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run import
importToSanity();