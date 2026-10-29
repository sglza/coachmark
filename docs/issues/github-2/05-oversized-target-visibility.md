# Visibility of oversized targets

A long target may remain partly offscreen by design because it cannot fit inside its scrolling container. Coachmark currently accepts an oversized target when its center is visible. That policy can be reasonable while still revealing the wrong part of a panel for a particular tour step.

## Status and baseline

- Priority: medium, initial rank 05.
- Assessment: partly valid report; distinguish impossible full visibility from incomplete scrolling of a target that does fit.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no replacement visibility or alignment policy selected.

## Original need and example

The reporter describes a long side-panel section that is not always fully scrolled into view before the popup appears. They attribute it to early scroll completion. The report does not include the target dimensions or enough layout detail to establish that explanation for every instance.

For example, a panel may be 900 pixels tall inside a 500-pixel visible area. No scrolling algorithm can show all 900 pixels at once. Showing the middle may satisfy Coachmark's existing rule, but a step explaining the first controls in the panel may need the top instead.

A different case is a 40-pixel button that fits comfortably but remains half hidden. That is not explained by unavoidable target size and should be investigated as a visibility or completion failure.

## Current behavior and evidence

[`isOutsideBounds`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L420) handles each axis separately. If the target is larger than the available bounds, it checks whether the target's center lies inside those bounds. For a target that fits, it instead checks the edges with a one-pixel tolerance.

The existing [oversized-target test](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/tests/coachmark.test.tsx#L400) places a 400-pixel target at `y=-100` in a 200-pixel container. Its center is visible, so no scroll is requested. This behavior is deliberate and covered by a test, though the test name does not itself define a complete public contract.

The default scroll alignment is `block: "center"`. Choosing another alignment only matters if the visibility gate allows a scroll to start.

## Impact and priority

Large panels are legitimate targets, but a popup pointing at the wrong visible portion can be confusing. The immediate need is a clear visibility policy and a dimensioned reproduction; treating all partial visibility as a scrolling bug would risk introducing unnecessary movement.

## Decisions still needed

Define what success means for oversized targets: visible center, visible start, a minimum visible region, or another deliberate rule. Consider whether an individual step can request alignment even when the target is already acceptable under the general policy.

Target selection is also relevant. Highlighting the specific subsection or control can express the lesson better than anchoring to an entire long panel. That is a possible integration adjustment, not proof that every report should be solved by changing the application's target.

## Proposed acceptance criteria

- Targets that fit and targets that cannot fit have separate, explicit expectations.
- The oversized-target policy avoids repeated or oscillating scroll attempts.
- The popup has useful behavior when part of its anchor lies outside the visible area.
- Supported alignment choices interact predictably with the visibility gate.
- Reproductions record target size, effective container size, clipping ancestors, and the intended portion to reveal.

## Resuming this work

Ask for or construct both a fitting target and an oversized target inside the same panel layout. Investigate [completion](02-scroll-completion-detection.md) and [scroll margins](04-scroll-margins-and-visibility.md) separately before attributing every failure to the center-based rule.
