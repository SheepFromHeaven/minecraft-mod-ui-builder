#!/usr/bin/env node
/**
 * Extracts real textures into tests/fixtures/real-textures/ for visual
 * regression testing, by loading a fresh instance of the app and letting its
 * OWN auto-load flow run (lib/extractFromGithub.ts fetches the default
 * reference pack straight from GitHub's raw CDN into IndexedDB) — no
 * reimplementation of the extraction logic, no local pack file, no .env.
 *
 * Only the resulting texture PNGs land in tests/fixtures/real-textures/,
 * which is gitignored (see .gitignore) since they're Minecraft-derived
 * assets that must never be committed.
 *
 * Run: node tests/scripts/extract-real-textures.mjs
 */

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP_ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(__dirname, "../fixtures/real-textures");
const FALLBACK_PORT = 3101;

function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if (Date.now() > deadline) reject(new Error(`Server at ${url} did not start in time`));
        else setTimeout(tryOnce, 500);
      });
    };
    tryOnce();
  });
}

async function isUp(url) {
  try { await fetch(url); return true; } catch { return false; }
}

async function main() {
  // Next 16 enforces a single dev server instance per project regardless of
  // the port requested — reuse one that's already running rather than
  // fighting that lock (mirrors playwright.config.ts's reuseExistingServer).
  const existingUrl = "http://localhost:3000";
  const reuseExisting = await isUp(existingUrl);
  const baseUrl = reuseExisting ? existingUrl : `http://localhost:${FALLBACK_PORT}`;

  let server = null;
  if (reuseExisting) {
    console.log(`Reusing dev server already running at ${existingUrl}.`);
  } else {
    console.log(`Starting dev server on port ${FALLBACK_PORT}...`);
    server = spawn("npm", ["run", "dev", "--", "-p", String(FALLBACK_PORT)], {
      cwd: WEBAPP_ROOT,
      stdio: "pipe",
    });
    server.stdout.on("data", () => {}); // swallow noisy Next.js output
    server.stderr.on("data", (d) => process.stderr.write(d));
  }

  try {
    await waitForServer(baseUrl);
    console.log("Dev server ready. Launching browser...");

    const browser = await chromium.launch();
    // Fresh, isolated storage — no leftover IndexedDB from a previous run —
    // so the app's auto-load path (empty IndexedDB -> fetch from GitHub) fires.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(baseUrl);

    console.log("Waiting for the app's auto-load (GitHub raw CDN) to finish...");
    await page.getByText("No projects yet").waitFor({ timeout: 60_000 });
    console.log("Auto-load finished — WelcomeScreen loaded (textures ready).");

    const textures = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("mc-ui-builder", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const blobs = await new Promise((resolve, reject) => {
        const result = {};
        const tx = db.transaction("textures", "readonly");
        const store = tx.objectStore("textures");
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            result[cursor.key] = cursor.value;
            cursor.continue();
          }
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      });
      const out = {};
      for (const [name, blob] of Object.entries(blobs)) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const byte of buf) binary += String.fromCharCode(byte);
        out[name] = btoa(binary);
      }
      return out;
    });

    await browser.close();

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const [name, b64] of Object.entries(textures)) {
      if (name.startsWith("pack:")) continue; // raw pack textures — not needed for widget snapshots
      fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(b64, "base64"));
    }
    const written = Object.keys(textures).filter((n) => !n.startsWith("pack:"));
    console.log(`Wrote ${written.length} textures to ${path.relative(WEBAPP_ROOT, OUT_DIR)}/`);
    if (written.length === 0) {
      console.error("No textures were written — the app's auto-load may have failed (see its console output).");
      process.exit(1);
    }
  } finally {
    server?.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
