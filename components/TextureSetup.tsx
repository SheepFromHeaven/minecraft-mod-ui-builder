"use client";

import { useRef } from "react";
import { REQUIRED_TEXTURES, useTextures } from "@/lib/TextureContext";

export default function TextureSetup() {
  const { textures, uploadFiles } = useTextures();
  const inputRef = useRef<HTMLInputElement>(null);

  const missing = REQUIRED_TEXTURES.filter((n) => !textures[n]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: '"Minecraft", monospace',
    }}>
      <div style={{
        background: "#2a2a2a",
        border: "2px solid #555",
        padding: 32,
        maxWidth: 480,
        width: "100%",
        color: "#ddd",
      }}>
        <h2 style={{ color: "#fff", marginTop: 0, fontSize: 16 }}>Texture Setup</h2>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "#aaa" }}>
          This tool needs Minecraft texture files to render widgets accurately.
          Extract the following PNGs from your resource pack and upload them here.
          They are stored locally in your browser — never uploaded anywhere.
        </p>

        <div style={{ marginBottom: 20 }}>
          {REQUIRED_TEXTURES.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: textures[name] ? "#55ff55" : "#ff5555" }}>
                {textures[name] ? "✓" : "✗"}
              </span>
              <code style={{ color: "#ccc" }}>{name}</code>
            </div>
          ))}
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          style={{
            background: "#3a3a3a",
            border: "2px solid #666",
            color: "#fff",
            padding: "8px 16px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            display: "block",
            width: "100%",
          }}
        >
          Upload texture files ({missing.length} remaining)
        </button>

        <p style={{ fontSize: 10, color: "#666", marginBottom: 0, marginTop: 12 }}>
          Files with unexpected names are ignored. You can upload all at once.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".png,image/png"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
