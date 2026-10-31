import { useLayoutEffect, type RefObject } from "react";

const locks = new WeakMap<
  HTMLElement,
  { count: number; original: string | null }
>();

/** Restrict only the target region of a non-interactive step, not the page. */
export function useTargetInert(
  element: HTMLElement | null | undefined,
  enabled: boolean,
  popupRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    if (!enabled || !element) return;
    let lock = locks.get(element);
    if (!lock) {
      lock = { count: 0, original: element.getAttribute("inert") };
      locks.set(element, lock);
    }
    lock.count++;
    if (element.contains(element.ownerDocument.activeElement)) {
      popupRef.current?.focus({ preventScroll: true });
    }
    element.setAttribute("inert", "");
    return () => {
      if (--lock.count > 0) return;
      if (lock.original === null) element.removeAttribute("inert");
      else element.setAttribute("inert", lock.original);
      locks.delete(element);
    };
  }, [element, enabled, popupRef]);
}
