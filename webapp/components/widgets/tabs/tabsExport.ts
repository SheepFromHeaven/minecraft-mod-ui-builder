import type { WidgetSpec } from "@/lib/types";

/**
 * A `tab` child's own x/y don't carry real meaning — tabs are laid out purely
 * by the tabs container (see tabLayout.ts) and always start flush with their
 * parent's left edge, below the tab header row. Used when resolving a
 * descendant's absolute position for export (e.g. inventory_area/inventoryAreaExport.ts).
 */
export function tabChildOrigin(parent: WidgetSpec, parentOrigin: { x: number; y: number }): { x: number; y: number } {
  const tabHeight = parseInt(parent.props?.tab_height ?? "20", 10);
  return { x: parentOrigin.x, y: parentOrigin.y + tabHeight };
}
