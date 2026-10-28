# Custom scrolling and target measurement

Disabling automatic scrolling changes the preparation sequence, but the baseline code does not disable all target measurement. The supported underlying problem is coordinating application-owned asynchronous scrolling with the moment Coachmark presents a step. The reported loss of anchor remeasurement still needs a focused reproduction.

## Status and baseline

- Priority: medium to investigate, initial rank 06.
- Assessment: valid coordination gap; broader measurement claim is unconfirmed and challenged by the code.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no custom-scroll lifecycle contract selected.

## Original need and example

The reporter wants to replace internal scrolling with a wrapper that waits until the target rectangle is stable. They say `scrollIntoView={false}` also loses separate anchor-remeasurement behavior. As a workaround, their own scrolling and Coachmark's scrolling run together, risking a visible double scroll.

Imagine the application starts a smooth panel scroll while opening a step with internal scrolling disabled. Coachmark can present the popup before the custom operation finishes. Even if the anchor and spotlight keep tracking the moving target, the visible result differs from waiting and showing the popup only at the end.

That is a timing difference. It must be distinguished from a stale anchor or spotlight that fails to move at all.

## Current behavior and evidence

[`startTargetScroll`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L581) exits when the resolved scroll option is false. Step navigation also uses `shouldScroll` to choose concealment and scroll-wait behavior. With built-in navigation, the [ordinary positioning sequence](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1566) still runs without scrolling.

Externally controlled step changes have a different [scroll preparation effect](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1703). Opting out skips its concealment and waiting sequence; this deserves separate verification from Next and Previous navigation.

However, [`useSpotlightGeometry`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L762) depends on open state and the target, not the scroll option. It listens for scroll and resize events and observes target size. The positioner still receives the active target anchor, and `scrollIntoView=false` does not set `disableAnchorTracking`.

Root and Step have no asynchronous custom-scroll callback. An application cannot hand Coachmark an operation to await simply by disabling the built-in one. A Step-level scroll option can also override Root's `false`, so reproduction must record both values.

## Impact and priority

Advanced applications need control over custom scroll containers, sticky layouts, and their own completion logic. A clean handoff can prevent competing scroll operations. Investigation has medium priority because the integration need is credible, while the specific assertion that measurement stops is not yet established.

## Decisions still needed

Define who owns scrolling and who owns readiness. If an asynchronous handoff is added, define its inputs, cancellation, error behavior, and relationship to step changes. Distinguish continuous geometry tracking from waiting before initial presentation.

Record which visual element fails in a reproduction: spotlight cutout, popup position, or presentation timing. A report that the anchor is wrong is not precise enough to identify which mechanism needs a change.

## Proposed acceptance criteria

- Disabling internal scrolling prevents internal scroll calls unless a documented Step override enables them.
- Target and spotlight measurements continue updating during application-owned scrolling.
- Built-in and externally controlled step changes have explicit presentation expectations.
- Any custom readiness mechanism handles cancellation, failure, and stale results after navigation.
- A reproduction that claims measurement failure identifies the stale geometry and the exact event sequence.

## Resuming this work

Compare three cases in a browser: internal scrolling, disabled scrolling with a custom smooth operation, and a controlled step change during that operation. Coordinate with [completion detection](02-scroll-completion-detection.md) before designing separate public APIs for the same lifecycle boundary.
