const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cheerio = require('cheerio');

// Configuration
const config = {
  baseUrl: 'https://www.russellconcept.com',
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

// Fetch RSS feed with pagination attempts
const fetchRSSWithPagination = async () => {
  const allPosts = new Map(); // Use link as key to avoid duplicates
  const sources = [];
  
  // Try base RSS feed
  console.log('📡 Fetching base RSS feed...');
  try {
    const response = await fetch(config.rssUrl, {
      headers: { 'User-Agent': config.userAgent }
    });
    
    if (response.ok) {
      const xmlData = await response.text();
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const items = result.rss?.channel?.[0]?.item || [];
      items.forEach(item => {
        const link = item.link?.[0] || '';
        if (link) {
          allPosts.set(link, item);
        }
      });
      
      sources.push(`Base RSS: ${items.length} posts`);
      console.log(`   ✅ Found ${items.length} posts in base feed`);
    }
  } catch (error) {
    console.log(`   ❌ Base RSS error: ${error.message}`);
  }
  
  // Try pagination patterns
  const paginationPatterns = [
    { pattern: 'page', max: 10 },     // ?page=2, ?page=3, etc.
    { pattern: 'offset', max: 200, increment: 20 }, // ?offset=20, ?offset=40
    { pattern: 'start', max: 200, increment: 20 }   // ?start=20, ?start=40
  ];
  
  for (const { pattern, max, increment = 1 } of paginationPatterns) {
    console.log(`\n📡 Trying ${pattern} pagination...`);
    let found = false;
    
    for (let i = (pattern === 'page' ? 2 : increment); i <= max; i += increment) {
      const url = `${config.rssUrl}?${pattern}=${i}`;
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': config.userAgent }
        });
        
        if (response.ok) {
          const xmlData = await response.text();
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(xmlData);
          
          const items = result.rss?.channel?.[0]?.item || [];
          if (items.length > 0) {
            let newPosts = 0;
            items.forEach(item => {
              const link = item.link?.[0] || '';
              if (link && !allPosts.has(link)) {
                allPosts.set(link, item);
                newPosts++;
              }
            });
            
            if (newPosts > 0) {
              console.log(`   ✅ ${pattern}=${i}: Found ${newPosts} new posts`);
              found = true;
            }
          } else {
            break; // No more posts
          }
        }
      } catch (error) {
        // Pagination endpoint doesn't exist, move on
        break;
      }
    }
    
    if (found) {
      sources.push(`${pattern} pagination: Added new posts`);
    }
  }
  
  // Try sitemaps
  const sitemapUrls = [
    '/blog/sitemap.xml',
    '/sitemap.xml',
    '/sitemap_index.xml'
  ];
  
  for (const sitemapPath of sitemapUrls) {
    console.log(`\n📡 Trying sitemap: ${sitemapPath}...`);
    
    try {
      const response = await fetch(`${config.baseUrl}${sitemapPath}`, {
        headers: { 'User-Agent': config.userAgent }
      });
      
      if (response.ok) {
        const xmlData = await response.text();
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlData);
        
        // Look for blog URLs in sitemap
        const urls = [];
        
        // Handle standard sitemap format
        if (result.urlset?.url) {
          result.urlset.url.forEach(entry => {
            const loc = entry.loc?.[0];
            if (loc && loc.includes('/blog/') && !loc.endsWith('/blog/')) {
              urls.push(loc);
            }
          });
        }
        
        // Handle sitemap index format
        if (result.sitemapindex?.sitemap) {
          console.log('   Found sitemap index, checking sub-sitemaps...');
          for (const sitemap of result.sitemapindex.sitemap) {
            const loc = sitemap.loc?.[0];
            if (loc && loc.includes('blog')) {
              // Fetch sub-sitemap
              try {
                const subResponse = await fetch(loc, {
                  headers: { 'User-Agent': config.userAgent }
                });
                
                if (subResponse.ok) {
                  const subXml = await subResponse.text();
                  const subResult = await parser.parseStringPromise(subXml);
                  
                  if (subResult.urlset?.url) {
                    subResult.urlset.url.forEach(entry => {
                      const url = entry.loc?.[0];
                      if (url && url.includes('/blog/') && !url.endsWith('/blog/')) {
                        urls.push(url);
                      }
                    });
                  }
                }
              } catch (error) {
                console.log(`   ⚠️  Sub-sitemap error: ${error.message}`);
              }
            }
          }
        }
        
        if (urls.length > 0) {
          console.log(`   ✅ Found ${urls.length} blog URLs in sitemap`);
          sources.push(`${sitemapPath}: ${urls.length} URLs`);
          
          // Store URLs for potential scraping if needed
          const sitemapData = {
            source: sitemapPath,
            urls: urls,
            timestamp: new Date().toISOString()
          };
          
          await fs.writeFile(
            path.join(process.cwd(), 'src/data/wix-sitemap-urls.json'),
            JSON.stringify(sitemapData, null, 2)
          );
        }
      }
    } catch (error) {
      console.log(`   ❌ Sitemap error: ${error.message}`);
    }
  }
  
  return { posts: Array.from(allPosts.values()), sources };
};

// Main scraping function
const scrapeRSSFeed = async () => {
  console.log('🚀 Starting comprehensive Wix content scraper...\n');
  console.log('🎯 Goal: Capture all 111 blog posts\n');
  
  try {
    // Ensure output directories exist
    await fs.mkdir(config.outputImagesPath, { recursive: true });
    await fs.mkdir(path.dirname(config.outputDataPath), { recursive: true });
    
    // Fetch posts from all sources
    const { posts: rssItems, sources } = await fetchRSSWithPagination();
    
    console.log(`\n📊 RSS Collection Summary:`);
    console.log(`   Total unique posts found: ${rssItems.length}`);
    sources.forEach(source => {
      console.log(`   - ${source}`);
    });
    
    if (rssItems.length < 111) {
      console.log(`\n⚠️  WARNING: Only found ${rssItems.length} posts out of expected 111`);
      console.log(`   Missing: ${111 - rssItems.length} posts`);
      console.log(`\n   Possible reasons:`);
      console.log(`   - Some posts might be drafts or unpublished`);
      console.log(`   - RSS feed might have limits`);
      console.log(`   - Posts might be in different sections`);
      console.log(`\n   Check src/data/wix-sitemap-urls.json for additional blog URLs`);
    }
    
    // Process each post
    const posts = [];
    const allImages = [];
    
    console.log(`\n📝 Processing ${rssItems.length} posts...\n`);
    
    for (let i = 0; i < rssItems.length; i++) {
      const item = rssItems[i];
      console.log(`\n📝 Processing post ${i + 1}/${rssItems.length}`);
      
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
        source: 'RSS Feed + Pagination + Sitemaps',
        feedUrl: config.rssUrl,
        scrapedAt: new Date().toISOString(),
        expectedPosts: 111,
        totalPosts: posts.length,
        missingPosts: Math.max(0, 111 - posts.length),
        totalImages: allImages.length,
        successfulDownloads,
        failedDownloads,
        sources
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
    console.log('📊 SCRAPING COMPLETE');
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
    console.log('\n📋 Recent posts:');
    posts.slice(0, 10).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title} (${post.date})`);
    });
    
    if (posts.length > 10) {
      console.log(`   ... and ${posts.length - 10} more`);
    }
    
    // Final recommendations
    if (posts.length < 111) {
      console.log('\n💡 To find missing posts:');
      console.log('1. Check src/data/wix-sitemap-urls.json for blog URLs');
      console.log('2. Try accessing individual post pages directly');
      console.log('3. Check if posts are in draft/unpublished state on Wix');
      console.log('4. Consider manual export from Wix dashboard if available');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run scraper
scrapeRSSFeed();