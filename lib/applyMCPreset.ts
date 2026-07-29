import { saveTexture } from "./textureStore";

// Zone colors baked into our placeholder sprites by scripts/generateTextures.js.
// Each [r,g,b] is unique so we can do exact-match swaps.
const ZONES: Record<string, [number, number, number]> = {
  OUTER_BORDER: [255, 0,   255], // magenta
  INNER_LIGHT:  [255, 255, 0  ], // yellow
  INNER_DARK:   [255, 136, 0  ], // orange
  FILL:         [0,   255, 136], // mint
  // hover-only zones
  HOVER_BORDER: [255, 64,  0  ], // burnt orange
  HOVER_FILL:   [255, 200, 0  ], // golden
  // slider track zones
  TRACK_BORDER: [0,   220, 255], // cyan
  TRACK_FILL:   [0,   80,  120], // dark teal
};

// MC vanilla palette — measured from the rendered widget colors (plain RGB
// values, not copied pixel art) so the recolor matches the real look.
const MC = {
  border:           [0,   0,   0  ] as [number,number,number], // pure black outer edge
  panelHighlight:   [255, 255, 255] as [number,number,number], // white bevel on panel inner edge
  buttonHighlight:  [170, 170, 170] as [number,number,number], // light grey bevel on buttons/handle
  panelFill:        [198, 198, 198] as [number,number,number], // #C6C6C6 panel background
  panelShadow:      [85,  85,  85 ] as [number,number,number], // #555 panel bottom-right bevel
  buttonFill:       [112, 112, 112] as [number,number,number], // medium grey button face
  buttonShadow:     [86,  86,  86 ] as [number,number,number], // button bottom-right bevel
  hoverBorder:      [255, 255, 255] as [number,number,number], // white outline on hover
  hoverHighlight:   [175, 175, 175] as [number,number,number],
  hoverFill:        [117, 117, 117] as [number,number,number],
  hoverShadow:      [92,  92,  92 ] as [number,number,number],
  trackFill:        [43,  43,  43 ] as [number,number,number], // dark recessed slider track
  handleFill:       [109, 109, 109] as [number,number,number], // same tone as button face
};

// Per-texture swap tables: zone name → target [r,g,b]
const SWAPS: Record<string, Array<{ from: [number,number,number]; to: [number,number,number] }>> = {
  "mc_panel_slice.png": [
    { from: ZONES.OUTER_BORDER, to: MC.border          },
    { from: ZONES.INNER_LIGHT,  to: MC.panelHighlight  },
    { from: ZONES.INNER_DARK,   to: MC.panelShadow     },
    { from: ZONES.FILL,         to: MC.panelFill       },
  ],
  "mc_button_normal.png": [
    { from: ZONES.OUTER_BORDER, to: MC.border          },
    { from: ZONES.INNER_LIGHT,  to: MC.buttonHighlight },
    { from: ZONES.INNER_DARK,   to: MC.buttonShadow    },
    { from: ZONES.FILL,         to: MC.buttonFill      },
  ],
  "mc_button_hover.png": [
    { from: ZONES.HOVER_BORDER, to: MC.hoverBorder     },
    { from: ZONES.INNER_LIGHT,  to: MC.hoverHighlight  },
    { from: ZONES.INNER_DARK,   to: MC.hoverShadow     },
    { from: ZONES.HOVER_FILL,   to: MC.hoverFill       },
  ],
  "mc_slider_track_slice.png": [
    { from: ZONES.TRACK_BORDER, to: MC.border    },
    { from: ZONES.TRACK_FILL,   to: MC.trackFill },
  ],
  "mc_slider_handle_slice.png": [
    { from: ZONES.OUTER_BORDER, to: MC.border          },
    { from: ZONES.INNER_LIGHT,  to: MC.buttonHighlight },
    { from: ZONES.INNER_DARK,   to: MC.buttonShadow    },
    { from: ZONES.FILL,         to: MC.handleFill      },
  ],
};

function matchColor(r: number, g: number, b: number, zone: [number, number, number]) {
  return r === zone[0] && g === zone[1] && b === zone[2];
}

async function recolor(name: string): Promise<Blob> {
  const swaps = SWAPS[name];
  if (!swaps) throw new Error(`No swap table for ${name}`);

  // Load the bundled placeholder
  const res = await fetch(`/textures/${name}`);
  const bitmap = await createImageBitmap(await res.blob());

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a === 0) continue; // keep transparent pixels
    for (const { from, to } of swaps) {
      if (matchColor(r, g, b, from)) {
        d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2];
        break;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), "image/png")
  );
}

export async function applyMCPreset(): Promise<void> {
  const names = Object.keys(SWAPS);
  await Promise.all(
    names.map(async (name) => {
      const blob = await recolor(name);
      await saveTexture(name, blob);
    })
  );
}
