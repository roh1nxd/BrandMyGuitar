const fs = require('fs');

const buffer = fs.readFileSync('public/models/taylor_guitar_gold_label.glb');
const chunkLength = buffer.readUInt32LE(12);
const jsonText = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonText);

const binOffset = 20 + chunkLength + 8;
const p0 = gltf.meshes[0].primitives[0];
const posAcc = gltf.accessors[p0.attributes.POSITION];
const bufferView = gltf.bufferViews[posAcc.bufferView];
const byteOffset = binOffset + (bufferView.byteOffset || 0) + (posAcc.byteOffset || 0);

let negZSpread = 0, posZSpread = 0;
let atNegX_Z = [], atPosX_Z = [];

for (let i = 0; i < posAcc.count; i++) {
  const x = buffer.readFloatLE(byteOffset + i * 12);
  const y = buffer.readFloatLE(byteOffset + i * 12 + 4);
  const z = buffer.readFloatLE(byteOffset + i * 12 + 8);

  if (x < -0.2) atNegX_Z.push(Math.abs(z));
  if (x > 0.2) atPosX_Z.push(Math.abs(z));
}

const maxZAtNegX = Math.max(...atNegX_Z);
const maxZAtPosX = Math.max(...atPosX_Z);

console.log(`Z-width at X < -0.2 (negative X end): ${maxZAtNegX.toFixed(3)}`);
console.log(`Z-width at X > +0.2 (positive X end): ${maxZAtPosX.toFixed(3)}`);
