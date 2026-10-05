#!/usr/bin/env node
// Screenshot a running page at the reference image's exact size and diff it with pixelmatch.
//
//   node <skill-dir>/compare.mjs --ref refs/page.png --url http://127.0.0.1:5173/?page=x [--name page] [--iter 3] [--threshold 0.12]
//
// Writes refs/out/<name>-<iter>.png and refs/out/<name>-<iter>-diff.png, prints the global
// mismatch % and a 3x4 grid of per-cell mismatch (rows = y bands, cols = x bands) so the
// offending region is obvious, and appends a line to refs/out/history.jsonl.
// Dependencies (playwright, pngjs, pixelmatch) are resolved from the *project* (cwd), so the
// script works when the skill directory is a copy or a symlink into the toolkit checkout.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const req = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = req('playwright'); // CJS
const { PNG } = req('pngjs'); // CJS
const pixelmatch = (await import(req.resolve('pixelmatch'))).default; // ESM-only

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
if (!args.ref || !args.url) {
  console.error('usage: compare.mjs --ref <reference.png> --url <page url> [--name x] [--iter n] [--threshold 0.12] [--out refs/out]');
  process.exit(2);
}

const name = args.name ?? path.basename(args.ref, path.extname(args.ref));
const outDir = args.out ?? 'refs/out';
const threshold = Number(args.threshold ?? 0.12);
fs.mkdirSync(outDir, { recursive: true });
const iter =
  args.iter ??
  fs.readdirSync(outDir).filter((f) => f.startsWith(`${name}-`) && f.endsWith('.png') && !f.includes('diff')).length + 1;

const ref = PNG.sync.read(fs.readFileSync(args.ref));
const { width, height } = ref;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(args.url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const shotPath = path.join(outDir, `${name}-${iter}.png`);
await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width, height } });
await browser.close();

const shot = PNG.sync.read(fs.readFileSync(shotPath));
const diff = new PNG({ width, height });
const mismatched = pixelmatch(ref.data, shot.data, diff.data, width, height, { threshold });
const diffPath = path.join(outDir, `${name}-${iter}-diff.png`);
fs.writeFileSync(diffPath, PNG.sync.write(diff));

const pct = (mismatched / (width * height)) * 100;
const cols = 3;
const rows = 4;
const cw = Math.ceil(width / cols);
const rh = Math.ceil(height / rows);
const grid = [];
for (let r = 0; r < rows; r++) {
  const line = [];
  for (let c = 0; c < cols; c++) {
    let bad = 0;
    let total = 0;
    for (let y = r * rh; y < Math.min(height, (r + 1) * rh); y++) {
      for (let x = c * cw; x < Math.min(width, (c + 1) * cw); x++) {
        const i = (y * width + x) * 4;
        total++;
        if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) bad++;
      }
    }
    line.push(((bad / total) * 100).toFixed(1).padStart(5));
  }
  grid.push(`  y${String(r * rh).padStart(4)}-${String(Math.min(height, (r + 1) * rh)).padStart(4)} | ${line.join(' | ')}`);
}

fs.appendFileSync(
  path.join(outDir, 'history.jsonl'),
  JSON.stringify({ name, iter: Number(iter), mismatchPct: Number(pct.toFixed(3)), mismatched, threshold, at: new Date().toISOString() }) + '\n',
);
console.log(`${name} iter ${iter}: ${pct.toFixed(2)}% pixels differ (${mismatched}) -> ${shotPath}, ${diffPath}`);
console.log(`  cols: x0-${cw} | x${cw}-${2 * cw} | x${2 * cw}-${width}`);
console.log(grid.join('\n'));
