import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../fixtures/real-textures");

const GITHUB_OWNER = "Faithful-Pack";
const GITHUB_REPO  = "Default-Java";
const GITHUB_REF   = "1.21.11";

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
}

interface SliceTask {
  name: string;
  path: string;
  slice: number;
  contentW?: number;
  contentH?: number;
  midCol?: number;
  midRow?: number;
}

function rawUrl(assetPath: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_REF}/${assetPath}`;
}

async function fetchPng(assetPath: string): Promise<RawImage | null> {
  const res = await fetch(rawUrl(assetPath));
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  try {
    const png = PNG.sync.read(buf);
    return { data: png.data, width: png.width, height: png.height };
  } catch {
    return null;
  }
}

function encodePng({ data, width, height }: RawImage): Buffer {
  const png = new PNG({ width, height });
  png.data = Buffer.from(data);
  return PNG.sync.write(png);
}

function sample9slice(src: RawImage, task: SliceTask): RawImage {
  const { data, width: imgW, height } = src;
  const cw = task.contentW ?? imgW;
  const ch = task.contentH ?? height;
  const s  = task.slice;
  const midCol = task.midCol ?? (s + Math.floor((cw - 2 * s) / 2));
  const midRow = task.midRow ?? (s + Math.floor((ch - 2 * s) / 2));

  const buildAxis = (slicePx: number, total: number, mid: number): number[] => {
    const a: number[] = [];
    for (let i = 0; i < slicePx; i++) a.push(i);
    a.push(mid);
    for (let i = slicePx - 1; i >= 0; i--) a.push(total - 1 - i);
    return a;
  };

  const cols = buildAxis(s, cw, midCol);
  const rows = buildAxis(s, ch, midRow);
  const outSize = s * 2 + 1;
  const outData = new Uint8Array(outSize * outSize * 4);

  for (let oy = 0; oy < rows.length; oy++) {
    for (let ox = 0; ox < cols.length; ox++) {
      const si = (rows[oy] * imgW + cols[ox]) * 4;
      const di = (oy * outSize + ox) * 4;
      outData[di]     = data[si];
      outData[di + 1] = data[si + 1];
      outData[di + 2] = data[si + 2];
      outData[di + 3] = data[si + 3];
    }
  }
  return { data: Buffer.from(outData), width: outSize, height: outSize };
}

function crop(src: RawImage, x: number, y: number, w: number, h: number): RawImage {
  const outData = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const si = ((y + row) * src.width + (x + col)) * 4;
      const di = (row * w + col) * 4;
      outData[di]     = src.data[si];
      outData[di + 1] = src.data[si + 1];
      outData[di + 2] = src.data[si + 2];
      outData[di + 3] = src.data[si + 3];
    }
  }
  return { data: Buffer.from(outData), width: w, height: h };
}

function save(name: string, img: RawImage): void {
  fs.writeFileSync(path.join(OUT_DIR, name), encodePng(img));
  console.log(`  wrote ${name}`);
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── 9-slice textures (button, slider, panel, nested tabs) ────────────────
  const TASKS_9SLICE: SliceTask[] = [
    { name: "mc_button_normal.png",       path: "assets/minecraft/textures/gui/sprites/widget/button.png",             slice: 2 },
    { name: "mc_button_hover.png",        path: "assets/minecraft/textures/gui/sprites/widget/button_highlighted.png", slice: 2 },
    { name: "mc_slider_track_slice.png",  path: "assets/minecraft/textures/gui/sprites/widget/slider.png",             slice: 2 },
    { name: "mc_slider_handle_slice.png", path: "assets/minecraft/textures/gui/sprites/widget/slider_handle.png",      slice: 2 },
    { name: "mc_panel_slice.png",         path: "assets/minecraft/textures/gui/container/inventory.png",               slice: 3, contentW: 176, contentH: 166, midCol: 88, midRow: 10 },
    { name: "widget_tab_selected.png",    path: "assets/minecraft/textures/gui/sprites/widget/tab_selected.png",       slice: 3 },
    { name: "widget_tab_unselected.png",  path: "assets/minecraft/textures/gui/sprites/widget/tab.png",                slice: 3 },
  ];
  for (const task of TASKS_9SLICE) {
    const src = await fetchPng(task.path);
    if (src) save(task.name, sample9slice(src, task));
    else console.warn(`  MISSING ${task.name}`);
  }

  // ── As-is sprites (checkboxes, advancements tabs) ────────────────────────
  const AS_IS = [
    { name: "mc_checkbox.png",                      path: "assets/minecraft/textures/gui/sprites/widget/checkbox.png" },
    { name: "mc_checkbox_selected.png",              path: "assets/minecraft/textures/gui/sprites/widget/checkbox_selected.png" },
    { name: "mc_checkbox_highlighted.png",           path: "assets/minecraft/textures/gui/sprites/widget/checkbox_highlighted.png" },
    { name: "mc_checkbox_selected_highlighted.png",  path: "assets/minecraft/textures/gui/sprites/widget/checkbox_selected_highlighted.png" },
    { name: "tab_selected_left.png",    path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_left_selected.png" },
    { name: "tab_selected_middle.png",  path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_middle_selected.png" },
    { name: "tab_selected_right.png",   path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_right_selected.png" },
    { name: "tab_unselected_left.png",   path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_left.png" },
    { name: "tab_unselected_middle.png", path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_middle.png" },
    { name: "tab_unselected_right.png",  path: "assets/minecraft/textures/gui/sprites/advancements/tab_above_right.png" },
  ];
  for (const { name, path: assetPath } of AS_IS) {
    const src = await fetchPng(assetPath);
    if (src) save(name, src);
    else console.warn(`  MISSING ${name}`);
  }

  // ── Slot tile (dedicated sprite preferred, atlas crop fallback) ───────────
  const slotSrc = await fetchPng("assets/minecraft/textures/gui/sprites/container/slot.png");
  if (slotSrc) {
    save("mc_slot_tile.png", slotSrc);
  } else {
    const inv = await fetchPng("assets/minecraft/textures/gui/container/inventory.png");
    if (inv) save("mc_slot_tile.png", crop(inv, 7, 83, 18, 18));
    else console.warn("  MISSING mc_slot_tile.png");
  }

  // ── Scrollbar handle (dedicated sprite preferred, atlas crop fallback) ────
  const scrollSrc = await fetchPng("assets/minecraft/textures/gui/sprites/container/creative_inventory/scroller.png");
  if (scrollSrc) {
    save("mc_scrollbar_handle.png", scrollSrc);
  } else {
    const tabs = await fetchPng("assets/minecraft/textures/gui/container/creative_inventory/tabs.png");
    if (tabs) save("mc_scrollbar_handle.png", crop(tabs, 232, 0, 12, 15));
    else console.warn("  MISSING mc_scrollbar_handle.png");
  }

  console.log("Done — textures in tests/fixtures/real-textures/");
}

main().catch((err) => { console.error(err); process.exit(1); });
