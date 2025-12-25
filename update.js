const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';
const TXT_FILE = path.join(__dirname, 'alternate.txt');
const M3U8_FILE = path.join(__dirname, 'alternate.m3u8');
const LOG_FILE = path.join(__dirname, 'update.log');

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  // Append to log file
  await fs.appendFile(LOG_FILE, logMessage);
}

async function fetchStream() {
  try {
    log('Fetching stream from source...');
    
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://livecricketsl.cc.nf/',
        'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, */*'
      },
      timeout: 10000 // 10 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    if (!text.includes('#EXTM3U')) {
      throw new Error('Invalid M3U8 content');
    }

    return text;
  } catch (error) {
    log(`Fetch error: ${error.message}`);
    throw error;
  }
}

async function updateFiles() {
  try {
    log('Starting update process...');
    
    // Fetch fresh stream
    const streamContent = await fetchStream();
    
    // Create timestamp
    const timestamp = new Date().toISOString();
    
    // Create TXT version
    const txtContent = `# Updated via Railway: ${timestamp}\n# Source: ${SOURCE_URL}\n\n${streamContent}`;
    
    // Create M3U8 version
    const m3u8Content = `#EXTM3U\n# Updated: ${timestamp}\n${streamContent}`;
    
    // Save files
    await fs.writeFile(TXT_FILE, txtContent, 'utf8');
    await fs.writeFile(M3U8_FILE, m3u8Content, 'utf8');
    
    log(`✓ Update successful! ${streamContent.length} characters`);
    log(`  Files saved: alternate.txt, alternate.m3u8`);
    
    return {
      success: true,
      timestamp,
      length: streamContent.length
    };
    
  } catch (error) {
    log(`✗ Update failed: ${error.message}`);
    
    // Keep existing files if update fails
    const txtExists = await fs.pathExists(TXT_FILE);
    const m3u8Exists = await fs.pathExists(M3U8_FILE);
    
    if (!txtExists) {
      await fs.writeFile(TXT_FILE, '#EXTM3U\n# Initializing...', 'utf8');
    }
    if (!m3u8Exists) {
      await fs.writeFile(M3U8_FILE, '#EXTM3U\n# Initializing...', 'utf8');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run update
async function main() {
  try {
    const result = await updateFiles();
    
    if (result.success) {
      console.log(JSON.stringify(result));
      process.exit(0);
    } else {
      console.error(JSON.stringify(result));
      process.exit(1);
    }
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

// If called directly
if (require.main === module) {
  main();
}

module.exports = { updateFiles };
