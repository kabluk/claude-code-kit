// Shared browser lookup for compare.mjs, contrast.mjs and scale-audit.mjs.
//
// Playwright is resolved from the *project* (cwd): `playwright`, then
// `playwright-core`, then a global install next to the node binary. The scripts
// work when the skill directory is a copy or a symlink into the toolkit checkout.
//
// Chromium binary, in order:
//   1. CHROMIUM env var (the scripts' --exe flag sets it);
//   2. the browser the installed Playwright expects, if the file is there;
//   3. the newest chromium-* / chromium_headless_shell-* revision in a known
//      Playwright cache (PLAYWRIGHT_BROWSERS_PATH, ~/Library/Caches/ms-playwright,
//      ~/.cache/ms-playwright, %LOCALAPPDATA%\ms-playwright, /opt/pw-browsers),
//      full Chromium before headless shell. This covers a cloud session where the
//      project's Playwright version differs from the preinstalled browsers;
//   4. an error saying exactly what to install.
// No machine-specific path is written anywhere: directories are scanned.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

export function loadPlaywright() {
  const req = createRequire(path.join(process.cwd(), 'package.json'));
  const globalDir = path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules');
  for (const name of ['playwright', 'playwright-core']) {
    try { return req(name); } catch { /* next */ }
    try { return req(path.join(globalDir, name)); } catch { /* next */ }
  }
  throw new Error('playwright not found: `npm i -D playwright` in the project (or install it globally)');
}

const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

function cacheDirs() {
  const home = os.homedir();
  const dirs = [];
  const env = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (env && env !== '0') dirs.push(env);
  dirs.push(path.join(home, 'Library/Caches/ms-playwright'));
  dirs.push(path.join(process.env.XDG_CACHE_HOME || path.join(home, '.cache'), 'ms-playwright'));
  if (process.env.LOCALAPPDATA) dirs.push(path.join(process.env.LOCALAPPDATA, 'ms-playwright'));
  dirs.push('/opt/pw-browsers');
  return [...new Set(dirs)].filter((d) => fs.existsSync(d));
}

// Inside a revision: chrome-<platform>/<binary>. Names changed between versions.
const FULL = ['chrome', 'chrome.exe', 'Chromium.app/Contents/MacOS/Chromium',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'];
const SHELL = ['chrome-headless-shell', 'chrome-headless-shell.exe', 'headless_shell', 'headless_shell.exe'];

export function scanCaches() {
  const found = [];
  for (const dir of cacheDirs()) {
    for (const rev of fs.readdirSync(dir)) {
      const m = /^(chromium|chromium_headless_shell)-(\d+)$/.exec(rev);
      if (!m) continue;
      const shell = m[1] !== 'chromium';
      let subs = [];
      try { subs = fs.readdirSync(path.join(dir, rev)).filter((s) => s.startsWith('chrome')); } catch { continue; }
      for (const sub of subs)
        for (const bin of shell ? SHELL : FULL) {
          const p = path.join(dir, rev, sub, bin);
          if (isFile(p)) found.push({ p, rev: Number(m[2]), shell });
        }
    }
  }
  found.sort((a, b) => Number(a.shell) - Number(b.shell) || b.rev - a.rev);
  return found.map((f) => f.p);
}

export const HOWTO =
  'Chromium not found. Options:\n' +
  '  - CHROMIUM=/path/to/chrome node <script> ...   (any Chromium/Chrome)\n' +
  '  - npx playwright install chromium              (the revision your Playwright expects)\n' +
  '  - PLAYWRIGHT_BROWSERS_PATH=/dir                (if Playwright browsers live outside the default cache)';

export function resolveChromium(chromium) {
  if (process.env.CHROMIUM) {
    if (!isFile(process.env.CHROMIUM)) throw new Error(`CHROMIUM=${process.env.CHROMIUM}: no such file.\n${HOWTO}`);
    return process.env.CHROMIUM;
  }
  try {
    const own = chromium.executablePath();
    if (own && isFile(own)) return undefined; // Playwright finds its own browser
  } catch { /* fall through to the cache scan */ }
  const [first] = scanCaches();
  if (first) return first;
  throw new Error(HOWTO);
}

export async function launchChromium(opts = {}) {
  const pw = loadPlaywright();
  const chromium = pw.chromium ?? pw.default?.chromium;
  const exe = resolveChromium(chromium);
  return chromium.launch(exe ? { ...opts, executablePath: exe } : opts);
}
