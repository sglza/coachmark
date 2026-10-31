import { useCallback, type Ref } from "react";
import { useRender } from "@base-ui/react/use-render";

interface TargetRegionProps {
  elementProps: useRender.ComponentProps<"div">;
  nativeRef: Ref<HTMLElement> | undefined;
  registrationRef: Ref<HTMLElement>;
  nativeButton: boolean;
  onNativeButtonChange: (value: boolean) => void;
}

function assignRef(
  ref: Ref<HTMLElement> | undefined,
  element: HTMLElement | null,
) {
  if (typeof ref === "function") ref(element);
  else if (ref) ref.current = element;
}

/**
 * Use Base UI's trigger registration, without applying its button props or events
 * to a target region. Only the registration ref crosses this adapter boundary.
 */
export function TargetRegion({
  elementProps: { render, ...elementProps },
  nativeRef,
  registrationRef,
  nativeButton,
  onNativeButtonChange,
}: TargetRegionProps) {
  const nativeRegistrationRef = useCallback(
    (element: HTMLElement | null) => {
      const isButton = element?.tagName === "BUTTON";
      if (element && isButton !== nativeButton) {
        // Classify custom render components by their actual DOM node. Defer the
        // Base UI ref until its native-button validation matches that node.
        assignRef(nativeRef, null);
        onNativeButtonChange(isButton);
      } else {
        assignRef(nativeRef, element);
      }
    },
    [nativeRef, nativeButton, onNativeButtonChange],
  );

  return useRender({
    defaultTagName: "div",
    render,
    props: { ...elementProps, "data-slot": "coachmark-target" },
    ref: [registrationRef, nativeRegistrationRef],
  });
}
