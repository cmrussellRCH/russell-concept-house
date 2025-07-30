const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@sanity/client');
const { htmlToText } = require('html-to-text');
const { JSDOM } = require('jsdom');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-12-01',
  useCdn: false
});

// Path to original HTML backup files
const BACKUP_DIR = '/Users/anthonynicolau/Desktop/RussellConceptBackup/backup/www.russellconcept.com/post';

// Category mapping based on keywords in title/content
function determineCategory(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('ceramic') || text.includes('porcelain') || text.includes('clay') || text.includes('pottery')) {
    return 'Ceramics';
  } else if (text.includes('furniture') || text.includes('chair') || text.includes('table') || text.includes('stool') || text.includes('desk') || text.includes('shelf')) {
    return 'Furniture';
  } else if (text.includes('light') || text.includes('lamp') || text.includes('sconce') || text.includes('lantern') || text.includes('chandelier')) {
    return 'Lighting';
  } else if (text.includes('glass') || text.includes('crystal') || text.includes('wine') || text.includes('beer') || text.includes('flute')) {
    return 'Glassware';
  } else if (text.includes('textile') || text.includes('fabric') || text.includes('towel') || text.includes('rug') || text.includes('napkin') || text.includes('runner')) {
    return 'Textiles';
  } else if (text.includes('vintage') || text.includes('antique') || text.includes('series')) {
    return 'Vintage';
  } else if (text.includes('print') || text.includes('art') || text.includes('painting') || text.includes('drawing')) {
    return 'Art';
  } else if (text.includes('craft') || text.includes('handmade') || text.includes('artisan')) {
    return 'Crafts';
  } else if (text.includes('candle') || text.includes('taper') || text.includes('flame') || text.includes('fire')) {
    return 'Candles';
  } else if (text.includes('serve') || text.includes('tray') || text.includes('plate') || text.includes('bowl') || text.includes('pitcher')) {
    return 'Serveware';
  } else if (text.includes('jewelry') || text.includes('ring') || text.includes('necklace') || text.includes('bracelet')) {
    return 'Jewelry';
  } else if (text.includes('plant') || text.includes('vase') || text.includes('planter') || text.includes('pot')) {
    return 'Home Decor';
  } else if (text.includes('mirror') || text.includes('hook') || text.includes('holder')) {
    return 'Home Accessories';
  } else {
    return 'Design';
  }
}

// Generate AI-style excerpt
function generateExcerpt(bodyText, title) {
  // Remove any metadata lines
  const cleanText = bodyText
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
        !trimmed.match(/^\d+\s*min\s*read$/i) &&
        !trimmed.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i) &&
        !trimmed.includes('Colleen Russell') &&
        !trimmed.includes('Updated:') &&
        trimmed !== title;
    })
    .join(' ');

  // Get first meaningful sentence or two
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
  let excerpt = '';
  
  for (const sentence of sentences) {
    if (excerpt.length + sentence.length <= 150) {
      excerpt += sentence;
    } else {
      break;
    }
  }

  return excerpt.trim() || cleanText.substring(0, 150).trim() + '...';
}

// Clean body text
function cleanBodyText(bodyText, title) {
  const lines = bodyText.split('\n');
  const cleanedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip metadata
    if (line === title) continue;
    if (line === 'Colleen Russell') continue;
    if (line.match(/^\d+\s*min\s*read$/i)) continue;
    if (line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i)) continue;
    if (line.startsWith('Updated:')) continue;
    if (line.match(/^Photos\s+(Courtesy|courtesy)/i)) continue;
    if (line.includes('©')) continue;
    
    cleanedLines.push(line);
  }

  return cleanedLines.join('\n\n');
}

async function parseHTMLArticle(htmlPath) {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract title from various possible locations
  let title = '';
  const h1 = doc.querySelector('h1');
  const h2 = doc.querySelector('h2');
  const metaTitle = doc.querySelector('meta[property="og:title"]');
  const titleTag = doc.querySelector('title');
  
  if (h1) {
    title = h1.textContent.trim();
  } else if (h2) {
    title = h2.textContent.trim();
  } else if (metaTitle) {
    title = metaTitle.getAttribute('content').trim();
  } else if (titleTag) {
    title = titleTag.textContent.replace('| Russell Concept House', '').trim();
  }

  // Extract date
  let publishedAt = new Date().toISOString();
  const timeElement = doc.querySelector('time');
  const dateSpan = doc.querySelector('span[style*="font-size:12px"]');
  
  if (timeElement) {
    const datetime = timeElement.getAttribute('datetime') || timeElement.textContent;
    try {
      publishedAt = new Date(datetime).toISOString();
    } catch (e) {
      console.log('Could not parse date from time element');
    }
  } else if (dateSpan && dateSpan.textContent.match(/\w+\s+\d+,?\s*\d*/)) {
    try {
      publishedAt = new Date(dateSpan.textContent.trim()).toISOString();
    } catch (e) {
      console.log('Could not parse date from span');
    }
  }

  // Extract body text - look for main content area
  let bodyText = '';
  
  // Try different selectors for the main content
  const contentSelectors = [
    '[data-hook="post-description"]',
    '.post-content',
    'div[style*="font-size:16px"]',
    'div[style*="font-size:15px"]',
    'main',
    'article'
  ];
  
  for (const selector of contentSelectors) {
    const contentElement = doc.querySelector(selector);
    if (contentElement) {
      bodyText = htmlToText(contentElement.innerHTML, {
        wordwrap: false,
        selectors: [
          { selector: 'p', format: 'paragraph' },
          { selector: 'br', format: 'lineBreak' },
          { selector: 'h1', format: 'skip' },
          { selector: 'h2', format: 'skip' },
          { selector: 'h3', format: 'heading' },
          { selector: 'img', format: 'skip' },
          { selector: 'a', options: { ignoreHref: true } }
        ]
      });
      
      if (bodyText.trim().length > 50) {
        break;
      }
    }
  }

  // Clean and prepare data
  const cleanedBody = cleanBodyText(bodyText, title);
  const category = determineCategory(title, cleanedBody);
  const excerpt = generateExcerpt(cleanedBody, title);
  const slug = path.basename(htmlPath, '.html');

  return {
    title,
    slug,
    category,
    excerpt,
    publishedAt,
    body: cleanedBody,
    author: {
      _type: 'author',
      name: 'RCH Team'
    }
  };
}

// Create Sanity block content from plain text
function createBlockContent(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => ({
    _key: `block-${index}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{
      _key: `span-${index}`,
      _type: 'span',
      text: paragraph.trim(),
      marks: []
    }]
  }));
}

async function importArticles() {
  try {
    // Find all HTML article files in backup directory
    const files = await fs.readdir(BACKUP_DIR);
    const articleFiles = files.filter(file => {
      return file.endsWith('.html') && 
        !['feed.html', 'sitemap.html', 'robots.html', 'decodeURIComponent(e.html', 'c.html', 't.html'].includes(file);
    });
    
    console.log(`Found ${articleFiles.length} article HTML files`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const file of articleFiles) {
      const htmlPath = path.join(BACKUP_DIR, file);
      
      try {
        console.log(`\nProcessing: ${file}`);
        const articleData = await parseHTMLArticle(htmlPath);
        
        if (!articleData.title) {
          console.log(`Skipping ${file}: No title found`);
          errorCount++;
          continue;
        }

        // Create Sanity document with all required fields
        const doc = {
          _type: 'article',
          title: articleData.title,
          slug: {
            _type: 'slug',
            current: articleData.slug
          },
          category: articleData.category,
          excerpt: articleData.excerpt,
          publishedAt: articleData.publishedAt,
          author: articleData.author,
          body: createBlockContent(articleData.body)
        };

        const result = await client.create(doc);
        console.log(`✓ Imported: ${articleData.title}`);
        console.log(`  Category: ${articleData.category}`);
        console.log(`  Author: ${articleData.author.name}`);
        console.log(`  Excerpt: ${articleData.excerpt.substring(0, 60)}...`);
        successCount++;

      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n\nImport Complete!`);
    console.log(`Successfully imported: ${successCount} articles`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${articleFiles.length}`);

  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importArticles();