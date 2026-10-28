# Keyboard step navigation

Coachmark has no built-in left and right arrow shortcuts for Previous and Next. This is a valid enhancement request. Applications can already invoke navigation through `useCoachmark()` instead of locating and clicking DOM buttons.

## Status and baseline

- Priority: low, initial rank 07.
- Assessment: missing convenience feature, not a demonstrated regression.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no shortcut API, default, or focus scope selected.

## Original need and example

The reporter wired left and right arrows by finding the rendered Previous and Next buttons and clicking them. They want Coachmark to supply that behavior directly.

For a sequence of explanatory steps, pressing Right can be a useful shortcut for Next. A listener coupled to a button selector is brittle because rendering, labels, or button availability can change.

The same Right key has a different meaning when focus is on an opacity slider: it should increase opacity. An unconditional tour shortcut would conflict directly with the interactive-target request from the same issue.

## Current behavior and evidence

The baseline implementation contains no `ArrowLeft` or `ArrowRight` step-navigation handler. Previous and Next use their existing click actions. The public [`useCoachmark` state and actions](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/README.md#usecoachmark) include `next()`, `previous()`, and `goTo(index)`.

A component inside Root can use those actions for application-specific keyboard handling. This avoids DOM lookup but still leaves the application responsible for deciding where shortcuts apply.

[`transitionTo`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1566) ignores navigation while the presentation phase is not idle. Final-step `next()` instead calls `finish()`, so mapping Right to Next also implies a completion policy and inherits the baseline [finish callback bug](01-tour-completion-callbacks.md).

## Impact and priority

Shortcuts can make repeated or desktop use more convenient. This is lower priority than broken completion or hidden targets because button navigation already exists and the hook provides a direct customization path. Missing arrow shortcuts alone does not establish that the tour is inaccessible; ordinary keyboard access to controls is a separate concern.

## Decisions still needed

Decide whether shortcuts are enabled by default or opt-in, whether they apply only inside the popup or more broadly, and which focused controls should retain their keys. Consider text fields, sliders, radio groups, tabs, selects, and open menus.

Define behavior with modifiers, repeated keydown events, composition input, nested popups, right-to-left interfaces, and active transitions. Decide whether Right finishes the final step or stops at it. Avoid using a global listener simply because the application's workaround used one.

## Proposed acceptance criteria

- Documented shortcuts invoke public navigation actions without DOM button lookup.
- Inputs and controls that use arrow keys retain their expected behavior.
- First-step, final-step, transition, and held-key behavior are explicit.
- Closed tours and unrelated page content are unaffected within the chosen focus policy.
- Any opt-in and right-to-left behavior is documented and covered.

## Resuming this work

Begin with an application example using `useCoachmark()` to demonstrate the current customization path. Design built-in scope alongside [interactive spotlight targets](03-spotlight-target-interaction.md), and account for the completion contract before treating Right as Finish.
