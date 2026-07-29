export interface WidgetSpec {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  icon: string | null;
  action?: string;
  bindings?: Record<string, string>;
  props: Record<string, string>;
  item_template?: WidgetSpec[];
  parentId?: string;
}

export interface ScreenSpec {
  id: string;
  modId?: string;
  width: number;
  height: number;
  widgets: WidgetSpec[];
}
