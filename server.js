const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// CRITICAL: Read from same /tmp directory
const TXT_PATH = '/tmp/alternate.txt';
const M3U8_PATH = '/tmp/alternate.m3u8';

// Create initial files in /tmp if they don't exist
if (!fs.existsSync(TXT_PATH)) {
  fs.writeFileSync(TXT_PATH, '#EXTM3U\n# Initializing...');
  console.log('Created initial /tmp/alternate.txt');
}

app.get('/alternate.txt', (req, res) => {
  try {
    const content = fs.readFileSync(TXT_PATH, 'utf8');
    res.set({
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    });
    res.send(content);
  } catch (error) {
    res.send('#EXTM3U\n# Error reading file');
  }
});

app.get('/alternate.m3u8', (req, res) => {
  try {
    const content = fs.readFileSync(M3U8_PATH, 'utf8');
    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache'
    });
    res.send(content);
  } catch (error) {
    res.send('#EXTM3U\n# Error reading file');
  }
});

app.get('/debug', (req, res) => {
  const files = {
    '/tmp/alternate.txt': fs.existsSync(TXT_PATH),
    '/tmp/alternate.m3u8': fs.existsSync(M3U8_PATH),
    './alternate.txt': fs.existsSync('./alternate.txt'),
    currentDir: process.cwd(),
    tmpDir: fs.readdirSync('/tmp')
  };
  res.json(files);
});

app.listen(PORT, () => {
  console.log(`✅ Server running`);
  console.log(`📁 Serving from /tmp directory`);
});
