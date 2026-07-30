"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ProjectSummary {
  key: string;
  screenId: string;
  modId?: string;
  updatedAt: number;
}

interface Props {
  projects: ProjectSummary[];
  onOpenProject: (key: string) => void;
  onCreateProject: (modId: string, screenId: string) => void;
  onEditTestScreen?: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WelcomeScreen({ projects, onOpenProject, onCreateProject, onEditTestScreen }: Props) {
  const [open, setOpen] = useState(false);
  const [modId, setModId] = useState("");
  const [screenId, setScreenId] = useState("main");

  const canCreate = modId.trim().length > 0;

  const submit = () => {
    if (!canCreate) return;
    onCreateProject(modId.trim(), screenId.trim() || "main");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">MC Screen Designer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual designer for Minecraft mod GUI screens
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-10 py-8 shadow-sm w-full max-w-sm">
        {projects.length === 0 ? (
          <>
            <div className="text-5xl select-none">🗂️</div>
            <p className="text-sm text-muted-foreground">No projects yet</p>
          </>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {projects.map((p) => (
              <button
                key={p.key}
                onClick={() => onOpenProject(p.key)}
                className="flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors w-full"
              >
                <div>
                  <p className="text-sm font-medium">{p.screenId || "(unnamed)"}</p>
                  {p.modId && (
                    <p className="text-xs text-muted-foreground">{p.modId}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {relativeTime(p.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}

        <Button className="w-full" onClick={() => setOpen(true)}>+ New Project</Button>
        {process.env.NODE_ENV === "development" && onEditTestScreen && (
          <Button className="w-full" variant="outline" onClick={onEditTestScreen}>
            Edit test screen
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modId">
                Mod ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modId"
                autoFocus
                placeholder="e.g. my_mod"
                value={modId}
                onChange={(e) => setModId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <p className="text-xs text-muted-foreground">
                Your mod's namespace — qualifies binding and action IDs automatically
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="screenId">First screen ID</Label>
              <Input
                id="screenId"
                placeholder="main"
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canCreate} onClick={submit}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
