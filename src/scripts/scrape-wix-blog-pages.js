const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Configuration
const config = {
  baseUrl: 'https://www.russellconcept.com',
  blogUrl: 'https://www.russellconcept.com',
  outputImagesPath: path.join(process.cwd(), 'public/images/wix-blog'),
  outputDataPath: path.join(process.cwd(), 'src/data/wix-blog-all-posts.json'),
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  delay: 1000 // Delay between requests in ms
};

// Utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
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

// Fetch all blog post URLs from the blog archive
const fetchBlogPostUrls = async () => {
  const allUrls = new Set();
  console.log('📡 Fetching blog post URLs...\n');
  
  try {
    // First try the homepage
    console.log(`   Checking homepage for blog links...`);
    
    try {
      const response = await fetch(config.baseUrl, {
        headers: { 'User-Agent': config.userAgent }
      });
      
      if (response.ok) {
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Find blog post links - adjust selectors based on Wix structure
        const postLinks = [];
        
        // Common Wix blog selectors
        $('a[href*="/post/"]').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
            postLinks.push(fullUrl);
          }
        });
        
        // Alternative selectors
        $('article a, .blog-post a, .post-item a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('/post/')) {
            const fullUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
            postLinks.push(fullUrl);
          }
        });
        
        // Add unique URLs
        const uniqueNewUrls = postLinks.filter(url => !allUrls.has(url));
        uniqueNewUrls.forEach(url => allUrls.add(url));
        
        console.log(`   ✅ Found ${uniqueNewUrls.length} new posts (total: ${allUrls.size})`);
      }
        
    } catch (error) {
        console.log(`   ❌ Error on homepage: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error fetching blog archive:', error);
  }
  
  return Array.from(allUrls);
};

// Scrape individual blog post
const scrapeBlogPost = async (url, index) => {
  console.log(`\n📝 Scraping post ${index + 1}: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': config.userAgent }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract post data
    const post = {
      url,
      title: '',
      date: '',
      content: '',
      excerpt: '',
      images: [],
      author: 'Russell Concept House'
    };
    
    // Extract title
    post.title = $('h1').first().text().trim() ||
                 $('h2').first().text().trim() ||
                 $('title').text().trim() ||
                 'Untitled Post';
    
    // Extract date
    const dateSelectors = [
      'time', 
      '[datetime]',
      '.post-date',
      '.date',
      '.published'
    ];
    
    for (const selector of dateSelectors) {
      const dateElem = $(selector).first();
      if (dateElem.length) {
        post.date = dateElem.attr('datetime') || dateElem.text().trim();
        if (post.date) break;
      }
    }
    
    // Extract content
    const contentSelectors = [
      'article',
      '.post-content',
      '.entry-content',
      '[data-hook="post-description"]',
      'main'
    ];
    
    for (const selector of contentSelectors) {
      const contentElem = $(selector);
      if (contentElem.length) {
        post.content = contentElem.text().trim();
        if (post.content) break;
      }
    }
    
    // Create excerpt
    if (post.content) {
      post.excerpt = post.content.substring(0, 160).replace(/\s+/g, ' ').trim();
      if (post.excerpt.length === 160) post.excerpt += '...';
    }
    
    // Extract slug
    const urlParts = url.split('/');
    post.slug = sanitizeFilename(urlParts[urlParts.length - 1] || post.title);
    
    // Find all images
    const imageUrls = new Set();
    
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && (src.includes('wixstatic.com') || src.includes('wix.com'))) {
        imageUrls.add(src);
      }
    });
    
    // Check background images
    $('[style*="background-image"]').each((i, elem) => {
      const style = $(elem).attr('style');
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1] && (match[1].includes('wixstatic.com') || match[1].includes('wix.com'))) {
        imageUrls.add(match[1]);
      }
    });
    
    post.images = Array.from(imageUrls).map(src => ({ src, alt: post.title }));
    
    console.log(`   ✅ Title: ${post.title}`);
    console.log(`   📅 Date: ${post.date || 'Not found'}`);
    console.log(`   🖼️  Images: ${post.images.length}`);
    
    return post;
    
  } catch (error) {
    console.error(`   ❌ Error scraping ${url}: ${error.message}`);
    return null;
  }
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
      localPath: `/images/wix-blog/${filename}`,
      filename,
      success,
      alt: image.alt
    });
  }
  
  return processedImages;
};

// Main scraping function
const scrapeBlog = async () => {
  console.log('🚀 Starting comprehensive Wix blog scraper...\n');
  console.log('🎯 Goal: Capture all 111 blog posts by scraping blog pages\n');
  
  try {
    // Ensure output directories exist
    await fs.mkdir(config.outputImagesPath, { recursive: true });
    await fs.mkdir(path.dirname(config.outputDataPath), { recursive: true });
    
    // Step 1: Get all blog post URLs
    const blogUrls = await fetchBlogPostUrls();
    console.log(`\n📊 Found ${blogUrls.length} blog post URLs`);
    
    if (blogUrls.length === 0) {
      console.log('\n⚠️  No blog URLs found. The blog structure might have changed.');
      console.log('Please check the blog manually at:', config.blogUrl);
      return;
    }
    
    // Step 2: Scrape each blog post
    const posts = [];
    const allImages = [];
    
    for (let i = 0; i < blogUrls.length; i++) {
      const post = await scrapeBlogPost(blogUrls[i], i);
      
      if (post) {
        // Download images
        if (post.images.length > 0) {
          const processedImages = await processPostImages(post, i);
          post.processedImages = processedImages;
          allImages.push(...processedImages);
        }
        
        posts.push(post);
      }
      
      // Be respectful with rate limiting
      if (i < blogUrls.length - 1) {
        await sleep(config.delay);
      }
    }
    
    // Generate report
    const successfulDownloads = allImages.filter(img => img.success).length;
    const failedDownloads = allImages.filter(img => !img.success).length;
    
    const output = {
      metadata: {
        source: 'Direct Blog Scraping',
        blogUrl: config.blogUrl,
        scrapedAt: new Date().toISOString(),
        expectedPosts: 111,
        totalPosts: posts.length,
        missingPosts: Math.max(0, 111 - posts.length),
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
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG SCRAPING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Posts scraped: ${posts.length} / 111`);
    if (posts.length < 111) {
      console.log(`⚠️  Missing posts: ${111 - posts.length}`);
    }
    console.log(`🖼️  Images found: ${allImages.length}`);
    console.log(`   Downloaded: ${successfulDownloads}`);
    console.log(`   Failed: ${failedDownloads}`);
    console.log(`\n📁 Data saved to: ${config.outputDataPath}`);
    console.log(`📁 Images saved to: ${config.outputImagesPath}`);
    
    // Show sample of posts
    console.log('\n📋 Sample posts:');
    posts.slice(0, 10).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`);
    });
    
    if (posts.length > 10) {
      console.log(`   ... and ${posts.length - 10} more`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run scraper
scrapeBlog();