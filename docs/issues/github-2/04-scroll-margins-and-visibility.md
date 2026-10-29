# Scroll margins and target visibility

Coachmark can decide that a target is already visible even when a fixed header covers it or the desired scroll margin is missing. The browser's ability to honor scroll margins during scrolling does not solve this earlier decision about whether to scroll at all.

## Status and baseline

- Priority: medium, initial rank 04.
- Assessment: confirmed visibility-policy gap from code inspection; the reporter's layout was not reproduced.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no margin or offset policy selected.

## Original need and example

The reporter asks for `scroll-margin-top`, or an equivalent per-step offset, to influence the internal visibility check. They already recognize that native scrolling can use CSS scroll margins.

Consider a button at viewport position `y=30`, with a height of 20 pixels. A fixed header covers the first 64 pixels of the screen. The button has `scroll-margin-top: 80px`, expressing the desired spacing when scrolling it into view. Coachmark sees a rectangle inside the viewport and skips scrolling, leaving the button covered.

## Current behavior and evidence

[`isTargetOutsideVisibleArea`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L460) intersects the visual viewport with ancestors that clip overflow. It compares the target's bounding rectangle with those bounds. It does not read target scroll margins, scroll-container padding, or the geometry of a covering header.

[`startTargetScroll`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L581) returns without calling the browser when that check says the target is visible. The browser therefore has no opportunity to apply the configured margin.

[Native scroll alignment can use `scroll-margin-top` to leave room for a fixed header](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#controlling_topbottom_alignment). That describes the alignment operation, not a browser guarantee that Coachmark's separate visibility test understands header occlusion.

The existing tests cover clipping and partial visibility but do not establish a scroll-margin or sticky-header contract.

## Impact and priority

The tour may correctly identify the intended element while leaving it unreadable or unclickable. Headers and scrollable settings panels are common layouts, so this deserves attention after the broader callback and completion problems.

## Decisions still needed

Decide whether visibility should include CSS scroll margins, an explicit step offset, container scroll padding, or a combination. These are not interchangeable: a target margin affects alignment, container padding reserves space in a scrollport, and a fixed overlay can cover content without clipping its rectangle.

Also decide how much spacing is required to trigger a scroll. Requiring every requested margin can be impossible near a document boundary or for an oversized target. The policy should avoid repeatedly trying to create space the container cannot provide. Do not promise general detection of every overlapping element unless that is deliberately part of scope.

## Proposed acceptance criteria

- The chosen visibility policy handles a target inside viewport bounds but obscured by a supported header or configured offset.
- The decision to scroll and the final alignment use compatible definitions of required spacing.
- Nested scrolling containers, nonzero margins, and boundaries with insufficient available space have documented behavior.
- Already-visible targets do not move unnecessarily under the chosen policy.
- Browser coverage verifies real clipping and sticky or fixed positioning, beyond mocked rectangles.

## Resuming this work

Start with a fixed-header reproduction and then a sticky header inside a scrolling panel. Treat visibility as the decision before scrolling, separate from [completion detection](02-scroll-completion-detection.md). Check [oversized-target policy](05-oversized-target-visibility.md) before deciding whether all margins must fit.
