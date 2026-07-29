"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Canvas from "@/components/Canvas";
import PropertyPanel from "@/components/PropertyPanel";
import Sidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import WelcomeScreen from "@/components/WelcomeScreen";
import { TextureProvider, useTextures } from "@/lib/TextureContext";
import { applyMCPreset } from "@/lib/applyMCPreset";
import TextureDebug from "@/components/TextureDebug";
import type { ScreenSpec, WidgetSpec } from "@/lib/types";
import { getWidgetDef } from "@/lib/widgetRegistry";
import type { ProjectSummary } from "@/components/WelcomeScreen";

let idCounter = 1000;
function newId(type: string) {
  return `${type}_${++idCounter}`;
}

const MAX_HISTORY = 100;
const PROJECTS_KEY = "mc-ui-builder-projects";
const LEGACY_KEY = "mc-ui-builder-session";
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
    // old format: history was ScreenSpec[]
    return {
      ...raw,
      history: (hist as ScreenSpec[]).map(s => ({ screens: [s], activeIdx: 0 })),
    } as SavedSession;
  }
  return raw as unknown as SavedSession;
}

function loadProjects(): StoredProject[] {
  try {
    // migrate legacy single-session format
    const oldRaw = localStorage.getItem(LEGACY_KEY);
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Record<string, unknown>;
      const hist = old.history as unknown[];
      if (Array.isArray(hist) && hist.length > 0) {
        const key = `project_${Date.now()}`;
        const session = migrateSession(old);
        const list: StoredProject[] = [{ key, session, updatedAt: Date.now() }];
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
        localStorage.removeItem(LEGACY_KEY);
        return list;
      }
      localStorage.removeItem(LEGACY_KEY);
    }
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

function toSummaries(projects: StoredProject[]): ProjectSummary[] {
  return projects.map((p) => {
    const entry = p.session.history[p.session.cursor];
    const active = entry?.screens[entry.activeIdx] ?? entry?.screens[0];
    return { key: p.key, screenId: active?.id ?? "", modId: active?.modId, updatedAt: p.updatedAt };
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

const PLACEHOLDER_SCREEN: ScreenSpec = { id: "main", width: 176, height: 166, widgets: [] };
const EMPTY_SESSION: SavedSession = {
  history: [{ screens: [PLACEHOLDER_SCREEN], activeIdx: 0 }],
  cursor: 0,
  gridSize: 4,
  showGrid: true,
};

function syncIdCounter(screens: ScreenSpec[]) {
  for (const screen of screens) {
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
  const [view, setView] = useState<"loading" | "welcome" | "editor">("loading");
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [currentProjectKey, setCurrentProjectKey] = useState<string | null>(null);

  const handleLoadPreset = async () => {
    await applyMCPreset();
    await reload();
  };

  const handleResetTextures = async () => {
    await reset();
  };

  // undo/redo history — present is history[cursor]
  const [history, setHistory] = useState<HistoryEntry[]>(EMPTY_SESSION.history);
  const [cursor, setCursor] = useState(EMPTY_SESSION.cursor);

  const entry = history[cursor];
  const screens = entry.screens;
  const activeIdx = entry.activeIdx;
  const screen = screens[activeIdx];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(EMPTY_SESSION.gridSize);
  const [showGrid, setShowGrid] = useState(EMPTY_SESSION.showGrid);
  const [scale, setScale] = useState(3);
  const [tryMode, setTryMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const canvasWrapperRef = useRef<HTMLElement>(null);

  const handleOpenProject = useCallback((key: string) => {
    const project = projects.find((p) => p.key === key);
    if (!project) return;
    const s = project.session;
    syncIdCounter(s.history.flatMap(e => e.screens));
    setHistory(s.history);
    setCursor(s.cursor);
    setGridSize(s.gridSize);
    setShowGrid(s.showGrid);
    setScale(s.scale ?? 3);
    setSelectedId(null);
    setCurrentProjectKey(key);
    setView("editor");
  }, [projects]);

  const handleCreateProject = useCallback((modId: string, screenId: string) => {
    const emptyScreen: ScreenSpec = { id: screenId, modId, width: 176, height: 166, widgets: [] };
    const session: SavedSession = {
      history: [{ screens: [emptyScreen], activeIdx: 0 }],
      cursor: 0,
      gridSize: 4,
      showGrid: true,
      scale: 3,
    };
    const key = `project_${Date.now()}`;
    const newProject: StoredProject = { key, session, updatedAt: Date.now() };
    setProjects((prev) => {
      const updated = [...prev, newProject];
      saveProjects(updated);
      return updated;
    });
    setHistory([{ screens: [emptyScreen], activeIdx: 0 }]);
    setCursor(0);
    setGridSize(4);
    setShowGrid(true);
    setScale(3);
    setSelectedId(null);
    setCurrentProjectKey(key);
    setView("editor");
  }, []);

  const zoomIn  = useCallback(() => setScale((s) => Math.min(s + 1, 8)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 1, 1)), []);
  const zoomReset = useCallback(() => setScale(3), []);

  // Persist current project whenever session state changes
  useEffect(() => {
    if (!currentProjectKey) return;
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.key === currentProjectKey
          ? { ...p, session: { history, cursor, gridSize, showGrid, scale }, updatedAt: Date.now() }
          : p
      );
      saveProjects(updated);
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, cursor, gridSize, showGrid, scale, currentProjectKey]);

  // Persist (or clear) the last-open project key so reload restores it.
  // Skip during "loading" so the init effect below can read it first.
  useEffect(() => {
    if (view === "loading") return;
    try {
      if (currentProjectKey) localStorage.setItem(LAST_PROJECT_KEY, currentProjectKey);
      else localStorage.removeItem(LAST_PROJECT_KEY);
    } catch { /* quota */ }
  }, [currentProjectKey, view]);

  // Client-only init: read localStorage and jump straight to the last project (or welcome)
  useEffect(() => {
    const projs = loadProjects();
    setProjects(projs);
    const lastKey = localStorage.getItem(LAST_PROJECT_KEY);
    const lastProject = lastKey ? (projs.find((p) => p.key === lastKey) ?? null) : null;
    if (lastProject) {
      syncIdCounter(lastProject.session.history.flatMap(e => e.screens));
      setHistory(lastProject.session.history);
      setCursor(lastProject.session.cursor);
      setGridSize(lastProject.session.gridSize);
      setShowGrid(lastProject.session.showGrid);
      setScale(lastProject.session.scale ?? 3);
      setCurrentProjectKey(lastProject.key);
      setView("editor");
    } else {
      setView("welcome");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // push a new HistoryEntry, discarding any redo tail
  const commit = useCallback((next: HistoryEntry) => {
    setHistory((h) => {
      const trimmed = h.slice(0, cursor + 1);
      const capped = trimmed.length >= MAX_HISTORY ? trimmed.slice(1) : trimmed;
      return [...capped, next];
    });
    setCursor((c) => Math.min(c + 1, MAX_HISTORY - 1));
  }, [cursor]);

  // Wraps an active screen change into a HistoryEntry
  const commitScreen = useCallback((next: ScreenSpec) => {
    commit({ screens: screens.map((s, i) => i === activeIdx ? next : s), activeIdx });
  }, [screens, activeIdx, commit]);

  const undo = useCallback(() => {
    setCursor((c) => Math.max(0, c - 1));
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    setCursor((c) => Math.min(history.length - 1, c + 1));
    setSelectedId(null);
  }, [history.length]);

  const updateWidget = useCallback((updated: WidgetSpec) => {
    commitScreen({ ...screen, widgets: screen.widgets.map((w) => (w.id === updated.id ? updated : w)) });
    if (updated.id !== selectedId) setSelectedId(updated.id);
  }, [screen, commitScreen, selectedId]);

  const deleteWidget = useCallback((id = selectedId) => {
    if (!id) return;
    commitScreen({ ...screen, widgets: screen.widgets.filter((w) => w.id !== id) });
    setSelectedId(null);
  }, [screen, commitScreen, selectedId]);

  const addWidget = useCallback((type: string) => {
    const def = getWidgetDef(type);
    if (!def) return;
    const id = newId(type);
    const widget: WidgetSpec = { ...def.defaultWidget, id };
    commitScreen({ ...screen, widgets: [...screen.widgets, widget] });
    setSelectedId(id);
  }, [screen, commitScreen]);

  const copyWidget = useCallback(() => {
    if (selectedWidget) clipboardRef.current = selectedWidget;
  }, [selectedWidget]);

  const pasteWidget = useCallback(() => {
    const src = clipboardRef.current;
    if (!src) return;
    const id = newId(src.type);
    const pasted: WidgetSpec = { ...src, id, x: src.x + 8, y: src.y + 8 };
    commitScreen({ ...screen, widgets: [...screen.widgets, pasted] });
    setSelectedId(id);
  }, [screen, commitScreen]);

  const duplicateWidget = useCallback(() => {
    if (!selectedWidget) return;
    const id = newId(selectedWidget.type);
    const dup: WidgetSpec = { ...selectedWidget, id, x: selectedWidget.x + 8, y: selectedWidget.y + 8 };
    commitScreen({ ...screen, widgets: [...screen.widgets, dup] });
    setSelectedId(id);
  }, [screen, commitScreen, selectedWidget]);

  const nudgeWidget = useCallback((dx: number, dy: number) => {
    if (!selectedWidget) return;
    updateWidget({ ...selectedWidget, x: selectedWidget.x + dx, y: selectedWidget.y + dy });
  }, [selectedWidget, updateWidget]);

  // Screen management callbacks
  const addScreen = useCallback(() => {
    const newScreen: ScreenSpec = {
      id: `screen_${screens.length + 1}`,
      modId: screen.modId,
      width: 176,
      height: 166,
      widgets: [],
    };
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
    // navigation: update activeIdx without pushing to undo stack
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
        commitScreen(parsed);
        setSelectedId(null);
      } catch {
        alert("Failed to parse ScreenSpec JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (view === "welcome") {
    return (
      <WelcomeScreen
        projects={toSummaries(projects)}
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
      />
    );
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
        sidebarOpen={sidebarOpen}
        onUndo={undo}
        onRedo={redo}
        onGridSizeChange={setGridSize}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleTryMode={() => { setTryMode((v) => { if (!v) setSelectedId(null); return !v; }); }}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onScreenChange={(patch) => commitScreen({ ...screen, ...patch })}
        onExport={handleExport}
        onImport={handleImportClick}
        onLoadPreset={handleLoadPreset}
        onResetTextures={handleResetTextures}
        onViewTextures={() => setShowTextureDebug(true)}
        onGoHome={() => { setCurrentProjectKey(null); setView("welcome"); }}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
      />

      <div className="flex flex-1 overflow-hidden">
        {!tryMode && sidebarOpen && (
          <Sidebar
            screens={screens}
            activeIdx={activeIdx}
            onSelectScreen={switchScreen}
            onAddScreen={addScreen}
            onRemoveScreen={removeScreen}
            onRenameScreen={renameScreen}
            onAddWidget={addWidget}
          />
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
