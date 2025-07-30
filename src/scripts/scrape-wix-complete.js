const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Configuration
const config = {
  baseUrl: 'https://www.russellconcept.com',
  outputImagesPath: path.join(process.cwd(), 'public/images/wix-complete'),
  outputDataPath: path.join(process.cwd(), 'src/data/wix-complete-posts.json'),
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

// Discover all blog post URLs
const discoverBlogUrls = async () => {
  const allUrls = new Set();
  const visitedPages = new Set();
  const urlsToVisit = new Set();
  
  console.log('🔍 Discovering blog post URLs...\n');
  
  // Start with known posts from RSS
  const rssData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'src/data/wix-all-posts.json'), 
    'utf8'
  ));
  
  rssData.posts.forEach(post => {
    if (post.link) {
      allUrls.add(post.link);
      urlsToVisit.add(post.link);
    }
  });
  
  console.log(`   Starting with ${allUrls.size} posts from RSS feed\n`);
  
  // Visit each post to find more links
  const urlArray = Array.from(urlsToVisit);
  for (let i = 0; i < Math.min(urlArray.length, 5); i++) { // Check first 5 posts
    const url = urlArray[i];
    if (visitedPages.has(url)) continue;
    
    console.log(`   Checking ${url} for more post links...`);
    visitedPages.add(url);
    
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': config.userAgent }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Find all links
        const newLinks = new Set();
        
        $('a[href*="/post/"]').each((idx, elem) => {
          const href = $(elem).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
            if (fullUrl.includes('russellconcept.com/post/') && !allUrls.has(fullUrl)) {
              newLinks.add(fullUrl);
            }
          }
        });
        
        // Also check for "next post" or related posts
        $('a').each((idx, elem) => {
          const text = $(elem).text().toLowerCase();
          const href = $(elem).attr('href');
          if (href && (text.includes('next') || text.includes('previous') || text.includes('related'))) {
            const fullUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
            if (fullUrl.includes('/post/') && !allUrls.has(fullUrl)) {
              newLinks.add(fullUrl);
            }
          }
        });
        
        if (newLinks.size > 0) {
          console.log(`      Found ${newLinks.size} new post links`);
          newLinks.forEach(link => allUrls.add(link));
        }
      }
      
      await sleep(500); // Be respectful
      
    } catch (error) {
      console.log(`      Error: ${error.message}`);
    }
  }
  
  // Try sitemap
  console.log('\n   Checking sitemap...');
  try {
    const sitemapResponse = await fetch(`${config.baseUrl}/sitemap.xml`, {
      headers: { 'User-Agent': config.userAgent }
    });
    
    if (sitemapResponse.ok) {
      const sitemapText = await sitemapResponse.text();
      const postMatches = sitemapText.match(/russellconcept\.com\/post\/[^<]+/g);
      if (postMatches) {
        postMatches.forEach(match => {
          const url = `https://www.${match}`;
          if (!allUrls.has(url)) {
            allUrls.add(url);
          }
        });
        console.log(`      Found ${postMatches.length} posts in sitemap`);
      }
    }
  } catch (error) {
    console.log(`      Sitemap error: ${error.message}`);
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
      localPath: `/images/wix-complete/${filename}`,
      filename,
      success,
      alt: image.alt
    });
  }
  
  return processedImages;
};

// Merge with existing data
const mergeWithExisting = async () => {
  const existingPosts = new Map();
  
  // Load RSS posts
  try {
    const rssData = JSON.parse(await fs.readFile(
      path.join(process.cwd(), 'src/data/wix-all-posts.json'), 
      'utf8'
    ));
    rssData.posts.forEach(post => {
      existingPosts.set(post.link, post);
    });
  } catch (error) {
    console.log('No RSS data found');
  }
  
  // Load migration posts
  try {
    const migrationData = JSON.parse(await fs.readFile(
      path.join(process.cwd(), 'src/data/wix-migration.json'), 
      'utf8'
    ));
    migrationData.posts.forEach(post => {
      const url = `${config.baseUrl}/post/${post.slug}`;
      if (!existingPosts.has(url)) {
        existingPosts.set(url, {
          ...post,
          link: url,
          url
        });
      }
    });
  } catch (error) {
    console.log('No migration data found');
  }
  
  return existingPosts;
};

// Main scraping function
const scrapeComplete = async () => {
  console.log('🚀 Starting complete Wix content scraper...\n');
  console.log('🎯 Goal: Find and capture all 111 blog posts\n');
  
  try {
    // Ensure output directories exist
    await fs.mkdir(config.outputImagesPath, { recursive: true });
    await fs.mkdir(path.dirname(config.outputDataPath), { recursive: true });
    
    // Get existing posts
    const existingPosts = await mergeWithExisting();
    console.log(`📊 Found ${existingPosts.size} posts from existing data\n`);
    
    // Discover all blog URLs
    const allBlogUrls = await discoverBlogUrls();
    console.log(`\n📊 Total unique blog URLs discovered: ${allBlogUrls.length}`);
    
    // Scrape new posts
    const posts = [];
    const allImages = [];
    let newPostsScraped = 0;
    
    for (let i = 0; i < allBlogUrls.length; i++) {
      const url = allBlogUrls[i];
      
      // Check if we already have this post
      if (existingPosts.has(url)) {
        posts.push(existingPosts.get(url));
        console.log(`\n⏭️  Skipping ${url} (already have data)`);
        continue;
      }
      
      const post = await scrapeBlogPost(url, i);
      
      if (post) {
        newPostsScraped++;
        
        // Download images
        if (post.images.length > 0) {
          const processedImages = await processPostImages(post, i);
          post.processedImages = processedImages;
          allImages.push(...processedImages);
        }
        
        posts.push(post);
      }
      
      // Be respectful with rate limiting
      if (i < allBlogUrls.length - 1) {
        await sleep(config.delay);
      }
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.date || 0);
      const dateB = new Date(b.publishedAt || b.date || 0);
      return dateB - dateA;
    });
    
    // Generate report
    const successfulDownloads = allImages.filter(img => img.success).length;
    const failedDownloads = allImages.filter(img => !img.success).length;
    
    const output = {
      metadata: {
        source: 'Complete Scraping (RSS + Migration + Discovery)',
        scrapedAt: new Date().toISOString(),
        expectedPosts: 111,
        totalPosts: posts.length,
        missingPosts: Math.max(0, 111 - posts.length),
        newPostsScraped,
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
    console.log('📊 COMPLETE SCRAPING FINISHED');
    console.log('='.repeat(60));
    console.log(`✅ Total posts: ${posts.length} / 111`);
    console.log(`   From RSS: ${existingPosts.size}`);
    console.log(`   New posts scraped: ${newPostsScraped}`);
    if (posts.length < 111) {
      console.log(`⚠️  Still missing: ${111 - posts.length} posts`);
    }
    console.log(`🖼️  Images downloaded: ${successfulDownloads}`);
    console.log(`📁 Data saved to: ${config.outputDataPath}`);
    console.log(`📁 Images saved to: ${config.outputImagesPath}`);
    
    // Show sample of posts
    console.log('\n📋 Sample posts:');
    posts.slice(0, 10).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title} (${post.date || 'no date'})`);
    });
    
    if (posts.length > 10) {
      console.log(`   ... and ${posts.length - 10} more`);
    }
    
    if (posts.length < 111) {
      console.log('\n💡 To find remaining posts:');
      console.log('1. Check if posts are in draft/unpublished state on Wix');
      console.log('2. Try manual export from Wix dashboard');
      console.log('3. The posts might be in a different section or have different URLs');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run scraper
scrapeComplete();