import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { hideOthers } from "aria-hidden";
import { isFocusable, tabbable } from "tabbable";

type OutsidePress = MouseEvent | PointerEvent | TouchEvent;

interface ModalBoundaryOptions {
  enabled: boolean;
  blockOutsidePointer: boolean;
  getRegions: () => HTMLElement[];
  triggerElements: Set<HTMLElement>;
  interactionGesture: RefObject<boolean>;
  interactionEvents: WeakSet<Event>;
  onOutsidePress: (event: OutsidePress) => void;
}

interface BoundaryEntry {
  refresh: (force?: boolean) => void;
  suspend: () => void;
}

const boundaryStacks = new WeakMap<Document, BoundaryEntry[]>();

/** Expands modality to disjoint DOM regions without depending on Base UI internals. */
export function useModalBoundary({
  enabled,
  blockOutsidePointer,
  getRegions,
  triggerElements,
  interactionGesture,
  interactionEvents,
  onOutsidePress,
}: ModalBoundaryOptions): () => boolean {
  const refreshRef = useRef<(() => void) | null>(null);
  const activeRef = useRef<() => boolean>(() => false);
  const isActive = useCallback(() => activeRef.current(), []);

  useLayoutEffect(() => {
    if (!enabled) return;

    const ownerDocument = getRegions()[0]?.ownerDocument ?? document;
    const stack = boundaryStacks.get(ownerDocument) ?? [];
    boundaryStacks.set(ownerDocument, stack);
    let undoAccessibility: (() => void) | undefined;
    let previousRegions: HTMLElement[] = [];
    let lastFocused: HTMLElement | null = null;
    let touchStart: { x: number; y: number } | null = null;
    let touchMoved = false;
    const contains = (element: HTMLElement, node: EventTarget | null) =>
      node != null && "nodeType" in node && element.contains(node as Node);
    const isAllowed = (node: EventTarget | null) =>
      getRegions().some((element) => contains(element, node)) ||
      [...triggerElements].some((element) => contains(element, node));
    const isAllowedEvent = (event: Event) =>
      interactionEvents.has(event) || event.composedPath().some(isAllowed);
    // A real backdrop already intercepts the control underneath. Let its own
    // handlers and Base UI's dismissal pipeline receive those presses.
    const isBackdropEvent = (event: Event) =>
      event
        .composedPath()
        .some(
          (node) =>
            "getAttribute" in node &&
            (node as Element).getAttribute("data-slot") ===
              "coachmark-backdrop",
        );
    const refresh = (force = false) => {
      if (!isActive()) return;
      const regions = [...getRegions(), ...triggerElements];
      if (
        !force &&
        regions.length === previousRegions.length &&
        regions.every((region, index) => region === previousRegions[index])
      )
        return;
      const active = ownerDocument.activeElement;
      const focusLeftScope =
        previousRegions.some((region) => region.contains(active)) &&
        !isAllowed(active);
      const focusedControlRemoved =
        active === ownerDocument.body &&
        lastFocused &&
        !lastFocused.isConnected &&
        previousRegions.some((region) => region.contains(lastFocused));
      if (focusLeftScope || focusedControlRemoved) {
        regions[0]?.focus({ preventScroll: true });
      }
      undoAccessibility?.();
      previousRegions = regions;
      undoAccessibility = regions.length
        ? hideOthers(regions, ownerDocument.body)
        : undefined;
    };
    const entry: BoundaryEntry = {
      refresh,
      suspend: () => {
        undoAccessibility?.();
        undoAccessibility = undefined;
        previousRegions = [];
      },
    };
    stack[stack.length - 1]?.suspend();
    stack.push(entry);
    activeRef.current = () => stack[stack.length - 1] === entry;
    refreshRef.current = refresh;
    refresh();
    // Refs can mount after opening, including menus in unrelated React portals.
    const observer = new MutationObserver(() => refresh(true));
    observer.observe(ownerDocument.body, { childList: true, subtree: true });

    const onFocusIn = (event: FocusEvent) => {
      if (!isActive()) return;
      if (isAllowed(event.target)) {
        lastFocused = event.target as HTMLElement;
        return;
      }
      event.stopPropagation();
      const destination =
        lastFocused?.isConnected &&
        isAllowed(lastFocused) &&
        isFocusable(lastFocused)
          ? lastFocused
          : getRegions()[0];
      destination?.focus({ preventScroll: true });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !isActive() ||
        event.key !== "Tab" ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;

      const regions = getRegions();
      const active = ownerDocument.activeElement;
      // Owned popups retain their own keyboard handling and modal focus guards.
      const childPopup = active?.closest(
        '[role="dialog"], [role="listbox"], [role="menu"]',
      );
      if (
        childPopup &&
        childPopup !== regions[0] &&
        (regions[0]?.contains(childPopup) ||
          regions.slice(2).some((region) => region.contains(childPopup)))
      )
        return;
      const direction = event.shiftKey ? -1 : 1;
      const regionIndex = regions.findIndex((region) =>
        region.contains(active),
      );
      const controls =
        regionIndex < 0
          ? []
          : tabbable(regions[regionIndex], {
              includeContainer: true,
            });
      const index = controls.indexOf(active as HTMLElement);
      const next = index + direction;
      event.preventDefault();
      if (index < 0 && direction > 0 && controls[0]) {
        controls[0].focus();
        return;
      }
      if (index >= 0 && next >= 0 && next < controls.length) {
        controls[next].focus();
        return;
      }
      for (let offset = 1; offset <= regions.length; offset++) {
        const nextRegion =
          (regionIndex + direction * offset + regions.length * 2) %
          regions.length;
        const region = regions[nextRegion];
        if (nextRegion === 0) {
          // Returning to the popup lets its nonmodal Base UI portal restore tab stops.
          region.focus({ preventScroll: true });
        }
        const candidates = tabbable(region, { includeContainer: true });
        const destination =
          direction > 0 ? candidates[0] : candidates[candidates.length - 1];
        if (destination) {
          destination.focus();
          return;
        }
      }
      regions[0]?.focus({ preventScroll: true });
    };
    const block = (event: Event) => {
      // Touch start must remain cancelable by the browser's pinch-zoom gesture.
      // Movement and activation are intercepted separately.
      if (event.cancelable && event.type !== "touchstart")
        event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onPressStart = (event: Event) => {
      if (!isActive()) return;
      if (isAllowedEvent(event) || isBackdropEvent(event)) return;
      if (event.type === "touchstart") {
        const touch = (event as TouchEvent).touches[0];
        touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
        touchMoved = (event as TouchEvent).touches.length > 1;
      }
      block(event);
    };
    const onMove = (event: Event) => {
      if (!isActive()) return;
      if (isAllowedEvent(event) || interactionGesture.current) return;
      if (
        event.type === "touchmove" &&
        (event as TouchEvent).touches.length > 1
      ) {
        touchMoved = true;
        event.stopImmediatePropagation();
        return;
      }
      if (isBackdropEvent(event)) return;
      if (event.type === "touchmove" && touchStart) {
        const touch = (event as TouchEvent).touches[0];
        if (
          touch &&
          Math.hypot(
            touch.clientX - touchStart.x,
            touch.clientY - touchStart.y,
          ) > 10
        ) {
          touchMoved = true;
        }
      }
      block(event);
    };
    const onZoom = (event: WheelEvent) => {
      if (isActive() && event.ctrlKey && !isAllowedEvent(event))
        event.stopImmediatePropagation();
    };
    const onPressEnd = (event: Event) => {
      if (!isActive()) return;
      if (
        isAllowedEvent(event) ||
        isBackdropEvent(event) ||
        interactionGesture.current
      )
        return;
      block(event);
      if (
        event.type === "click" ||
        (event.type === "touchend" && !touchMoved)
      ) {
        onOutsidePress(event as OutsidePress);
      }
      touchStart = null;
    };
    ownerDocument.addEventListener("focusin", onFocusIn, true);
    ownerDocument.addEventListener("keydown", onKeyDown);
    if (blockOutsidePointer) {
      ownerDocument.addEventListener("wheel", onZoom, {
        capture: true,
        passive: true,
      });
      for (const type of [
        "pointerdown",
        "mousedown",
        "touchstart",
        "contextmenu",
      ]) {
        ownerDocument.addEventListener(type, onPressStart, {
          capture: true,
          passive: false,
        });
      }
      for (const type of ["pointermove", "mousemove", "touchmove"]) {
        ownerDocument.addEventListener(type, onMove, {
          capture: true,
          passive: false,
        });
      }
      for (const type of ["pointerup", "mouseup", "touchend", "click"]) {
        ownerDocument.addEventListener(type, onPressEnd, {
          capture: true,
          passive: false,
        });
      }
    }
    return () => {
      refreshRef.current = null;
      observer.disconnect();
      undoAccessibility?.();
      const wasActive = isActive();
      stack.splice(stack.indexOf(entry), 1);
      activeRef.current = () => false;
      if (wasActive) stack[stack.length - 1]?.refresh(true);
      if (!stack.length) boundaryStacks.delete(ownerDocument);
      ownerDocument.removeEventListener("focusin", onFocusIn, true);
      ownerDocument.removeEventListener("keydown", onKeyDown);
      ownerDocument.removeEventListener("wheel", onZoom, true);
      for (const type of [
        "pointerdown",
        "mousedown",
        "touchstart",
        "contextmenu",
      ]) {
        ownerDocument.removeEventListener(type, onPressStart, true);
      }
      for (const type of ["pointermove", "mousemove", "touchmove"]) {
        ownerDocument.removeEventListener(type, onMove, true);
      }
      for (const type of ["pointerup", "mouseup", "touchend", "click"]) {
        ownerDocument.removeEventListener(type, onPressEnd, true);
      }
    };
  }, [
    enabled,
    blockOutsidePointer,
    getRegions,
    triggerElements,
    interactionGesture,
    interactionEvents,
    onOutsidePress,
    isActive,
  ]);

  // Ref arrays can change without a DOM mutation or a step-index change.
  useLayoutEffect(() => refreshRef.current?.());
  return isActive;
}
