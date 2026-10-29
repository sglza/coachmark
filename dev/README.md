# Coachmark playground

This app is the library's visual test environment. It imports Coachmark from `../dist/index.js`, so the UI always exercises the same build that a package consumer receives. The controls use targeted components copied from the Coss UI registry; they and Tailwind are development-only and are not included in the published package.

The default enables Modal and Allow target interaction: tabs remain usable while page scrolling and unrelated controls are blocked. Disable Allow target interaction to compare the original popup-only modal behavior. The generated code follows both settings.

To try a persistent tour while exploring the page, choose Non-modal, turn off Backdrop, and enable Keep open on outside interaction before starting the tour. Clicking other controls or moving keyboard focus outside then keeps the current step open. In modal mode, the toggle prevents outside dismissal while keeping background controls blocked. Escape, Skip, and Finish still close the tour. The toggle demonstrates canceling `outside-press` and `focus-out` requests through `onOpenChange`; the generated code includes that handler when enabled.

## Extending the playground

When the Coachmark API grows:

1. Add the prop and its value to `playground-types.ts`.
2. Add an appropriate control to `components/config-controls.tsx`.
3. Pass the configured value to Coachmark in `components/coachmark-example.tsx`.
4. Add a separate example only when the behavior cannot be represented safely in the existing one, such as a fundamentally different target environment or controlled-state integration. Give each additional example only the controls it needs.
