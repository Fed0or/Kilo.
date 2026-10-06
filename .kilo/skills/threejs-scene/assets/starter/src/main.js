import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('app');
const msg = document.getElementById('msg');
const show = (text) => { msg.textContent = text; };

// State read by scripts/check.mjs. Keep in sync with what the page really does.
const state = { ready: false, frames: 0, bbox: null };
window.__app = state;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101418);

// Environment map: without it, metallic PBR materials render black.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xffffff, 0x20242a, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(4, 8, 6);
sun.castShadow = true;
scene.add(sun);

const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Content root: everything the user cares about goes in here, so it can be framed.
const root = new THREE.Group();
scene.add(root);

function frame(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) throw new Error('Content has an empty bounding box');
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Bounding-sphere radius (half the box diagonal) so every corner fits, and the
  // narrower of the vertical/horizontal field of view so portrait windows work too.
  const radius = size.length() / 2;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = radius / Math.sin(Math.min(vFov, hFov) / 2);
  camera.position.copy(center).add(new THREE.Vector3(1, 0.6, 1).normalize().multiplyScalar(dist * 1.1));
  camera.near = dist / 100;
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
  state.bbox = { min: box.min.toArray(), max: box.max.toArray() };
}

function addDemo() {
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.5, 0.17, 220, 32),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 1, roughness: 0.25 }),
  );
  knot.position.y = 1;
  knot.castShadow = true;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(knot, floor);
}

async function load(url) {
  show('Loading model...');
  const gltf = await new GLTFLoader().loadAsync(url, (e) => {
    if (e.total) show(`Loading model... ${Math.round((e.loaded / e.total) * 100)}%`);
  });
  gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.add(gltf.scene);
  show('');
}

function resize() {
  const { clientWidth: w, clientHeight: h } = container;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// Largest absolute NDC coordinate over the 8 bounding-box corners. <= 1 means the
// whole content is inside the view.
state.inView = () => {
  if (!state.bbox) return Infinity;
  const [a, b] = [state.bbox.min, state.bbox.max];
  camera.updateMatrixWorld();
  let worst = 0;
  for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) {
    const p = new THREE.Vector3(x, y, z).project(camera);
    worst = Math.max(worst, Math.abs(p.x), Math.abs(p.y));
  }
  return worst;
};

// Returns the share of sampled pixels that differ from the background colour.
// Called synchronously after a render, so the drawing buffer is still readable.
state.coverage = () => {
  renderer.render(scene, camera);
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, n = 24;
  const px = new Uint8Array(4);
  const bg = scene.background.clone().convertLinearToSRGB();
  let hit = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      gl.readPixels(Math.floor(((i + 0.5) / n) * w), Math.floor(((j + 0.5) / n) * h), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const d = Math.abs(px[0] / 255 - bg.r) + Math.abs(px[1] / 255 - bg.g) + Math.abs(px[2] / 255 - bg.b);
      if (d > 0.06) hit++;
    }
  }
  return hit / (n * n);
};

try {
  const model = new URLSearchParams(location.search).get('model');
  if (model) await load(model); else addDemo();
  frame(root);
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    state.frames++;
  });
  state.ready = true;
} catch (err) {
  console.error(err);
  show(`Error: ${err.message}`);
}
