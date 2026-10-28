# Scroll behavior configuration

Instant and smooth scrolling are already configurable in Coachmark. The original request combines that existing capability with separate missing controls over asynchronous preparation and completion. Keeping those concerns distinct avoids introducing a redundant scroll-behavior API.

## Status and baseline

- Priority: low, initial rank 08.
- Assessment: behavior selection already supported; duration control and a public asynchronous handoff are separate requests.
- Source: [GitHub issue 2](https://github.com/sglza/coachmark/issues/2).
- Recorded: October 28, 2026.
- Baseline: commit `3404fb5f0a5e696d1e8933f48d80f221ff222c86`, Coachmark `0.1.1`, Base UI `1.7.0`.
- Decision status: no additional timing API selected.

## Original need and example

The reporter asks for instant versus smooth behavior, timing control, or an awaitable promise so the application does not have to guess when scrolling finishes.

For example, an application that wants an immediate jump can already write:

```tsx
<Coachmark.Root scrollIntoView={{ behavior: "instant", block: "start" }}>
  {/* Trigger and steps */}
</Coachmark.Root>
```

A Step can provide the same option to override Root for that target. This selects the browser's scrolling behavior; it does not provide an application-visible completion event or custom animation duration.

## Current behavior and evidence

The [Root and Step prop types](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L47) accept `boolean | ScrollIntoViewOptions`. The [default options](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L205) are `behavior: "smooth"`, `block: "center"`, and `inline: "nearest"`.

[`getScrollIntoViewOptions`](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/src/coachmark.tsx#L517) merges supplied values with those defaults. It forces instant behavior when reduced motion is preferred. In the focused review, an explicit instant/start configuration was preserved with the default nearest inline alignment.

The [option-override test](https://github.com/sglza/coachmark/blob/3404fb5f0a5e696d1e8933f48d80f221ff222c86/tests/coachmark.test.tsx#L432) checks that a Step can enable its own scroll options even when Root disables automatic scrolling. Reduced-motion behavior also has a test.

The visibility gate still decides whether to invoke scrolling at all. Requesting `block: "start"` does not force realignment of a target already considered visible.

## Impact and priority

The most immediate response is clarification of the current API and its limits. There is no demonstrated need for another instant-versus-smooth switch. An instant jump may reduce visible movement, but it does not solve incorrect visibility checks or define custom-scroll coordination.

## Decisions still needed

Separate four requests before designing anything: browser behavior selection, alignment, animation duration, and notification that preparation is complete. Only the first two are present in the baseline API.

Decide whether controlling duration is an actual application requirement; neither the report nor the baseline establishes a desired duration contract. If custom animation is necessary, assess whether the [custom-scroll handoff](06-custom-scrolling-and-measurement.md) can address it rather than adding an unrelated timing system.

Document how reduced motion, Root inheritance, Step overrides, and the visibility gate interact. Avoid describing `behavior: "auto"` as an unconditional instant jump; the browser can use its CSS scroll-behavior setting.

## Proposed acceptance criteria

- Documentation clearly shows existing instant and smooth configuration at Root and Step level.
- Examples explain that alignment options apply when automatic scrolling runs.
- Reduced-motion preferences and option inheritance remain explicit and covered.
- Completion and custom timing are described separately from behavior selection.
- Any additional API has a concrete use case beyond duplicating `ScrollIntoViewOptions`.

## Resuming this work

Start with documentation or an integration example before proposing a new behavior prop. Follow [scroll completion](02-scroll-completion-detection.md) for the promise request and [custom scrolling](06-custom-scrolling-and-measurement.md) for application-owned timing.
