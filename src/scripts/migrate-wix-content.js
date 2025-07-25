const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const config = {
  articlesPath: path.join(process.env.HOME, 'Desktop/RussellConceptBackup/backup/www.russellconcept.com/articles/page'),
  imagesPath: path.join(process.env.HOME, 'Desktop/RussellConceptBackup/backup/static.wixstatic.com/media'),
  outputImagesPath: path.join(process.cwd(), 'public/images/wix-import'),
  outputDataPath: path.join(process.cwd(), 'src/data/wix-migration.json'),
  imageMapping: {}
};

// Utilities
const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const extractImageExtension = (filename) => {
  const match = filename.match(/\.(jpg|jpeg|png|gif|webp)/i);
  return match ? match[0] : '.jpg';
};

// Parse article HTML
const parseArticle = async (htmlContent, filename) => {
  const $ = cheerio.load(htmlContent);
  
  // Extract title - try multiple selectors
  let title = $('h1').first().text().trim() ||
              $('h2').first().text().trim() ||
              $('title').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              `Article ${filename}`;
  
  // Extract date - try multiple methods
  let date = null;
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\w+ \d{1,2},? \d{4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
  ];
  
  const textContent = $.text();
  for (const pattern of datePatterns) {
    const match = textContent.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }
  
  // Extract main content
  let content = '';
  const contentSelectors = [
    'article',
    '.post-content',
    '.entry-content',
    'main',
    '#content',
    'div[role="main"]'
  ];
  
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element.text().trim();
      break;
    }
  }
  
  // If no specific content area found, get all paragraph text
  if (!content) {
    content = $('p').map((i, el) => $(el).text()).get().join('\n\n');
  }
  
  // Extract images
  const images = [];
  $('img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    const alt = $(elem).attr('alt') || '';
    if (src && src.includes('wixstatic.com')) {
      images.push({ src, alt });
    }
  });
  
  // Also check for background images in style attributes
  $('[style*="background-image"]').each((i, elem) => {
    const style = $(elem).attr('style');
    const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (match && match[1].includes('wixstatic.com')) {
      images.push({ src: match[1], alt: '' });
    }
  });
  
  return {
    title,
    date,
    content: content.substring(0, 5000), // Limit content length
    images,
    sourceFile: filename
  };
};

// Process single image
const processImage = async (imageSrc, articleSlug, imageIndex) => {
  const imageFilename = path.basename(imageSrc.split('?')[0]);
  const extension = extractImageExtension(imageFilename);
  const newImageName = `${articleSlug}-image-${imageIndex}${extension}`;
  
  // Look for the image in the backup directory
  try {
    const files = await fs.readdir(config.imagesPath);
    const matchingFile = files.find(file => file.includes(imageFilename) || imageSrc.includes(file));
    
    if (matchingFile) {
      const sourcePath = path.join(config.imagesPath, matchingFile);
      const destPath = path.join(config.outputImagesPath, newImageName);
      
      await fs.copyFile(sourcePath, destPath);
      config.imageMapping[imageSrc] = `/images/wix-import/${newImageName}`;
      
      return {
        success: true,
        oldUrl: imageSrc,
        newUrl: `/images/wix-import/${newImageName}`,
        filename: newImageName
      };
    }
  } catch (error) {
    console.error(`Error processing image ${imageFilename}:`, error.message);
  }
  
  return {
    success: false,
    oldUrl: imageSrc,
    error: 'Image not found in backup'
  };
};

// Main migration function
const migrateContent = async () => {
  console.log('🚀 Starting Wix content migration...\n');
  
  const articles = [];
  const imageResults = [];
  const errors = [];
  
  try {
    // Ensure output directories exist
    await fs.mkdir(config.outputImagesPath, { recursive: true });
    await fs.mkdir(path.dirname(config.outputDataPath), { recursive: true });
    
    // Read all HTML files
    const files = await fs.readdir(config.articlesPath);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to process\n`);
    
    // Process each article
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = htmlFiles[i];
      console.log(`\n📄 Processing ${file} (${i + 1}/${htmlFiles.length})...`);
      
      try {
        const filePath = path.join(config.articlesPath, file);
        const htmlContent = await fs.readFile(filePath, 'utf-8');
        
        const article = await parseArticle(htmlContent, file);
        const articleSlug = sanitizeFilename(article.title);
        
        console.log(`   Title: ${article.title}`);
        console.log(`   Date: ${article.date || 'Not found'}`);
        console.log(`   Content length: ${article.content.length} characters`);
        console.log(`   Images found: ${article.images.length}`);
        
        // Process images for this article
        const processedImages = [];
        for (let j = 0; j < article.images.length; j++) {
          const image = article.images[j];
          console.log(`   🖼️  Processing image ${j + 1}/${article.images.length}...`);
          
          const result = await processImage(image.src, articleSlug, j + 1);
          processedImages.push(result);
          imageResults.push(result);
          
          if (result.success) {
            console.log(`      ✅ Saved as: ${result.filename}`);
          } else {
            console.log(`      ❌ Failed: ${result.error}`);
          }
        }
        
        // Update article with processed images
        article.processedImages = processedImages;
        article.slug = articleSlug;
        articles.push(article);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${file}: ${error.message}`);
        errors.push({ file, error: error.message });
      }
    }
    
    // Generate summary report
    const successfulImages = imageResults.filter(r => r.success).length;
    const failedImages = imageResults.filter(r => !r.success).length;
    
    const report = {
      summary: {
        totalArticles: articles.length,
        totalImagesFound: imageResults.length,
        successfulImages,
        failedImages,
        errors: errors.length,
        migrationDate: new Date().toISOString()
      },
      articles,
      imageMapping: config.imageMapping,
      errors
    };
    
    // Save migration data
    await fs.writeFile(
      config.outputDataPath,
      JSON.stringify(report, null, 2)
    );
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Articles processed: ${articles.length}`);
    console.log(`🖼️  Images processed: ${successfulImages}/${imageResults.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`\n📁 Migration data saved to: ${config.outputDataPath}`);
    console.log(`📁 Images saved to: ${config.outputImagesPath}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Check if cheerio is installed
const checkDependencies = async () => {
  try {
    require.resolve('cheerio');
  } catch (e) {
    console.log('📦 Installing required dependency: cheerio...');
    const { execSync } = require('child_process');
    execSync('npm install cheerio', { stdio: 'inherit' });
  }
};

// Run migration
const run = async () => {
  await checkDependencies();
  await migrateContent();
};

run();