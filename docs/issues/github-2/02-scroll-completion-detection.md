# Scroll completion detection

Coachmark can treat a scroll as complete without establishing that the intended target has settled. The weakness is demonstrated in isolation, while its role in the reporter's actual side-panel failure remains unproven. A public way to await scroll preparation is also absent.

## Status and baseline

- Priority: high, initial rank 02.
- Assessment: demonstrated weakness in completion detection and a valid public coordination gap.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no completion algorithm or public lifecycle API selected.

## Original need and example

Terrain Viewer has long sections inside a side panel. The reporter sees a tour popup positioned against a target that is still partly offscreen. Their application scrolls the target and polls its rectangle until stable because the internal completion behavior was not trustworthy for that integration.

For example, a settings panel and the outer page may both scroll to reveal one control. If one finishes first, the popup should not be revealed merely because that container stopped. The target may still be moving relative to the viewport.

## Current behavior and evidence

[`waitForScrollEnd`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L530) listens for captured document `scroll` and `scrollend` events and visual-viewport events. Scroll events schedule completion after 120 milliseconds of silence; scrollend schedules it after 50 milliseconds. A 1.5-second timeout ends the wait regardless. Later events can replace the scheduled quiet-period timer.

The handlers do not filter events to the target's relevant scrolling containers. The ordinary finish path performs no final target visibility or rectangle-stability check. Explicit instant behavior has an additional animation-frame visibility check, but that is not the general completion guarantee.

In the focused reproduction, the target stayed offscreen and scrolling was stubbed. Dispatching `scrollend` on another attached element still resolved the internal promise. This demonstrates a completion condition that does not establish target readiness; it does not establish a real browser's animation timing. See [verification details](00-original-report.md#scroll-completion).

[`startTargetScroll`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L581) returns an internal promise, but Root and Step do not expose it. The public `transitioning` flag spans several phases and is not a scroll-specific completion result.

## Impact and priority

An early popup can point to moving or hidden content, making the tour hard to follow. Completion detection affects ordinary scrolling across the library, so it has higher priority than adding a convenience control. However, the source code and simulated reproduction do not prove that every partly visible target is caused by this algorithm.

## Decisions still needed

Define what completion means: the relevant scroll operations ended, the target geometry settled, the target satisfies a visibility policy, or some combination. These conditions differ when scrolling is interrupted, scroll snapping occurs, a target is oversized, or layout changes continue after scrolling.

A timeout can prevent a permanent wait, but the contract must say whether that outcome means success, interruption, or a bounded fallback. Define behavior when no scroll actually occurs and when the tour closes or changes step before completion. A stable rectangle alone also does not prove that a target is visible.

Separately decide whether applications need a notification, an awaitable action, or a custom asynchronous preparation hook. Do not infer a specific API from the reporter's suggested promise.

## Proposed acceptance criteria

- Unrelated containers cannot independently satisfy the intended scroll's completion condition.
- Nested scrolling, smooth and instant behavior, no-op scrolling, interruption, and cancellation have defined outcomes.
- A bounded fallback does not silently imply successful visibility unless the chosen contract establishes it.
- The popup's reveal point matches the chosen readiness contract, with meaningful browser coverage.
- Any public completion mechanism documents its result and how it differs from the broader transition state.

## Resuming this work

Reproduce in a browser with nested containers before selecting an algorithm. Existing [fallback tests](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/tests/coachmark.test.tsx#L802) establish event settling, not the full readiness contract. Coordinate with [custom scrolling](06-custom-scrolling-and-measurement.md), [visibility margins](04-scroll-margins-and-visibility.md), and [oversized targets](05-oversized-target-visibility.md).
