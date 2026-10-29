import type {
  CoachmarkPositionerProps,
  CoachmarkProps,
} from "coachmark";

export type StylingMode = "css-modules" | "tailwind";

export type PlaygroundConfig = {
  align: NonNullable<CoachmarkPositionerProps["align"]>;
  alignOffset: number;
  arrow: boolean;
  backdrop: boolean;
  keepOpenOnOutsideInteraction: boolean;
  modal: NonNullable<CoachmarkProps["modal"]>;
  resetOnOpen: boolean;
  side: NonNullable<CoachmarkPositionerProps["side"]>;
  sideOffset: number;
  spotlightPadding: number;
  spotlightRadius: number;
  transition: "fade" | "move" | "none" | "viewport-only";
  viewport: boolean;
};

export type PlaygroundEvent = {
  id: number;
  message: string;
  time: string;
};
