# Interaction with spotlight targets

A highlighted target is not automatically an allowed interaction region. Coachmark can explain a slider or select without letting the user operate it while retaining the current step. Supporting that use case requires pointer access, dismissal rules, and focus behavior to work together.

## Status and baseline

- Priority: medium to high, initial rank 03.
- Assessment: valid capability request; behavior depends on modal configuration and popup composition.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: nonmodal tours allow target interaction; `modal` is the interaction switch, with `false` as the new default and per-step `interactionRefs` for associated portals.

## Original need and example

Terrain Viewer includes sliders, checkboxes, selects, and button groups. The reporter wants a step to stay open while a user tries the highlighted feature. The application currently keeps a short memory of recent interaction inside the target and exempts some subsequent outside presses. It also handles menus rendered through portals.

For example, a step says to adjust terrain opacity. A user should be able to drag the highlighted slider while reading the explanation. If the tour closes on that interaction, the instructions disappear at the moment they are useful.

## Baseline behavior and evidence

[`CoachmarkRoot`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1418) defaults to `modal=true`. Base UI's modal popover restricts outside pointer interactions; its focus trapping also depends on the popup's close-part composition. See the [Base UI modal contract](https://base-ui.com/react/components/popover#root).

Coachmark's backdrop creates a [visual cutout](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L835), and its [positioner uses the target as an anchor](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L941). Neither operation registers the target as an additional interactive region for the tour.

Changing to `modal=false` allows outside interaction but does not automatically exempt the target from outside-press dismissal. The installed Base UI positioner also creates its own modal interception backdrop, whose cutout follows the trigger rather than Coachmark's target. A visible hole in the Coachmark backdrop therefore does not establish pointer access through every layer.

The report's portal concern is meaningful: a select's options may be attached to `document.body`, so a target containment check can treat them as outside. Some nested Base UI popup relationships may already be recognized; arbitrary third-party menus need explicit consideration rather than a blanket assumption about all portals.

## Impact and priority

The gap prevents learning by doing. It is less clearly a broken existing promise than the finish callback, but it blocks an important category of tours. Short time windows are fragile because a slow user and a quick user should receive the same interaction rules.

## Selected behavior and API

Use the existing `modal` prop instead of introducing a separate interaction flag. With `modal=false`, the active target and its descendants can be operated without dismissing the current step. Additional per-step `interactionRefs` register associated content such as portaled menus; refs may initially be null and do not change the spotlight or anchor.

Change the default to `modal=false` in a minor release. Explicit `modal=true` retains the restrictive behavior. Trap-focus mode retains Base UI's existing popup-only focus model; use nonmodal mode for keyboard access to the target.

With a backdrop, unrelated pointer interactions hit the backdrop and dismiss the tour. Without one, unrelated page controls remain operable and request dismissal. Applications can cancel `outside-press` and `focus-out` through the existing `onOpenChange` API, whose cancellation handling was fixed in PR #4.

Tab from the last popup control moves to the target's first tab stop, and Shift+Tab returns to the popup. Focus can continue out through the page normally. Target controls keep their arrow keys. Target-owned menus must consume Escape while open and restore focus to their controls; registered portal refs do not supply third-party keyboard handling or stacking styles.

## Proposed acceptance criteria

- An enabled interactive step permits clicking, dragging, and keyboard operation of its target without unwanted dismissal.
- Associated dropdown content can remain usable even when rendered outside the target's DOM subtree.
- Unrelated outside interaction, Escape, and focus return follow documented rules.
- Modal defaults and pointer-interception layers are covered explicitly.
- Pointer, keyboard, touch, and assistive-technology behavior receive appropriate verification.

## Verification

Regression coverage exercises target operations, late-mounted portals, controlled state, dismissal cancellation, keyboard focus, pointer and touch gestures, step changes, and explicit modal modes. Browser verification uses a controlled slider and a portaled Base UI select, including backdrop hit testing, nested Escape, touch interaction, and keyboard exit to the page. Direct assistive-technology testing remains separate from DOM accessibility checks. Coordinate future [keyboard navigation](07-keyboard-step-navigation.md) with these controls so their arrow keys do not advance the tour.
