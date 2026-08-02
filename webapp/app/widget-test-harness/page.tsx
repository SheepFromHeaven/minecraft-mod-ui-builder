"use client";

/**
 * Test-only harness: renders a single widget on a solid pink background so
 * visual snapshot diffs surface every stray pixel (anti-aliasing bleed,
 * off-by-one slices, wrong z-order). Not linked from the app UI.
 *
 * The widget spec + optional toggled/interactState are read from
 * `window.__HARNESS_WIDGET__`, set via page.addInitScript in tests before
 * navigation — see tests/support/seed.ts.
 */

import { useEffect, useState } from "react";
import WidgetVisual from "@/components/WidgetVisual";
import { ScrollbarVisual } from "@/components/widgets";
import { TextureProvider, useTextures } from "@/lib/TextureContext";
import type { WidgetSpec } from "@/lib/types";

interface HarnessConfig {
  widget: WidgetSpec;
  scale?: number;
  interactState?: "idle" | "hovered" | "pressed";
  toggled?: boolean;
  /** Scrollbar-only: knob position 0-1. WidgetVisual's own static preview is
   * always pct=0, so scroll-position snapshots render ScrollbarVisual directly. */
  scrollPct?: number;
}

declare global {
  interface Window {
    __HARNESS_WIDGET__?: HarnessConfig;
  }
}

export default function WidgetHarnessPage() {
  const [config, setConfig] = useState<HarnessConfig | null>(null);

  useEffect(() => {
    setConfig(window.__HARNESS_WIDGET__ ?? null);
  }, []);

  if (!config) return <div data-harness-state="waiting" style={{ background: "#ff00ff", width: "100vw", height: "100vh" }} />;

  return (
    <TextureProvider>
      <HarnessBody config={config} />
    </TextureProvider>
  );
}

const STAGE_MARGIN = 24; // px, fixed regardless of viewport — keeps the snapshot region deterministic

function HarnessBody({ config }: { config: HarnessConfig }) {
  const { ready, textures } = useTextures();
  const scale = config.scale ?? 4;
  const tex = (name: string) => textures[name as keyof typeof textures];
  const stageW = config.widget.w * scale + STAGE_MARGIN * 2;
  const stageH = config.widget.h * scale + STAGE_MARGIN * 2;

  return (
    <div
      data-harness-state={ready ? "ready" : "waiting"}
      style={{
        background: "#ff00ff",
        width: stageW,
        height: stageH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        data-harness-widget
        style={{ width: config.widget.w * scale, height: config.widget.h * scale }}
      >
        <div
          style={{
            width: config.widget.w,
            height: config.widget.h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            imageRendering: "pixelated",
          }}
        >
          {config.widget.type === "scrollbar" && config.scrollPct !== undefined ? (
            <ScrollbarVisual
              axis={config.widget.props.axis === "x" ? "x" : "y"}
              width={config.widget.w}
              height={config.widget.h}
              tex={tex}
              pct={config.scrollPct}
            />
          ) : (
            <WidgetVisual
              widget={config.widget}
              scale={scale}
              interactState={config.interactState}
              toggled={config.toggled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
