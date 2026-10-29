# Original report context

[GitHub issue 2](https://github.com/sglza/coachmark/issues/2), opened by `jo-chemla`, combines experience integrating Coachmark into a real application with requested improvements and proposed explanations for failures. The report is valuable evidence of user needs, while each proposed root cause requires its own verification.

## Source and application

- Issue title: Huge thanks + feature request ideas (interaction in spotlight, kbd, bugfixes).
- Created: August 17, 2026.
- Last updated at the time of this record: October 28, 2026.
- Issue state at capture: open, with no comments.
- Application: [Terrain Viewer](https://terrain-viewer.iconem.com/).
- The reporter says the guided tour runs on page load or can be opened with the compass icon in the settings modal title bar.

The application includes sliders, checkboxes, selects, button groups, and long sections in a side panel. The reporter wants users to try these controls while reading the current tour step. Some controls render menus through a portal, meaning their visible content is attached elsewhere in the document rather than inside the target element.

These details describe the reporter's application at the time of the issue. They are not a record of testing that live application.

## Requests in their original order

The following is a paraphrase of the report, preserving the relationship between symptoms and suggested fixes. The live issue remains the source for its exact wording.

1. Allow interaction with a highlighted control while keeping the current step open. The application currently uses a recent-interaction time window to avoid outside-press dismissal, plus exceptions for portaled content. See [brief 03](03-spotlight-target-interaction.md).
2. Ensure a target in a long or tall panel is sufficiently revealed before the popup appears. The reported symptom is a popup anchored to a target that is still partly offscreen. See [brief 05](05-oversized-target-visibility.md) and [brief 02](02-scroll-completion-detection.md).
3. Include `scroll-margin-top`, or an equivalent offset, in the decision about whether a target is already visible. The reporter distinguishes this check from the browser's handling of margins during an actual scroll. See [brief 04](04-scroll-margins-and-visibility.md).
4. Expose instant versus smooth scrolling and timing or an awaitable completion mechanism. See [brief 08](08-scroll-behavior-configuration.md) for the existing options and [brief 02](02-scroll-completion-detection.md) for the missing public completion contract.
5. Make disabling internal scrolling preserve the other behavior needed for custom scrolling. The reporter attributes the current difficulty to skipped anchor remeasurement and says the application ends up running custom and internal scrolling together, with a risk of visible double scrolling. See [brief 06](06-custom-scrolling-and-measurement.md).
6. Provide reliable scroll completion. The reporter identifies early completion as the cause of the side-panel problem and describes an application wrapper that scrolls and then polls the target rectangle until it becomes stable. The library review supports a weakness in completion detection, but does not establish this exact diagnosis for Terrain Viewer. See [brief 02](02-scroll-completion-detection.md).
7. Provide left and right arrow navigation. The application currently finds the rendered Previous and Next buttons and clicks them. See [brief 07](07-keyboard-step-navigation.md) for the existing hook alternative.
8. Notify `onOpenChange` when Next finishes the last step. The reporter wants to persist a tour-seen flag at completion and notes that Finish bypasses the path used by Close. See [brief 01](01-tour-completion-callbacks.md).

## Review baseline

The review used commit [`3404fb5f0a5e696d1e8933f48d80f221ff222c86`](https://github.com/sglza/coachmark/tree/3404fb5f0a5e696d1e8933f48d80f221ff222c86), package version `0.1.1`, and the installed Base UI dependency at version `1.7.0`.

`pnpm test` passed all 37 tests across two files. The suite covers ordinary opening, step navigation, scrolling options, scroll-event settling, cancellation, oversized targets, and focus behavior. A passing suite does not establish coverage of the reported failures.

## Focused verification results

The initial review also used a temporary in-memory DOM harness. It loaded the existing TypeScript implementation into Node using TypeScript transpilation and JSDOM, exercised the behavior, and wrote no reproduction files or production changes. These observations are historical verification results; the harness is not checked-in regression coverage.

### Finish and Close

A one-step fixture rendered a target, popup, Next button labeled Finish, and Close button. It used `modal={false}` and recorded `onOpenChange` calls. The click happened after the presentation phase became idle.

- With `defaultOpen={true}`, Finish closed the dialog and produced no callback.
- With controlled `open={true}`, Finish produced no callback and the dialog was visible again after the close attempt.
- In the uncontrolled fixture, Close produced `onOpenChange(false)` and closed the dialog.

The controlled fixture deliberately kept `open` true unless a callback could tell the application to update it. That models the missing notification without adding an unrelated application state change.

### Scroll completion

The harness supplied a target with a fixed offscreen rectangle at `x=20`, `y=2000`, width `100`, height `40`, and a stubbed `scrollIntoView`. It invoked the internal `startTargetScroll`, then dispatched `scrollend` on a different attached element.

The internal promise resolved even though the target remained outside the visible area. This establishes that completion can be accepted from an unrelated event without validating the target's final visibility. Because the scroll was stubbed, it does not prove a particular browser's smooth-scroll timing or reproduce Terrain Viewer's nested scrolling.

### Existing scroll configuration

Resolving `{ behavior: "instant", block: "start" }` preserved those choices and supplied the default `inline: "nearest"`. Instant scrolling is already accepted by the implementation.

## Limits that affect future decisions

The review did not reproduce Terrain Viewer's actual layout, nested menus, browser timing, or custom wrapper. The broader claim that opting out disables anchor measurement remains unconfirmed. Browser checks are particularly important for smooth scrolling, sticky headers, clipping, focus, pointer interception, and nested portals because a simulated DOM does not reproduce their layout behavior.

The eight briefs preserve both supporting and qualifying evidence. Their priority order is an initial assessment, not an accepted roadmap.
