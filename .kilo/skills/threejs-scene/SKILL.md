---
name: threejs-scene
description: Build, fix or extend 3D scenes for the browser with Three.js (viewers, product/model showcases, glTF/GLB loading, simple generated geometry, animation) and export assets from Blender when needed. Use for any request about 3D, WebGL, scenes, models or renders on the web.
---

# Three.js scene workflow

## 1. Setup
- **Start from the tested starter** in `assets/starter/` (next to this file) instead of writing from memory: copy it to `3d/<project-name>/`, run `npm install`, then edit `src/main.js`. It already contains the baseline from section 2, model loading via `?model=/models/asset.glb`, and the headless check from section 4. Verified with three 0.180, vite 7 and playwright 1.63.
- Default stack: Vite + `three` from npm, plain JavaScript ES modules (TypeScript only if the project already uses it). Do not load Three.js from a CDN unless asked.
- Your memory of the Three.js API may be outdated. Before using an unfamiliar API, read `node_modules/three/package.json` for the installed version and look in `node_modules/three/examples/jsm/` or `node_modules/three/src/` for the real signature instead of guessing.
- Addons import as `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'` (also `GLTFLoader`, `DRACOLoader`, `RGBELoader`).

## 2. Scene baseline (always include)
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, `renderer.outputColorSpace = THREE.SRGBColorSpace`, tone mapping `THREE.ACESFilmicToneMapping`.
- Perspective camera that frames the content: compute `new THREE.Box3().setFromObject(root)`, then place the camera from the bounding-sphere radius (half the box diagonal, not the largest side, or corners get clipped) and the narrower of the vertical/horizontal field of view. Never hardcode a distance for a loaded model.
- Light: `HemisphereLight` + one `DirectionalLight` (shadows only if requested). Add an environment map for PBR materials, otherwise metals render black.
- `OrbitControls` with `enableDamping`; render loop through `renderer.setAnimationLoop`.
- Resize handler updating camera aspect, projection matrix and renderer size.
- Units are meters, Y is up. Keep scale sane (objects 0.1–100 units).
- Dispose geometries, materials and textures you remove.

## 3. Loading models
- Prefer `.glb`. Use `GLTFLoader`; add `DRACOLoader` only if the file is Draco-compressed.
- Handle load errors visibly (console + on-screen message), and show progress for files over ~2 MB.

## 4. Verify (the main model cannot see images)
1. Run `npm run check` in the project folder. It builds, serves `dist/`, opens the page in headless Chromium and fails on: any console or page error, failed requests, zero-size canvas, no rendered frames, missing or non-finite bounding box, content cut off by the viewport (any bbox corner outside the view), or an almost blank image (under 3 % of sampled pixels differ from the background). It writes `out/shot.png`. Pass a query for a model: `npm run check -- "?model=/models/asset.glb"` (`public/models/cube.glb` is a tiny test model).
2. First time on a machine: `npx playwright install chromium`. If the browser lives elsewhere, set `CHROMIUM_PATH` to its executable.
3. If you change what the page exposes (`window.__app`: `ready`, `frames`, `bbox`, `coverage()`, `inView()`), update `scripts/check.mjs` to match. Never loosen a check to make it pass; fix the scene.
4. Only when a visual judgement is truly needed (composition, materials, "does it look right"): switch the Kilo model to `Qwen2.5-VL-32B`, attach `out/shot.png`, ask for a concrete review checklist, then switch back to `gpt-oss-120b` for the fixes. Do not use the vision model for coding.

## 5. Assets from Blender (only if a model must be created or converted)
- Headless: `blender -b -P tools/make_asset.py`. Inside the script, build the object with `bpy`, then export with `bpy.ops.export_scene.gltf(filepath="public/models/asset.glb", export_format='GLB')`.
- Apply transforms and set the origin before export; keep triangle counts low for web (under ~100k per asset unless told otherwise).

## Pitfalls
- Black or flat-looking materials: missing lights or environment map, or wrong color space on textures (color maps `SRGBColorSpace`, data maps linear).
- Blank canvas: camera inside the model, near/far planes wrong, or the render loop was never started.
- Memory leaks: creating new geometries or materials every frame.
