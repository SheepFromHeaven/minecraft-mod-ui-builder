export interface WidgetSpec {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  icon: string | null;
  props: Record<string, string>;
}

export interface ScreenSpec {
  id: string;
  width: number;
  height: number;
  widgets: WidgetSpec[];
}
