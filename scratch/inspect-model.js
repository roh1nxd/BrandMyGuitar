const fs = require('fs');

const buffer = fs.readFileSync('public/models/taylor_guitar_gold_label.glb');
const chunkLength = buffer.readUInt32LE(12);
const jsonText = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonText);

console.log('Nodes:');
gltf.nodes.forEach((n, i) => {
  console.log(`Node ${i}:`, n.name, 'mesh:', n.mesh, 'matrix:', n.matrix, 'rot:', n.rotation, 'trans:', n.translation, 'scale:', n.scale);
});

console.log('Position Accessors:');
gltf.meshes.forEach((m, i) => {
  m.primitives.forEach((p, pi) => {
    const posAccIndex = p.attributes.POSITION;
    const posAcc = gltf.accessors[posAccIndex];
    console.log(`Mesh ${i} [${m.name}] Prim ${pi}: min = ${JSON.stringify(posAcc.min)}, max = ${JSON.stringify(posAcc.max)}, count = ${posAcc.count}`);
  });
});
