const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-12-01',
  useCdn: false
});

// Category mapping based on keywords in title/content
function determineCategory(title, body) {
  const text = (title + ' ' + (body || '')).toLowerCase();
  
  if (text.includes('ceramic') || text.includes('porcelain') || text.includes('clay') || text.includes('pottery')) {
    return 'Ceramics';
  } else if (text.includes('furniture') || text.includes('chair') || text.includes('table') || text.includes('stool') || text.includes('desk') || text.includes('shelf') || text.includes('headboard')) {
    return 'Furniture';
  } else if (text.includes('light') || text.includes('lamp') || text.includes('sconce') || text.includes('lantern') || text.includes('chandelier') || text.includes('candle')) {
    return 'Lighting';
  } else if (text.includes('glass') || text.includes('crystal') || text.includes('wine') || text.includes('beer') || text.includes('flute') || text.includes('coupe')) {
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
  } else if (text.includes('mirror') || text.includes('hook') || text.includes('holder') || text.includes('bookend')) {
    return 'Home Accessories';
  } else if (text.includes('incense') || text.includes('burner') || text.includes('oil')) {
    return 'Aromatherapy';
  } else {
    return 'Design';
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

async function forceUpdateAllArticles() {
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
    
    console.log(`Found ${articles.length} articles to update\n`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        // Extract text from body blocks
        const bodyText = extractTextFromBlocks(article.body);
        const fullText = article.excerpt ? bodyText + ' ' + article.excerpt : bodyText;
        
        // Determine category based on content
        const category = determineCategory(article.title || '', fullText);
        
        // Force update with author and category
        const updates = {
          author: {
            _type: 'author',
            name: 'RCH Team'
          },
          category: category
        };
        
        // Update the document
        await client
          .patch(article._id)
          .set(updates)
          .commit();
          
        console.log(`✓ Updated: ${article.title}`);
        console.log(`  Author: ${updates.author.name}`);
        console.log(`  Category: ${updates.category} ${article.category !== category ? '(changed from ' + article.category + ')' : ''}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`✗ Error updating "${article.title}":`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n\nForce Update Complete!`);
    console.log(`Updated: ${updatedCount} articles`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// Run the update
forceUpdateAllArticles();