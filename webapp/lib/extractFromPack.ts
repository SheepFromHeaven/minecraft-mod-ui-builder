import JSZip from "jszip";
import { saveTexture } from "./textureStore";

interface Task9Slice {
  name: string;
  path: string;
  slice: number;
  contentW?: number;
  contentH?: number;
  midCol?: number;
  midRow?: number;
}

interface TaskCrop {
  name: string;
  path: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Mirrors the TASKS list in scripts/extractMCTextures.py
const TASKS_9SLICE: Task9Slice[] = [
  {
    name: "mc_button_normal.png",
    path: "assets/minecraft/textures/gui/sprites/widget/button.png",
    slice: 2,
  },
  {
    name: "mc_button_hover.png",
    path: "assets/minecraft/textures/gui/sprites/widget/button_highlighted.png",
    slice: 2,
  },
  {
    name: "mc_slider_track_slice.png",
    path: "assets/minecraft/textures/gui/sprites/widget/slider.png",
    slice: 2,
  },
  {
    name: "mc_slider_handle_slice.png",
    path: "assets/minecraft/textures/gui/sprites/widget/slider_handle.png",
    slice: 2,
  },
  {
    name: "mc_panel_slice.png",
    path: "assets/minecraft/textures/gui/container/inventory.png",
    slice: 3,
    contentW: 176,
    contentH: 166,
    midCol: 88,
    midRow: 10,
  },
];

// Checkbox sprites (20×20, used as-is — no processing needed)
const CHECKBOX_SPRITES: { name: string; path: string }[] = [
  { name: "mc_checkbox.png",                    path: "assets/minecraft/textures/gui/sprites/widget/checkbox.png" },
  { name: "mc_checkbox_selected.png",            path: "assets/minecraft/textures/gui/sprites/widget/checkbox_selected.png" },
  { name: "mc_checkbox_highlighted.png",         path: "assets/minecraft/textures/gui/sprites/widget/checkbox_highlighted.png" },
  { name: "mc_checkbox_selected_highlighted.png",path: "assets/minecraft/textures/gui/sprites/widget/checkbox_selected_highlighted.png" },
];

// Tab sprites from the creative-inventory sprite sheet (26×32, used as-is)
const TAB_SPRITES: { name: string; path: string }[] = [
  { name: "tab_top_selected_1.png",   path: "assets/minecraft/textures/gui/sprites/container/creative_inventory/tab_top_selected_1.png" },
  { name: "tab_top_selected_2.png",   path: "assets/minecraft/textures/gui/sprites/container/creative_inventory/tab_top_selected_2.png" },
  { name: "tab_top_selected_7.png",   path: "assets/minecraft/textures/gui/sprites/container/creative_inventory/tab_top_selected_7.png" },
  { name: "tab_top_unselected_1.png", path: "assets/minecraft/textures/gui/sprites/container/creative_inventory/tab_top_unselected_1.png" },
];

// Slot tile: try dedicated sprite first (1.20.2+ individual sprites), then crop
// from the inventory atlas at the well-known first-slot position.
const SLOT_SPRITE_PATH = "assets/minecraft/textures/gui/sprites/container/slot.png";
const SLOT_CROP: TaskCrop = {
  name: "mc_slot_tile.png",
  path: "assets/minecraft/textures/gui/container/inventory.png",
  // First player-inventory row starts at x=8, y=84 in the 176×166 atlas.
  x: 8,
  y: 84,
  w: 18,
  h: 18,
};

// Scrollbar handle: the creative-inventory scroller sprite (12×15, used as-is).
// Introduced as an individual sprite in 1.20.2.
const SCROLLBAR_PATHS = [
  "assets/minecraft/textures/gui/sprites/container/creative_inventory/scroller.png",
  // Fallback: older resource packs may still have it inside the tabs atlas.
  // In that atlas the scroller sits at x=232, y=0 in a 256×256 sheet.
  // We treat the atlas crop as a last resort below.
];

export interface ExtractResult {
  extracted: string[];
  missing: string[];
}

/**
 * Reads a file entry from the ZIP as an ImageBitmap.
 * Returns null if the entry doesn't exist.
 */
async function readBitmap(zip: JSZip, path: string): Promise<ImageBitmap | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  const buf = await entry.async("arraybuffer");
  return createImageBitmap(new Blob([buf], { type: "image/png" }));
}

/**
 * Port of scripts/extractMCTextures.py sample_9slice().
 * Samples corner pixels + one centre pixel from each axis and writes them
 * into a compact (slicePx*2+1)² sprite suitable for CSS border-image.
 */
function sample9slice(
  srcData: ImageData,
  imgW: number,
  task: Task9Slice
): ImageData {
  const cw = task.contentW ?? imgW;
  const ch = task.contentH ?? srcData.height;
  const s = task.slice;

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

  const out = new ImageData(outSize, outSize);
  for (let oy = 0; oy < rows.length; oy++) {
    for (let ox = 0; ox < cols.length; ox++) {
      const si = (rows[oy] * imgW + cols[ox]) * 4;
      const di = (oy * outSize + ox) * 4;
      out.data[di]     = srcData.data[si];
      out.data[di + 1] = srcData.data[si + 1];
      out.data[di + 2] = srcData.data[si + 2];
      out.data[di + 3] = srcData.data[si + 3];
    }
  }
  return out;
}

function bitmapToImageData(bitmap: ImageBitmap): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

function imageDataToBlob(data: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(data, 0, 0);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
}

function cropImageData(src: ImageData, x: number, y: number, w: number, h: number): ImageData {
  const out = new ImageData(w, h);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const si = ((y + row) * src.width + (x + col)) * 4;
      const di = (row * w + col) * 4;
      out.data[di]     = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

/**
 * Load a JAR or resource pack ZIP (as an ArrayBuffer), extract the known
 * GUI sprites, and persist them to IndexedDB.
 *
 * Returns which texture names were successfully extracted vs not found.
 */
export async function extractFromPack(buffer: ArrayBuffer): Promise<ExtractResult> {
  const zip = await JSZip.loadAsync(buffer);

  const extracted: string[] = [];
  const missing: string[] = [];

  // --- 9-slice textures ---
  for (const task of TASKS_9SLICE) {
    const bitmap = await readBitmap(zip, task.path);
    if (!bitmap) {
      missing.push(task.name);
      continue;
    }
    const srcData = bitmapToImageData(bitmap);
    const bitmapWidth = bitmap.width;
    bitmap.close();
    const sliced = sample9slice(srcData, bitmapWidth, task);
    const blob = await imageDataToBlob(sliced);
    await saveTexture(task.name, blob);
    extracted.push(task.name);
  }

  // --- Checkbox + tab sprites: direct copy ---
  for (const { name, path } of [...CHECKBOX_SPRITES, ...TAB_SPRITES]) {
    const bitmap = await readBitmap(zip, path);
    if (bitmap) {
      const blob = await imageDataToBlob(bitmapToImageData(bitmap));
      bitmap.close();
      await saveTexture(name, blob);
      extracted.push(name);
    } else {
      missing.push(name);
    }
  }

  // --- Slot tile: try individual sprite, then crop from inventory atlas ---
  const slotBitmap = await readBitmap(zip, SLOT_SPRITE_PATH);
  if (slotBitmap) {
    const blob = await imageDataToBlob(bitmapToImageData(slotBitmap));
    slotBitmap.close();
    await saveTexture("mc_slot_tile.png", blob);
    extracted.push("mc_slot_tile.png");
  } else {
    const inventoryBitmap = await readBitmap(zip, SLOT_CROP.path);
    if (inventoryBitmap) {
      const srcData = bitmapToImageData(inventoryBitmap);
      inventoryBitmap.close();
      const cropped = cropImageData(srcData, SLOT_CROP.x, SLOT_CROP.y, SLOT_CROP.w, SLOT_CROP.h);
      const blob = await imageDataToBlob(cropped);
      await saveTexture("mc_slot_tile.png", blob);
      extracted.push("mc_slot_tile.png");
    } else {
      missing.push("mc_slot_tile.png");
    }
  }

  // --- Scrollbar handle: creative-inventory scroller sprite ---
  let scrollbarSaved = false;
  for (const path of SCROLLBAR_PATHS) {
    const bitmap = await readBitmap(zip, path);
    if (bitmap) {
      const blob = await imageDataToBlob(bitmapToImageData(bitmap));
      bitmap.close();
      await saveTexture("mc_scrollbar_handle.png", blob);
      extracted.push("mc_scrollbar_handle.png");
      scrollbarSaved = true;
      break;
    }
  }
  // Last resort: crop from the pre-1.20.2 creative-inventory tabs atlas.
  // The scroller sits at x=232, y=0 in the 256×256 sheet.
  if (!scrollbarSaved) {
    const tabsBitmap = await readBitmap(
      zip,
      "assets/minecraft/textures/gui/container/creative_inventory/tabs.png"
    );
    if (tabsBitmap) {
      const srcData = bitmapToImageData(tabsBitmap);
      tabsBitmap.close();
      const cropped = cropImageData(srcData, 232, 0, 12, 15);
      const blob = await imageDataToBlob(cropped);
      await saveTexture("mc_scrollbar_handle.png", blob);
      extracted.push("mc_scrollbar_handle.png");
      scrollbarSaved = true;
    }
  }
  if (!scrollbarSaved) missing.push("mc_scrollbar_handle.png");

  // --- Store raw pack textures (gui + item) for use as widget sources ---
  const packRe = /^assets\/[^/]+\/textures\/.+\.png$/;
  const packFiles = Object.keys(zip.files).filter(p => packRe.test(p) && !zip.files[p].dir);
  for (const path of packFiles) {
    const entry = zip.files[path];
    const buf = await entry.async("arraybuffer");
    const blob = new Blob([buf], { type: "image/png" });
    // Key: strip "assets/<namespace>/textures/" prefix → e.g. "gui/sprites/widget/button.png"
    const key = path.replace(/^assets\/[^/]+\/textures\//, "pack:");
    await saveTexture(key, blob);
  }

  return { extracted, missing };
}
