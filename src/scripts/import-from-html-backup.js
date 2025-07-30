const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const cheerio = require('cheerio');

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

// Paths
const BACKUP_PATH = path.join(process.env.HOME, 'Desktop/RussellConceptBackup/backup/www.russellconcept.com/post');
const WIX_IMAGES_PATH = path.join(process.cwd(), 'WIX_SITE_FILES');

// Enhanced HTML to Portable Text converter
const htmlToPortableText = (html) => {
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const blocks = [];
  
  // Process each paragraph, heading, or text block
  $('p, h1, h2, h3, h4, h5, h6').each((i, elem) => {
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

// Extract content from HTML
const extractContentFromHTML = async (htmlPath) => {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const $ = cheerio.load(html);
  
  // Extract title
  const title = $('h1').first().text().trim() || 
               $('meta[property="og:title"]').attr('content') || 
               $('title').text().trim();
  
  // Extract date
  let date = null;
  const dateSelectors = [
    'time',
    '[data-testid="blog-post-date"]',
    '.blog-post-date',
    '.post-date',
    '[class*="date"]',
    '[datetime]'
  ];
  
  for (const selector of dateSelectors) {
    const element = $(selector).first();
    if (element.length) {
      date = element.attr('datetime') || element.text().trim();
      if (date) break;
    }
  }
  
  if (!date) {
    date = $('meta[property="article:published_time"]').attr('content') ||
           $('meta[name="publish_date"]').attr('content');
  }
  
  // Extract main content area
  const contentSelectors = [
    '[data-testid="blog-post-content"]',
    '.blog-post-content',
    '.post-content',
    'article',
    '[class*="rich-text"]',
    '[class*="post-body"]',
    'main'
  ];
  
  let contentHtml = '';
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      contentHtml = element.html();
      break;
    }
  }
  
  // Extract images
  const images = [];
  $('img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    const alt = $(elem).attr('alt') || '';
    
    if (src && !src.startsWith('data:')) {
      // Extract filename from URL
      const urlParts = src.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0];
      
      images.push({
        src,
        alt,
        filename,
        localPath: path.join(WIX_IMAGES_PATH, filename)
      });
    }
  });
  
  // Create excerpt
  const excerpt = $('p').first().text().trim().substring(0, 160) + '...';
  
  return {
    title,
    date,
    contentHtml,
    images,
    excerpt
  };
};

// Upload image to Sanity
const uploadImageToSanity = async (imagePath, filename) => {
  try {
    let imageBuffer;
    
    // Check if local file exists
    if (fsSync.existsSync(imagePath)) {
      console.log(`      ✓ Found local image: ${path.basename(imagePath)}`);
      imageBuffer = await fs.readFile(imagePath);
    } else {
      console.log(`      ✗ Local image not found: ${path.basename(imagePath)}`);
      return null;
    }
    
    // Upload to Sanity
    console.log(`      Uploading to Sanity...`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename
    });
    
    console.log(`      ✓ Uploaded successfully: ${asset._id}`);
    return asset;
    
  } catch (error) {
    console.error(`      ✗ Error uploading image:`, error.message);
    return null;
  }
};

// Main import function
const importFromHTMLBackup = async () => {
  console.log('🚀 Starting HTML Backup Import to Sanity...\n');
  console.log('Backup path:', BACKUP_PATH);
  console.log('WIX images path:', WIX_IMAGES_PATH);
  
  // Check for API token
  if (!config.token) {
    console.error('❌ Error: SANITY_API_TOKEN not found in environment variables');
    console.log('\nPlease add your Sanity API token to .env:');
    console.log('SANITY_API_TOKEN=your-token-here\n');
    process.exit(1);
  }
  
  try {
    // Get all HTML files
    const files = await fs.readdir(BACKUP_PATH);
    const htmlFiles = files.filter(f => f.endsWith('.html')).sort();
    
    console.log(`\n📚 Found ${htmlFiles.length} HTML files to import\n`);
    
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each HTML file
    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlFile = htmlFiles[i];
      const htmlPath = path.join(BACKUP_PATH, htmlFile);
      const slug = htmlFile.replace('.html', '');
      
      console.log(`\n📄 Processing ${i + 1}/${htmlFiles.length}: ${htmlFile}`);
      
      try {
        // Check if article already exists
        const existingQuery = `*[_type == "article" && slug.current == $slug][0]`;
        const existing = await client.fetch(existingQuery, { slug });
        
        if (existing) {
          console.log(`   ⚠️  Article already exists, skipping...`);
          results.skipped++;
          continue;
        }
        
        // Extract content from HTML
        const data = await extractContentFromHTML(htmlPath);
        console.log(`   📌 Title: ${data.title}`);
        console.log(`   📅 Date: ${data.date || 'Not found'}`);
        console.log(`   🖼️  Images: ${data.images.length}`);
        
        // Upload images
        let mainImageRef = null;
        const imageGallery = [];
        
        for (let j = 0; j < data.images.length; j++) {
          const img = data.images[j];
          console.log(`   📸 Processing image ${j + 1}/${data.images.length}`);
          
          const asset = await uploadImageToSanity(img.localPath, `${slug}-${j + 1}-${img.filename}`);
          
          if (asset) {
            const imageRef = {
              _type: 'image',
              _key: `img-${j}`,
              asset: {
                _type: 'reference',
                _ref: asset._id
              }
            };
            
            // First image becomes main image
            if (j === 0) {
              mainImageRef = {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: asset._id
                }
              };
            }
            
            imageGallery.push(imageRef);
          }
        }
        
        // Infer category from title
        const titleLower = data.title.toLowerCase();
        let category = 'design';
        if (titleLower.includes('lighting') || titleLower.includes('lamp')) category = 'lighting';
        else if (titleLower.includes('ceramic') || titleLower.includes('pottery')) category = 'pottery';
        else if (titleLower.includes('textile') || titleLower.includes('fabric')) category = 'textiles';
        else if (titleLower.includes('furniture') || titleLower.includes('table') || titleLower.includes('chair')) category = 'furniture';
        else if (titleLower.includes('glass')) category = 'glass';
        
        // Create Sanity document
        const doc = {
          _type: 'article',
          title: data.title,
          slug: {
            _type: 'slug',
            current: slug
          },
          publishedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
          excerpt: data.excerpt,
          category,
          author: 'Russell Nicolau',
          mainImage: mainImageRef,
          content: htmlToPortableText(data.contentHtml),
          imageGallery: imageGallery,
          _migrationData: {
            sourceFile: htmlFile,
            importedAt: new Date().toISOString(),
            imageCount: data.images.length
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
          file: htmlFile,
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
    console.log(`\nTotal processed: ${htmlFiles.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.slice(0, 10).forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    console.log('\n🎉 Next steps:');
    console.log('1. Check your Sanity Studio to verify the imported articles');
    console.log('2. Review articles that might be missing images');
    console.log('3. Update categories and metadata as needed');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run import
importFromHTMLBackup();