const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const SOURCE_URL = 'https://livecricketsl.cc.nf/proxy/fox.php';

// Middleware to fetch fresh stream
async function fetchFreshStream() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://livecricketsl.cc.nf/',
        'Accept': 'application/x-mpegURL'
      },
      timeout: 10000
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    if (!text.includes('#EXTM3U')) throw new Error('Invalid M3U8');
    
    return text;
  } catch (error) {
    console.error('Fetch error:', error.message);
    return '#EXTM3U\n# Error: ' + error.message;
  }
}

// Serve alternate.txt (always fresh)
app.get('/alternate.txt', async (req, res) => {
  try {
    const stream = await fetchFreshStream();
    const timestamp = new Date().toISOString();
    const content = `# Updated: ${timestamp}\n${stream}`;
    
    res.set({
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.send(content);
  } catch (error) {
    res.status(500).send('#EXTM3U\n# Server error');
  }
});

// Serve alternate.m3u8 (always fresh)
app.get('/alternate.m3u8', async (req, res) => {
  try {
    const stream = await fetchFreshStream();
    const timestamp = new Date().toISOString();
    const content = `#EXTM3U\n# Updated: ${timestamp}\n${stream}`;
    
    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.send(content);
  } catch (error) {
    res.status(500).send('#EXTM3U\n# Server error');
  }
});

// Status page
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    service: 'Live Stream Proxy',
    source: SOURCE_URL,
    endpoints: {
      txt: '/alternate.txt',
      m3u8: '/alternate.m3u8'
    },
    note: 'Stream is fetched fresh on every request'
  });
});

// Test endpoint
app.get('/test-fetch', async (req, res) => {
  try {
    const start = Date.now();
    const stream = await fetchFreshStream();
    const duration = Date.now() - start;
    
    res.json({
      success: stream.includes('#EXTM3U'),
      fetchTime: `${duration}ms`,
      length: stream.length,
      preview: stream.substring(0, 200) + '...'
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📄 Fresh TXT: http://localhost:${PORT}/alternate.txt`);
  console.log(`🎬 Fresh M3U8: http://localhost:${PORT}/alternate.m3u8`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
});
