const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';

// IMPORTANT: Railway cron runs in project root
const PROJECT_ROOT = process.cwd();
const TXT_PATH = path.join(PROJECT_ROOT, 'alternate.txt');
const M3U8_PATH = path.join(PROJECT_ROOT, 'alternate.m3u8');

// Log everything for debugging
console.log('==========================================');
console.log('RAILWAY CRON JOB STARTING');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`CWD: ${PROJECT_ROOT}`);
console.log(`Files will be saved to:`);
console.log(`  TXT: ${TXT_PATH}`);
console.log(`  M3U8: ${M3U8_PATH}`);
console.log('==========================================');

async function updateStream() {
  try {
    console.log('📡 Fetching stream from source...');
    
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://livecricketsl.cc.nf/',
        'Accept': 'application/x-mpegURL'
      },
      timeout: 20000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log(`✅ Fetched ${text.length} characters`);
    
    if (!text.includes('#EXTM3U')) {
      throw new Error('Invalid M3U8 - missing #EXTM3U tag');
    }

    const timestamp = new Date().toISOString();
    
    // Create content
    const txtContent = `# Updated via Railway: ${timestamp}\n${text}`;
    const m3u8Content = `#EXTM3U\n# Updated: ${timestamp}\n${text}`;
    
    // Write files
    console.log('💾 Writing files...');
    fs.writeFileSync(TXT_PATH, txtContent, 'utf8');
    fs.writeFileSync(M3U8_PATH, m3u8Content, 'utf8');
    
    // Verify
    const txtExists = fs.existsSync(TXT_PATH);
    const m3u8Exists = fs.existsSync(M3U8_PATH);
    
    if (txtExists && m3u8Exists) {
      const txtSize = fs.statSync(TXT_PATH).size;
      const m3u8Size = fs.statSync(M3U8_PATH).size;
      
      console.log('🎉 UPDATE SUCCESSFUL!');
      console.log(`   Files saved: ${txtSize} bytes (txt), ${m3u8Size} bytes (m3u8)`);
      console.log(`   Access at: /alternate.txt`);
      console.log(`   Next update in 1 minute`);
      return true;
    } else {
      throw new Error('Files not created successfully');
    }
    
  } catch (error) {
    console.error('❌ UPDATE FAILED:', error.message);
    
    // Create placeholder files if they don't exist
    if (!fs.existsSync(TXT_PATH)) {
      fs.writeFileSync(TXT_PATH, '#EXTM3U\n# Error: Update failed\n');
    }
    if (!fs.existsSync(M3U8_PATH)) {
      fs.writeFileSync(M3U8_PATH, '#EXTM3U\n# Error: Update failed\n');
    }
    
    return false;
  }
}

// Run immediately
updateStream().then(success => {
  const exitCode = success ? 0 : 1;
  console.log(`Exiting with code: ${exitCode}`);
  process.exit(exitCode);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
