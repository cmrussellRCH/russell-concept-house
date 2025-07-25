const fs = require('fs').promises;
const path = require('path');

const checkBackup = async () => {
  const articlesPath = path.join(process.env.HOME, 'Desktop/RussellConceptBackup/backup/www.russellconcept.com/articles/page');
  const imagesPath = path.join(process.env.HOME, 'Desktop/RussellConceptBackup/backup/static.wixstatic.com/media');
  
  console.log('🔍 Checking Wix backup directories...\n');
  
  try {
    // Check articles directory
    console.log('📁 Articles directory:', articlesPath);
    const articleFiles = await fs.readdir(articlesPath);
    const htmlFiles = articleFiles.filter(f => f.endsWith('.html'));
    console.log(`   Found ${htmlFiles.length} HTML files`);
    if (htmlFiles.length > 0) {
      console.log('   Sample files:', htmlFiles.slice(0, 5).join(', '));
    }
    
    // Check images directory
    console.log('\n📁 Images directory:', imagesPath);
    const imageFiles = await fs.readdir(imagesPath);
    console.log(`   Found ${imageFiles.length} image files`);
    if (imageFiles.length > 0) {
      console.log('   Sample files:', imageFiles.slice(0, 5).join(', '));
    }
    
    console.log('\n✅ Backup directories found and accessible!');
    console.log('\nRun "npm run migrate-wix" to start the migration.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease ensure the backup is located at:');
    console.log('~/Desktop/RussellConceptBackup/');
  }
};

checkBackup();