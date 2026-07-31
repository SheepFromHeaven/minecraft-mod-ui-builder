"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { clearTextures, loadAllTextures, saveTexture } from "./textureStore";
import { extractFromPack, type ExtractResult } from "./extractFromPack";

export const REQUIRED_TEXTURES = [
  "mc_panel_slice.png",
  "mc_slider_track_slice.png",
  "mc_slider_handle_slice.png",
  "mc_button_normal.png",
  "mc_button_hover.png",
  "mc_slot_tile.png",
  "mc_scrollbar_handle.png",
  "tab.png",
  "tab_selected.png",
  "tab_top_selected_1.png",
  "tab_top_selected_2.png",
  "tab_top_selected_7.png",
  "tab_top_unselected_1.png",
  "tab_top_unselected_2.png",
  "tab_top_selected_1_slice.png",
  "tab_top_selected_2_slice.png",
  "tab_top_selected_7_slice.png",
  "tab_top_unselected_1_slice.png",
] as const;

export type TextureName = (typeof REQUIRED_TEXTURES)[number];

interface TextureCtx {
  textures: Partial<Record<TextureName, string>>;
  packTextures: Record<string, string>;
  ready: boolean;
  initialized: boolean;
  setupRequired: boolean;
  uploadFiles: (files: FileList) => Promise<void>;
  extractPack: (file: File) => Promise<ExtractResult>;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
}

const Ctx = createContext<TextureCtx>({
  textures: {},
  packTextures: {},
  ready: false,
  initialized: false,
  setupRequired: false,
  uploadFiles: async () => {},
  extractPack: async () => ({ extracted: [], missing: [] }),
  reload: async () => {},
  reset: async () => {},
});

export function useTextures() {
  return useContext(Ctx);
}

export function TextureProvider({ children }: { children: React.ReactNode }) {
  const [textures, setTextures] = useState<Partial<Record<TextureName, string>>>({});
  const [packTextures, setPackTextures] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const urlsRef = useRef<string[]>([]);

  const applyBlobs = (blobs: Record<string, Blob>) => {
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
    const pack: Record<string, string> = {};
    for (const [key, blob] of Object.entries(blobs)) {
      if (key.startsWith("pack:")) {
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        pack[key.slice(5)] = url;
      }
    }
    setPackTextures(pack);
  };

  useEffect(() => {
    (async () => {
      const blobs = await loadAllTextures();
      if (Object.keys(blobs).length === 0) {
        setSetupRequired(true);
        setInitialized(true);
        return;
      }
      applyBlobs(blobs);
      setInitialized(true);
    })().catch((e) => {
      console.error(e);
      setSetupRequired(true);
      setInitialized(true);
    });
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

  const extractPackFn = async (file: File): Promise<ExtractResult> => {
    const buffer = await file.arrayBuffer();
    const result = await extractFromPack(buffer);
    applyBlobs(await loadAllTextures());
    setSetupRequired(false);
    setInitialized(true);
    return result;
  };

  const reload = async () => {
    applyBlobs(await loadAllTextures());
  };

  const reset = async () => {
    await clearTextures();
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setTextures({});
    setSetupRequired(true);
  };

  const ready = REQUIRED_TEXTURES.every((n) => !!textures[n]);

  return (
    <Ctx.Provider value={{ textures, packTextures, ready, initialized, setupRequired, uploadFiles, extractPack: extractPackFn, reload, reset }}>
      {children}
    </Ctx.Provider>
  );
}
