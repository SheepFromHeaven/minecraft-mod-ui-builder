"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import WIDGET_REGISTRY from "@/lib/widgetRegistry";
import type { ScreenSpec } from "@/lib/types";

interface Props {
  screens: ScreenSpec[];
  activeIdx: number;
  onSelectScreen: (idx: number) => void;
  onAddScreen: () => void;
  onRemoveScreen: (idx: number) => void;
  onRenameScreen: (idx: number, name: string) => void;
  onAddWidget: (type: string) => void;
}

export default function Sidebar({ screens, activeIdx, onSelectScreen, onAddScreen, onRemoveScreen, onRenameScreen, onAddWidget }: Props) {
  const [screensOpen, setScreensOpen] = useState(true);
  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingIdx !== null) renameRef.current?.focus();
  }, [renamingIdx]);

  const startRename = (idx: number) => {
    setRenamingIdx(idx);
    setRenameValue(screens[idx].id);
  };

  const commitRename = () => {
    if (renamingIdx !== null && renameValue.trim()) onRenameScreen(renamingIdx, renameValue.trim());
    setRenamingIdx(null);
  };

  return (
    <div className="flex flex-col h-full border-r bg-background w-56 shrink-0 overflow-hidden">
      {/* Screens */}
      <div className="flex flex-col shrink-0">
        <button
          onClick={() => setScreensOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full text-left"
        >
          {screensOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          Screens
          <span className="ml-auto text-xs text-muted-foreground font-normal">{screens.length}</span>
        </button>

        {screensOpen && (
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {screens.map((s, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div
                  key={idx}
                  onClick={() => renamingIdx !== idx && onSelectScreen(idx)}
                  className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer select-none ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {renamingIdx === idx ? (
                    <Input
                      ref={renameRef}
                      className="h-6 px-1 py-0 text-sm flex-1 min-w-0"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingIdx(null);
                      }}
                      onBlur={commitRename}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm">{s.id || "(unnamed)"}</span>
                      <button
                        title="Rename"
                        className={`shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 ${isActive ? "hover:bg-white/20" : "hover:bg-black/10 dark:hover:bg-white/10"}`}
                        onClick={e => { e.stopPropagation(); startRename(idx); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        title="Delete"
                        disabled={screens.length <= 1}
                        className={`shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 disabled:pointer-events-none ${isActive ? "hover:bg-white/20" : "hover:bg-black/10 dark:hover:bg-white/10"}`}
                        onClick={e => { e.stopPropagation(); onRemoveScreen(idx); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 mt-0.5 h-8 text-muted-foreground hover:text-foreground"
              onClick={onAddScreen}
            >
              <Plus className="h-4 w-4" /> Add Screen
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Widgets */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <button
          onClick={() => setWidgetsOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full text-left shrink-0"
        >
          {widgetsOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          Widgets
        </button>

        {widgetsOpen && (
          <div className="flex flex-col gap-1 px-2 pb-2 overflow-y-auto">
            {WIDGET_REGISTRY.map(def => (
              <Button
                key={def.type}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() => onAddWidget(def.type)}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {def.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
