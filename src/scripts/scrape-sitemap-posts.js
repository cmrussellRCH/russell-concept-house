const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const xml2js = require('xml2js');

// Configuration
const SITEMAP_FILE = path.join(__dirname, '../data/wix-sitemap.xml');
const OUTPUT_FILE = path.join(__dirname, '../data/wix-all-111-posts.json');
const IMAGE_DIR = path.join(__dirname, '../data/wix-images');
const DELAY_MS = 1000;

// Ensure directories exist
if (!fsSync.existsSync(path.join(__dirname, '../data'))) {
  fsSync.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}
if (!fsSync.existsSync(IMAGE_DIR)) {
  fsSync.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Helper function to delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download image function
async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.buffer();
    const filePath = path.join(IMAGE_DIR, filename);
    fsSync.writeFileSync(filePath, buffer);
    
    return `/images/wix-images/${filename}`;
  } catch (error) {
    console.error(`Failed to download image ${url}:`, error.message);
    return url; // Return original URL if download fails
  }
}

// Parse a single blog post page
async function parsePostPage(url, index, total) {
  console.log(`Fetching post ${index}/${total}: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract title - try multiple selectors
    let title = $('h1').first().text().trim() ||
                $('[data-testid="blog-post-title"]').text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('title').text().split('|')[0].trim();
    
    // Extract date - try multiple approaches
    let date = null;
    
    // Try to find date in various formats
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
    
    // Try to parse date from meta tags if not found
    if (!date) {
      date = $('meta[property="article:published_time"]').attr('content') ||
             $('meta[name="publish_date"]').attr('content');
    }
    
    // Extract author
    let author = $('[data-testid="blog-post-author"]').text().trim() ||
                 $('meta[name="author"]').attr('content') ||
                 $('.author-name').text().trim() ||
                 'Russell Nicolau';
    
    // Extract content - try multiple content areas
    let content = '';
    const contentSelectors = [
      '[data-testid="blog-post-content"]',
      '.blog-post-content',
      '.post-content',
      'article',
      '[class*="rich-text"]',
      '[class*="post-body"]',
      'main'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        content = element.html();
        break;
      }
    }
    
    // Extract images
    const images = [];
    const imageElements = $('img').toArray();
    
    for (let i = 0; i < imageElements.length; i++) {
      const img = $(imageElements[i]);
      let src = img.attr('src') || img.attr('data-src');
      
      if (src && !src.startsWith('data:')) {
        // Make URL absolute if needed
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = 'https://www.russellconcept.com' + src;
        }
        
        // Skip tiny images (likely icons)
        const width = img.attr('width');
        const height = img.attr('height');
        if ((width && parseInt(width) < 50) || (height && parseInt(height) < 50)) {
          continue;
        }
        
        images.push({
          url: src,
          alt: img.attr('alt') || '',
          title: img.attr('title') || ''
        });
      }
    }
    
    // Download images
    const downloadedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const urlParts = img.url.split('/');
      const originalName = urlParts[urlParts.length - 1].split('?')[0];
      const extension = path.extname(originalName) || '.jpg';
      const filename = `post-${index}-img-${i + 1}${extension}`;
      
      console.log(`  Downloading image ${i + 1}/${images.length}...`);
      const localPath = await downloadImage(img.url, filename);
      
      downloadedImages.push({
        ...img,
        localPath
      });
      
      // Small delay between image downloads
      if (i < images.length - 1) {
        await delay(100);
      }
    }
    
    return {
      url,
      title,
      date,
      author,
      content,
      images: downloadedImages,
      source: 'sitemap',
      fetchedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return {
      url,
      title: 'Failed to fetch',
      error: error.message,
      source: 'sitemap',
      fetchedAt: new Date().toISOString()
    };
  }
}

// Main scraping function
async function scrapeSitemap() {
  console.log('Reading sitemap from:', SITEMAP_FILE);
  
  try {
    // Check if sitemap file exists
    if (!fsSync.existsSync(SITEMAP_FILE)) {
      console.error('\n❌ Sitemap file not found!');
      console.error(`Please paste your sitemap XML content into: ${SITEMAP_FILE}`);
      console.error('\nThe file should contain XML like:');
      console.error('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      console.error('  <url>');
      console.error('    <loc>https://www.russellconcept.com/post/...</loc>');
      console.error('  </url>');
      console.error('  ...');
      console.error('</urlset>');
      process.exit(1);
    }
    
    // Read and parse sitemap
    const xml = await fs.readFile(SITEMAP_FILE, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);
    
    // Extract URLs from sitemap
    const urls = [];
    if (result.urlset && result.urlset.url) {
      for (const urlEntry of result.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          urls.push(urlEntry.loc[0]);
        }
      }
    }
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    
    // Fetch each post
    const posts = [];
    for (let i = 0; i < urls.length; i++) {
      const post = await parsePostPage(urls[i], i + 1, urls.length);
      posts.push(post);
      
      // Save progress periodically
      if ((i + 1) % 10 === 0) {
        console.log(`Saving progress... (${posts.length} posts)`);
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(posts, null, 2));
      }
      
      // Delay between requests
      if (i < urls.length - 1) {
        await delay(DELAY_MS);
      }
    }
    
    // Save final results
    console.log(`\nSaving all ${posts.length} posts to ${OUTPUT_FILE}`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    
    // Summary
    const successfulPosts = posts.filter(p => !p.error).length;
    const failedPosts = posts.filter(p => p.error).length;
    
    console.log('\n=== Scraping Complete ===');
    console.log(`Total posts: ${posts.length}`);
    console.log(`Successful: ${successfulPosts}`);
    console.log(`Failed: ${failedPosts}`);
    console.log(`Output saved to: ${OUTPUT_FILE}`);
    console.log(`Images saved to: ${IMAGE_DIR}`);
    
  } catch (error) {
    console.error('Failed to scrape sitemap:', error);
    process.exit(1);
  }
}

// Run the scraper
scrapeSitemap();