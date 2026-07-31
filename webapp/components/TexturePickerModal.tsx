"use client";

import { useState, useRef, useEffect } from "react";
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

export default function TexturePickerModal({ open, packTextures, current, onSelect, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState(current);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelected(current);
      setFilter("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, current]);

  const keys = Object.keys(packTextures).sort();
  const filtered = filter
    ? keys.filter((k) => k.toLowerCase().includes(filter.toLowerCase()))
    : keys;

  const preview = hovered ?? selected;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle>Pick texture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left: search + grid */}
          <div className="flex flex-col flex-1 min-w-0 border-r">
            <div className="px-3 pb-2 shrink-0">
              <Input
                ref={searchRef}
                placeholder="Search…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-7 text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">{filtered.length} textures</p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
                {filtered.map((key) => {
                  const isSelected = key === selected;
                  return (
                    <button
                      key={key}
                      title={key}
                      onClick={() => setSelected(key)}
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered(null)}
                      className={[
                        "flex flex-col items-center gap-0.5 rounded p-1 border text-center transition-colors",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-transparent hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                      ].join(" ")}
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-[#555] rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={packTextures[key]}
                          alt=""
                          className="max-w-full max-h-full"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <span className="text-[9px] leading-tight text-muted-foreground truncate w-full">
                        {key.split("/").pop()}
                      </span>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground text-center py-8">No textures match</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: preview panel */}
          <div className="w-56 shrink-0 flex flex-col gap-3 p-4">
            <div className="flex-1 flex items-center justify-center bg-[#555] rounded min-h-0">
              {preview && packTextures[preview] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={packTextures[preview]}
                  alt=""
                  className="max-w-full max-h-full"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <span className="text-xs text-gray-400">hover to preview</span>
              )}
            </div>
            {preview && (
              <p className="text-[10px] text-muted-foreground break-all leading-tight">{preview}</p>
            )}
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!selected}
                onClick={() => { onSelect(selected); onClose(); }}
              >
                Select
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
