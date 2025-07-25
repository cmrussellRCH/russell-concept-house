const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cheerio = require('cheerio');

// Configuration
const config = {
  rssUrl: 'https://www.russellconcept.com/blog-feed.xml',
  outputImagesPath: path.join(process.cwd(), 'public/images/wix-rss'),
  outputDataPath: path.join(process.cwd(), 'src/data/wix-all-posts.json'),
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

// Utilities
const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50); // Limit length
};

const downloadImage = async (url, filepath) => {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': config.userAgent }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.buffer();
    await fs.writeFile(filepath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return false;
  }
};

const extractImageExtension = (url) => {
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  return match ? match[0] : '.jpg';
};

const parseRSSDate = (dateString) => {
  try {
    return new Date(dateString).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
};

// Parse RSS item
const parseRSSItem = async (item, index) => {
  const post = {
    title: item.title?.[0] || `Post ${index + 1}`,
    link: item.link?.[0] || '',
    guid: item.guid?.[0]?._ || item.guid?.[0] || '',
    pubDate: item.pubDate?.[0] || '',
    author: item['dc:creator']?.[0] || 'Russell Concept House',
    categories: item.category || [],
    
    // Extract content
    content: '',
    excerpt: '',
    images: []
  };
  
  // Parse date
  post.publishedAt = parseRSSDate(post.pubDate);
  post.date = post.pubDate;
  
  // Extract slug from link
  const urlParts = post.link.split('/');
  post.slug = sanitizeFilename(urlParts[urlParts.length - 1] || post.title);
  
  // Get content from content:encoded or description
  const contentEncoded = item['content:encoded']?.[0] || '';
  const description = item.description?.[0] || '';
  
  // Parse HTML content
  const $ = cheerio.load(contentEncoded || description);
  
  // Extract text content
  post.content = $.text().trim().substring(0, 10000); // Limit content length
  
  // Create excerpt
  if (post.content) {
    post.excerpt = post.content.substring(0, 160).replace(/\s+/g, ' ').trim();
    if (post.excerpt.length === 160) {
      post.excerpt += '...';
    }
  }
  
  // Extract images
  const imageUrls = new Set();
  
  // Find img tags
  $('img').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src && (src.includes('wixstatic.com') || src.includes('wix.com'))) {
      imageUrls.add(src);
    }
  });
  
  // Find images in style attributes
  $('[style*="background-image"]').each((i, elem) => {
    const style = $(elem).attr('style');
    const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (match && match[1] && (match[1].includes('wixstatic.com') || match[1].includes('wix.com'))) {
      imageUrls.add(match[1]);
    }
  });
  
  // Also check for media:content in RSS
  if (item['media:content']) {
    item['media:content'].forEach(media => {
      if (media.$ && media.$.url) {
        imageUrls.add(media.$.url);
      }
    });
  }
  
  // Convert to array
  post.images = Array.from(imageUrls).map(url => ({
    src: url,
    alt: post.title
  }));
  
  return post;
};

// Process images for a post
const processPostImages = async (post, postIndex) => {
  const processedImages = [];
  
  for (let i = 0; i < post.images.length; i++) {
    const image = post.images[i];
    const extension = extractImageExtension(image.src);
    const filename = `${post.slug}-${i + 1}${extension}`;
    const filepath = path.join(config.outputImagesPath, filename);
    
    console.log(`      Downloading image ${i + 1}/${post.images.length}...`);
    
    const success = await downloadImage(image.src, filepath);
    
    processedImages.push({
      originalUrl: image.src,
      localPath: `/images/wix-rss/${filename}`,
      filename,
      success,
      alt: image.alt
    });
  }
  
  return processedImages;
};

// Main scraping function
const scrapeRSSFeed = async () => {
  console.log('🚀 Starting Wix RSS feed scraper...\n');
  console.log(`📡 Fetching RSS feed from: ${config.rssUrl}\n`);
  
  try {
    // Ensure output directories exist
    await fs.mkdir(config.outputImagesPath, { recursive: true });
    await fs.mkdir(path.dirname(config.outputDataPath), { recursive: true });
    
    // Fetch RSS feed
    const response = await fetch(config.rssUrl, {
      headers: { 'User-Agent': config.userAgent }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlData = await response.text();
    console.log(`✅ RSS feed fetched successfully\n`);
    
    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const channel = result.rss?.channel?.[0];
    if (!channel) {
      throw new Error('Invalid RSS feed structure');
    }
    
    const items = channel.item || [];
    console.log(`📊 Found ${items.length} posts in RSS feed\n`);
    
    // Process each post
    const posts = [];
    const allImages = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n📝 Processing post ${i + 1}/${items.length}`);
      
      try {
        // Parse post data
        const post = await parseRSSItem(item, i);
        console.log(`   Title: ${post.title}`);
        console.log(`   Date: ${post.date}`);
        console.log(`   Images found: ${post.images.length}`);
        
        // Download images
        if (post.images.length > 0) {
          const processedImages = await processPostImages(post, i);
          post.processedImages = processedImages;
          allImages.push(...processedImages);
        }
        
        posts.push(post);
        
      } catch (error) {
        console.error(`   ❌ Error processing post: ${error.message}`);
      }
    }
    
    // Generate report
    const successfulDownloads = allImages.filter(img => img.success).length;
    const failedDownloads = allImages.filter(img => !img.success).length;
    
    const output = {
      metadata: {
        source: 'RSS Feed',
        feedUrl: config.rssUrl,
        scrapedAt: new Date().toISOString(),
        totalPosts: posts.length,
        totalImages: allImages.length,
        successfulDownloads,
        failedDownloads
      },
      posts
    };
    
    // Save data
    await fs.writeFile(
      config.outputDataPath,
      JSON.stringify(output, null, 2)
    );
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RSS SCRAPING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Posts scraped: ${posts.length}`);
    console.log(`🖼️  Images found: ${allImages.length}`);
    console.log(`   Downloaded: ${successfulDownloads}`);
    console.log(`   Failed: ${failedDownloads}`);
    console.log(`\n📁 Data saved to: ${config.outputDataPath}`);
    console.log(`📁 Images saved to: ${config.outputImagesPath}`);
    
    // Show sample of posts
    console.log('\n📋 Sample posts:');
    posts.slice(0, 5).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title} (${post.date})`);
    });
    
    if (posts.length > 5) {
      console.log(`   ... and ${posts.length - 5} more`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run scraper
scrapeRSSFeed();