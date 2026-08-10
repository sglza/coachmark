import { cn } from "./lib/utils";
import type { PlaygroundConfig, StylingMode } from "./playground-types";
import styles from "./coachmark.module.css";

export type CoachmarkSize = "compact" | "large" | "medium";

type CoachmarkClassNames = {
  actions: string;
  arrow: string;
  backdrop: string;
  content: string;
  description: string;
  navigation: string;
  popup: string;
  positioner: string;
  stepper: string;
  title: string;
  viewport: string;
};

// Raw transition and transform declarations intentionally mirror the CSS
// Module. Tailwind's named easings and individual transform properties have
// different computed values and animation semantics.
const tailwindBase = {
  actions: "mt-1 flex items-center justify-between gap-4",
  arrow:
    "h-1.5 w-3 overflow-hidden before:absolute before:bottom-0 before:left-1/2 before:size-[calc(0.375rem*1.414)] before:border before:border-black/12 before:bg-[Canvas] before:content-[''] before:[transform:translate(-50%,50%)_rotate(45deg)] data-[side=top]:-bottom-1.5 data-[side=top]:[transform:rotate(180deg)] data-[side=bottom]:-top-1.5 data-[side=left]:-right-[0.5625rem] data-[side=left]:[transform:rotate(90deg)] data-[side=right]:-left-[0.5625rem] data-[side=right]:[transform:rotate(-90deg)]",
  backdrop:
    "fixed inset-0 z-[9998] bg-black/52 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-[120ms] data-[ending-style]:[transition-timing-function:ease-out] data-concealed:[transition:none]",
  content: "grid gap-3",
  description:
    "m-0 text-sm leading-[1.5] text-[color-mix(in_srgb,CanvasText_68%,transparent)]",
  navigation: "flex gap-1.5",
  popup:
    "relative flex box-border w-[min(20rem,calc(100vw-2rem))] origin-(--transform-origin) flex-col gap-[0.65rem] rounded-[0.75rem] border border-black/12 bg-[Canvas] p-4 [font-family:inherit] text-[CanvasText] opacity-100 shadow-[0_18px_45px_rgb(0_0_0/22%)] data-[ending-style]:duration-[120ms] data-[ending-style]:[transition-timing-function:ease-out] data-[motion-state=exiting]:duration-[120ms] data-[motion-state=exiting]:[transition-timing-function:ease-out]",
  positioner:
    "z-[9999] data-[motion-state=exiting]:duration-[120ms] data-[motion-state=exiting]:[transition-timing-function:ease-out] data-concealed:data-[motion-state=repositioning]:[transition:none]",
  stepper:
    "text-[0.7rem] font-semibold tracking-[0.08em] text-[color-mix(in_srgb,CanvasText_58%,transparent)] uppercase",
  title: "m-0 text-base leading-[1.3] font-[650]",
  viewport:
    "relative min-h-0 min-w-0 flex-1 overflow-clip [--coachmark-current-x:0] [--coachmark-current-y:0] [--coachmark-previous-x:0] [--coachmark-previous-y:0] data-[activation-direction~=right]:[--coachmark-current-x:0.5rem] data-[activation-direction~=right]:[--coachmark-previous-x:-0.5rem] data-[activation-direction~=left]:[--coachmark-current-x:-0.5rem] data-[activation-direction~=left]:[--coachmark-previous-x:0.5rem] data-[activation-direction~=down]:[--coachmark-current-y:0.5rem] data-[activation-direction~=down]:[--coachmark-previous-y:-0.5rem] data-[activation-direction~=up]:[--coachmark-current-y:-0.5rem] data-[activation-direction~=up]:[--coachmark-previous-y:0.5rem] [&>[data-current]]:w-full [&>[data-previous]]:w-full [&>[data-previous]]:inset-0 [&>[data-current]]:[transition:opacity_240ms_ease-in-out,transform_240ms_ease-in-out] [&>[data-previous]]:[transition:opacity_240ms_ease-in-out,transform_240ms_ease-in-out] [&>[data-current][data-starting-style]]:[transform:translate(var(--coachmark-current-x),var(--coachmark-current-y))] [&>[data-current][data-starting-style]]:opacity-0 [&>[data-previous][data-ending-style]]:[transform:translate(var(--coachmark-previous-x),var(--coachmark-previous-y))] [&>[data-previous][data-ending-style]]:opacity-0 motion-reduce:[&>[data-current]]:[transition:none] motion-reduce:[&>[data-previous]]:[transition:none]",
} as const;

const tailwindTransitions = {
  fade: {
    backdrop:
      "[transition:opacity_180ms_ease-out] data-[motion-state=entering]:[--coachmark-cutout-path:none] data-[motion-state=exiting]:[--coachmark-cutout-path:none] data-[motion-state=repositioning]:[--coachmark-cutout-path:none]",
    popup:
      "[transition:opacity_180ms_ease-out] data-[starting-style]:transform-none data-[ending-style]:transform-none data-[motion-state=entering]:transform-none data-[motion-state=exiting]:transform-none data-[motion-state=repositioning]:transform-none data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[motion-state=entering]:opacity-0 data-[motion-state=exiting]:opacity-0 data-[motion-state=repositioning]:opacity-0",
    positioner:
      "[transition:opacity_180ms_ease-out] data-[motion-state=entering]:opacity-0 data-[motion-state=exiting]:opacity-0 data-[motion-state=repositioning]:opacity-0",
  },
  move: {
    backdrop:
      "[transition:clip-path_240ms_ease-in-out,opacity_180ms_ease-out]",
    popup:
      "[transition:opacity_180ms_ease-out,transform_180ms_ease-out] data-[starting-style]:[transform:scale(0.97)] data-[starting-style]:opacity-0 data-[ending-style]:[transform:scale(0.97)] data-[ending-style]:opacity-0",
    positioner:
      "[transition:top_240ms_ease-in-out,left_240ms_ease-in-out,transform_240ms_ease-in-out,opacity_180ms_ease-out]",
  },
  none: {
    backdrop: "[transition:none]",
    popup: "[transition:none]",
    positioner: "[transition:none]",
  },
} as const;

const tailwindSizes: Record<CoachmarkSize, string> = {
  compact:
    "w-[min(17rem,calc(100vw-2rem))] [--coachmark-step-width:min(17rem,calc(100vw-2rem))]",
  medium:
    "w-[min(20rem,calc(100vw-2rem))] [--coachmark-step-width:min(20rem,calc(100vw-2rem))]",
  large:
    "w-[min(23rem,calc(100vw-2rem))] [--coachmark-step-width:min(23rem,calc(100vw-2rem))]",
};

export function getCoachmarkClassNames(
  stylingMode: StylingMode,
  config: Pick<PlaygroundConfig, "transition" | "viewport">,
  size: CoachmarkSize,
): CoachmarkClassNames {
  const viewportEnabled = config.viewport && config.transition === "move";

  if (stylingMode === "css-modules") {
    const transition = {
      fade: styles.transitionFade,
      move: styles.transitionMove,
      none: styles.transitionNone,
    }[config.transition];
    const viewport = viewportEnabled ? styles.withViewport : "";
    const sizeClass = {
      compact: styles.sizeCompact,
      large: styles.sizeLarge,
      medium: styles.sizeMedium,
    }[size];

    return {
      actions: styles.Actions,
      arrow: styles.Arrow,
      backdrop: cn(styles.Backdrop, transition),
      content: styles.Content,
      description: styles.Description,
      navigation: styles.Navigation,
      popup: cn(styles.Popup, sizeClass, transition, viewport),
      positioner: cn(styles.Positioner, transition, viewport),
      stepper: styles.Stepper,
      title: styles.Title,
      viewport: styles.Viewport,
    };
  }

  const transition = tailwindTransitions[config.transition];
  const viewportPositioner = viewportEnabled
    ? "h-[var(--positioner-height,max-content)] w-[var(--positioner-width,max-content)]"
    : "";
  const viewportPopup = viewportEnabled
    ? "h-[var(--popup-height,auto)] w-[var(--popup-width,var(--coachmark-step-width))] [transition:width_240ms_ease-in-out,height_240ms_ease-in-out,opacity_180ms_ease-out,transform_180ms_ease-out]"
    : "";

  return {
    actions: tailwindBase.actions,
    arrow: tailwindBase.arrow,
    backdrop: cn(
      tailwindBase.backdrop,
      transition.backdrop,
      "motion-reduce:[transition:none]",
    ),
    content: tailwindBase.content,
    description: tailwindBase.description,
    navigation: tailwindBase.navigation,
    popup: cn(
      tailwindBase.popup,
      tailwindSizes[size],
      transition.popup,
      viewportPopup,
      "motion-reduce:[transition:none]",
    ),
    positioner: cn(
      tailwindBase.positioner,
      transition.positioner,
      viewportPositioner,
      viewportEnabled
        ? "[transition:top_240ms_ease-in-out,left_240ms_ease-in-out,transform_240ms_ease-in-out,opacity_180ms_ease-out]"
        : "",
      "motion-reduce:[transition:none]",
    ),
    stepper: tailwindBase.stepper,
    title: tailwindBase.title,
    viewport: tailwindBase.viewport,
  };
}
