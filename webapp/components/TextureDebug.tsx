"use client";

import { REQUIRED_TEXTURES, useTextures } from "@/lib/TextureContext";

interface Props {
  onClose: () => void;
}

export default function TextureDebug({ onClose }: Props) {
  const { textures, reset } = useTextures();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#1e1e1e",
        border: "2px solid #555",
        padding: 24,
        minWidth: 400,
        maxWidth: 600,
        color: "#ddd",
        fontFamily: '"Minecraft", monospace',
        fontSize: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#fff", fontSize: 14 }}>Active Textures</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 16 }}
          >✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {REQUIRED_TEXTURES.map((name) => {
            const url = textures[name];
            return (
              <div key={name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <code style={{ color: url ? "#55ff55" : "#ff5555", fontSize: 10, wordBreak: "break-all" }}>
                  {name}
                </code>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={name}
                    style={{
                      width: 64, height: 64,
                      imageRendering: "pixelated",
                      background: "repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 0 0 / 8px 8px",
                      border: "1px solid #444",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64, height: 64,
                    background: "#2a2a2a",
                    border: "1px solid #333",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#555", fontSize: 10,
                  }}>
                    default
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <button
            onClick={async () => { await reset(); onClose(); }}
            style={{
              background: "#6b2020",
              border: "1px solid #944",
              color: "#fff",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            Reset Textures
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#2a2a2a",
              border: "1px solid #555",
              color: "#ccc",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>

        <p style={{ color: "#555", fontSize: 10, marginTop: 10, marginBottom: 0 }}>
          All textures shown above are extracted from your JAR / resource pack and stored in IndexedDB.
        </p>
      </div>
    </div>
  );
}
