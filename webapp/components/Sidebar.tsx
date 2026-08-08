"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LayersTree from "@/components/LayersTree";
import type { ScreenSpec, WidgetSpec } from "@/lib/types";

interface Props {
  screens: ScreenSpec[];
  activeIdx: number;
  modId?: string;
  widgets: WidgetSpec[];
  selectedId: string | null;
  selectedIds?: string[];
  onGoHome: () => void;
  onSelectScreen: (idx: number) => void;
  onAddScreen: () => void;
  onRemoveScreen: (idx: number) => void;
  onRenameScreen: (idx: number, name: string) => void;
  onAddWidget: (type: string, parentId?: string) => void;
  onSelectWidget: (id: string, shiftKey: boolean, modKey: boolean) => void;
  onDeleteWidget: (id: string) => void;
  onToggleHiddenWidget: (id: string) => void;
  onReparentWidget: (id: string, newParentId: string | null) => void;
  onReorderWidget: (draggedIds: string[], overId: string, placement: "before" | "after" | "inside") => void;
}

export default function AppSidebar({
  screens, activeIdx, modId, widgets, selectedId, selectedIds,
  onGoHome, onSelectScreen, onAddScreen, onRemoveScreen, onRenameScreen,
  onAddWidget, onSelectWidget, onDeleteWidget, onToggleHiddenWidget, onReparentWidget, onReorderWidget,
}: Props) {
  const [screensOpen, setScreensOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);
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
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b">
        <div className="flex h-8 items-center gap-1 px-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 px-0 shrink-0" onClick={onGoHome} title="Back to projects">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold truncate text-sidebar-foreground">
            {modId || "Unnamed project"}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>

        {/* ── Screens ────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer select-none"
            onClick={() => setScreensOpen(v => !v)}
          >
            {screensOpen
              ? <ChevronDown className="mr-1 h-3.5 w-3.5" />
              : <ChevronRight className="mr-1 h-3.5 w-3.5" />}
            Screens
          </SidebarGroupLabel>

          <SidebarGroupAction title="Add screen" onClick={onAddScreen}>
            <Plus />
          </SidebarGroupAction>

          {screensOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {screens.map((s, idx) => (
                  <SidebarMenuItem key={idx}>
                    {renamingIdx === idx ? (
                      <div className="px-2 py-0.5">
                        <Input
                          ref={renameRef}
                          className="h-6 text-xs"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingIdx(null);
                          }}
                          onBlur={commitRename}
                        />
                      </div>
                    ) : (
                      <>
                        <SidebarMenuButton
                          size="sm"
                          isActive={idx === activeIdx}
                          onClick={() => onSelectScreen(idx)}
                          className="pr-12"
                        >
                          <span className="truncate">{s.id || "(unnamed)"}</span>
                        </SidebarMenuButton>
                        {/* Hover actions — two buttons in a row, absolutely positioned */}
                        <div className="absolute right-1 top-1.5 hidden items-center gap-0.5 group-hover/menu-item:flex">
                          <button
                            title="Rename"
                            onClick={e => { e.stopPropagation(); startRename(idx); }}
                            className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-sidebar-accent [&>svg]:size-3.5"
                          >
                            <Pencil />
                          </button>
                          <button
                            title="Delete"
                            disabled={screens.length <= 1}
                            onClick={e => { e.stopPropagation(); onRemoveScreen(idx); }}
                            className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-30 [&>svg]:size-3.5"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Layers ─────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer select-none"
            onClick={() => setLayersOpen(v => !v)}
          >
            {layersOpen
              ? <ChevronDown className="mr-1 h-3.5 w-3.5" />
              : <ChevronRight className="mr-1 h-3.5 w-3.5" />}
            Layers
          </SidebarGroupLabel>

          {layersOpen && (
            <SidebarGroupContent>
              <LayersTree
                widgets={widgets}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={onSelectWidget}
                onAdd={onAddWidget}
                onDelete={onDeleteWidget}
                onToggleHidden={onToggleHiddenWidget}
                onReorder={onReorderWidget}
              />
            </SidebarGroupContent>
          )}
        </SidebarGroup>


      </SidebarContent>
    </Sidebar>
  );
}
