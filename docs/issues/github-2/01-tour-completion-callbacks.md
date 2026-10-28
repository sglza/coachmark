# Tour completion callbacks

Finishing the final step bypasses `onOpenChange`, so applications cannot reliably learn that the tour has closed. In controlled mode, the unchanged `open` prop can make the tour reopen. This is the highest-priority confirmed bug from [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).

## Status and baseline

- Priority: high, initial rank 01.
- Assessment: confirmed implementation bug, with focused DOM reproduction.
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no fix or new completion API selected.

## Original need and example

The reporter uses a controlled Root and wants to save a localStorage flag when the user actually finishes the tour. They noticed that the last Next button closes through a different path from `Coachmark.Close`.

Imagine an application that owns `open` in React state and updates that state in `onOpenChange`. Clicking Finish should request `open=false`. Instead, the application hears nothing and still supplies `open=true`. Coachmark hides its presentation internally, then its opening logic sees that the tour should still be open and presents it again.

An uncontrolled tour has a quieter failure: it closes, but the application's completion-related side effect does not run.

## Current behavior and evidence

[`CoachmarkNext`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1289) invokes the context's `next()` action. On the last step, [`next()` calls `finish()`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1672). `finish()` updates the step index and calls internal `close()`.

Internal `close()` resets presentation state and calls `setResolvedOpen(false)`, but never calls `onOpenChange`. The controlled-state setter does not change an externally supplied value. The callback is instead called inside the separate [`Popover.Root` event handler](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L1848).

The public hook's `close()` and `finish()` use the same internal actions, so this is broader than the rendered Finish button.

The focused reproduction found no callback for either controlled or uncontrolled Finish. The uncontrolled dialog closed; the controlled dialog was visible again. Ordinary Close produced `onOpenChange(false)`. See [verification details](00-original-report.md#finish-and-close).

The existing [finish test](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/tests/coachmark.test.tsx#L1085) checks uncontrolled closing and focus restoration, without checking the callback or a controlled `open` prop.

## Impact and priority

This breaks existing state synchronization rather than merely lacking a convenience feature. It can repeat onboarding, lose completion tracking, and make Finish appear ineffective. It has a clear trigger and strong evidence, which makes it the first candidate for a fix.

## Decisions still needed

Closing and completing are different meanings. Skip, Escape, and outside press may all close a tour without completing it. Restoring `onOpenChange(false)` alone does not define how an application distinguishes successful completion.

Decide whether completion uses a distinct reason, a dedicated notification, or another documented mechanism. Also define the callback details for actions invoked through the hook, which may have no originating click event, and whether repeated calls can produce duplicate completion notifications. Preserve the ability of a controlled parent to accept or decline a close request according to the chosen contract.

## Proposed acceptance criteria

- Final Next, hook `finish()`, and hook `close()` participate in the documented open-state notification contract.
- A controlled parent accepting the close request can set `open=false` and keep the tour closed.
- Controlled and uncontrolled cases have explicit callback assertions, including duplicate-call behavior.
- Completion can be distinguished from early dismissal if a completion-specific contract is introduced.
- Existing focus restoration, step state, reset-on-open behavior, and transition cancellation remain covered.

## Resuming this work

Start with a controlled one-step reproduction and compare the current close paths with the baseline. Add a regression for the missing callback before broadening the public API. Link any completion-event decision and final pull request here. The [source context](00-original-report.md) preserves the reporter's persistence requirement.
