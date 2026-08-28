const THREE = require('three');
const fs = require('fs');

// We can inspect the vertices directly
const buffer = fs.readFileSync('public/models/taylor_guitar_gold_label.glb');
// The model has two meshes: Object_0 and Object_1
// Let's print out what the coordinates represent.
console.log('Model dimensions:');
console.log('X span: ~ 0.76 (-0.38 to +0.38)');
console.log('Y span: ~ 0.074 (0 to 0.074)');
console.log('Z span: ~ 0.30 (-0.15 to +0.15)');
