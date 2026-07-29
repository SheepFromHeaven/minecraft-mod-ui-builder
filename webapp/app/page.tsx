"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Canvas from "@/components/Canvas";
import PropertyPanel from "@/components/PropertyPanel";
import Palette from "@/components/Palette";
import Toolbar from "@/components/Toolbar";
import WelcomeScreen from "@/components/WelcomeScreen";
import { TextureProvider, useTextures } from "@/lib/TextureContext";
import { applyMCPreset } from "@/lib/applyMCPreset";
import TextureDebug from "@/components/TextureDebug";
import type { ScreenSpec, WidgetSpec } from "@/lib/types";
import { getWidgetDef } from "@/lib/widgetRegistry";

let idCounter = 1000;
function newId(type: string) {
  return `${type}_${++idCounter}`;
}

const MAX_HISTORY = 100;
const STORAGE_KEY = "mc-ui-builder-session";

interface SavedSession {
  history: ScreenSpec[];
  cursor: number;
  gridSize: number;
  showGrid: boolean;
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedSession;
      if (Array.isArray(parsed.history) && parsed.history.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

const EMPTY_SESSION: SavedSession = { history: [], cursor: 0, gridSize: 4, showGrid: true };

function syncIdCounter(history: ScreenSpec[]) {
  for (const screen of history) {
    for (const w of screen.widgets) {
      const n = parseInt(w.id.split("_").pop() ?? "0", 10);
      if (n > idCounter) idCounter = n;
    }
  }
}

export default function EditorPage() {
  return (
    <TextureProvider>
      <Editor />
    </TextureProvider>
  );
}

function Editor() {
  const { reload, reset } = useTextures();
  const [showTextureDebug, setShowTextureDebug] = useState(false);
  const [view, setView] = useState<"welcome" | "editor">(() => {
    if (typeof window === "undefined") return "welcome";
    return loadSession() !== null ? "editor" : "welcome";
  });

  const handleLoadPreset = async () => {
    await applyMCPreset();
    await reload();
  };

  const handleResetTextures = async () => {
    await reset();
  };
  const handleCreateProject = useCallback((modId: string, screenId: string) => {
    const emptyScreen: ScreenSpec = { id: screenId, modId, width: 176, height: 166, widgets: [] };
    const session = { history: [emptyScreen], cursor: 0, gridSize: 4, showGrid: true, scale: 3 };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* ignore */ }
    setHistory([emptyScreen]);
    setCursor(0);
    setView("editor");
  }, []);

  // undo/redo history — present is history[cursor]
  const [history, setHistory] = useState<ScreenSpec[]>(() => {
    const s = loadSession() ?? EMPTY_SESSION;
    syncIdCounter(s.history);
    return s.history;
  });
  const [cursor, setCursor] = useState(() => (loadSession() ?? EMPTY_SESSION).cursor);
  const screen = history[cursor];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(() => (loadSession() ?? EMPTY_SESSION).gridSize);
  const [showGrid, setShowGrid] = useState(() => (loadSession() ?? EMPTY_SESSION).showGrid);
  const [scale, setScale] = useState(() => ((loadSession() ?? EMPTY_SESSION) as SavedSession & { scale?: number }).scale ?? 3);
  const [tryMode, setTryMode] = useState(false);
  const canvasWrapperRef = useRef<HTMLElement>(null);

  const zoomIn  = useCallback(() => setScale((s) => Math.min(s + 1, 8)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 1, 1)), []);
  const zoomReset = useCallback(() => setScale(3), []);

  // Persist session whenever history, cursor, or preferences change
  useEffect(() => {
    try {
      const session = { history, cursor, gridSize, showGrid, scale };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch { /* quota exceeded or SSR */ }
  }, [history, cursor, gridSize, showGrid, scale]);

  // Ctrl+scroll to zoom — needs non-passive listener so we can preventDefault
  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) setScale((s) => Math.min(s + 1, 8));
      else               setScale((s) => Math.max(s - 1, 1));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);
  const clipboardRef = useRef<WidgetSpec | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedWidget = screen.widgets.find((w) => w.id === selectedId) ?? null;

  // push a new screen state, discarding any redo tail
  const commit = useCallback((next: ScreenSpec) => {
    setHistory((h) => {
      const trimmed = h.slice(0, cursor + 1);
      const capped = trimmed.length >= MAX_HISTORY ? trimmed.slice(1) : trimmed;
      return [...capped, next];
    });
    setCursor((c) => Math.min(c + 1, MAX_HISTORY - 1));
  }, [cursor]);

  const undo = useCallback(() => {
    setCursor((c) => Math.max(0, c - 1));
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    setCursor((c) => Math.min(history.length - 1, c + 1));
    setSelectedId(null);
  }, [history.length]);

  const updateWidget = useCallback((updated: WidgetSpec) => {
    commit({ ...screen, widgets: screen.widgets.map((w) => (w.id === updated.id ? updated : w)) });
    if (updated.id !== selectedId) setSelectedId(updated.id);
  }, [screen, commit, selectedId]);

  const deleteWidget = useCallback((id = selectedId) => {
    if (!id) return;
    commit({ ...screen, widgets: screen.widgets.filter((w) => w.id !== id) });
    setSelectedId(null);
  }, [screen, commit, selectedId]);

  const addWidget = useCallback((type: string) => {
    const def = getWidgetDef(type);
    if (!def) return;
    const id = newId(type);
    const widget: WidgetSpec = { ...def.defaultWidget, id };
    commit({ ...screen, widgets: [...screen.widgets, widget] });
    setSelectedId(id);
  }, [screen, commit]);

  const copyWidget = useCallback(() => {
    if (selectedWidget) clipboardRef.current = selectedWidget;
  }, [selectedWidget]);

  const pasteWidget = useCallback(() => {
    const src = clipboardRef.current;
    if (!src) return;
    const id = newId(src.type);
    const pasted: WidgetSpec = { ...src, id, x: src.x + 8, y: src.y + 8 };
    commit({ ...screen, widgets: [...screen.widgets, pasted] });
    setSelectedId(id);
  }, [screen, commit]);

  const duplicateWidget = useCallback(() => {
    if (!selectedWidget) return;
    const id = newId(selectedWidget.type);
    const dup: WidgetSpec = { ...selectedWidget, id, x: selectedWidget.x + 8, y: selectedWidget.y + 8 };
    commit({ ...screen, widgets: [...screen.widgets, dup] });
    setSelectedId(id);
  }, [screen, commit, selectedWidget]);

  const nudgeWidget = useCallback((dx: number, dy: number) => {
    if (!selectedWidget) return;
    updateWidget({ ...selectedWidget, x: selectedWidget.x + dx, y: selectedWidget.y + dy });
  }, [selectedWidget, updateWidget]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inInput) return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomIn(); return; }
      if (mod && e.key === "-") { e.preventDefault(); zoomOut(); return; }
      if (mod && e.key === "0") { e.preventDefault(); zoomReset(); return; }

      if (mod && e.key === "c") { e.preventDefault(); copyWidget(); return; }
      if (mod && e.key === "v") { e.preventDefault(); pasteWidget(); return; }
      if (mod && e.key === "d") { e.preventDefault(); duplicateWidget(); return; }

      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteWidget(); return; }
      if (e.key === "Escape") { if (tryMode) setTryMode(false); else setSelectedId(null); return; }
      if (e.key === "t" || e.key === "T") { setTryMode((v) => { if (!v) setSelectedId(null); return !v; }); return; }

      // arrow nudge — 1px normally, gridSize with shift
      const step = e.shiftKey ? gridSize : 1;
      if (e.key === "ArrowLeft")  { e.preventDefault(); nudgeWidget(-step, 0); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); nudgeWidget(step, 0);  return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); nudgeWidget(0, -step); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); nudgeWidget(0, step);  return; }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, copyWidget, pasteWidget, duplicateWidget, deleteWidget, nudgeWidget, gridSize, tryMode, zoomIn, zoomOut, zoomReset]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(screen, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${screen.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [screen]);

  const handleImportClick = () => importRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as ScreenSpec;
        if (!parsed.id || !Array.isArray(parsed.widgets)) throw new Error("Invalid ScreenSpec");
        commit(parsed);
        setSelectedId(null);
      } catch {
        alert("Failed to parse ScreenSpec JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (view === "welcome") {
    return <WelcomeScreen onCreateProject={handleCreateProject} />;
  }

  return (
    <>
    {showTextureDebug && <TextureDebug onClose={() => setShowTextureDebug(false)} />}
    <div className="flex flex-col h-full min-h-screen bg-gray-200">
      <Toolbar
        screen={screen}
        gridSize={gridSize}
        showGrid={showGrid}
        canUndo={cursor > 0}
        canRedo={cursor < history.length - 1}
        tryMode={tryMode}
        onUndo={undo}
        onRedo={redo}
        onGridSizeChange={setGridSize}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleTryMode={() => { setTryMode((v) => { if (!v) setSelectedId(null); return !v; }); }}
        onScreenChange={(patch) => commit({ ...screen, ...patch })}
        onExport={handleExport}
        onImport={handleImportClick}
        onLoadPreset={handleLoadPreset}
        onResetTextures={handleResetTextures}
        onViewTextures={() => setShowTextureDebug(true)}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
      />

      <div className="flex flex-1 overflow-hidden">
        {!tryMode && (
          <aside className="w-36 shrink-0 border-r border-gray-300 bg-white overflow-y-auto">
            <Palette onAdd={addWidget} />
          </aside>
        )}

        <main ref={canvasWrapperRef} className="flex flex-1 items-start justify-center overflow-auto p-8">
          <Canvas
            width={screen.width}
            height={screen.height}
            scale={scale}
            widgets={screen.widgets}
            selectedId={selectedId}
            gridSize={gridSize}
            showGrid={showGrid}
            tryMode={tryMode}
            onSelect={setSelectedId}
            onUpdateWidget={updateWidget}
          />
        </main>

        {!tryMode && (
          <aside className="w-48 shrink-0 border-l border-gray-300 bg-white overflow-y-auto">
            <PropertyPanel
              widget={selectedWidget}
              onUpdate={updateWidget}
              onDelete={() => deleteWidget()}
            />
          </aside>
        )}
      </div>

      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
    </>
  );
}
