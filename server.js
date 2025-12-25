const express = require('express');
const fs = require('fs'); // Use built-in fs
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Use absolute paths
const TXT_PATH = path.join(__dirname, 'alternate.txt');
const M3U8_PATH = path.join(__dirname, 'alternate.m3u8');

// Serve alternate.txt
app.get('/alternate.txt', (req, res) => {
  try {
    if (fs.existsSync(TXT_PATH)) {
      const content = fs.readFileSync(TXT_PATH, 'utf8');
      res.set({
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(content);
    } else {
      // Create file if doesn't exist
      const initialContent = '#EXTM3U\n# Initializing... Waiting for first update.';
      fs.writeFileSync(TXT_PATH, initialContent);
      fs.writeFileSync(M3U8_PATH, initialContent);
      res.set('Content-Type', 'text/plain');
      res.send(initialContent);
    }
  } catch (error) {
    res.status(500).send(`# Error: ${error.message}`);
  }
});

// Serve alternate.m3u8
app.get('/alternate.m3u8', (req, res) => {
  try {
    if (fs.existsSync(M3U8_PATH)) {
      const content = fs.readFileSync(M3U8_PATH, 'utf8');
      res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.send(content);
    } else {
      const initialContent = '#EXTM3U\n# Initializing... Waiting for first update.';
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(initialContent);
    }
  } catch (error) {
    res.status(500).send(`#EXTM3U\n# Error: ${error.message}`);
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  try {
    const txtExists = fs.existsSync(TXT_PATH);
    const m3u8Exists = fs.existsSync(M3U8_PATH);
    
    let lastModified = null;
    let fileSize = 0;
    
    if (txtExists) {
      const stats = fs.statSync(TXT_PATH);
      lastModified = stats.mtime;
      fileSize = stats.size;
    }
    
    res.json({
      status: 'running',
      last_update: lastModified,
      file_exists: txtExists,
      file_size: fileSize,
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

// Force update endpoint
app.get('/force-update', async (req, res) => {
  try {
    const updateStream = require('./update.js');
    const success = await updateStream();
    res.json({ 
      success, 
      timestamp: new Date().toISOString(),
      message: success ? 'Manual update triggered' : 'Manual update failed'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📄 TXT: http://localhost:${PORT}/alternate.txt`);
  console.log(`🎬 M3U8: http://localhost:${PORT}/alternate.m3u8`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`🔄 Force Update: http://localhost:${PORT}/force-update`);
});
