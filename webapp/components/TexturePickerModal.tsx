"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  packTextures: Record<string, string>;
  current: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

type FolderNode = { [name: string]: FolderNode };

function buildTree(keys: string[]): FolderNode {
  const root: FolderNode = {};
  for (const key of keys) {
    const parts = key.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] ??= {};
      node = node[parts[i]];
    }
  }
  return root;
}

function filesUnder(prefix: string, keys: string[]): string[] {
  const p = prefix ? prefix + "/" : "";
  return keys.filter((k) => k.startsWith(p));
}

// ── FolderTree ────────────────────────────────────────────────────────────────

function FolderTree({
  node,
  prefix,
  selected,
  onSelect,
}: {
  node: FolderNode;
  prefix: string;
  selected: string;
  onSelect: (path: string) => void;
}) {
  const names = Object.keys(node).sort();
  return (
    <ul className="pl-3 border-l border-gray-200 dark:border-gray-700">
      {names.map((name) => {
        const path = prefix ? `${prefix}/${name}` : name;
        const hasChildren = Object.keys(node[name]).length > 0;
        return (
          <FolderItem
            key={name}
            name={name}
            path={path}
            node={node[name]}
            selected={selected}
            hasChildren={hasChildren}
            onSelect={onSelect}
          />
        );
      })}
    </ul>
  );
}

function FolderItem({
  name, path, node, selected, hasChildren, onSelect,
}: {
  name: string; path: string; node: FolderNode;
  selected: string; hasChildren: boolean;
  onSelect: (path: string) => void;
}) {
  const isSelected = selected === path;
  const isAncestor = selected.startsWith(path + "/");
  const [open, setOpen] = useState(isAncestor || isSelected);

  return (
    <li className="my-0.5">
      <div className="flex items-center gap-1">
        <button
          className="w-4 shrink-0 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen((v) => !v)}
        >
          {hasChildren ? (open ? "▾" : "▸") : " "}
        </button>
        <button
          onClick={() => { onSelect(path); setOpen(true); }}
          className={[
            "flex-1 text-left text-xs px-1.5 py-0.5 rounded truncate",
            isSelected
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200",
          ].join(" ")}
        >
          {name}
        </button>
      </div>
      {hasChildren && open && (
        <FolderTree node={node} prefix={path} selected={selected} onSelect={onSelect} />
      )}
    </li>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function TexturePickerModal({ open, packTextures, current, onSelect, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const [folder, setFolder] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState(current);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelected(current);
      setFilter("");
      // Pre-select the folder of the current texture
      const parts = current.split("/");
      setFolder(parts.length > 1 ? parts.slice(0, -1).join("/") : "");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, current]);

  const allKeys = useMemo(() => Object.keys(packTextures).sort(), [packTextures]);
  const tree = useMemo(() => buildTree(allKeys), [allKeys]);

  const searching = filter.length > 0;
  const visibleKeys = searching
    ? allKeys.filter((k) => k.toLowerCase().includes(filter.toLowerCase()))
    : folder
      ? filesUnder(folder, allKeys)
      : allKeys;

  const preview = hovered ?? selected;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 shrink-0 border-b">
          <DialogTitle>Pick texture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">

          {/* ── Left: folder tree ── */}
          <div className="w-52 shrink-0 flex flex-col border-r overflow-hidden">
            <div className="p-2 border-b shrink-0">
              <Input
                ref={searchRef}
                placeholder="Search…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            {!searching && (
              <div className="flex-1 overflow-y-auto p-2 text-xs">
                <button
                  onClick={() => setFolder("")}
                  className={[
                    "w-full text-left px-2 py-1 rounded mb-1",
                    folder === "" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800",
                  ].join(" ")}
                >
                  All textures
                </button>
                <FolderTree node={tree} prefix="" selected={folder} onSelect={setFolder} />
              </div>
            )}
            {searching && (
              <div className="p-2 text-xs text-muted-foreground">{visibleKeys.length} results</div>
            )}
          </div>

          {/* ── Middle: texture grid ── */}
          <div className="flex-1 min-w-0 overflow-y-auto p-3">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))" }}
            >
              {visibleKeys.map((key) => {
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    title={key}
                    onClick={() => setSelected(key)}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    className={[
                      "flex flex-col items-center gap-1 rounded-lg p-1.5 border-2 transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-transparent hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                    ].join(" ")}
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-[#555] rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={packTextures[key]}
                        alt=""
                        className="max-w-full max-h-full"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <span className="text-[9px] leading-tight text-muted-foreground truncate w-full text-center">
                      {key.split("/").pop()}
                    </span>
                  </button>
                );
              })}
              {visibleKeys.length === 0 && (
                <p className="col-span-full text-xs text-muted-foreground text-center py-12">
                  {searching ? "No textures match" : "Empty folder"}
                </p>
              )}
            </div>
          </div>

          {/* ── Right: preview + confirm ── */}
          <div className="w-52 shrink-0 flex flex-col gap-3 p-4 border-l">
            <div
              className="flex-1 flex items-center justify-center bg-[#555] rounded min-h-0"
              style={{ minHeight: 120 }}
            >
              {preview && packTextures[preview] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={packTextures[preview]}
                  alt=""
                  className="max-w-full max-h-full"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">hover a texture to preview</span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground break-all leading-tight shrink-0">
              {preview || "—"}
            </p>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                disabled={!selected}
                onClick={() => { onSelect(selected); onClose(); }}
              >
                Select
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
