import type {
  CSSProperties,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from "react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useId,
  useSyncExternalStore,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { Popover } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import {
  createCoachmarkHandle,
  getTourStore,
  type CoachmarkHandle,
  type TourStore,
} from "./tour-store";

export interface CoachmarkRenderState {
  close: () => void;
  finish: () => void;
  goTo: (index: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  motionState: CoachmarkMotionState;
  next: () => void;
  previous: () => void;
  stepCount: number;
  stepIndex: number;
  transitioning: boolean;
}

export type CoachmarkMotionState =
  | "entering"
  | "exiting"
  | "idle"
  | "repositioning";

export type CoachmarkOpenChangeEventDetails = Popover.Root.ChangeEventDetails & {
  /** Present for final Next and the hook's close/finish actions. */
  action?: "close" | "finish";
};

export interface CoachmarkProps {
  /** Application content, targets, launchers, and registered step definitions. */
  children: ReactNode;
  /** Connect targets and launchers rendered outside this Root. */
  handle?: CoachmarkHandle;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    details: CoachmarkOpenChangeEventDetails,
  ) => void;
  stepIndex?: number;
  defaultStepIndex?: number;
  onStepChange?: (index: number) => void;
  modal?: Popover.Root.Props["modal"];
  /**
   * Reset to the first step whenever the tour opens.
   * @default true
   */
  resetOnOpen?: boolean;
  /** Reveal an offscreen target when the tour opens or changes steps. */
  scrollIntoView?: boolean | ScrollIntoViewOptions;
}

export interface CoachmarkStepProps {
  /** Registered target name. Element refs remain supported during the 1.0 migration. */
  target: string | RefObject<HTMLElement | null>;
  /** Explicit sequence for steps distributed across independently mounted components. */
  order?: number;
  children: ReactNode;
  /**
   * Space between the target and spotlight cutout, in CSS pixels.
   * @default 8
   */
  spotlightPadding?: number;
  /**
   * Corner radius of the spotlight cutout, in CSS pixels.
   * @default 0
   */
  spotlightRadius?: number;
  /** Override automatic target scrolling for this step. */
  scrollIntoView?: boolean | ScrollIntoViewOptions;
}

export interface CoachmarkBackdropProps
  extends Omit<Popover.Backdrop.Props, "children"> {}

export interface CoachmarkTriggerProps
  extends Omit<Popover.Trigger.Props, "handle"> {
  handle?: CoachmarkHandle;
}

export interface CoachmarkTargetProps extends CoachmarkTriggerProps {
  /** Name scoped to this tour; not a CSS selector or a global DOM id. */
  name: string;
}

type ResolvedCoachmarkStepProps = Omit<CoachmarkStepProps, "target"> & {
  target: RefObject<HTMLElement | null>;
};

const TourStoreContext = createContext<TourStore | null>(null);

function useTourStore(handle?: CoachmarkHandle): TourStore {
  const context = useContext(TourStoreContext);
  const store = handle ? getTourStore(handle) : context;
  if (!store) {
    throw new Error(
      "Coachmark: use this part inside a Root or provide a tour handle.",
    );
  }
  return store;
}
export type CoachmarkArrowProps = Popover.Arrow.Props;
export type CoachmarkPositionerProps = Omit<
  Popover.Positioner.Props,
  "anchor"
>;
export type CoachmarkPopupProps = Popover.Popup.Props;

type CoachmarkPartState = Pick<
  CoachmarkRenderState,
  | "isFirstStep"
  | "isLastStep"
  | "motionState"
  | "stepCount"
  | "stepIndex"
  | "transitioning"
>;

export interface CoachmarkStepperProps
  extends Omit<
    useRender.ComponentProps<"div", CoachmarkPartState>,
    "children"
  > {
  children: ReactNode | ((state: CoachmarkRenderState) => ReactNode);
}

export type CoachmarkViewportState = CoachmarkPartState & {
  /** Direction from the previous target to the current target. */
  activationDirection: string | undefined;
  /** Whether outgoing and incoming step content are being presented together. */
  transitioning: boolean;
};

export interface CoachmarkViewportProps
  extends Omit<
    useRender.ComponentProps<"div", CoachmarkViewportState>,
    "children"
  > {
  children: ReactNode;
}

export interface CoachmarkPreviousProps
  extends Omit<
    useRender.ComponentProps<"button", CoachmarkPartState>,
    "children"
  > {
  children: ReactNode | ((state: CoachmarkRenderState) => ReactNode);
  /** Keep the button mounted and disabled on the first step. */
  keepMounted?: boolean;
}

export interface CoachmarkNextProps
  extends Omit<
    useRender.ComponentProps<"button", CoachmarkPartState>,
    "children"
  > {
  children: ReactNode | ((state: CoachmarkRenderState) => ReactNode);
}

interface InternalCoachmarkContextValue extends CoachmarkRenderState {
  activeStep: ResolvedCoachmarkStepProps | null;
  launcherRef: RefObject<HTMLElement | null>;
  activationDirection: string | undefined;
  concealed: boolean;
  motionElementRefs: {
    backdrop: RefObject<HTMLElement | null>;
    popup: RefObject<HTMLElement | null>;
    positioner: RefObject<HTMLElement | null>;
  };
  open: boolean;
  phase: CoachmarkPresentationPhase;
}

type CoachmarkPresentationPhase =
  | "closed"
  | "entering"
  | "exiting"
  | "preparing-open"
  | "positioning"
  | "scrolling"
  | "idle";

type SpotlightGeometry = {
  clipPath: string;
  closedClipPath: string;
  height: number;
  left: number;
  radius: number;
  top: number;
  width: number;
};

type SpotlightCustomProperties = {
  "--coachmark-cutout-closed"?: string;
  "--coachmark-cutout-open"?: string;
};

type PopupDimensions = {
  height: number;
  width: number;
};

type ViewportSnapshot = {
  dimensions: PopupDimensions;
  node: HTMLDivElement;
};

type PopupSizeCustomProperties = {
  "--popup-height"?: string;
  "--popup-width"?: string;
};

const InternalCoachmarkContext =
  createContext<InternalCoachmarkContextValue | null>(null);

const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  behavior: "smooth",
  block: "center",
  inline: "nearest",
};
const scrollEndFallbackDelay = 120;
const scrollEndSettleDelay = 50;
const scrollEndTimeout = 1500;
const motionEndTimeout = 10000;

function useCoachmarkContext(): InternalCoachmarkContextValue {
  const context = useContext(InternalCoachmarkContext);

  if (!context) {
    throw new Error("Coachmark parts must be rendered inside <Coachmark>.");
  }

  return context;
}

function getPartState(context: CoachmarkRenderState): CoachmarkPartState {
  return {
    isFirstStep: context.isFirstStep,
    isLastStep: context.isLastStep,
    motionState: context.motionState,
    stepCount: context.stepCount,
    stepIndex: context.stepIndex,
    transitioning: context.transitioning,
  };
}

const coachmarkPartStateAttributesMapping = {
  isFirstStep: (value: boolean) => (value ? { "data-first-step": "" } : null),
  isLastStep: (value: boolean) => (value ? { "data-last-step": "" } : null),
  motionState: (value: CoachmarkMotionState) => ({
    "data-motion-state": value,
  }),
  stepCount: (value: number) => ({
    "data-step-count": value.toString(),
  }),
  stepIndex: (value: number) => ({
    "data-step-index": value.toString(),
  }),
  transitioning: (value: boolean) =>
    value ? { "data-transitioning": "" } : null,
};

function getMotionState(
  phase: CoachmarkPresentationPhase,
): CoachmarkMotionState {
  if (phase === "entering" || phase === "preparing-open") {
    return "entering";
  }
  if (phase === "exiting") {
    return "exiting";
  }
  if (phase === "positioning" || phase === "scrolling") {
    return "repositioning";
  }

  return "idle";
}

function getActivationDirection(
  previousTarget: HTMLElement | null | undefined,
  nextTarget: HTMLElement | null | undefined,
): string | undefined {
  if (!previousTarget || !nextTarget) {
    return undefined;
  }

  const previousRect = previousTarget.getBoundingClientRect();
  const nextRect = nextTarget.getBoundingClientRect();
  const horizontalOffset =
    nextRect.left + nextRect.width / 2 -
    (previousRect.left + previousRect.width / 2);
  const verticalOffset =
    nextRect.top + nextRect.height / 2 -
    (previousRect.top + previousRect.height / 2);
  const tolerance = 5;
  const directions = [
    horizontalOffset > tolerance
      ? "right"
      : horizontalOffset < -tolerance
        ? "left"
        : "",
    verticalOffset > tolerance
      ? "down"
      : verticalOffset < -tolerance
        ? "up"
        : "",
  ].filter(Boolean);

  return directions.length > 0 ? directions.join(" ") : undefined;
}

function cloneElementContents(element: HTMLElement): HTMLDivElement {
  const clone = element.ownerDocument.createElement("div");

  for (const child of Array.from(element.childNodes)) {
    clone.appendChild(child.cloneNode(true));
  }

  return clone;
}

function measureNaturalPopup(
  popup: HTMLElement,
  positioner: HTMLElement,
): PopupDimensions {
  const popupProperties = [
    "--popup-height",
    "--popup-width",
    "position",
    "scale",
    "transform",
  ] as const;
  const positionerProperties = [
    "--positioner-height",
    "--positioner-width",
  ] as const;
  const popupValues = popupProperties.map((property) =>
    popup.style.getPropertyValue(property),
  );
  const positionerValues = positionerProperties.map((property) =>
    positioner.style.getPropertyValue(property),
  );
  const popupAnimation = popup.style.getPropertyValue("animation");
  const popupTransition = popup.style.getPropertyValue("transition");
  const positionerAnimation = positioner.style.getPropertyValue("animation");
  const positionerTransition = positioner.style.getPropertyValue("transition");
  const restoreProperty = (
    element: HTMLElement,
    property: string,
    value: string,
  ) => {
    if (value) {
      element.style.setProperty(property, value);
    } else {
      element.style.removeProperty(property);
    }
  };

  popup.style.removeProperty("--popup-height");
  popup.style.removeProperty("--popup-width");
  popup.style.setProperty("position", "static");
  popup.style.setProperty("scale", "1");
  popup.style.setProperty("animation", "none");
  popup.style.setProperty("transition", "none");
  popup.style.setProperty("transform", "none");
  positioner.style.removeProperty("--positioner-height");
  positioner.style.removeProperty("--positioner-width");
  positioner.style.setProperty("animation", "none");
  positioner.style.setProperty("transition", "none");

  const rect = popup.getBoundingClientRect();

  popupProperties.forEach((property, index) => {
    const value = popupValues[index];
    if (value) {
      popup.style.setProperty(property, value);
    } else {
      popup.style.removeProperty(property);
    }
  });
  positionerProperties.forEach((property, index) => {
    const value = positionerValues[index];
    restoreProperty(positioner, property, value);
  });
  popup.getBoundingClientRect();
  positioner.getBoundingClientRect();
  restoreProperty(popup, "animation", popupAnimation);
  restoreProperty(popup, "transition", popupTransition);
  restoreProperty(positioner, "animation", positionerAnimation);
  restoreProperty(positioner, "transition", positionerTransition);

  return { height: rect.height, width: rect.width };
}

function setPopupDimensions(
  popup: HTMLElement,
  dimensions: PopupDimensions,
): void {
  popup.style.setProperty("--popup-height", `${dimensions.height}px`);
  popup.style.setProperty("--popup-width", `${dimensions.width}px`);
}

function setPositionerDimensions(
  positioner: HTMLElement,
  dimensions: PopupDimensions,
): void {
  positioner.style.setProperty("--positioner-height", `${dimensions.height}px`);
  positioner.style.setProperty("--positioner-width", `${dimensions.width}px`);
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function clipsOverflow(value: string): boolean {
  return ["auto", "clip", "hidden", "overlay", "scroll"].includes(value);
}

function isOutsideBounds(
  rect: DOMRect,
  bounds: Pick<DOMRect, "bottom" | "left" | "right" | "top">,
): boolean {
  const isAxisOutside = (
    start: number,
    end: number,
    boundsStart: number,
    boundsEnd: number,
  ) => {
    const targetSize = end - start;
    const boundsSize = boundsEnd - boundsStart;

    if (boundsSize <= 0) {
      return true;
    }

    if (targetSize > boundsSize) {
      const targetCenter = start + targetSize / 2;
      return targetCenter < boundsStart || targetCenter > boundsEnd;
    }

    return start < boundsStart - 1 || end > boundsEnd + 1;
  };
  const outsideHorizontally = isAxisOutside(
    rect.left,
    rect.right,
    bounds.left,
    bounds.right,
  );
  const outsideVertically = isAxisOutside(
    rect.top,
    rect.bottom,
    bounds.top,
    bounds.bottom,
  );

  return outsideHorizontally || outsideVertically;
}

function isTargetOutsideVisibleArea(target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const viewportLeft = visualViewport?.offsetLeft ?? 0;
  const viewportTop = visualViewport?.offsetTop ?? 0;
  const viewportHeight =
    visualViewport && visualViewport.height > 0
      ? visualViewport.height
      : window.innerHeight;
  const viewportWidth =
    visualViewport && visualViewport.width > 0
      ? visualViewport.width
      : window.innerWidth;
  let bounds = {
    bottom: viewportTop + viewportHeight,
    left: viewportLeft,
    right: viewportLeft + viewportWidth,
    top: viewportTop,
  };

  for (
    let ancestor = target.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      continue;
    }

    const styles = window.getComputedStyle(ancestor);
    const clipsHorizontally = clipsOverflow(
      styles.overflowX || styles.overflow,
    );
    const clipsVertically = clipsOverflow(styles.overflowY || styles.overflow);

    if (!clipsHorizontally && !clipsVertically) {
      continue;
    }

    const ancestorRect = ancestor.getBoundingClientRect();
    bounds = {
      bottom: clipsVertically
        ? Math.min(bounds.bottom, ancestorRect.bottom)
        : bounds.bottom,
      left: clipsHorizontally
        ? Math.max(bounds.left, ancestorRect.left)
        : bounds.left,
      right: clipsHorizontally
        ? Math.min(bounds.right, ancestorRect.right)
        : bounds.right,
      top: clipsVertically
        ? Math.max(bounds.top, ancestorRect.top)
        : bounds.top,
    };
  }

  return isOutsideBounds(rect, bounds);
}

function getScrollIntoViewOptions(
  value: true | ScrollIntoViewOptions,
): ScrollIntoViewOptions {
  const options =
    value === true
      ? defaultScrollIntoViewOptions
      : { ...defaultScrollIntoViewOptions, ...value };
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return prefersReducedMotion ? { ...options, behavior: "instant" } : options;
}

function waitForScrollEnd(
  target: HTMLElement,
  signal: AbortSignal,
  checkAfterAnimationFrame: boolean,
): Promise<void> {
  return new Promise((resolve) => {
    let animationFrame = 0;
    let settleTimer = 0;
    let timeoutTimer = 0;
    const visualViewport = window.visualViewport;

    const cleanup = () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(timeoutTimer);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scrollend", handleScrollEnd, true);
      visualViewport?.removeEventListener("scroll", handleScroll);
      visualViewport?.removeEventListener("scrollend", handleScrollEnd);
      signal.removeEventListener("abort", finish);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const scheduleFinish = (delay: number) => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finish, delay);
    };
    const handleScroll = () => scheduleFinish(scrollEndFallbackDelay);
    const handleScrollEnd = () => scheduleFinish(scrollEndSettleDelay);

    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scrollend", handleScrollEnd, true);
    visualViewport?.addEventListener("scroll", handleScroll);
    visualViewport?.addEventListener("scrollend", handleScrollEnd);
    signal.addEventListener("abort", finish, { once: true });
    timeoutTimer = window.setTimeout(finish, scrollEndTimeout);
    if (checkAfterAnimationFrame) {
      animationFrame = window.requestAnimationFrame(() => {
        if (!isTargetOutsideVisibleArea(target)) {
          scheduleFinish(0);
        }
      });
    }
  });
}

function startTargetScroll(
  step: ResolvedCoachmarkStepProps | null,
  rootValue: boolean | ScrollIntoViewOptions,
  signal: AbortSignal,
): Promise<void> | null {
  const resolvedValue = step?.scrollIntoView ?? rootValue;
  const element = step?.target.current;

  if (
    resolvedValue === false ||
    !element ||
    typeof element.scrollIntoView !== "function" ||
    !isTargetOutsideVisibleArea(element)
  ) {
    return null;
  }

  const scrollOptions = getScrollIntoViewOptions(resolvedValue);
  const scrollFinished = waitForScrollEnd(
    element,
    signal,
    scrollOptions.behavior === "instant",
  );
  element.scrollIntoView(scrollOptions);

  return scrollFinished;
}

function waitForAnimationFrames(
  count: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    let animationFrame = 0;
    let remaining = count;

    const cleanup = () => {
      window.cancelAnimationFrame(animationFrame);
      signal.removeEventListener("abort", finish);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const next = () => {
      if (signal.aborted || remaining <= 0) {
        finish();
        return;
      }

      remaining -= 1;
      animationFrame = window.requestAnimationFrame(next);
    };

    signal.addEventListener("abort", finish, { once: true });
    next();
  });
}

async function waitForRenderedMotion(
  elements: Array<HTMLElement | null>,
  signal: AbortSignal,
): Promise<void> {
  await waitForAnimationFrames(1, signal);
  if (
    signal.aborted ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const animations = Array.from(
    new Set(
      elements.flatMap((element) =>
        element && typeof element.getAnimations === "function"
          ? element
              .getAnimations()
              .filter(
                (animation) =>
                  animation.pending ||
                  animation.playState === "running",
              )
          : [],
      ),
    ),
  );

  if (animations.length === 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    let remaining = animations.length;
    let timeout = 0;

    const cleanup = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const settleAnimation = () => {
      remaining -= 1;
      if (remaining === 0) {
        finish();
      }
    };

    signal.addEventListener("abort", finish, { once: true });
    timeout = window.setTimeout(finish, motionEndTimeout);
    animations.forEach((animation) => {
      void animation.finished.then(settleAnimation, settleAnimation);
    });
  });
}

function getRoundedRectPath(
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
): string {
  return [
    `M ${left + radius} ${top}`,
    `H ${right - radius}`,
    `Q ${right} ${top} ${right} ${top + radius}`,
    `V ${bottom - radius}`,
    `Q ${right} ${bottom} ${right - radius} ${bottom}`,
    `H ${left + radius}`,
    `Q ${left} ${bottom} ${left} ${bottom - radius}`,
    `V ${top + radius}`,
    `Q ${left} ${top} ${left + radius} ${top}`,
    "Z",
  ].join(" ");
}

function getSpotlightGeometry(
  target: HTMLElement,
  padding: number,
  radius: number,
): SpotlightGeometry {
  const rect = target.getBoundingClientRect();
  const left = rect.left - padding;
  const top = rect.top - padding;
  const right = rect.right + padding;
  const bottom = rect.bottom + padding;
  const width = right - left;
  const height = bottom - top;
  const cutoutRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  const outerPath = `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z`;
  const innerPath = getRoundedRectPath(left, top, right, bottom, cutoutRadius);
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const closedInnerPath = getRoundedRectPath(
    centerX,
    centerY,
    centerX,
    centerY,
    0,
  );

  return {
    clipPath: `path(evenodd, "${outerPath} ${innerPath}")`,
    closedClipPath: `path(evenodd, "${outerPath} ${closedInnerPath}")`,
    height,
    left,
    radius: cutoutRadius,
    top,
    width,
  };
}

function useSpotlightGeometry(
  open: boolean,
  target: RefObject<HTMLElement | null> | undefined,
  padding: number,
  radius: number,
): SpotlightGeometry | undefined {
  const [geometry, setGeometry] = useState<SpotlightGeometry>();

  useLayoutEffect(() => {
    if (!open || !target) {
      return;
    }

    let animationFrame = 0;
    let observedElement: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | undefined;

    const measure = (): boolean => {
      const element = target.current;

      if (!element) {
        setGeometry(undefined);
        return false;
      }

      if (element !== observedElement) {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(element);
        observedElement = element;
      }

      setGeometry(getSpotlightGeometry(element, padding, radius));
      return true;
    };
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    if (!measure()) {
      scheduleMeasure();
    }

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("scroll", scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("scroll", scheduleMeasure);
    };
  }, [open, padding, radius, target]);

  return geometry;
}

export const CoachmarkTrigger = forwardRef<HTMLElement, CoachmarkTriggerProps>(
  function CoachmarkTrigger({ handle, ...props }, forwardedRef) {
    const store = useTourStore(handle);
    const previousElement = useRef<HTMLElement | null>(null);
    const mergedRef = useCallback(
      (element: HTMLElement | null) => {
        if (previousElement.current) store.unregisterLauncher(previousElement.current);
        previousElement.current = element;
        setRef(forwardedRef, element);
        if (element) store.registerLauncher(element);
      },
      [forwardedRef, store],
    );

    return (
      <Popover.Trigger
        {...props}
        data-slot="coachmark-trigger"
        handle={store.popoverHandle}
        ref={mergedRef}
      />
    );
  },
);

/** Registers an existing control as a tour target and a native Base UI trigger. */
export const CoachmarkTarget = forwardRef<HTMLElement, CoachmarkTargetProps>(
  function CoachmarkTarget(
    { name, handle, id: idProp, ...props },
    forwardedRef,
  ) {
    const store = useTourStore(handle);
    const generatedId = useId();
    const triggerId = idProp ?? generatedId;
    const elementRef = useRef<HTMLElement | null>(null);
    const registration = useMemo(
      () => ({ triggerId, ref: elementRef }),
      [triggerId],
    );
    const mergedRef = useCallback(
      (element: HTMLElement | null) => {
        elementRef.current = element;
        setRef(forwardedRef, element);
        if (element) store.registerTarget(name, registration);
        else store.unregisterTarget(name, triggerId);
      },
      [forwardedRef, name, registration, store, triggerId],
    );

    return (
      <Popover.Trigger
        {...props}
        data-slot="coachmark-target"
        handle={store.popoverHandle}
        id={triggerId}
        ref={mergedRef}
      />
    );
  },
);

export const CoachmarkBackdrop = forwardRef<
  HTMLDivElement,
  CoachmarkBackdropProps
>(function CoachmarkBackdrop(
  { className, style, ...backdropProps },
  forwardedRef,
) {
  const {
    activeStep,
    concealed,
    motionElementRefs,
    motionState,
    open,
    phase,
    transitioning,
  } = useCoachmarkContext();
  const geometry = useSpotlightGeometry(
    open,
    activeStep?.target,
    activeStep?.spotlightPadding ?? 8,
    activeStep?.spotlightRadius ?? 0,
  );
  const mergedBackdropRef = useCallback(
    (element: HTMLDivElement | null) => {
      motionElementRefs.backdrop.current = element;
      setRef(forwardedRef, element);
    },
    [forwardedRef, motionElementRefs.backdrop],
  );

  return (
    <Popover.Portal>
      <Popover.Backdrop
        {...backdropProps}
        className={className}
        data-concealed={concealed ? "" : undefined}
        data-motion-state={motionState}
        data-phase={phase}
        data-slot="coachmark-backdrop"
        data-transitioning={transitioning ? "" : undefined}
        ref={mergedBackdropRef}
        style={(state) => {
          const resolvedStyle =
            typeof style === "function" ? style(state) : style;
          const spotlightStyle: CSSProperties & SpotlightCustomProperties = {
            ...resolvedStyle,
            "--coachmark-cutout-closed": geometry?.closedClipPath,
            "--coachmark-cutout-open": geometry?.clipPath,
            clipPath: concealed
              ? "none"
              : (resolvedStyle?.clipPath ??
                (geometry
                  ? "var(--coachmark-cutout-path, var(--coachmark-cutout-open))"
                  : undefined)),
            visibility: geometry ? undefined : "hidden",
          };

          return spotlightStyle;
        }}
      />
    </Popover.Portal>
  );
});

export function CoachmarkStep(props: CoachmarkStepProps): null {
  const store = useTourStore();
  const id = useId();
  useLayoutEffect(() => {
    store.registerStep(id, props);
  });
  useLayoutEffect(() => () => store.unregisterStep(id), [id, store]);
  return null;
}

export const CoachmarkPositioner = forwardRef<
  HTMLDivElement,
  CoachmarkPositionerProps
>(function CoachmarkPositioner(
  {
    align = "center",
    children,
    side = "bottom",
    sideOffset,
    style,
    ...positionerProps
  },
  forwardedRef,
) {
  const {
    activeStep,
    concealed,
    motionElementRefs,
    motionState,
    phase,
    transitioning,
  } = useCoachmarkContext();
  const mergedPositionerRef = useCallback(
    (element: HTMLDivElement | null) => {
      motionElementRefs.positioner.current = element;
      setRef(forwardedRef, element);
    },
    [forwardedRef, motionElementRefs.positioner],
  );

  return (
    <Popover.Positioner
      {...positionerProps}
      align={align}
      anchor={activeStep?.target}
      aria-hidden={transitioning || undefined}
      data-concealed={concealed ? "" : undefined}
      data-motion-state={motionState}
      data-phase={phase}
      data-slot="coachmark-positioner"
      data-transitioning={transitioning ? "" : undefined}
      ref={mergedPositionerRef}
      side={side}
      sideOffset={sideOffset}
      style={(state) => {
        const resolvedStyle =
          typeof style === "function" ? style(state) : style;

        return {
          ...resolvedStyle,
          opacity: concealed ? 0 : resolvedStyle?.opacity,
          pointerEvents: transitioning
            ? "none"
            : resolvedStyle?.pointerEvents,
        };
      }}
    >
      {children}
    </Popover.Positioner>
  );
});

export const CoachmarkPopup = forwardRef<HTMLDivElement, CoachmarkPopupProps>(
  function CoachmarkPopup(
    { children, finalFocus, ...popupProps },
    forwardedRef,
  ) {
    const {
      concealed,
      launcherRef,
      motionElementRefs,
      motionState,
      phase,
      transitioning,
    } = useCoachmarkContext();
    const mergedPopupRef = useCallback(
      (element: HTMLDivElement | null) => {
        motionElementRefs.popup.current = element;
        setRef(forwardedRef, element);
      },
      [forwardedRef, motionElementRefs.popup],
    );

    return (
      <Popover.Popup
        {...popupProps}
        data-concealed={concealed ? "" : undefined}
        data-motion-state={motionState}
        data-phase={phase}
        data-slot="coachmark-popup"
        finalFocus={finalFocus ?? launcherRef}
        data-transitioning={transitioning ? "" : undefined}
        ref={mergedPopupRef}
      >
        {children}
      </Popover.Popup>
    );
  },
);

export const CoachmarkViewport = forwardRef<
  HTMLDivElement,
  CoachmarkViewportProps
>(function CoachmarkViewport(
  { children, render, ...elementProps },
  forwardedRef,
) {
  const context = useCoachmarkContext();
  const currentContainerRef = useRef<HTMLDivElement | null>(null);
  const previousContainerRef = useRef<HTMLDivElement | null>(null);
  const capturedContentRef = useRef<HTMLDivElement | null>(null);
  const committedDimensionsRef = useRef<PopupDimensions | null>(null);
  const currentContentKeyRef = useRef(0);
  const popupElementRef = useRef<HTMLElement | null>(null);
  const positionerElementRef = useRef<HTMLElement | null>(null);
  const previousStepIndexRef = useRef(context.stepIndex);
  const animationFrameRef = useRef(0);
  const [snapshot, setSnapshot] = useState<ViewportSnapshot | null>(null);
  const [starting, setStarting] = useState(false);

  const captureCurrentContent = useCallback(() => {
    const currentContainer = currentContainerRef.current;
    if (currentContainer) {
      capturedContentRef.current = cloneElementContents(currentContainer);
    }
  }, []);

  useLayoutEffect(() => {
    const currentContainer = currentContainerRef.current;
    const popup = currentContainer?.closest<HTMLElement>(
      '[data-slot="coachmark-popup"]',
    );
    const positioner = popup?.closest<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );

    if (!popup || !positioner || !currentContainer) {
      return;
    }

    popupElementRef.current = popup;
    positionerElementRef.current = positioner;

    const nextDimensions = measureNaturalPopup(popup, positioner);
    const previousDimensions = committedDimensionsRef.current;
    const stepChanged = previousStepIndexRef.current !== context.stepIndex;
    const previousContent = capturedContentRef.current;

    previousStepIndexRef.current = context.stepIndex;
    committedDimensionsRef.current = nextDimensions;
    setPositionerDimensions(positioner, nextDimensions);

    if (
      stepChanged &&
      previousDimensions &&
      previousContent &&
      !context.concealed
    ) {
      setPopupDimensions(popup, previousDimensions);
      popup.getBoundingClientRect();
      currentContentKeyRef.current += 1;
      setSnapshot({
        dimensions: previousDimensions,
        node: previousContent,
      });
      setStarting(true);
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = window.requestAnimationFrame(() => {
        setPopupDimensions(popup, nextDimensions);
        animationFrameRef.current = window.requestAnimationFrame(() => {
          flushSync(() => setStarting(false));
        });
      });
    } else {
      setPopupDimensions(popup, nextDimensions);
      setSnapshot(null);
      setStarting(false);
    }

    captureCurrentContent();
  }, [
    captureCurrentContent,
    context.concealed,
    context.motionElementRefs.popup,
    context.motionElementRefs.positioner,
    context.stepIndex,
  ]);

  useLayoutEffect(() => {
    const previousContainer = previousContainerRef.current;
    if (!previousContainer || !snapshot) {
      return;
    }

    previousContainer.replaceChildren(...Array.from(snapshot.node.childNodes));
  }, [snapshot]);

  useLayoutEffect(() => {
    if (!snapshot || starting) {
      return;
    }

    const controller = new AbortController();
    void waitForRenderedMotion(
      [previousContainerRef.current, currentContainerRef.current],
      controller.signal,
    ).then(() => {
      if (controller.signal.aborted) {
        return;
      }

      setSnapshot(null);
      captureCurrentContent();
    });

    return () => controller.abort();
  }, [captureCurrentContent, snapshot, starting]);

  useLayoutEffect(() => {
    if (context.transitioning) {
      return;
    }

    setSnapshot(null);
    setStarting(false);
    captureCurrentContent();
  }, [captureCurrentContent, context.transitioning]);

  useLayoutEffect(() => {
    const currentContainer = currentContainerRef.current;
    const popup = currentContainer?.closest<HTMLElement>(
      '[data-slot="coachmark-popup"]',
    );
    const positioner = popup?.closest<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );

    if (!currentContainer || !popup || !positioner) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (context.transitioning) {
        return;
      }

      const dimensions = measureNaturalPopup(popup, positioner);
      committedDimensionsRef.current = dimensions;
      setPopupDimensions(popup, dimensions);
      setPositionerDimensions(positioner, dimensions);
      captureCurrentContent();
    });
    observer.observe(currentContainer);

    return () => observer.disconnect();
  }, [
    captureCurrentContent,
    context.motionElementRefs.popup,
    context.motionElementRefs.positioner,
    context.transitioning,
  ]);

  useLayoutEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      const popup = popupElementRef.current;
      const positioner = positionerElementRef.current;
      popup?.style.removeProperty("--popup-height");
      popup?.style.removeProperty("--popup-width");
      positioner?.style.removeProperty("--positioner-height");
      positioner?.style.removeProperty("--positioner-width");
    },
    [context.motionElementRefs.popup, context.motionElementRefs.positioner],
  );

  const viewportState: CoachmarkViewportState = {
    ...getPartState(context),
    activationDirection: context.activationDirection,
    transitioning: snapshot !== null,
  };
  const previousStyle: CSSProperties & PopupSizeCustomProperties = snapshot
    ? {
        "--popup-height": `${snapshot.dimensions.height}px`,
        "--popup-width": `${snapshot.dimensions.width}px`,
        position: "absolute",
      }
    : {};
  const content = (
    <>
      {snapshot ? (
        <div
          aria-hidden="true"
          data-ending-style={starting ? undefined : ""}
          data-previous=""
          inert
          ref={previousContainerRef}
          style={previousStyle}
        />
      ) : null}
      <div
        data-current=""
        data-starting-style={snapshot && starting ? "" : undefined}
        key={currentContentKeyRef.current}
        ref={currentContainerRef}
      >
        {children}
      </div>
    </>
  );

  return useRender({
    defaultTagName: "div",
    props: mergeProps(
      {
        children: content,
        "data-slot": "coachmark-viewport",
      },
      elementProps,
    ),
    ref: forwardedRef,
    render,
    state: viewportState,
    stateAttributesMapping: {
      ...coachmarkPartStateAttributesMapping,
      activationDirection: (value) =>
        value ? { "data-activation-direction": value } : null,
    },
  });
});

export const CoachmarkStepper = forwardRef<
  HTMLDivElement,
  CoachmarkStepperProps
>(function CoachmarkStepper(
  { children, render, ...elementProps },
  forwardedRef,
) {
  const context = useCoachmarkContext();
  const content =
    typeof children === "function"
      ? children(context)
      : children;

  return useRender({
    defaultTagName: "div",
    props: mergeProps(
      { children: content, "data-slot": "coachmark-stepper" },
      elementProps,
    ),
    ref: forwardedRef,
    render,
    state: getPartState(context),
    stateAttributesMapping: coachmarkPartStateAttributesMapping,
  });
});

export const CoachmarkPrevious = forwardRef<
  HTMLButtonElement,
  CoachmarkPreviousProps
>(function CoachmarkPrevious(
  { children, keepMounted = false, render, ...elementProps },
  forwardedRef,
) {
  const context = useCoachmarkContext();
  const content =
    typeof children === "function" ? children(context) : children;

  return useRender({
    defaultTagName: "button",
    enabled: keepMounted || !context.isFirstStep,
    props: mergeProps(
      {
        children: content,
        "data-slot": "coachmark-previous",
        disabled: context.isFirstStep,
        onClick: context.previous,
        type: "button",
      },
      elementProps,
    ),
    ref: forwardedRef,
    render,
    state: getPartState(context),
    stateAttributesMapping: coachmarkPartStateAttributesMapping,
  });
});

export const CoachmarkNext = forwardRef<HTMLButtonElement, CoachmarkNextProps>(
  function CoachmarkNext({ children, render, ...elementProps }, forwardedRef) {
    const context = useCoachmarkContext();
    const content =
      typeof children === "function" ? children(context) : children;

    return useRender({
      defaultTagName: "button",
      props: mergeProps(
        {
          children: content,
          "data-slot": context.isLastStep
            ? "coachmark-finish"
            : "coachmark-next",
          onClick: context.next,
          type: "button",
        },
        elementProps,
      ),
      ref: forwardedRef,
      render,
      state: getPartState(context),
      stateAttributesMapping: coachmarkPartStateAttributesMapping,
    });
  },
);

export const CoachmarkTitle = forwardRef<
  HTMLHeadingElement,
  Popover.Title.Props
>(function CoachmarkTitle(props, forwardedRef) {
  return (
    <Popover.Title
      {...props}
      data-slot="coachmark-title"
      ref={forwardedRef}
    />
  );
});

export const CoachmarkArrow = forwardRef<HTMLDivElement, CoachmarkArrowProps>(
  function CoachmarkArrow(props, forwardedRef) {
    return (
      <Popover.Arrow
        {...props}
        data-slot="coachmark-arrow"
        ref={forwardedRef}
      />
    );
  },
);

export const CoachmarkDescription = forwardRef<
  HTMLParagraphElement,
  Popover.Description.Props
>(function CoachmarkDescription(props, forwardedRef) {
  return (
    <Popover.Description
      {...props}
      data-slot="coachmark-description"
      ref={forwardedRef}
    />
  );
});

export const CoachmarkClose = forwardRef<
  HTMLButtonElement,
  Popover.Close.Props
>(function CoachmarkClose(props, forwardedRef) {
  return (
    <Popover.Close
      {...props}
      data-slot="coachmark-close"
      ref={forwardedRef}
    />
  );
});

export function useCoachmark(): CoachmarkRenderState {
  return useCoachmarkContext();
}

export function CoachmarkRoot({
  children,
  handle,
  open,
  defaultOpen = false,
  onOpenChange,
  stepIndex,
  defaultStepIndex = 0,
  onStepChange,
  modal = true,
  resetOnOpen = true,
  scrollIntoView = true,
}: CoachmarkProps): ReactElement {
  const [ownHandle] = useState(createCoachmarkHandle);
  const store = getTourStore(handle ?? ownHandle);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const rootOwner = useRef({}).current;
  useLayoutEffect(() => store.attachRoot(rootOwner), [rootOwner, store]);
  const missingTargetRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLElement | null>(null);
  const popoverActionsRef = useRef<Popover.Root.Actions | null>(null);
  const closeActionRef = useRef<"close" | "finish" | undefined>(undefined);
  const backdropMotionRef = useRef<HTMLElement | null>(null);
  const popupMotionRef = useRef<HTMLElement | null>(null);
  const positionerMotionRef = useRef<HTMLElement | null>(null);
  const motionElementRefs = useMemo(
    () => ({
      backdrop: backdropMotionRef,
      popup: popupMotionRef,
      positioner: positionerMotionRef,
    }),
    [],
  );
  const steps = useMemo(
    () =>
      [...snapshot.steps]
        .sort((a, b) => (a.props.order ?? 0) - (b.props.order ?? 0))
        .map((step) => ({
          ...step,
          props: {
            ...step.props,
            target:
              typeof step.props.target === "string"
                ? (snapshot.targets.get(step.props.target)?.ref ??
                  missingTargetRef)
                : step.props.target,
          },
        })),
    [snapshot],
  );
  const stepCount = steps.length;
  const [resolvedOpen, setResolvedOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
  });
  const resolvedOpenRef = useRef(resolvedOpen);
  useLayoutEffect(() => {
    resolvedOpenRef.current = resolvedOpen;
  }, [resolvedOpen]);
  const [resolvedStepIndex, setResolvedStepIndex] = useControllableState({
    value: stepIndex,
    defaultValue: defaultStepIndex,
  });
  const safeStepIndex = Math.max(
    0,
    Math.min(resolvedStepIndex, Math.max(stepCount - 1, 0)),
  );
  const activeStepElement = steps[safeStepIndex];
  const activeStep = activeStepElement?.props ?? null;
  const activeNamedTarget =
    typeof snapshot.steps.find((step) => step.id === activeStepElement?.id)
      ?.props.target === "string";
  const activeTarget = [...snapshot.targets.values()].find(
    (target) => target.ref === activeStep?.target,
  );
  const targetReady = !activeNamedTarget || !!activeStep?.target.current;
  const openAbortRef = useRef<AbortController | null>(null);
  const openStepIndexRef = useRef<number | null>(null);
  const transitionAbortRef = useRef<AbortController | null>(null);
  const transitionSourceIndexRef = useRef<number | null>(null);
  const committingStepRef = useRef(false);
  const presentedStepIndexRef = useRef(safeStepIndex);
  const [presentedOpen, setPresentedOpen] = useState(false);
  const [phase, setPhase] = useState<CoachmarkPresentationPhase>("closed");
  const [concealed, setConcealed] = useState(false);
  const [activationDirection, setActivationDirection] = useState<string>();
  const motionState = getMotionState(phase);
  const transitioning =
    phase === "entering" ||
    phase === "exiting" ||
    phase === "scrolling" ||
    phase === "positioning";

  const abortOpenPreparation = useCallback(() => {
    openAbortRef.current?.abort();
    openAbortRef.current = null;
    openStepIndexRef.current = null;
  }, []);
  const abortStepTransition = useCallback(() => {
    transitionAbortRef.current?.abort();
    transitionAbortRef.current = null;
    transitionSourceIndexRef.current = null;
    committingStepRef.current = false;
    setConcealed(false);
  }, []);
  const cancelStepTransition = useCallback(() => {
    abortStepTransition();
    setPhase(presentedOpen ? "idle" : "closed");
  }, [abortStepTransition, presentedOpen]);

  useLayoutEffect(() => {
    if (!resolvedOpen || stepCount === 0 || !targetReady) {
      abortOpenPreparation();
      abortStepTransition();
      setActivationDirection(undefined);
      setPresentedOpen(false);
      setPhase("closed");
      return;
    }

    if (presentedOpen) {
      return;
    }

    if (openAbortRef.current) {
      if (openStepIndexRef.current === safeStepIndex) {
        return;
      }

      abortOpenPreparation();
    }

    const controller = new AbortController();
    openAbortRef.current = controller;
    openStepIndexRef.current = safeStepIndex;
    setPhase("preparing-open");

    void (async () => {
      const scrollFinished = startTargetScroll(
        activeStep,
        scrollIntoView,
        controller.signal,
      );

      if (scrollFinished) {
        await scrollFinished;
      }
      if (controller.signal.aborted) {
        return;
      }

      setPhase("entering");
      setPresentedOpen(true);
      await waitForAnimationFrames(2, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      openAbortRef.current = null;
      openStepIndexRef.current = null;
      setPhase("idle");
    })();
  }, [
    abortOpenPreparation,
    abortStepTransition,
    activeStep,
    presentedOpen,
    resolvedOpen,
    safeStepIndex,
    scrollIntoView,
    stepCount,
    targetReady,
  ]);

  const updateStep = useCallback(
    (nextIndex: number) => {
      if (stepCount === 0) {
        return;
      }

      const next = Math.max(0, Math.min(nextIndex, stepCount - 1));
      setResolvedStepIndex(next);
      onStepChange?.(next);
    },
    [onStepChange, setResolvedStepIndex, stepCount],
  );
  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (stepCount === 0 || phase !== "idle") {
        return;
      }

      const next = Math.max(0, Math.min(nextIndex, stepCount - 1));
      if (next === safeStepIndex) {
        return;
      }

      const nextStep = steps[next]?.props;
      const scrollValue = nextStep?.scrollIntoView ?? scrollIntoView;
      const element = nextStep?.target.current;
      const shouldScroll =
        scrollValue !== false &&
        element != null &&
        typeof element.scrollIntoView === "function" &&
        isTargetOutsideVisibleArea(element);

      const controller = new AbortController();
      transitionAbortRef.current = controller;
      transitionSourceIndexRef.current = safeStepIndex;
      setConcealed(shouldScroll);
      setPhase("exiting");

      void (async () => {
        await waitForRenderedMotion(
          [
            shouldScroll ? null : motionElementRefs.backdrop.current,
            motionElementRefs.positioner.current,
            motionElementRefs.popup.current,
          ],
          controller.signal,
        );
        if (controller.signal.aborted) {
          return;
        }

        if (shouldScroll) {
          setPhase("scrolling");
          const scrollFinished = startTargetScroll(
            nextStep ?? null,
            scrollIntoView,
            controller.signal,
          );
          if (scrollFinished) {
            await scrollFinished;
          }
          if (controller.signal.aborted) {
            return;
          }
        }

        setActivationDirection(
          getActivationDirection(
            activeStep?.target.current,
            nextStep?.target.current,
          ),
        );
        setPhase("positioning");
        committingStepRef.current = true;
        updateStep(next);
        await waitForAnimationFrames(2, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        if (!shouldScroll) {
          await waitForRenderedMotion(
            [
              motionElementRefs.backdrop.current,
              motionElementRefs.positioner.current,
              motionElementRefs.popup.current,
            ],
            controller.signal,
          );
          if (controller.signal.aborted) {
            return;
          }
        }

        setPhase("entering");
        await waitForAnimationFrames(1, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        transitionAbortRef.current = null;
        transitionSourceIndexRef.current = null;
        committingStepRef.current = false;
        setConcealed(false);
        setPhase("idle");
      })();
    },
    [
      motionElementRefs,
      activeStep,
      phase,
      safeStepIndex,
      scrollIntoView,
      stepCount,
      steps,
      updateStep,
    ],
  );
  const requestClose = useCallback((action: "close" | "finish") => {
    if (!resolvedOpenRef.current || closeActionRef.current) {
      return;
    }

    closeActionRef.current = action;
    try {
      popoverActionsRef.current?.close();
    } finally {
      closeActionRef.current = undefined;
    }
  }, []);
  const close = useCallback(() => requestClose("close"), [requestClose]);
  const finish = useCallback(() => {
    requestClose("finish");
  }, [requestClose]);
  const next = useCallback(() => {
    if (safeStepIndex >= stepCount - 1) {
      finish();
    } else {
      transitionTo(safeStepIndex + 1);
    }
  }, [finish, safeStepIndex, stepCount, transitionTo]);
  const previous = useCallback(
    () => transitionTo(safeStepIndex - 1),
    [safeStepIndex, transitionTo],
  );

  useLayoutEffect(() => {
    if (
      transitionAbortRef.current &&
      !committingStepRef.current &&
      transitionSourceIndexRef.current !== safeStepIndex
    ) {
      cancelStepTransition();
    }
  }, [cancelStepTransition, safeStepIndex]);

  useLayoutEffect(() => {
    if (!presentedOpen) {
      presentedStepIndexRef.current = safeStepIndex;
      return;
    }

    if (committingStepRef.current) {
      presentedStepIndexRef.current = safeStepIndex;
      return;
    }

    if (
      phase !== "idle" ||
      presentedStepIndexRef.current === safeStepIndex ||
      transitionAbortRef.current
    ) {
      return;
    }

    const previousStep = steps[presentedStepIndexRef.current]?.props;
    setActivationDirection(
      getActivationDirection(
        previousStep?.target.current,
        activeStep?.target.current,
      ),
    );
    presentedStepIndexRef.current = safeStepIndex;
    const scrollValue = activeStep?.scrollIntoView ?? scrollIntoView;
    const element = activeStep?.target.current;

    if (
      scrollValue === false ||
      !element ||
      typeof element.scrollIntoView !== "function" ||
      !isTargetOutsideVisibleArea(element)
    ) {
      return;
    }

    const controller = new AbortController();
    transitionAbortRef.current = controller;
    transitionSourceIndexRef.current = safeStepIndex;
    setConcealed(true);
    setPhase("scrolling");

    void (async () => {
      await waitForAnimationFrames(1, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      const scrollFinished = startTargetScroll(
        activeStep,
        scrollIntoView,
        controller.signal,
      );
      if (scrollFinished) {
        await scrollFinished;
      }
      if (controller.signal.aborted) {
        return;
      }

      setPhase("positioning");
      await waitForAnimationFrames(2, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      setPhase("entering");
      await waitForAnimationFrames(1, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      transitionAbortRef.current = null;
      transitionSourceIndexRef.current = null;
      setConcealed(false);
      setPhase("idle");
    })();
  }, [activeStep, phase, presentedOpen, safeStepIndex, scrollIntoView, steps]);

  useLayoutEffect(
    () => () => {
      openAbortRef.current?.abort();
      transitionAbortRef.current?.abort();
    },
    [],
  );
  const context = useMemo<InternalCoachmarkContextValue>(
    () => ({
      activeStep,
      activationDirection,
      launcherRef,
      close,
      concealed,
      finish,
      goTo: transitionTo,
      isFirstStep: safeStepIndex === 0,
      isLastStep: stepCount > 0 && safeStepIndex === stepCount - 1,
      motionElementRefs,
      motionState,
      next,
      open: presentedOpen && stepCount > 0,
      phase,
      previous,
      stepCount,
      stepIndex: safeStepIndex,
      transitioning,
    }),
    [
      activeStep,
      activationDirection,
      close,
      concealed,
      finish,
      motionElementRefs,
      motionState,
      next,
      phase,
      presentedOpen,
      previous,
      safeStepIndex,
      stepCount,
      transitioning,
      transitionTo,
    ],
  );

  return (
    <TourStoreContext.Provider value={store}>
      <InternalCoachmarkContext.Provider value={context}>
        <Popover.Root
          actionsRef={popoverActionsRef}
          handle={store.popoverHandle}
          triggerId={
            activeTarget?.triggerId ??
            (launcherRef.current?.isConnected ? launcherRef.current.id : undefined) ??
            snapshot.launchers.values().next().value?.id ??
            null
          }
          modal={modal}
          onOpenChange={(nextOpen, details) => {
            if (
              details.reason.startsWith("trigger-") &&
              store.isTarget(details.trigger)
            ) {
              details.cancel();
              return;
            }
            if (!nextOpen && !resolvedOpenRef.current) {
              details.cancel();
              return;
            }
            if (nextOpen && stepCount === 0) {
              details.cancel();
              return;
            }
            const eventDetails: CoachmarkOpenChangeEventDetails = details;
            if (!nextOpen && closeActionRef.current) {
              eventDetails.action = closeActionRef.current;
            }

            onOpenChange?.(nextOpen, eventDetails);
            if (details.isCanceled) {
              return;
            }

            if (nextOpen && details.trigger instanceof HTMLElement) {
              launcherRef.current = details.trigger;
            }
            if (nextOpen && resetOnOpen) {
              updateStep(0);
            } else if (!nextOpen && eventDetails.action === "finish") {
              updateStep(stepCount - 1);
            }
            // A controlled parent owns whether this request changes the open state.
            // Uncontrolled requests update the ref immediately to coalesce repeated
            // hook calls before React commits the closed state.
            if (open === undefined) {
              resolvedOpenRef.current = nextOpen;
            }
            setResolvedOpen(nextOpen);
          }}
          open={presentedOpen && stepCount > 0}
        >
          {children}
          <Popover.Portal>{activeStep?.children}</Popover.Portal>
        </Popover.Root>
      </InternalCoachmarkContext.Provider>
    </TourStoreContext.Provider>
  );
}

/**
 * Compound Coachmark API. The component itself remains usable as the root for
 * backwards compatibility, while its parts are also available as properties.
 */
export const Coachmark = Object.assign(CoachmarkRoot, {
  createHandle: createCoachmarkHandle,
  Arrow: CoachmarkArrow,
  Backdrop: CoachmarkBackdrop,
  Close: CoachmarkClose,
  Description: CoachmarkDescription,
  Next: CoachmarkNext,
  Popup: CoachmarkPopup,
  Positioner: CoachmarkPositioner,
  Previous: CoachmarkPrevious,
  Root: CoachmarkRoot,
  Step: CoachmarkStep,
  Stepper: CoachmarkStepper,
  Title: CoachmarkTitle,
  Target: CoachmarkTarget,
  Trigger: CoachmarkTrigger,
  Viewport: CoachmarkViewport,
});

function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const resolvedValue = value === undefined ? internalValue : value;
  const setValue = useCallback(
    (next: T) => {
      if (value === undefined) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [onChange, value],
  );

  return [resolvedValue, setValue];
}
