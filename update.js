const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';

// CRITICAL: Use /tmp directory (shared between cron and web)
const TXT_PATH = '/tmp/alternate.txt';
const M3U8_PATH = '/tmp/alternate.m3u8';

async function updateStream() {
  console.log(`\n🔄 [${new Date().toISOString()}] UPDATE STARTING`);
  console.log(`Using shared /tmp directory`);
  console.log(`TXT: ${TXT_PATH}`);
  console.log(`M3U8: ${M3U8_PATH}\n`);
  
  try {
    // Fetch stream
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://livecricketsl.cc.nf/'
      },
      timeout: 15000
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    console.log(`📥 Fetched: ${text.length} chars`);
    
    if (!text.includes('#EXTM3U')) throw new Error('Invalid M3U8');
    
    // Write to /tmp
    const timestamp = new Date().toISOString();
    const txtContent = `# Updated: ${timestamp}\n${text}`;
    const m3u8Content = `#EXTM3U\n# Updated: ${timestamp}\n${text}`;
    
    fs.writeFileSync(TXT_PATH, txtContent, 'utf8');
    fs.writeFileSync(M3U8_PATH, m3u8Content, 'utf8');
    
    console.log(`✅ Files written to /tmp`);
    console.log(`📊 TXT size: ${fs.statSync(TXT_PATH).size} bytes`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

module.exports = updateStream;

if (require.main === module) {
  updateStream().then(success => {
    process.exit(success ? 0 : 1);
  });
}
