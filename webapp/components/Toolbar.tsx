"use client";

import type { ScreenSpec } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PanelLeft } from "lucide-react";
import SettingsDialog from "@/components/SettingsDialog";

interface Props {
  screen: ScreenSpec;
  gridSize: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  tryMode: boolean;
  sidebarOpen: boolean;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onGridSizeChange: (v: number) => void;
  onToggleGrid: () => void;
  onToggleTryMode: () => void;
  onToggleSidebar: () => void;
  onScreenChange: (patch: Partial<ScreenSpec>) => void;
  onExport: () => void;
  onImport: () => void;
  onLoadPreset: () => Promise<void>;
  onResetTextures: () => Promise<void>;
  onViewTextures: () => void;
  onGoHome: () => void;
}

export default function Toolbar({
  screen, gridSize, showGrid, canUndo, canRedo, tryMode, sidebarOpen,
  onUndo, onRedo, onGridSizeChange, onToggleGrid, onToggleTryMode, onToggleSidebar,
  onScreenChange, onExport, onImport, onLoadPreset, onResetTextures, onViewTextures,
  scale, onZoomIn, onZoomOut, onZoomReset, onGoHome,
}: Props) {
  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 flex-wrap shrink-0">
      <Button variant="ghost" size="sm" className="h-8" onClick={onGoHome} title="Back to projects">
        ← Projects
      </Button>

      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={onToggleSidebar} title="Toggle sidebar">
        <PanelLeft className="h-5 w-5" />
      </Button>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          W:
          <Input
            className="h-8 w-16"
            type="number"
            value={screen.width}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) onScreenChange({ width: v }); }}
          />
        </label>
        <label className="flex items-center gap-1.5 text-muted-foreground">
          H:
          <Input
            className="h-8 w-16"
            type="number"
            value={screen.height}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) onScreenChange({ height: v }); }}
          />
        </label>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={showGrid} onChange={onToggleGrid} className="h-4 w-4" />
        Grid
      </label>

      <label className="flex items-center gap-1.5 text-muted-foreground">
        Snap:
        <Select value={String(gridSize)} onValueChange={(v) => { if (v) onGridSizeChange(parseInt(v)); }}>
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 4, 8].map((v) => (
              <SelectItem key={v} value={String(v)}>{v}px</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <Separator orientation="vertical" className="h-5" />

      <Button variant="outline" size="sm" className="h-8" onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)">↩ Undo</Button>
      <Button variant="outline" size="sm" className="h-8" onClick={onRedo} disabled={!canRedo} title="Redo (⌘⇧Z)">↪ Redo</Button>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center">
        <Button variant="outline" size="sm" className="h-8 w-8 rounded-r-none border-r-0" onClick={onZoomOut} disabled={scale <= 1} title="Zoom out (⌘-)">−</Button>
        <Button variant="outline" size="sm" className="h-8 min-w-12 rounded-none" onClick={onZoomReset} title="Reset zoom (⌘0)">{scale}×</Button>
        <Button variant="outline" size="sm" className="h-8 w-8 rounded-l-none border-l-0" onClick={onZoomIn} disabled={scale >= 8} title="Zoom in (⌘+)">+</Button>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <Button
        size="sm"
        className="h-8"
        variant={tryMode ? "destructive" : "default"}
        onClick={onToggleTryMode}
        title="Toggle try mode (T)"
      >
        {tryMode ? "⏹ Stop" : "▶ Try"}
      </Button>

      <Separator orientation="vertical" className="h-5" />

      <Button size="sm" className="h-8" onClick={onExport}>Export JSON</Button>
      <Button size="sm" variant="outline" className="h-8" onClick={onImport}>Import JSON</Button>

      <div className="ml-auto flex items-center gap-1">
        <SettingsDialog
          screen={screen}
          onScreenChange={onScreenChange}
          onLoadPreset={onLoadPreset}
          onResetTextures={onResetTextures}
          onViewTextures={onViewTextures}
        />
      </div>
    </div>
  );
}
