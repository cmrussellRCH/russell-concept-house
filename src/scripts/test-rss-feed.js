const fetch = require('node-fetch');
const xml2js = require('xml2js');

const testRSSFeed = async () => {
  const feedUrl = 'https://www.russellconcept.com/blog-feed.xml';
  
  console.log(`🔍 Testing RSS feed: ${feedUrl}\n`);
  
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    console.log(`   Response size: ${(xml.length / 1024).toFixed(1)} KB`);
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);
    
    const channel = result.rss?.channel?.[0];
    const items = channel?.item || [];
    
    console.log(`\n✅ RSS feed is accessible!`);
    console.log(`   Title: ${channel?.title?.[0] || 'Unknown'}`);
    console.log(`   Description: ${channel?.description?.[0] || 'Unknown'}`);
    console.log(`   Total posts: ${items.length}`);
    
    if (items.length > 0) {
      console.log(`\n📋 Recent posts:`);
      items.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title?.[0]} (${item.pubDate?.[0]})`);
      });
    }
    
    console.log(`\n🎉 Ready to scrape! Run: npm run scrape-rss`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('- The site might be down');
    console.log('- The RSS feed URL might have changed');
    console.log('- Network connectivity issues');
  }
};

testRSSFeed();