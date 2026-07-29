"use client";

import { useState } from "react";
import type { ScreenSpec } from "@/lib/types";

const INPUT = "rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-400 focus:outline-none";

interface Props {
  screen: ScreenSpec;
  gridSize: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  tryMode: boolean;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onGridSizeChange: (v: number) => void;
  onToggleGrid: () => void;
  onToggleTryMode: () => void;
  onScreenChange: (patch: Partial<ScreenSpec>) => void;
  onExport: () => void;
  onImport: () => void;
  onLoadPreset: () => Promise<void>;
  onResetTextures: () => Promise<void>;
  onViewTextures: () => void;
}

export default function Toolbar({
  screen, gridSize, showGrid, canUndo, canRedo, tryMode,
  onUndo, onRedo, onGridSizeChange, onToggleGrid, onToggleTryMode,
  onScreenChange, onExport, onImport, onLoadPreset, onResetTextures, onViewTextures,
  scale, onZoomIn, onZoomOut, onZoomReset,
}: Props) {
  const [presetLoading, setPresetLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handlePreset = async () => {
    setPresetLoading(true);
    try { await onLoadPreset(); } finally { setPresetLoading(false); }
  };

  const handleReset = async () => {
    setResetLoading(true);
    try { await onResetTextures(); } finally { setResetLoading(false); }
  };

  return (
    <div className="flex items-center gap-3 border-b border-gray-300 bg-gray-100 px-3 py-2 text-xs flex-wrap shrink-0">
      <span className="font-bold text-gray-800 text-sm">MC Screen Designer</span>

      <Divider />

      <label className="flex items-center gap-1 text-gray-700">
        Screen ID:
        <input
          className={`${INPUT} w-28`}
          value={screen.id}
          onChange={(e) => onScreenChange({ id: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-1 text-gray-700">
        W:
        <input
          className={`${INPUT} w-14`}
          type="number"
          value={screen.width}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) onScreenChange({ width: v });
          }}
        />
      </label>

      <label className="flex items-center gap-1 text-gray-700">
        H:
        <input
          className={`${INPUT} w-14`}
          type="number"
          value={screen.height}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) onScreenChange({ height: v });
          }}
        />
      </label>

      <Divider />

      <label className="flex items-center gap-1 text-gray-700">
        <input type="checkbox" checked={showGrid} onChange={onToggleGrid} />
        Grid
      </label>

      <label className="flex items-center gap-1 text-gray-700">
        Snap:
        <select className={`${INPUT} w-16`} value={gridSize} onChange={(e) => onGridSizeChange(parseInt(e.target.value))}>
          {[1, 2, 4, 8].map((v) => (
            <option key={v} value={v}>{v}px</option>
          ))}
        </select>
      </label>

      <Divider />

      <button
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)"
      >↩ Undo</button>
      <button
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onRedo} disabled={!canRedo} title="Redo (⌘⇧Z)"
      >↪ Redo</button>

      <Divider />

      <div className="flex items-center gap-1">
        <button
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onZoomOut} disabled={scale <= 1} title="Zoom out (⌘-)">−</button>
        <button
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 min-w-[3rem] text-center"
          onClick={onZoomReset} title="Reset zoom (⌘0)">{scale}×</button>
        <button
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onZoomIn} disabled={scale >= 8} title="Zoom in (⌘+)">+</button>
      </div>

      <Divider />

      <button
        className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${tryMode ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-green-600 text-white hover:bg-green-700"}`}
        onClick={onToggleTryMode}
        title="Toggle try mode (T)"
      >
        {tryMode ? "⏹ Stop" : "▶ Try"}
      </button>

      <Divider />

      <button className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700" onClick={onExport}>
        Export JSON
      </button>
      <button className="rounded border border-gray-400 bg-white px-3 py-1 text-xs text-gray-800 hover:bg-gray-50" onClick={onImport}>
        Import JSON
      </button>

      <Divider />

      <button
        className="rounded border border-gray-400 bg-white px-3 py-1 text-xs text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePreset}
        disabled={presetLoading || resetLoading}
        title="Recolor placeholder textures with Minecraft's default palette and save to browser storage"
      >
        {presetLoading ? "Applying…" : "Load MC Preset"}
      </button>
      <button
        className="rounded border border-gray-400 bg-white px-3 py-1 text-xs text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleReset}
        disabled={presetLoading || resetLoading}
        title="Clear IndexedDB textures and revert to placeholder sprites"
      >
        {resetLoading ? "Resetting…" : "Reset Textures"}
      </button>
      <button
        className="rounded border border-gray-400 bg-white px-3 py-1 text-xs text-gray-800 hover:bg-gray-50"
        onClick={onViewTextures}
        title="Inspect active textures from IndexedDB"
      >
        View Textures
      </button>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-gray-300" />;
}
