---
name: threejs-scene
description: Build, fix or extend 3D scenes for the browser with Three.js (viewers, product/model showcases, glTF/GLB loading, simple generated geometry, animation) and export assets from Blender when needed. Use for any request about 3D, WebGL, scenes, models or renders on the web.
---

# Three.js scene workflow

## 1. Setup
- Default stack: Vite + `three` from npm, plain JavaScript ES modules (TypeScript only if the project already uses it). Do not load Three.js from a CDN unless asked.
- Your memory of the Three.js API may be outdated. Before using an unfamiliar API, read `node_modules/three/package.json` for the installed version and look in `node_modules/three/examples/jsm/` or `node_modules/three/src/` for the real signature instead of guessing.
- Addons import as `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'` (also `GLTFLoader`, `DRACOLoader`, `RGBELoader`).

## 2. Scene baseline (always include)
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, `renderer.outputColorSpace = THREE.SRGBColorSpace`, tone mapping `THREE.ACESFilmicToneMapping`.
- Perspective camera that frames the content: compute `new THREE.Box3().setFromObject(root)`, then place the camera from the box size and center. Never hardcode a distance for a loaded model.
- Light: `HemisphereLight` + one `DirectionalLight` (shadows only if requested). Add an environment map for PBR materials, otherwise metals render black.
- `OrbitControls` with `enableDamping`; render loop through `renderer.setAnimationLoop`.
- Resize handler updating camera aspect, projection matrix and renderer size.
- Units are meters, Y is up. Keep scale sane (objects 0.1–100 units).
- Dispose geometries, materials and textures you remove.

## 3. Loading models
- Prefer `.glb`. Use `GLTFLoader`; add `DRACOLoader` only if the file is Draco-compressed.
- Handle load errors visibly (console + on-screen message), and show progress for files over ~2 MB.

## 4. Verify (the main model cannot see images)
1. `npm run build` must pass with no errors.
2. Start the dev server and take a headless screenshot: `npx playwright screenshot --viewport-size=1280,720 http://localhost:5173 out/shot.png`. Collect browser console errors and treat any as failures.
3. Check numerically what you cannot see: bounding box is non-empty and inside the camera frustum, no NaN in transforms, canvas size is non-zero, the first frame rendered.
4. Only when a visual judgement is truly needed (composition, materials, "does it look right"): switch the Kilo model to `Qwen2.5-VL-32B`, attach `out/shot.png`, ask for a concrete review checklist, then switch back to `gpt-oss-120b` for the fixes. Do not use the vision model for coding.

## 5. Assets from Blender (only if a model must be created or converted)
- Headless: `blender -b -P tools/make_asset.py`. Inside the script, build the object with `bpy`, then export with `bpy.ops.export_scene.gltf(filepath="public/models/asset.glb", export_format='GLB')`.
- Apply transforms and set the origin before export; keep triangle counts low for web (under ~100k per asset unless told otherwise).

## Pitfalls
- Black or flat-looking materials: missing lights or environment map, or wrong color space on textures (color maps `SRGBColorSpace`, data maps linear).
- Blank canvas: camera inside the model, near/far planes wrong, or the render loop was never started.
- Memory leaks: creating new geometries or materials every frame.
