# Interaction with spotlight targets

In the reviewed baseline, a highlighted target was not automatically an allowed interaction region. Coachmark could explain a slider or select without letting the user operate it while retaining the current step. Supporting that use case requires pointer access, dismissal rules, and focus behavior to work together.

## Status and baseline

- Priority: medium to high, initial rank 03.
- Assessment: valid capability request; behavior depends on modal configuration and popup composition.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: work moved to `feat/v1-tour-composition` for a planned 1.0 API redesign. Explicit target registration retains native `modal=true`. Target regions now preserve their semantics and steps control interaction. A complete keyboard boundary remains unresolved.

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

Keep `modal=true` as the default and continue forwarding it directly to Base UI. The per-step `allowTargetInteraction` prop defaults to true. Target registration describes the region, while each step chooses whether its subtree is interactive. Target operations should retain the step; unrelated interaction should continue to follow Base UI's modal and dismissal rules. Applications can cancel `outside-press` and `focus-out` through `onOpenChange`, with cancellation honored after PR #4.

The earlier implementation disabled native modality and recreated scroll locking, focus containment, background event blocking, and accessibility isolation. That approach has been removed, along with its additional runtime dependencies. It exceeded the agreed scope.

### Base UI integration constraint

In installed Base UI 1.7.0, `Popover.Positioner` anchors to the target but its internal modal backdrop cuts out only the active trigger. `Popover.Popup` also owns its focus manager and does not expose an additional allowed-region API. Canceling dismissal does not change either restriction. The current public Popover API also does not expose this extension.

A ref-only additive prop would need Base UI support for an additional allowed region. The broader 1.0 direction instead changes composition: targets register as native triggers, and the active step controls Base UI's `triggerId`. This creates a supported pointer exception without disabling modality. Multiple triggers do not, by themselves, extend the popup's native Tab cycle to the target.

The first implementation on `feat/v1-tour-composition` adds `Coachmark.Target`, `Coachmark.createHandle()`, detached launchers, and registered steps inside separate components. Roots remain per-tour, names are scoped to a handle, and explicit step ordering is available. Ref-based targets remain supported while the migration proceeds. `Coachmark.Step` now exposes `allowTargetInteraction`, defaulting to true. `Target` renders a neutral region and does not forward native trigger behavior or ARIA attributes onto it. Blocked steps temporarily make their target subtree inert; interactive steps register the region as the native reference. A physical hit mask outside the exact target rectangle avoids Chromium's clipped-backdrop wheel interception, including without a styled backdrop. Native modality, document scroll locking, and popup focus management remain enabled; there is no `lockScroll` prop, replacement scroll-lock implementation, or new runtime dependency. The package is not bumped or released.

## Proposed acceptance criteria

- An enabled interactive step permits clicking, dragging, and keyboard operation of its target without unwanted dismissal.
- Associated dropdown content can remain usable even when rendered outside the target's DOM subtree.
- Unrelated outside interaction, Escape, and focus return follow documented rules.
- Modal defaults and pointer-interception layers are covered explicitly.
- Pointer, keyboard, touch, and assistive-technology behavior receive appropriate verification.

## Verification

The registration implementation retains the 64 baseline tests and adds coverage for detached parts, Strict Mode, sibling tours with repeated names, targets inside unrelated Base UI Roots, explicit step order, content updates, late targets, handle reuse, and invalid registrations. Chromium verification checks actual native-modal hit testing, page wheel locking, target application actions, step changes, dismissal, focus return, and independent sibling tours. The removed custom-modal prototype is not part of this evidence.

Additional regression and browser checks exercise multi-control regions, default-enabled and mixed step policies on the same target, state retention, live focus recovery, preserving application-owned inert state, Backdrop event bubbling, direct custom buttons, nested region scrolling, and the no-visible-backdrop case. The native focus manager's reference-change cleanup is prevented from restoring launcher focus while the tour remains open.

Remaining work includes popup-to-target Tab traversal, focus containment after leaving an interactive target, nested overlays and portaled controls, touch behavior, and assistive-technology verification. Native modal behavior and scroll handling continue to belong to Base UI.
