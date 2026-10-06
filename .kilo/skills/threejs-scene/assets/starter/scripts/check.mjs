// Headless smoke test: serves ./dist, loads the page in Chromium and fails on any
// console error, empty canvas, missing first frame, bad bounding box, content outside the view or blank image.
// Usage: npm run check            (screenshot goes to out/shot.png)
//        npm run check -- "?model=/models/asset.glb"
// First time on a machine: npx playwright install chromium
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright';

const query = process.argv[2] ?? '';
mkdirSync('out', { recursive: true });

const server = await preview({ preview: { port: 0, open: false } });
const url = server.resolvedUrls.local[0] + query;
const failures = [];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => { if (m.type() === 'error') failures.push(`console error: ${m.text()}`); });
  page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => failures.push(`request failed: ${r.url()}`));

  await page.goto(url);
  await page.waitForFunction(() => window.__app?.ready && window.__app.frames > 2, null, { timeout: 15000 })
    .catch(() => failures.push('scene never became ready (no frames rendered)'));

  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const a = window.__app ?? {};
    return { w: c?.width ?? 0, h: c?.height ?? 0, frames: a.frames ?? 0, bbox: a.bbox ?? null, coverage: a.coverage?.() ?? 0, inView: a.inView?.() ?? Infinity };
  });
  await page.screenshot({ path: 'out/shot.png' });

  if (!info.w || !info.h) failures.push('canvas has zero size');
  const flat = info.bbox ? [...info.bbox.min, ...info.bbox.max] : [];
  if (!flat.length || !flat.every(Number.isFinite)) failures.push('bounding box missing or not finite');
  if (!(info.inView <= 1)) failures.push(`content is cut off by the viewport (max NDC ${info.inView})`);
  if (info.coverage < 0.03) failures.push(`image looks blank (coverage ${info.coverage.toFixed(3)})`);
  console.log(JSON.stringify(info));
} finally {
  await browser.close();
  server.httpServer.close();
}

if (failures.length) {
  console.error('CHECK FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('CHECK OK -> out/shot.png');
