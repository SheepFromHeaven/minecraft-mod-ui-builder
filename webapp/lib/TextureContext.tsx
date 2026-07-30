"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { clearTextures, loadAllTextures, saveTexture } from "./textureStore";
import { applyMCPreset } from "./applyMCPreset";

export const REQUIRED_TEXTURES = [
  "mc_panel_slice.png",
  "mc_slider_track_slice.png",
  "mc_slider_handle_slice.png",
  "mc_button_normal.png",
  "mc_button_hover.png",
  "mc_slot_tile.png",
  "mc_scrollbar_handle.png",
] as const;

export type TextureName = (typeof REQUIRED_TEXTURES)[number];

interface TextureCtx {
  textures: Partial<Record<TextureName, string>>;
  ready: boolean;
  uploadFiles: (files: FileList) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
}

const Ctx = createContext<TextureCtx>({
  textures: {},
  ready: false,
  uploadFiles: async () => {},
  reload: async () => {},
  reset: async () => {},
});

export function useTextures() {
  return useContext(Ctx);
}

export function TextureProvider({ children }: { children: React.ReactNode }) {
  const [textures, setTextures] = useState<Partial<Record<TextureName, string>>>({});
  const urlsRef = useRef<string[]>([]);

  const applyBlobs = (blobs: Record<string, Blob>) => {
    // revoke previous object URLs
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];

    const next: Partial<Record<TextureName, string>> = {};
    for (const name of REQUIRED_TEXTURES) {
      if (blobs[name]) {
        const url = URL.createObjectURL(blobs[name]);
        urlsRef.current.push(url);
        next[name] = url;
      }
    }
    setTextures(next);
  };

  useEffect(() => {
    (async () => {
      let blobs = await loadAllTextures();
      // First visit (or after Reset Textures): recolor the original placeholder
      // sprites to the MC palette client-side and cache in IndexedDB. This never
      // touches Mojang's actual texture files — only a small set of reference colors.
      const hasAll = REQUIRED_TEXTURES.every((n) => !!blobs[n]);
      if (!hasAll) {
        await applyMCPreset();
        blobs = await loadAllTextures();
      }
      applyBlobs(blobs);
    })().catch(console.error);
    return () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFiles = async (files: FileList) => {
    const blobs = await loadAllTextures();
    for (const file of Array.from(files)) {
      if ((REQUIRED_TEXTURES as readonly string[]).includes(file.name)) {
        await saveTexture(file.name, file);
        blobs[file.name] = file;
      }
    }
    applyBlobs(blobs);
  };

  const reload = async () => {
    const blobs = await loadAllTextures();
    applyBlobs(blobs);
  };

  const reset = async () => {
    await clearTextures();
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setTextures({});
  };

  const ready = REQUIRED_TEXTURES.every((n) => !!textures[n]);

  return (
    <Ctx.Provider value={{ textures, ready, uploadFiles, reload, reset }}>
      {children}
    </Ctx.Provider>
  );
}
