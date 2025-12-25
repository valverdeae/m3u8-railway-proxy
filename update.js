const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';

// IMPORTANT: Use __dirname for consistent paths
const TXT_PATH = path.join(__dirname, 'alternate.txt');
const M3U8_PATH = path.join(__dirname, 'alternate.m3u8');

async function updateStream() {
  const timestamp = new Date().toISOString();
  console.log(`\n========== [${timestamp}] CRON JOB STARTING ==========`);
  
  try {
    console.log('📡 Fetching stream from source...');
    
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://livecricketsl.cc.nf/',
        'Accept': 'application/x-mpegURL'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log(`✅ Fetched ${text.length} characters`);
    
    if (!text.includes('#EXTM3U')) {
      throw new Error('Invalid M3U8 content');
    }

    // Create content
    const txtContent = `# Updated: ${timestamp}\n${text}`;
    const m3u8Content = `#EXTM3U\n# Updated: ${timestamp}\n${text}`;
    
    // Write files
    console.log('💾 Writing files...');
    fs.writeFileSync(TXT_PATH, txtContent, 'utf8');
    fs.writeFileSync(M3U8_PATH, m3u8Content, 'utf8');
    
    // Verify
    const txtSize = fs.statSync(TXT_PATH).size;
    const m3u8Size = fs.statSync(M3U8_PATH).size;
    
    console.log(`🎉 UPDATE SUCCESSFUL!`);
    console.log(`   Files: ${txtSize} bytes (txt), ${m3u8Size} bytes (m3u8)`);
    console.log(`   Paths: ${TXT_PATH}, ${M3U8_PATH}`);
    console.log(`============================================\n`);
    
    return true;
    
  } catch (error) {
    console.error('❌ UPDATE FAILED:', error.message);
    
    // Create error placeholder files
    const errorContent = `#EXTM3U\n# Update failed at ${timestamp}\n# Error: ${error.message}`;
    fs.writeFileSync(TXT_PATH, errorContent, 'utf8');
    fs.writeFileSync(M3U8_PATH, errorContent, 'utf8');
    
    console.log(`============================================\n`);
    return false;
  }
}

// Export for manual triggering
module.exports = updateStream;

// Run if called directly (by cron)
if (require.main === module) {
  updateStream().then(success => {
    process.exit(success ? 0 : 1);
  });
}
