"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import WelcomeScreen from "@/components/WelcomeScreen";
import SetupScreen from "@/components/SetupScreen";
import { useTextures } from "@/lib/TextureContext";
import type { ScreenSpec } from "@/lib/types";
import type { ProjectSummary } from "@/components/WelcomeScreen";

const PROJECTS_KEY = "mc-ui-builder-projects";
const LEGACY_KEY = "mc-ui-builder-session";

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
  if (!Array.isArray(hist) || hist.length === 0) {
    return { history: [{ screens: [{ id: "main", width: 320, height: 180, widgets: [] }], activeIdx: 0 }], cursor: 0, gridSize: 4, showGrid: true };
  }
  if ('widgets' in (hist[0] as object)) {
    return { ...raw, history: (hist as ScreenSpec[]).map(s => ({ screens: [s], activeIdx: 0 })) } as SavedSession;
  }
  return raw as unknown as SavedSession;
}

function loadProjects(): StoredProject[] {
  try {
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
    return parsed.map(p => ({ ...p, session: migrateSession(p.session as unknown as Record<string, unknown>) }));
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

export default function ProjectsPage() {
  const router = useRouter();
  const { initialized, setupRequired, ready } = useTextures();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setProjectsLoaded(true);
  }, []);

  const handleOpenProject = useCallback((key: string) => {
    router.push(`/editor/${key}`);
  }, [router]);

  const handleCreateProject = useCallback((modId: string, screenId: string) => {
    const emptyScreen: ScreenSpec = { id: screenId, modId, width: 320, height: 180, widgets: [] };
    const session: SavedSession = {
      history: [{ screens: [emptyScreen], activeIdx: 0 }],
      cursor: 0, gridSize: 4, showGrid: true, scale: 3,
    };
    const key = `project_${Date.now()}`;
    setProjects((prev) => {
      const updated = [...prev, { key, session, updatedAt: Date.now() }];
      saveProjects(updated);
      return updated;
    });
    router.push(`/editor/${key}`);
  }, [router]);

  const handleDeleteProject = useCallback((key: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.key !== key);
      saveProjects(updated);
      return updated;
    });
  }, []);

  const handleEditTestScreen = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/test-screen");
      if (!res.ok) throw new Error("Failed to load test screen");
      const parsed = await res.json() as ScreenSpec;
      if (!parsed.id || !Array.isArray(parsed.widgets)) throw new Error("Invalid ScreenSpec");
      const DEV_TEST_KEY = "__dev_test_screen__";
      const session: SavedSession = {
        history: [{ screens: [parsed], activeIdx: 0 }],
        cursor: 0, gridSize: 4, showGrid: true, scale: 3,
      };
      setProjects((prev) => {
        const exists = prev.find(p => p.key === DEV_TEST_KEY);
        const updated = exists
          ? prev.map(p => p.key === DEV_TEST_KEY ? { ...p, session, updatedAt: Date.now() } : p)
          : [...prev, { key: DEV_TEST_KEY, session, updatedAt: Date.now() }];
        saveProjects(updated);
        return updated;
      });
      router.push(`/editor/${DEV_TEST_KEY}`);
    } catch (e) {
      alert(`Could not load test screen: ${e instanceof Error ? e.message : e}`);
    }
  }, [router]);

  if (!initialized || !projectsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (setupRequired && !ready) {
    return <SetupScreen />;
  }

  return (
    <WelcomeScreen
      projects={toSummaries(projects)}
      onOpenProject={handleOpenProject}
      onCreateProject={handleCreateProject}
      onDeleteProject={handleDeleteProject}
      onEditTestScreen={handleEditTestScreen}
    />
  );
}
