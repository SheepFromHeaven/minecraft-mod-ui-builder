import React from "react";

// Shared by try-mode components (Canvas.tsx's TryWidget/TryWidgetRoot and the
// per-widget Try components, e.g. scrollbar/ScrollbarTry.tsx,
// inventory_area/InventoryAreaTry.tsx) so they can reach textures and
// scroll-position state without prop drilling through the whole tree.

// tiny context bridge so try-mode components can reach textures without prop drilling
export const TextureCtx = React.createContext<{ textures: Record<string, string> }>({ textures: {} });

export interface ScrollPos { x: number; y: number }
export interface ScrollCtxVal {
  getScroll:    (id: string) => ScrollPos;
  setScroll:    (id: string, pos: ScrollPos) => void;
  getMaxScroll: (id: string) => ScrollPos;
  setMaxScroll: (id: string, max: ScrollPos) => void;
}
export const ScrollCtx = React.createContext<ScrollCtxVal>({
  getScroll:    () => ({ x: 0, y: 0 }),
  setScroll:    () => undefined,
  getMaxScroll: () => ({ x: 0, y: 0 }),
  setMaxScroll: () => undefined,
});
