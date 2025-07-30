const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-12-01',
  useCdn: false
});

// Map our categories to the schema's lowercase values
const categoryMap = {
  'Ceramics': 'pottery',
  'Furniture': 'interior',
  'Lighting': 'design',
  'Glassware': 'objects',
  'Textiles': 'textiles',
  'Vintage': 'lifestyle',
  'Art': 'art',
  'Crafts': 'crafts',
  'Candles': 'objects',
  'Serveware': 'objects',
  'Jewelry': 'objects',
  'Home Decor': 'interior',
  'Home Accessories': 'interior',
  'Aromatherapy': 'lifestyle',
  'Design': 'design'
};

// Category mapping based on keywords in title/content
function determineCategory(title, body) {
  const text = (title + ' ' + (body || '')).toLowerCase();
  
  if (text.includes('ceramic') || text.includes('porcelain') || text.includes('clay') || text.includes('pottery')) {
    return 'pottery';
  } else if (text.includes('furniture') || text.includes('chair') || text.includes('table') || text.includes('stool') || text.includes('desk') || text.includes('shelf') || text.includes('headboard')) {
    return 'interior';
  } else if (text.includes('light') || text.includes('lamp') || text.includes('sconce') || text.includes('lantern') || text.includes('chandelier')) {
    return 'design';
  } else if (text.includes('glass') || text.includes('crystal') || text.includes('wine') || text.includes('beer') || text.includes('flute') || text.includes('coupe')) {
    return 'objects';
  } else if (text.includes('textile') || text.includes('fabric') || text.includes('towel') || text.includes('rug') || text.includes('napkin') || text.includes('runner')) {
    return 'textiles';
  } else if (text.includes('vintage') || text.includes('antique') || text.includes('series')) {
    return 'lifestyle';
  } else if (text.includes('print') || text.includes('art') || text.includes('painting') || text.includes('drawing')) {
    return 'art';
  } else if (text.includes('craft') || text.includes('handmade') || text.includes('artisan')) {
    return 'crafts';
  } else if (text.includes('candle') || text.includes('taper') || text.includes('flame') || text.includes('fire')) {
    return 'objects';
  } else if (text.includes('serve') || text.includes('tray') || text.includes('plate') || text.includes('bowl') || text.includes('pitcher')) {
    return 'objects';
  } else if (text.includes('jewelry') || text.includes('ring') || text.includes('necklace') || text.includes('bracelet')) {
    return 'objects';
  } else if (text.includes('plant') || text.includes('vase') || text.includes('planter') || text.includes('pot')) {
    return 'interior';
  } else if (text.includes('mirror') || text.includes('hook') || text.includes('holder') || text.includes('bookend')) {
    return 'interior';
  } else if (text.includes('incense') || text.includes('burner') || text.includes('oil')) {
    return 'lifestyle';
  } else {
    return 'design';
  }
}

// Extract text from block content
function extractTextFromBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  return blocks
    .filter(block => block._type === 'block' && block.children)
    .map(block => block.children.map(child => child.text || '').join(''))
    .join(' ');
}

async function fixAllArticles() {
  try {
    console.log('Fetching all articles from Sanity...\n');
    
    // Fetch all articles
    const articles = await client.fetch(`*[_type == "article"] {
      _id,
      title,
      category,
      author,
      body,
      excerpt
    }`);
    
    console.log(`Found ${articles.length} articles to fix\n`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        // Extract text from body blocks
        const bodyText = extractTextFromBlocks(article.body);
        const fullText = article.excerpt ? bodyText + ' ' + article.excerpt : bodyText;
        
        // Determine category based on content
        const category = determineCategory(article.title || '', fullText);
        
        // Fix the data structure - author should be a simple string
        const updates = {
          author: 'RCH Team',  // Simple string, not an object
          category: category   // Lowercase value from schema list
        };
        
        // Update the document
        await client
          .patch(article._id)
          .set(updates)
          .commit();
          
        console.log(`✓ Fixed: ${article.title}`);
        console.log(`  Author: ${updates.author} (as string)`);
        console.log(`  Category: ${updates.category}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`✗ Error fixing "${article.title}":`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n\nFix Complete!`);
    console.log(`Fixed: ${updatedCount} articles`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

// Run the fix
fixAllArticles();