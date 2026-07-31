"use client";

import { Download, Upload, BookOpen } from "lucide-react";
import Link from "next/link";
import type { ScreenSpec, BindingsSchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SettingsDialog from "@/components/SettingsDialog";
import BindingsModal from "@/components/BindingsModal";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
  onResetTextures: () => Promise<void>;
  onViewTextures: () => void;
  onExtractPack: (file: File) => Promise<{ extracted: string[]; missing: string[] }>;
  onSaveToTestMod?: () => Promise<void>;
  bindingsSchema: BindingsSchema;
  onUpdateBindingsSchema: (schema: BindingsSchema) => void;
  actions: string[];
  onUpdateActions: (actions: string[]) => void;
  modId?: string;
}

export default function Toolbar({
  screen, gridSize, showGrid, canUndo, canRedo, tryMode,
  onUndo, onRedo, onGridSizeChange, onToggleGrid, onToggleTryMode,
  onScreenChange, onExport, onImport, onResetTextures, onViewTextures, onExtractPack,
  scale, onZoomIn, onZoomOut, onZoomReset, onSaveToTestMod,
  bindingsSchema, onUpdateBindingsSchema, actions, onUpdateActions, modId,
}: Props) {
  const SNAP_STEPS = [1, 2, 4, 8];
  const snapIdx = SNAP_STEPS.indexOf(gridSize);
  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 flex-wrap shrink-0">
      <SidebarTrigger className="h-8 w-8" />

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

      <div className="flex items-center gap-1.5 text-muted-foreground">
        Snap:
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="h-8 w-8 rounded-r-none border-r-0" onClick={() => onGridSizeChange(SNAP_STEPS[snapIdx - 1])} disabled={snapIdx <= 0}>−</Button>
          <Button variant="outline" size="sm" className="h-8 min-w-14 rounded-none" onClick={() => onGridSizeChange(1)} title="Reset snap">{gridSize}px</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 rounded-l-none border-l-0" onClick={() => onGridSizeChange(SNAP_STEPS[snapIdx + 1])} disabled={snapIdx >= SNAP_STEPS.length - 1}>+</Button>
        </div>
      </div>

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

      <div className="ml-auto flex items-center gap-1">
        {process.env.NODE_ENV === "development" && onSaveToTestMod && (
          <>
            <Button variant="outline" size="sm" className="h-8" onClick={onSaveToTestMod} title="Save to neoforge-runtime test_container_screen.json">
              Save to test mod
            </Button>
            <Separator orientation="vertical" className="h-5" />
          </>
        )}
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={onImport} title="Import JSON">
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={onExport} title="Export JSON">
          <Download className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <BindingsModal
          schema={bindingsSchema}
          onChangeSchema={onUpdateBindingsSchema}
          actions={actions}
          onChangeActions={onUpdateActions}
          modId={modId}
        />
        <Link href="/docs" target="_blank" title="Documentation" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <BookOpen className="h-4 w-4" />
        </Link>
        <SettingsDialog
          screen={screen}
          onScreenChange={onScreenChange}
          onResetTextures={onResetTextures}
          onViewTextures={onViewTextures}
          onExtractPack={onExtractPack}
        />
      </div>
    </div>
  );
}
