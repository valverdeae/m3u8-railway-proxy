const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';

// IMPORTANT: Use absolute paths for Railway cron
const TXT_PATH = path.join(process.cwd(), 'alternate.txt');
const M3U8_PATH = path.join(process.cwd(), 'alternate.m3u8');

async function updateStream() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting update from cron job...`);
  console.log(`Current directory: ${process.cwd()}`);
  console.log(`TXT path: ${TXT_PATH}`);
  console.log(`M3U8 path: ${M3U8_PATH}`);
  
  try {
    // Fetch from source
    console.log('Fetching stream...');
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://livecricketsl.cc.nf/',
        'Accept': 'application/x-mpegURL'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log(`Fetched ${text.length} characters`);
    
    if (!text.includes('#EXTM3U')) {
      throw new Error('Invalid M3U8 content - no #EXTM3U tag found');
    }

    // Create both files
    const txtContent = `# Updated via Railway Cron: ${timestamp}\n${text}`;
    const m3u8Content = `#EXTM3U\n# Updated: ${timestamp}\n${text}`;
    
    // Save files with absolute paths
    console.log('Writing files...');
    fs.writeFileSync(TXT_PATH, txtContent, 'utf8');
    fs.writeFileSync(M3U8_PATH, m3u8Content, 'utf8');
    
    // Verify files were written
    const txtStats = fs.statSync(TXT_PATH);
    const m3u8Stats = fs.statSync(M3U8_PATH);
    
    console.log(`✅ Update successful!`);
    console.log(`   Files written: ${txtStats.size} bytes (txt), ${m3u8Stats.size} bytes (m3u8)`);
    console.log(`   Check at: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'your-domain'}/alternate.txt`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Update failed:`, error.message);
    console.error(`Stack:`, error.stack);
    return false;
  }
}

// Run update if called directly
if (require.main === module) {
  updateStream()
    .then(success => {
      console.log(`Process exiting with code: ${success ? 0 : 1}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = updateStream;
