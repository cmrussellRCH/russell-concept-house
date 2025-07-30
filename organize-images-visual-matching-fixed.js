const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { JSDOM } = require('jsdom');
const https = require('https');
const http = require('http');

// Configuration
const WIX_SITE_FILES = path.join(__dirname, 'WIX_SITE_FILES');
const OUTPUT_DIR = path.join(__dirname, 'organized-images');
const BACKUP_DIR = '/Users/anthonynicolau/Desktop/RussellConceptBackup/backup/www.russellconcept.com/post';
const TEMP_DIR = path.join(__dirname, 'temp-downloads');

// Download image from URL
async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = require('fs').createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      require('fs').unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Calculate perceptual hash using dhash algorithm
async function getPerceptualHash(imagePath) {
  try {
    const image = sharp(imagePath);
    
    // Resize to 9x8 for dhash (difference hash)
    const { data } = await image
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Calculate differences between adjacent pixels
    let hash = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = data[y * 9 + x];
        const right = data[y * 9 + x + 1];
        hash += left > right ? '1' : '0';
      }
    }
    
    return hash;
  } catch (error) {
    console.error(`Error hashing ${imagePath}:`, error.message);
    return null;
  }
}

// Get image metadata
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: (await fs.stat(imagePath)).size
    };
  } catch (error) {
    return null;
  }
}

// Calculate similarity between two hashes (Hamming distance)
function calculateSimilarity(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0;
  
  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  
  return matches / hash1.length;
}

// Find all images in WIX_SITE_FILES
async function findWixImages() {
  const images = [];
  
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  }
  
  await walk(WIX_SITE_FILES);
  return images;
}

// Parse HTML to extract image URLs
async function extractImagesFromHTML(htmlPath) {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const images = [];
  const imgElements = doc.querySelectorAll('img');
  
  for (const img of imgElements) {
    const src = img.src || img.getAttribute('src');
    if (!src) continue;
    
    // Skip logos, icons, and UI elements
    if (src.includes('logo') || 
        src.includes('icon') || 
        src.includes('favicon') ||
        src.includes('placeholder') ||
        src.includes('empty') ||
        src.includes('arrow')) {
      continue;
    }
    
    // Convert relative URLs to absolute
    let fullUrl = src;
    if (!src.startsWith('http')) {
      if (src.startsWith('//')) {
        fullUrl = 'https:' + src;
      } else {
        fullUrl = 'https://www.russellconcept.com' + (src.startsWith('/') ? src : '/' + src);
      }
    }
    
    images.push({
      url: fullUrl,
      alt: img.alt || '',
      title: img.title || ''
    });
  }
  
  return images;
}

// Build hash index for WIX images
async function buildWixImageIndex() {
  console.log('Building index of WIX_SITE_FILES images...');
  const wixImages = await findWixImages();
  const index = new Map();
  
  let processed = 0;
  for (const imagePath of wixImages) {
    const hash = await getPerceptualHash(imagePath);
    const metadata = await getImageMetadata(imagePath);
    
    if (hash && metadata) {
      // Skip small images (likely icons/logos)
      if (metadata.width < 200 || metadata.height < 200) {
        continue;
      }
      
      index.set(imagePath, {
        hash,
        metadata,
        path: imagePath
      });
      
      processed++;
      if (processed % 100 === 0) {
        console.log(`  Processed ${processed} images...`);
      }
    }
  }
  
  console.log(`Indexed ${index.size} high-quality images from WIX_SITE_FILES`);
  return index;
}

// Find best matching WIX image using visual comparison
async function findBestVisualMatch(downloadedImagePath, wixImageIndex, threshold = 0.85) {
  const downloadedHash = await getPerceptualHash(downloadedImagePath);
  if (!downloadedHash) return null;
  
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const [wixPath, wixInfo] of wixImageIndex) {
    const similarity = calculateSimilarity(downloadedHash, wixInfo.hash);
    
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity;
      bestMatch = {
        path: wixPath,
        similarity: similarity,
        info: wixInfo
      };
    }
  }
  
  return bestMatch;
}

async function organizeArticleImages() {
  try {
    // Create directories
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Build index of WIX images
    const wixImageIndex = await buildWixImageIndex();
    
    // Find all article HTML files
    const files = await fs.readdir(BACKUP_DIR);
    const articleFiles = files.filter(file => {
      return file.endsWith('.html') && 
        !['feed.html', 'sitemap.html', 'robots.html', 'decodeURIComponent(e.html', 'c.html', 't.html'].includes(file);
    });
    
    console.log(`\nProcessing ${articleFiles.length} articles for images...`);
    let totalOrganized = 0;
    
    for (const file of articleFiles) {
      const htmlPath = path.join(BACKUP_DIR, file);
      const articleSlug = path.basename(file, '.html');
      
      try {
        console.log(`\nProcessing article: ${articleSlug}`);
        
        // Extract images from HTML
        const articleImages = await extractImagesFromHTML(htmlPath);
        console.log(`  Found ${articleImages.length} images in HTML`);
        
        if (articleImages.length === 0) continue;
        
        // Create article directory
        const articleOutputDir = path.join(OUTPUT_DIR, articleSlug);
        await fs.mkdir(articleOutputDir, { recursive: true });
        
        // Process each image
        let copiedCount = 0;
        const usedWixImages = new Set();
        
        for (let i = 0; i < articleImages.length; i++) {
          const articleImage = articleImages[i];
          
          try {
            // Download image temporarily
            const tempFilename = `${articleSlug}_${i}.jpg`;
            const tempPath = path.join(TEMP_DIR, tempFilename);
            
            console.log(`  Downloading image ${i + 1}/${articleImages.length}...`);
            await downloadImage(articleImage.url, tempPath);
            
            // Find best visual match
            const match = await findBestVisualMatch(tempPath, wixImageIndex);
            
            if (match && !usedWixImages.has(match.path)) {
              const destFilename = `image-${copiedCount + 1}${path.extname(match.path)}`;
              const destPath = path.join(articleOutputDir, destFilename);
              
              await fs.copyFile(match.path, destPath);
              usedWixImages.add(match.path);
              copiedCount++;
              console.log(`  ✓ Matched: ${path.basename(match.path)} (${Math.round(match.similarity * 100)}% similarity)`);
            } else if (!match) {
              console.log(`  ✗ No match found for image ${i + 1}`);
            }
            
            // Clean up temp file
            await fs.unlink(tempPath).catch(() => {});
            
          } catch (error) {
            console.log(`  ✗ Error processing image ${i + 1}: ${error.message}`);
          }
        }
        
        console.log(`  Organized ${copiedCount} images for ${articleSlug}`);
        totalOrganized += copiedCount;
        
      } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
      }
    }
    
    // Clean up temp directory
    await fs.rmdir(TEMP_DIR, { recursive: true }).catch(() => {});
    
    console.log(`\n\nImage Organization Complete!`);
    console.log(`Total images organized: ${totalOrganized}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('Organization failed:', error);
  }
}

// Run the organization
organizeArticleImages();