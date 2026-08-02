import type { ComponentType } from "react";
import type { VisualProps } from "./shared";

import PanelVisual from "./panel/PanelVisual";
import ButtonVisual from "./button/ButtonVisual";
import SliderVisual from "./slider/SliderVisual";
import CheckboxVisual from "./checkbox/CheckboxVisual";
import InputVisual from "./input/InputVisual";
import LabelVisual from "./label/LabelVisual";
import IconVisual from "./icon/IconVisual";
import GroupVisual from "./group/GroupVisual";
import ScrollVisual from "./scroll/ScrollVisual";
import ListVisual from "./list/ListVisual";
import SpriteVisual from "./sprite/SpriteVisual";
import InventoryAreaVisual from "./inventory_area/InventoryAreaVisual";
import ScrollbarWidgetVisual from "./scrollbar/ScrollbarVisual";
import TabsVisual from "./tabs/TabsVisual";

/** widget.type -> its Visual component. One folder per widget type — see components/widgets/<type>/. */
export const WIDGET_VISUAL_REGISTRY: Record<string, ComponentType<VisualProps>> = {
  panel: PanelVisual,
  button: ButtonVisual,
  toggle_button: ButtonVisual,
  slider: SliderVisual,
  checkbox: CheckboxVisual,
  input: InputVisual,
  label: LabelVisual,
  icon: IconVisual,
  group: GroupVisual,
  scroll: ScrollVisual,
  list: ListVisual,
  sprite: SpriteVisual,
  inventory_area: InventoryAreaVisual,
  scrollbar: ScrollbarWidgetVisual,
  tabs: TabsVisual,
};

export { ScrollbarVisual, SCROLLBAR_THUMB_LEN, SCROLLBAR_BORDER_PX } from "./scrollbar/ScrollbarVisual";
