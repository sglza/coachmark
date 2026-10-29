---
"coachmark": minor
---

Keep tours modal by default and enable target interaction through the new `allowTargetInteraction` option, which defaults to true and supports per-step overrides. The popup, target, and registered `interactionRefs` share an allowed boundary while page scrolling and unrelated interaction remain blocked. Set `allowTargetInteraction={false}` to retain the previous popup-only behavior. Preserve pointer/touch gestures, keyboard access, associated portals, and cancelable outside dismissal through `onOpenChange`.
