#!/usr/bin/env python3
"""
Extracts widget textures from the local Minecraft 1.21.1 jar for use as a
DEV-ONLY visual reference when tuning scripts/generateTextures.js and
lib/applyMCPreset.ts.

These are Mojang's copyrighted assets. NEVER copy this script's output into
public/ or anywhere else that gets committed or hosted — output goes to
/tmp so it cannot accidentally ship. Compare against it locally, adjust the
placeholder sprite + recolor palette to match, then discard.

Run: python3 scripts/extractMCTextures.py
"""

import subprocess, io, os, sys
from pathlib import Path
from PIL import Image

JAR = Path.home() / "Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar"
OUT = Path("/tmp/mc_reference_textures")

def extract(path):
    data = subprocess.check_output(["unzip", "-p", str(JAR), path])
    return Image.open(io.BytesIO(data)).convert("RGBA")

def sample_9slice(img, slice_px, content_w=None, content_h=None, mid_col=None, mid_row=None):
    w, h = img.size
    cw = content_w or w
    ch = content_h or h

    if mid_col is None:
        mid_col = slice_px + (cw - 2 * slice_px) // 2
    if mid_row is None:
        mid_row = slice_px + (ch - 2 * slice_px) // 2

    cols = list(range(slice_px)) + [mid_col] + [cw - 1 - i for i in range(slice_px - 1, -1, -1)]
    rows = list(range(slice_px)) + [mid_row] + [ch - 1 - i for i in range(slice_px - 1, -1, -1)]

    out_size = slice_px * 2 + 1
    out = Image.new("RGBA", (out_size, out_size))
    pixels_in = img.load()
    pixels_out = out.load()
    for oy, sy in enumerate(rows):
        for ox, sx in enumerate(cols):
            pixels_out[ox, oy] = pixels_in[sx, sy]
    return out

TASKS = [
    dict(name="mc_button_normal.png",      jar="assets/minecraft/textures/gui/sprites/widget/button.png",             slice=2),
    dict(name="mc_button_hover.png",        jar="assets/minecraft/textures/gui/sprites/widget/button_highlighted.png", slice=2),
    dict(name="mc_slider_track_slice.png",  jar="assets/minecraft/textures/gui/sprites/widget/slider.png",             slice=2),
    dict(name="mc_slider_handle_slice.png", jar="assets/minecraft/textures/gui/sprites/widget/slider_handle.png",      slice=2),
    dict(name="mc_panel_slice.png",         jar="assets/minecraft/textures/gui/container/inventory.png",               slice=3,
         content_w=176, content_h=166, mid_col=88, mid_row=10),
]

OUT.mkdir(parents=True, exist_ok=True)

for task in TASKS:
    name = task["name"]
    try:
        img = extract(task["jar"])
        print(f"  {task['jar']}  →  {img.size[0]}×{img.size[1]}")
        sprite = sample_9slice(img, task["slice"], task.get("content_w"), task.get("content_h"), task.get("mid_col"), task.get("mid_row"))
        out_path = OUT / name
        sprite.save(str(out_path), "PNG")
        print(f"✓ wrote {name} ({sprite.size[0]}×{sprite.size[1]})")
    except Exception as e:
        print(f"✗ {name}: {e}", file=sys.stderr)

print("done")
