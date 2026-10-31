# Coachmark playground

This app is the library's visual test environment. It imports Coachmark from `../dist/index.js`, so the UI always exercises the same build that a package consumer receives. The controls use targeted components copied from the Coss UI registry; they and Tailwind are development-only and are not included in the published package.

The main workspace example uses named targets for its tabbed section, activation card, and invite button. All playground settings apply to that single tour.

Each popup has its own **Allow target interaction** switch, enabled by default. Change it while the tour is open, then move Back or Next to verify that the three values are independent and retained. The tabs switch panels, the Activity panel has a scrollable list, the activation card switches between weekly/monthly metrics, and Invite teammate increments a simulated invitation count. Controls and scroll position retain their state when interaction is blocked and enabled again.

The generated code includes all three named targets and step definitions, with the chosen `allowTargetInteraction` values. `playground-steps.ts` supplies shared target names, titles, descriptions, and popup sizes to the live example and source generator. Demo-only switches are omitted from the generated consumer example.

To try a persistent tour while exploring the page, choose Non-modal, turn off Backdrop, and enable Keep open on outside interaction before starting. Outside presses and focus changes then keep the current step open. Escape, Skip, and Finish still close it. In modal mode, the toggle prevents outside dismissal while keeping unrelated controls blocked. The generated code includes the cancellation handler when enabled.

Popup-to-target Tab traversal and target-owned popups remain open library work; consolidating the demo does not change those limitations.

## Extending the playground

When the Coachmark API grows:

1. Add the prop and its value to `playground-types.ts`.
2. Add an appropriate control to `components/config-controls.tsx`.
3. Pass the configured value to Coachmark in `components/coachmark-example.tsx`.
4. Add a separate example only when the behavior cannot be represented safely in the existing one, such as a fundamentally different target environment or controlled-state integration. Give each additional example only the controls it needs.
