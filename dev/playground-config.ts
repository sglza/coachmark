import type { PlaygroundConfig } from "./playground-types";

export const DEFAULT_CONFIG: PlaygroundConfig = {
  allowTargetInteraction: true,
  align: "center",
  alignOffset: 0,
  arrow: true,
  backdrop: true,
  keepOpenOnOutsideInteraction: false,
  modal: true,
  resetOnOpen: true,
  side: "bottom",
  sideOffset: 20,
  spotlightPadding: 8,
  spotlightRadius: 12,
  transition: "move",
  viewport: true,
};
