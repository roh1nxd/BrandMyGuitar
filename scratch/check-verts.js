const fs = require('fs');

const buffer = fs.readFileSync('public/models/taylor_guitar_gold_label.glb');
const chunkLength = buffer.readUInt32LE(12);
const jsonText = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonText);

// Access binary chunk
const binOffset = 20 + chunkLength + 8; // header + json chunk + bin header
// Read first mesh positions
const p0 = gltf.meshes[0].primitives[0];
const posAcc = gltf.accessors[p0.attributes.POSITION];
const bufferView = gltf.bufferViews[posAcc.bufferView];
const byteOffset = binOffset + (bufferView.byteOffset || 0) + (posAcc.byteOffset || 0);

const count = posAcc.count;
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

let headstockCandidates = [];
let bodyCandidates = [];

for (let i = 0; i < count; i++) {
  const x = buffer.readFloatLE(byteOffset + i * 12);
  const y = buffer.readFloatLE(byteOffset + i * 12 + 4);
  const z = buffer.readFloatLE(byteOffset + i * 12 + 8);
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}

console.log(`Bounds: X: [${minX.toFixed(3)}, ${maxX.toFixed(3)}], Y: [${minY.toFixed(3)}, ${maxY.toFixed(3)}], Z: [${minZ.toFixed(3)}, ${maxZ.toFixed(3)}]`);
