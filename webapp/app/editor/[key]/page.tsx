"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Canvas from "@/components/Canvas";
import PropertyPanel from "@/components/PropertyPanel";
import AppSidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import { useTextures } from "@/lib/TextureContext";
import TexturePickerModal from "@/components/TexturePickerModal";
import type { ContainerSpec, ScreenSpec, WidgetSpec } from "@/lib/types";
import { generateJavaClass } from "@/lib/generateJavaClass";
import { getWidgetDef } from "@/lib/widgetRegistry";
import { SidebarProvider } from "@/components/ui/sidebar";

let idCounter = 1000;
function newId(type: string) {
  return `${type}_${++idCounter}`;
}

function resolveAbsolutePos(w: WidgetSpec, byId: Map<string, WidgetSpec>): { x: number; y: number } {
  if (!w.parentId) return { x: w.x, y: w.y };
  const parent = byId.get(w.parentId);
  if (!parent) return { x: w.x, y: w.y };
  const parentOrigin = resolveAbsolutePos(parent, byId);
  if (w.type === "tab" && parent.type === "tabs") {
    const tabHeight = parseInt(parent.props?.tab_height ?? "20", 10);
    return { x: parentOrigin.x, y: parentOrigin.y + tabHeight };
  }
  return { x: parentOrigin.x + w.x, y: parentOrigin.y + w.y };
}

function buildContainerSpec(widgets: WidgetSpec[]): ContainerSpec | undefined {
  const inventoryWidgets = widgets.filter((w) => w.type === "inventory_area");
  if (inventoryWidgets.length === 0) return undefined;

  const seen = new Set<string>();
  for (const w of inventoryWidgets) {
    if (seen.has(w.id)) {
      throw new Error(`Duplicate inventory_area id "${w.id}" — give each inventory area a unique ID before exporting.`);
    }
    seen.add(w.id);
  }

  const byId = new Map(widgets.map((w) => [w.id, w]));
  return {
    slots: inventoryWidgets.map((w) => {
      const slotSize = parseInt(w.props.slot_size ?? "18", 10);
      const abs = resolveAbsolutePos(w, byId);
      return {
        id:            w.id,
        x:             abs.x,
        y:             abs.y,
        cols:          parseInt(w.props.cols ?? "1", 10),
        slot_size:     slotSize,
        viewport_rows: Math.max(1, Math.floor(w.h / slotSize)),
        ...(w.props.source ? { source: w.props.source as "player" | "player_hotbar" } : {}),
      };
    }),
  };
}

const MAX_HISTORY = 100;
const PROJECTS_KEY = "mc-ui-builder-projects";
const LAST_PROJECT_KEY = "mc-ui-builder-last-project";

interface HistoryEntry {
  screens: ScreenSpec[];
  activeIdx: number;
}

interface SavedSession {
  history: HistoryEntry[];
  cursor: number;
  gridSize: number;
  showGrid: boolean;
  scale?: number;
}

interface StoredProject {
  key: string;
  session: SavedSession;
  updatedAt: number;
}

function migrateSession(raw: Record<string, unknown>): SavedSession {
  const hist = raw.history as unknown[];
  if (!Array.isArray(hist) || hist.length === 0) return EMPTY_SESSION;
  if ('widgets' in (hist[0] as object)) {
    return {
      ...raw,
      history: (hist as ScreenSpec[]).map(s => ({ screens: [s], activeIdx: 0 })),
    } as SavedSession;
  }
  return raw as unknown as SavedSession;
}

function normalizeScreen(s: ScreenSpec): ScreenSpec {
  return { ...s, widgets: s.widgets.map((w) => ({ ...w, props: w.props ?? {} })) };
}

function loadProjects(): StoredProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(p => ({
      ...p,
      session: migrateSession(p.session as unknown as Record<string, unknown>),
    }));
  } catch {
    return [];
  }
}

function saveProjects(projects: StoredProject[]): void {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); } catch { /* quota */ }
}

function syncIdCounter(screens: ScreenSpec[]) {
  for (const screen of screens) {
    for (const w of screen.widgets) {
      const n = parseInt(w.id.split("_").pop() ?? "0", 10);
      if (n > idCounter) idCounter = n;
    }
  }
}

const PLACEHOLDER_SCREEN: ScreenSpec = { id: "main", width: 320, height: 180, widgets: [] };
const EMPTY_SESSION: SavedSession = {
  history: [{ screens: [PLACEHOLDER_SCREEN], activeIdx: 0 }],
  cursor: 0,
  gridSize: 4,
  showGrid: true,
};

export default function EditorPage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const projectKey = params.key;

  const { reset, extractPack, initialized, ready, setupRequired, packTextures } = useTextures();
  const [showTextureDebug, setShowTextureDebug] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);

  const handleResetTextures = async () => {
    await reset();
    router.replace("/");
  };

  const [history, setHistory] = useState<HistoryEntry[]>(EMPTY_SESSION.history);
  const [cursor, setCursor] = useState(EMPTY_SESSION.cursor);
  const cursorRef = useRef(EMPTY_SESSION.cursor);
  cursorRef.current = cursor;

  const entry = history[cursor];
  const screens = entry.screens;
  const activeIdx = entry.activeIdx;
  const screen = screens[activeIdx];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState<{ ids: string[] } | null>(null);
  const [gridSize, setGridSize] = useState(EMPTY_SESSION.gridSize);
  const [showGrid, setShowGrid] = useState(EMPTY_SESSION.showGrid);
  const [scale, setScale] = useState(3);
  const [tryMode, setTryMode] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const panRef = useRef({ x: 0, y: 0 });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<WidgetSpec | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Redirect to setup if textures aren't ready after init.
  useEffect(() => {
    if (initialized && setupRequired && !ready) router.replace("/");
  }, [initialized, setupRequired, ready, router]);

  // Load project from localStorage by key.
  useEffect(() => {
    const projects = loadProjects();
    const project = projects.find(p => p.key === projectKey);
    if (!project) {
      router.replace("/");
      return;
    }
    const s = project.session;
    syncIdCounter(s.history.flatMap(e => e.screens));
    setHistory(s.history);
    setCursor(s.cursor);
    setGridSize(s.gridSize);
    setShowGrid(s.showGrid);
    if (s.scale) setScale(s.scale);
    setProjectLoaded(true);
    try { localStorage.setItem(LAST_PROJECT_KEY, projectKey); } catch { /* quota */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey]);

  // Persist session whenever state changes.
  useEffect(() => {
    if (!projectLoaded) return;
    const projects = loadProjects();
    const updated = projects.map(p =>
      p.key === projectKey
        ? { ...p, session: { history, cursor, gridSize, showGrid, scale }, updatedAt: Date.now() }
        : p
    );
    saveProjects(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, cursor, gridSize, showGrid, scale]);

  const zoomIn  = useCallback(() => setScale((s) => Math.min(s + 1, 8)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 1, 1)), []);
  const computeFit = useCallback(() => {
    const el = canvasWrapperRef.current;
    if (!el) return 3;
    const buf = 64;
    const cw = el.clientWidth  - buf * 2;
    const ch = el.clientHeight - buf * 2;
    if (cw <= 0 || ch <= 0) return 3;
    const sw = cw / ch > 16 / 9 ? ch * (16 / 9) : cw;
    const sh = cw / ch > 16 / 9 ? ch : cw * (9 / 16);
    return Math.max(1, Math.min(8, Math.floor(Math.min(sw / screen.width, sh / screen.height))));
  }, [screen.width, screen.height]);

  const zoomReset = useCallback(() => setScale(computeFit()), [computeFit]);

  const fittedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (fittedForRef.current === projectKey) return;
    fittedForRef.current = projectKey;
    const id = requestAnimationFrame(() => setScale(computeFit()));
    return () => cancelAnimationFrame(id);
  }, [projectKey, computeFit]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = canvasWrapperRef.current;
      if (!el || !el.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      setScale((s) => Math.max(1, Math.min(8, s * Math.pow(0.999, e.deltaY))));
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      const el = canvasWrapperRef.current;
      if (!el || !el.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      el.style.cursor = "grabbing";
      const startX = e.clientX, startY = e.clientY;
      const startPanX = panRef.current.x, startPanY = panRef.current.y;
      const onMove = (ev: MouseEvent) => {
        const x = startPanX + ev.clientX - startX;
        const y = startPanY + ev.clientY - startY;
        panRef.current = { x, y };
        setPanX(x);
        setPanY(y);
      };
      const onUp = () => {
        el.style.cursor = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("mousedown", onMouseDown, { capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("mousedown", onMouseDown, { capture: true });
    };
  }, []);

  const selectedWidget = screen.widgets.find((w) => w.id === selectedId) ?? null;
  const selectedIds = multiSelect && selectedId && multiSelect.ids.includes(selectedId)
    ? multiSelect.ids
    : selectedId ? [selectedId] : [];

  const selectWidgetInTree = useCallback((id: string, shiftKey: boolean) => {
    if (shiftKey && selectedId) {
      const anchor = screen.widgets.find((w) => w.id === selectedId);
      const target = screen.widgets.find((w) => w.id === id);
      if (anchor && target && anchor.parentId === target.parentId) {
        const siblings = screen.widgets.filter((w) => w.parentId === anchor.parentId);
        const i = siblings.findIndex((w) => w.id === anchor.id);
        const j = siblings.findIndex((w) => w.id === target.id);
        const [lo, hi] = i < j ? [i, j] : [j, i];
        setMultiSelect({ ids: siblings.slice(lo, hi + 1).map((w) => w.id) });
        setSelectedId(id);
        return;
      }
    }
    setMultiSelect(null);
    setSelectedId(id);
  }, [screen.widgets, selectedId]);

  const commit = useCallback((next: HistoryEntry) => {
    const c = cursorRef.current;
    cursorRef.current = Math.min(c + 1, MAX_HISTORY - 1);
    setHistory((h) => {
      const trimmed = h.slice(0, c + 1);
      const capped = trimmed.length >= MAX_HISTORY ? trimmed.slice(1) : trimmed;
      return [...capped, next];
    });
    setCursor(cursorRef.current);
  }, []);

  const commitScreen = useCallback((next: ScreenSpec) => {
    commit({ screens: screens.map((s, i) => i === activeIdx ? next : s), activeIdx });
  }, [screens, activeIdx, commit]);

  const undo = useCallback(() => { setCursor((c) => Math.max(0, c - 1)); setSelectedId(null); }, []);
  const redo = useCallback(() => { setCursor((c) => Math.min(history.length - 1, c + 1)); setSelectedId(null); }, [history.length]);

  const updateWidget = useCallback((updated: WidgetSpec) => {
    commitScreen({ ...screen, widgets: screen.widgets.map((w) => (w.id === updated.id ? updated : w)) });
    if (updated.id !== selectedId) setSelectedId(updated.id);
  }, [screen, commitScreen, selectedId]);

  const deleteWidget = useCallback((id = selectedId) => {
    if (!id) return;
    commitScreen({ ...screen, widgets: screen.widgets.filter((w) => w.id !== id) });
    setSelectedId(null);
  }, [screen, commitScreen, selectedId]);

  const addWidget = useCallback((type: string, parentId?: string, atX?: number, atY?: number) => {
    const def = getWidgetDef(type);
    if (!def) return;
    const id = newId(type);
    const pos = atX !== undefined && atY !== undefined ? { x: atX, y: atY } : {};
    const widget: WidgetSpec = { ...def.defaultWidget, id, ...pos, ...(parentId ? { parentId } : {}) };
    commitScreen({ ...screen, widgets: [...screen.widgets, widget] });
    setSelectedId(id);
  }, [screen, commitScreen]);

  const reorderWidget = useCallback((draggedIds: string[], overId: string, placement: "before" | "after" | "inside") => {
    if (draggedIds.length === 0 || draggedIds.includes(overId)) return;
    const widgets = screen.widgets;
    const draggedSet = new Set(draggedIds);
    const over = widgets.find(w => w.id === overId);
    if (!over) return;

    const absPos = (wid: string): { x: number; y: number } => {
      const w = widgets.find(v => v.id === wid);
      if (!w) return { x: 0, y: 0 };
      if (!w.parentId) return { x: w.x, y: w.y };
      const parent = absPos(w.parentId);
      return { x: parent.x + w.x, y: parent.y + w.y };
    };

    const newParentId: string | undefined = placement === "inside" ? overId : over.parentId;

    const isSelfOrDescendant = (candidate: string | undefined): boolean => {
      let cur = candidate;
      while (cur) {
        if (draggedSet.has(cur)) return true;
        cur = widgets.find(w => w.id === cur)?.parentId;
      }
      return false;
    };
    if (newParentId && isSelfOrDescendant(newParentId)) return;

    const newParentAbs = newParentId ? absPos(newParentId) : { x: 0, y: 0 };
    const without = widgets.filter(w => !draggedSet.has(w.id));
    const overIdx = without.findIndex(w => w.id === overId);
    const insertIdx = placement === "before" ? overIdx : overIdx + 1;
    const orderedDragged = widgets.filter(w => draggedSet.has(w.id));
    const updatedDragged = orderedDragged.map(w => {
      const abs = absPos(w.id);
      return { ...w, x: abs.x - newParentAbs.x, y: abs.y - newParentAbs.y, parentId: newParentId };
    });
    commitScreen({ ...screen, widgets: [...without.slice(0, insertIdx), ...updatedDragged, ...without.slice(insertIdx)] });
  }, [screen, commitScreen]);

  const updateBindingsSchema = useCallback((schema: import("@/lib/types").BindingsSchema) => {
    commitScreen({ ...screen, bindingsSchema: Object.keys(schema).length ? schema : undefined });
  }, [screen, commitScreen]);

  const updateActions = useCallback((actions: string[]) => {
    commitScreen({ ...screen, actions: actions.length ? actions : undefined });
  }, [screen, commitScreen]);

  const reparentWidget = useCallback((id: string, newParentId: string | null) => {
    const widget = screen.widgets.find(w => w.id === id);
    if (!widget) return;
    const absPos = (wid: string): { x: number; y: number } => {
      const w = screen.widgets.find(v => v.id === wid);
      if (!w) return { x: 0, y: 0 };
      if (!w.parentId) return { x: w.x, y: w.y };
      const parent = absPos(w.parentId);
      return { x: parent.x + w.x, y: parent.y + w.y };
    };
    const current = absPos(id);
    const newParentAbs = newParentId ? absPos(newParentId) : { x: 0, y: 0 };
    commitScreen({
      ...screen,
      widgets: screen.widgets.map(w =>
        w.id === id ? { ...w, x: current.x - newParentAbs.x, y: current.y - newParentAbs.y, parentId: newParentId ?? undefined } : w
      ),
    });
  }, [screen, commitScreen]);

  const copyWidget    = useCallback(() => { if (selectedWidget) clipboardRef.current = selectedWidget; }, [selectedWidget]);
  const pasteWidget   = useCallback(() => {
    const src = clipboardRef.current;
    if (!src) return;
    const id = newId(src.type);
    commitScreen({ ...screen, widgets: [...screen.widgets, { ...src, id, x: src.x + 8, y: src.y + 8 }] });
    setSelectedId(id);
  }, [screen, commitScreen]);
  const duplicateWidget = useCallback(() => {
    if (!selectedWidget) return;
    const id = newId(selectedWidget.type);
    commitScreen({ ...screen, widgets: [...screen.widgets, { ...selectedWidget, id, x: selectedWidget.x + 8, y: selectedWidget.y + 8 }] });
    setSelectedId(id);
  }, [screen, commitScreen, selectedWidget]);
  const nudgeWidget = useCallback((dx: number, dy: number) => {
    if (!selectedWidget) return;
    updateWidget({ ...selectedWidget, x: selectedWidget.x + dx, y: selectedWidget.y + dy });
  }, [selectedWidget, updateWidget]);

  const addScreen = useCallback(() => {
    const newScreen: ScreenSpec = { id: `screen_${screens.length + 1}`, modId: screen.modId, width: 320, height: 180, widgets: [] };
    commit({ screens: [...screens, newScreen], activeIdx: screens.length });
    setSelectedId(null);
  }, [screens, screen.modId, commit]);

  const removeScreen = useCallback((idx: number) => {
    if (screens.length <= 1) return;
    const next = screens.filter((_, i) => i !== idx);
    const newActiveIdx = idx < activeIdx ? activeIdx - 1 : idx === activeIdx ? Math.min(activeIdx, next.length - 1) : activeIdx;
    commit({ screens: next, activeIdx: newActiveIdx });
    setSelectedId(null);
  }, [screens, activeIdx, commit]);

  const renameScreen = useCallback((idx: number, name: string) => {
    commit({ screens: screens.map((s, i) => i === idx ? { ...s, id: name } : s), activeIdx });
  }, [screens, activeIdx, commit]);

  const switchScreen = useCallback((idx: number) => {
    setHistory(h => h.map((e, i) => i === cursor ? { ...e, activeIdx: idx } : e));
    setSelectedId(null);
  }, [cursor]);

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
    try {
      const regularWidgets = screen.widgets.filter((w) => w.type !== "inventory_area");
      const container = buildContainerSpec(screen.widgets);
      const exported = { ...screen, widgets: regularWidgets, ...(container ? { container } : {}) };
      const json = JSON.stringify(exported, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${screen.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Could not export: ${e instanceof Error ? e.message : e}`);
    }
  }, [screen]);

  const handleCopyJava = useCallback(async () => {
    try {
      const java = generateJavaClass(screen);
      await navigator.clipboard.writeText(java);
    } catch (e) {
      alert(`Could not copy: ${e instanceof Error ? e.message : e}`);
    }
  }, [screen]);

  const handleImportClick = () => importRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = normalizeScreen(JSON.parse(ev.target?.result as string) as ScreenSpec);
        if (!parsed.id || !Array.isArray(parsed.widgets)) throw new Error("Invalid ScreenSpec");
        commitScreen(parsed);
        setSelectedId(null);
      } catch {
        alert("Failed to parse ScreenSpec JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSaveToTestMod = useCallback(async () => {
    try {
      const regularWidgets = screen.widgets.filter((w) => w.type !== "inventory_area");
      const container = buildContainerSpec(screen.widgets);
      const exported = { ...screen, widgets: regularWidgets, ...(container ? { container } : {}) };
      const res = await fetch("/api/dev/test-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exported),
      });
      if (!res.ok) throw new Error("Server error");
    } catch (e) {
      alert(`Could not save to test mod: ${e instanceof Error ? e.message : e}`);
    }
  }, [screen]);

  if (!projectLoaded || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <TexturePickerModal
        open={showTextureDebug}
        packTextures={packTextures}
        current=""
        onSelect={() => {}}
        onClose={() => setShowTextureDebug(false)}
      />
      <SidebarProvider>
        {!tryMode && (
          <AppSidebar
            screens={screens}
            activeIdx={activeIdx}
            modId={screen.modId}
            widgets={screen.widgets}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onGoHome={() => router.push("/")}
            onSelectScreen={switchScreen}
            onAddScreen={addScreen}
            onRemoveScreen={removeScreen}
            onRenameScreen={renameScreen}
            onAddWidget={addWidget}
            onSelectWidget={selectWidgetInTree}
            onDeleteWidget={deleteWidget}
            onReparentWidget={reparentWidget}
            onReorderWidget={reorderWidget}
          />
        )}

        <div className="flex flex-1 flex-col overflow-hidden h-svh">
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
            onScreenChange={(patch) => commitScreen({ ...screen, ...patch })}
            onExport={handleExport}
            onImport={handleImportClick}
            onCopyJava={handleCopyJava}
            onResetTextures={handleResetTextures}
            onViewTextures={() => setShowTextureDebug(true)}
            onExtractPack={extractPack}
            onSaveToTestMod={process.env.NODE_ENV === "development" ? handleSaveToTestMod : undefined}
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomReset={zoomReset}
            bindingsSchema={screen.bindingsSchema ?? {}}
            onUpdateBindingsSchema={updateBindingsSchema}
            actions={screen.actions ?? []}
            onUpdateActions={updateActions}
            modId={screen.modId}
          />

          <div className="flex flex-1 overflow-hidden">
            <div ref={canvasWrapperRef} className="flex flex-1 items-center justify-center overflow-hidden p-8">
              <div style={{ transform: `translate(${panX}px, ${panY}px)`, flexShrink: 0 }}>
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
                onUpdateWidgets={(widgets) => commitScreen({ ...screen, widgets })}
                bindingsSchema={screen.bindingsSchema ?? {}}
                onAddWidget={(type, x, y) => addWidget(type, undefined, x, y)}
              />
              </div>
            </div>

            {!tryMode && (
              <aside className="w-64 shrink-0 border-l bg-background overflow-y-auto">
                <PropertyPanel
                  widget={selectedWidget}
                  onUpdate={updateWidget}
                  bindingsSchema={screen.bindingsSchema ?? {}}
                  actions={screen.actions ?? []}
                  inventoryAreaIds={screen.widgets.filter((w) => w.type === "inventory_area").map((w) => w.id)}
                />
              </aside>
            )}
          </div>
        </div>

        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </SidebarProvider>
    </>
  );
}
