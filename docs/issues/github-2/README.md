# GitHub issue 2 investigation

These issue briefs preserve the context, evidence, and unresolved questions behind [GitHub issue 2](https://github.com/sglza/coachmark/issues/2). They cover tour completion, scrolling, interaction with highlighted controls, and keyboard navigation. The most urgent confirmed bug is the missing finish callback; scroll completion also has a demonstrated weakness.

## Baseline and status

- Recorded on October 28, 2026.
- Reviewed commit: [`3404fb5f0a5e696d1e8933f48d80f221ff222c86`](https://github.com/sglza/coachmark/tree/3404fb5f0a5e696d1e8933f48d80f221ff222c86).
- Package version: `coachmark@0.1.1`; underlying popover: `@base-ui/react@1.7.0`.
- Scope: investigation and documentation. No implementation or API design has been accepted through these briefs.
- The original application was not reproduced. The distinction between a reported symptom, a demonstrated library behavior, and a proposed explanation matters throughout.

The [original report context](00-original-report.md) preserves the request in its original order, the application background, and verification results. Each brief repeats the context needed to understand that individual finding.

## Why issue briefs

An issue brief answers: what is happening, who is affected, what evidence supports it, and what still needs to be decided? That is the information needed to resume this work in another thread without relying on conversation history.

Use an implementation plan when a particular change is selected and needs sequencing, ownership, and concrete test work. Link that plan from the relevant briefs.

Use an architecture decision record, or ADR, when a consequential design decision is made: for example, choosing how custom asynchronous scrolling integrates with the tour lifecycle. The ADR should record the chosen approach, alternatives, and consequences. A straightforward callback bug fix may need only a brief and pull request; it does not automatically need an ADR.

The lifecycle is: investigate in a brief, decide the contract, add an ADR if the decision warrants one, and create an implementation plan if the work warrants one. Keep the briefs as the record of the original problem after implementation.

## Findings in priority order

The numbers are stable identifiers from the initial review, not a commitment to implementation order. Priorities reflect impact and confidence at the recorded baseline.

| Brief | Priority | Assessment |
| --- | --- | --- |
| [01 Tour completion callbacks](01-tour-completion-callbacks.md) | High | Confirmed bug, including controlled tours reopening after Finish. |
| [02 Scroll completion detection](02-scroll-completion-detection.md) | High | Demonstrated completion weakness; the reporter's exact failure remains unproven. |
| [03 Interaction with spotlight targets](03-spotlight-target-interaction.md) | Medium to high | Valid capability gap involving dismissal, pointer access, and focus. |
| [04 Scroll margins and visibility](04-scroll-margins-and-visibility.md) | Medium | Confirmed mismatch between the visibility gate and desired scrolling offsets. |
| [05 Visibility of oversized targets](05-oversized-target-visibility.md) | Medium | Partly valid; current center-based policy is intentional and full visibility may be impossible. |
| [06 Custom scrolling and measurement](06-custom-scrolling-and-measurement.md) | Medium to investigate | Coordination gap is supported; disabling all measurement is not established. |
| [07 Keyboard step navigation](07-keyboard-step-navigation.md) | Low | Valid enhancement; application navigation can already use the public hook. |
| [08 Scroll behavior configuration](08-scroll-behavior-configuration.md) | Low | Instant and smooth behavior already exist; asynchronous coordination is a separate gap. |

## Relationships between findings

The scrolling findings describe different stages of one interaction. Brief 04 concerns whether to start scrolling. Brief 05 concerns what visibility can mean for an element larger than its container. Brief 08 concerns how a scroll is configured. Brief 02 concerns when a scroll is considered finished. Brief 06 concerns who owns scrolling and when the popup is presented.

Fixing one stage does not automatically fix the others. An instant scroll cannot reveal a target that the visibility gate decides does not need scrolling. A perfect completion signal cannot fit a 900-pixel panel inside a 500-pixel viewport. Continuous measurement cannot tell Coachmark when an application-owned asynchronous operation is complete.

Briefs 03 and 07 also interact: if highlighted controls become interactive, their arrow keys must continue operating those controls rather than unexpectedly advancing the tour.

## Starting work in a future thread

Use a request such as:

> Read `docs/issues/github-2/README.md` and brief 02 before investigating scroll completion. Compare the recorded baseline with the current code. Preserve the distinction between confirmed behavior and the reporter's diagnosis. Propose a contract before implementing a new public API.

Read the relevant source and tests again before implementation. The immutable source links explain the historical finding; they do not establish that the same behavior remains in a later release.

## Keeping the record useful

Each brief contains the original problem, a plain-language example, baseline evidence, a priority rationale, open decisions, and proposed acceptance criteria. Those criteria are discussion inputs, not an approved implementation plan.

When new evidence arrives, add a dated follow-up with the tested commit and reproduction result. When a decision or fix lands, link the ADR, plan, pull request, regression coverage, and release as applicable. Preserve the original baseline evidence so later readers can understand why the work began. Avoid renumbering or renaming the briefs when priorities change.
