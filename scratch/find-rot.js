const THREE = require('three');

// Let's test Euler rotation on our key points:
// Headstock: [0.32, 0.058, 0]
// Lower bout left: [-0.26, 0.058, -0.085]
// Lower bout right: [-0.26, 0.058, 0.085]
// Normal: [0, 1, 0] (face of soundboard)

const headstock = new THREE.Vector3(0.32, 0.058, 0);
const boutLeft = new THREE.Vector3(-0.26, 0.058, -0.085);
const boutRight = new THREE.Vector3(-0.26, 0.058, 0.085);
const normal = new THREE.Vector3(0, 1, 0);

// We want:
// Headstock.y > 0 (top)
// Bout.y < 0 (bottom)
// Normal.z > 0 (facing towards camera +Z)
// boutLeft.x < 0 (left)
// boutRight.x > 0 (right)

const eulers = [
  new THREE.Euler(0, 0, Math.PI / 2),
  new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2),
  new THREE.Euler(0, -Math.PI / 2, Math.PI / 2),
  new THREE.Euler(Math.PI / 2, -Math.PI / 2, 0),
  new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0),
  new THREE.Euler(0, Math.PI / 2, Math.PI / 2),
  new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0),
  new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
  new THREE.Euler(0, -Math.PI / 2, -Math.PI / 2),
];

console.log('Testing Euler rotations:');
eulers.forEach((e, idx) => {
  const h = headstock.clone().applyEuler(e);
  const bl = boutLeft.clone().applyEuler(e);
  const br = boutRight.clone().applyEuler(e);
  const n = normal.clone().applyEuler(e);

  const headstockIsTop = h.y > 0.2;
  const normalFacesCamera = n.z > 0.8;
  const leftIsLeft = bl.x < -0.03;
  const rightIsRight = br.x > 0.03;

  if (headstockIsTop && normalFacesCamera && leftIsLeft && rightIsRight) {
    console.log(`\nPERFECT MATCH Found at Euler [${idx}]: [${e.x.toFixed(3)}, ${e.y.toFixed(3)}, ${e.z.toFixed(3)}]`);
    console.log(`Headstock: [${h.x.toFixed(2)}, ${h.y.toFixed(2)}, ${h.z.toFixed(2)}]`);
    console.log(`Normal (Face): [${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)}]`);
    console.log(`Bout Left: [${bl.x.toFixed(2)}, ${bl.y.toFixed(2)}, ${bl.z.toFixed(2)}]`);
    console.log(`Bout Right: [${br.x.toFixed(2)}, ${br.y.toFixed(2)}, ${br.z.toFixed(2)}]`);
  }
});
