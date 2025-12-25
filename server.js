const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const TXT_FILE = path.join(__dirname, 'alternate.txt');
const M3U8_FILE = path.join(__dirname, 'alternate.m3u8');

// Serve static files
app.use(express.static('public'));

// Serve alternate.txt
app.get('/alternate.txt', async (req, res) => {
  try {
    if (await fs.pathExists(TXT_FILE)) {
      const content = await fs.readFile(TXT_FILE, 'utf8');
      res.header('Content-Type', 'text/plain');
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      res.send(content);
    } else {
      res.status(404).send('# File not found yet. First update pending.');
    }
  } catch (error) {
    res.status(500).send(`# Error: ${error.message}`);
  }
});

// Serve alternate.m3u8
app.get('/alternate.m3u8', async (req, res) => {
  try {
    if (await fs.pathExists(M3U8_FILE)) {
      const content = await fs.readFile(M3U8_FILE, 'utf8');
      res.header('Content-Type', 'application/vnd.apple.mpegurl');
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(content);
    } else {
      res.status(404).send('#EXTM3U\n# File not found yet.');
    }
  } catch (error) {
    res.status(500).send(`#EXTM3U\n# Error: ${error.message}`);
  }
});

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    const txtExists = await fs.pathExists(TXT_FILE);
    const m3u8Exists = await fs.pathExists(M3U8_FILE);
    
    let lastModified = null;
    if (txtExists) {
      const stats = await fs.stat(TXT_FILE);
      lastModified = stats.mtime;
    }
    
    res.json({
      status: 'running',
      last_update: lastModified,
      files: {
        'alternate.txt': txtExists,
        'alternate.m3u8': m3u8Exists
      },
      endpoints: {
        txt: `${req.protocol}://${req.get('host')}/alternate.txt`,
        m3u8: `${req.protocol}://${req.get('host')}/alternate.m3u8`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 TXT: http://localhost:${PORT}/alternate.txt`);
  console.log(`🎬 M3U8: http://localhost:${PORT}/alternate.m3u8`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
});
