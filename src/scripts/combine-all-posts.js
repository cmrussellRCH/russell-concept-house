const fs = require('fs').promises;
const path = require('path');

// Combine all Wix content from different sources
const combineAllPosts = async () => {
  console.log('📊 Combining all Wix content sources...\n');
  
  try {
    const allPosts = new Map(); // Use URL as key to avoid duplicates
    const sources = {
      rss: 0,
      migration: 0,
      duplicates: 0
    };
    
    // Load RSS posts (20 posts)
    console.log('📡 Loading RSS posts...');
    try {
      const rssData = JSON.parse(await fs.readFile(
        path.join(process.cwd(), 'src/data/wix-all-posts.json'), 
        'utf8'
      ));
      
      rssData.posts.forEach(post => {
        const key = post.link || post.url;
        allPosts.set(key, {
          ...post,
          source: 'rss',
          url: post.link || post.url
        });
        sources.rss++;
      });
      
      console.log(`   ✅ Found ${sources.rss} posts from RSS feed`);
    } catch (error) {
      console.log('   ❌ No RSS data found');
    }
    
    // Load migration posts (33 posts)
    console.log('\n📁 Loading migration posts...');
    try {
      const migrationData = JSON.parse(await fs.readFile(
        path.join(process.cwd(), 'src/data/wix-migration.json'), 
        'utf8'
      ));
      
      let migrationAdded = 0;
      migrationData.articles.forEach(post => {
        // Create URL from slug
        const url = `https://www.russellconcept.com/post/${post.slug}`;
        
        if (allPosts.has(url)) {
          // Merge data, preferring migration data which has full content
          const existing = allPosts.get(url);
          allPosts.set(url, {
            ...existing,
            ...post,
            url,
            source: 'both',
            // Keep RSS metadata if migration doesn't have it
            publishedAt: post.publishedAt || existing.publishedAt,
            author: post.author || existing.author
          });
          sources.duplicates++;
        } else {
          allPosts.set(url, {
            ...post,
            url,
            link: url,
            source: 'migration'
          });
          sources.migration++;
          migrationAdded++;
        }
      });
      
      console.log(`   ✅ Found ${migrationData.articles.length} posts from migration`);
      console.log(`      Added ${migrationAdded} new posts`);
      console.log(`      Updated ${sources.duplicates} existing posts`);
    } catch (error) {
      console.log('   ❌ No migration data found');
    }
    
    // Convert to array and sort by date
    const posts = Array.from(allPosts.values()).sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.date || 0);
      const dateB = new Date(b.publishedAt || b.date || 0);
      return dateB - dateA; // Newest first
    });
    
    // Create final output
    const output = {
      metadata: {
        source: 'Combined (RSS + Migration)',
        combinedAt: new Date().toISOString(),
        expectedPosts: 111,
        totalPosts: posts.length,
        missingPosts: Math.max(0, 111 - posts.length),
        sources: {
          rssOnly: sources.rss - sources.duplicates,
          migrationOnly: sources.migration,
          both: sources.duplicates,
          total: posts.length
        }
      },
      posts
    };
    
    // Save combined data
    const outputPath = path.join(process.cwd(), 'src/data/wix-combined-posts.json');
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMBINATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Total unique posts: ${posts.length} / 111`);
    console.log(`   From RSS only: ${sources.rss - sources.duplicates}`);
    console.log(`   From migration only: ${sources.migration}`);
    console.log(`   In both sources: ${sources.duplicates}`);
    console.log(`⚠️  Still missing: ${111 - posts.length} posts`);
    console.log(`\n📁 Combined data saved to: ${outputPath}`);
    
    // Show date range
    const dates = posts
      .map(p => new Date(p.publishedAt || p.date || 0))
      .filter(d => d.getTime() > 0)
      .sort((a, b) => a - b);
    
    if (dates.length > 0) {
      console.log(`\n📅 Date range:`);
      console.log(`   Oldest: ${dates[0].toLocaleDateString()}`);
      console.log(`   Newest: ${dates[dates.length - 1].toLocaleDateString()}`);
    }
    
    // Show sample posts
    console.log('\n📋 Sample posts:');
    posts.slice(0, 10).forEach((post, i) => {
      const date = new Date(post.publishedAt || post.date || 0);
      const dateStr = date.getTime() > 0 ? date.toLocaleDateString() : 'no date';
      console.log(`   ${i + 1}. ${post.title} (${dateStr}) [${post.source}]`);
    });
    
    if (posts.length > 10) {
      console.log(`   ... and ${posts.length - 10} more`);
    }
    
    // List posts by source
    console.log('\n📊 Posts by source:');
    const bySource = { rss: [], migration: [], both: [] };
    posts.forEach(post => {
      bySource[post.source].push(post.title);
    });
    
    if (bySource.rss.length > 0) {
      console.log(`\n   RSS only (${bySource.rss.length}):`);
      bySource.rss.slice(0, 5).forEach(title => console.log(`      - ${title}`));
      if (bySource.rss.length > 5) console.log(`      ... and ${bySource.rss.length - 5} more`);
    }
    
    if (bySource.migration.length > 0) {
      console.log(`\n   Migration only (${bySource.migration.length}):`);
      bySource.migration.slice(0, 5).forEach(title => console.log(`      - ${title}`));
      if (bySource.migration.length > 5) console.log(`      ... and ${bySource.migration.length - 5} more`);
    }
    
    // Final recommendations
    console.log('\n💡 Next steps:');
    console.log('1. You have 53 posts total (20 from RSS + 33 from migration)');
    console.log('2. Still missing 58 posts to reach 111 total');
    console.log('3. Options to find missing posts:');
    console.log('   - Check Wix dashboard for unpublished/draft posts');
    console.log('   - Look for posts in different sections (not /post/)');
    console.log('   - Try Wix export feature if available');
    console.log('   - Contact Wix support for complete export');
    console.log('\n4. Ready to import these 53 posts to Sanity with:');
    console.log('   npm run import-to-sanity');
    
  } catch (error) {
    console.error('\n❌ Error combining posts:', error);
    process.exit(1);
  }
};

// Run combination
combineAllPosts();