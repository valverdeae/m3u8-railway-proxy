const fs = require('fs');
const path = require('path');

const TXT_PATH = path.join(__dirname, 'alternate.txt');
const M3U8_PATH = path.join(__dirname, 'alternate.m3u8');

const initialContent = '#EXTM3U\n# Initializing... First update pending.\n';

if (!fs.existsSync(TXT_PATH)) {
  fs.writeFileSync(TXT_PATH, initialContent);
  console.log('Created alternate.txt');
}

if (!fs.existsSync(M3U8_PATH)) {
  fs.writeFileSync(M3U8_PATH, initialContent);
  console.log('Created alternate.m3u8');
}
