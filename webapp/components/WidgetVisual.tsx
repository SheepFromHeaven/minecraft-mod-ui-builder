"use client";

import type { WidgetSpec } from "@/lib/types";
import { useTextures } from "@/lib/TextureContext";
import { WIDGET_VISUAL_REGISTRY } from "@/components/widgets";
import FallbackVisual from "@/components/widgets/FallbackVisual";
import type { InteractState } from "@/components/widgets/shared";

interface Props {
  widget: WidgetSpec;
  scale: number;
  interactState?: InteractState;
  toggled?: boolean;
}

/**
 * Dispatches to the widget's own Visual component (components/widgets/<type>/).
 * Each widget type owns its folder with its Visual (and, where the widget needs
 * bespoke edit/try-mode behavior beyond generic drag/resize/select, its Edit
 * and/or Try components too — see Canvas.tsx for how those are wired in).
 */
export default function WidgetVisual({ widget, scale, interactState = "idle", toggled = false }: Props) {
  const { textures, packTextures } = useTextures();
  const tex = (name: string) => textures[name as keyof typeof textures];

  const Visual = WIDGET_VISUAL_REGISTRY[widget.type] ?? FallbackVisual;
  return (
    <Visual
      widget={widget}
      scale={scale}
      interactState={interactState}
      toggled={toggled}
      tex={tex}
      packTextures={packTextures}
    />
  );
}
