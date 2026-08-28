const fs = require('fs');

// Read PNG header dimensions
const buffer = fs.readFileSync('public/images/guitar-2d.png');
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);

console.log(`guitar-2d.png size: ${width}x${height}, aspect ratio: ${(width / height).toFixed(4)} (1:${(height / width).toFixed(2)})`);
