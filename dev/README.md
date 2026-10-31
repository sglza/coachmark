# Coachmark playground

This app is the library's visual test environment. It imports Coachmark from `../dist/index.js`, so the UI always exercises the same build that a package consumer receives. The controls use targeted components copied from the Coss UI registry; they and Tailwind are development-only and are not included in the published package.

The default uses Base UI's native modal behavior: page scrolling and outside pointer interaction are restricted. The workspace tabs are interactive outside a tour. The new per-step `allowTargetInteraction` API is demonstrated separately in the composition preview.

To try a persistent tour while exploring the page, choose Non-modal, turn off Backdrop, and enable Keep open on outside interaction before starting the tour. Clicking other controls or moving keyboard focus outside then keeps the current step open. In modal mode, the toggle prevents outside dismissal while keeping background controls blocked. Escape, Skip, and Finish still close the tour. The toggle demonstrates canceling `outside-press` and `focus-out` requests through `onOpenChange`; the generated code includes that handler when enabled.

## Composition preview

The separate **1.0 composition preview** demonstrates named target regions in `workspace-controls.tsx`, `team-actions.tsx`, and `preference-control.tsx`. Instructions live in `tour-instructions.tsx`; `composition-demo.tsx` owns two stable handles and sibling Roots. Parent-controlled `open` permits one tour at a time. Both Roots use native `modal=true`, independently of the original playground controls. The workspace tour starts with `allowTargetInteraction={false}` on a section containing a button, checkbox, and scrollable list. Next enables the same section; Back disables it again without resetting control or scroll state. The final workspace step uses a button in another component. The independent preferences tour deliberately reuses a target name and preserves the button's own ARIA state.

This is an initial implementation, not a release-ready modal interaction boundary. Popup-to-target Tab traversal and target-owned popups remain open work. Native control keyboard actions, such as Space on a focused checkbox, remain available during interactive steps. No additional runtime dependencies have been added.

## Extending the playground

When the Coachmark API grows:

1. Add the prop and its value to `playground-types.ts`.
2. Add an appropriate control to `components/config-controls.tsx`.
3. Pass the configured value to Coachmark in `components/coachmark-example.tsx`.
4. Add a separate example only when the behavior cannot be represented safely in the existing one, such as a fundamentally different target environment or controlled-state integration. Give each additional example only the controls it needs.
