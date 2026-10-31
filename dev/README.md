# Coachmark playground

This app is the library's visual test environment. It imports Coachmark from `../dist/index.js`, so the UI always exercises the same build that a package consumer receives. The controls use targeted components copied from the Coss UI registry; they and Tailwind are development-only and are not included in the published package.

The default uses Base UI's native modal behavior: page scrolling and outside pointer interaction are restricted. The workspace tabs are interactive outside a tour. The proposed `allowTargetInteraction` API is pending a supported way to extend Base UI's modal interaction boundary.

To try a persistent tour while exploring the page, choose Non-modal, turn off Backdrop, and enable Keep open on outside interaction before starting the tour. Clicking other controls or moving keyboard focus outside then keeps the current step open. In modal mode, the toggle prevents outside dismissal while keeping background controls blocked. Escape, Skip, and Finish still close the tour. The toggle demonstrates canceling `outside-press` and `focus-out` requests through `onOpenChange`; the generated code includes that handler when enabled.

## Composition preview

The separate **1.0 composition preview** demonstrates named button targets in `workspace-controls.tsx`, `team-actions.tsx`, and `preference-control.tsx`. Instructions live in `tour-instructions.tsx`; `composition-demo.tsx` owns two stable handles and sibling Roots. Parent-controlled `open` permits one tour at a time. Both Roots use native `modal=true`, independently of the original playground controls. Try each target before and during its tour, advance to the second workspace step, then open the preferences tour, whose target name deliberately repeats a name from the workspace tour.

This is an initial implementation, not a release-ready modal interaction boundary. Popup-to-target keyboard traversal, generic non-button targets, and target-owned popups remain open work. No additional runtime dependencies have been added.

## Extending the playground

When the Coachmark API grows:

1. Add the prop and its value to `playground-types.ts`.
2. Add an appropriate control to `components/config-controls.tsx`.
3. Pass the configured value to Coachmark in `components/coachmark-example.tsx`.
4. Add a separate example only when the behavior cannot be represented safely in the existing one, such as a fundamentally different target environment or controlled-state integration. Give each additional example only the controls it needs.
