"use client";

import {
  Square, MousePointerClick, ToggleLeft, TextCursorInput,
  SlidersHorizontal, Type, Image, List, ScrollText, Folder, HelpCircle,
  PanelTop, RectangleHorizontal,
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import WIDGET_REGISTRY from "@/lib/widgetRegistry";

export const WIDGET_ICONS: Record<string, React.ElementType> = {
  group:         Folder,
  panel:         Square,
  scroll:        ScrollText,
  button:        MousePointerClick,
  toggle_button: ToggleLeft,
  input:         TextCursorInput,
  slider:        SlidersHorizontal,
  label:         Type,
  icon:          Image,
  list:          List,
  tabs:          PanelTop,
  tab:           RectangleHorizontal,
};

export function AddWidgetItems({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <>
      {WIDGET_REGISTRY.filter(def => def.type !== "tab").map(def => {
        const Icon = WIDGET_ICONS[def.type] ?? HelpCircle;
        return (
          <DropdownMenuItem key={def.type} onClick={() => onAdd(def.type)}>
            <Icon className="size-3.5 mr-2" />
            {def.label}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
